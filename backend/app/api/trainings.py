from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import Participant, ParticipantStatus, ParticipantTraining, Training, TrainingStatus, User, UserRole
from app.schemas import ParticipantTrainingCreate, TrainingCreate, TrainingRead
from app.services.audit import write_audit

router = APIRouter(prefix="/trainings", tags=["trainings"])


@router.get("", response_model=list[TrainingRead])
def list_trainings(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[Training]:
    return db.query(Training).order_by(Training.created_at.desc()).all()


@router.post("", response_model=TrainingRead)
def create_training(payload: TrainingCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(UserRole.admin, UserRole.worker))) -> Training:
    training = Training(**payload.model_dump())
    db.add(training)
    db.flush()
    write_audit(db, user, "create", "training", training.id, payload.model_dump())
    db.commit()
    db.refresh(training)
    return training


@router.put("/{training_id}", response_model=TrainingRead)
def update_training(
    training_id: int,
    payload: TrainingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.worker)),
) -> Training:
    training = db.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Nie znaleziono szkolenia")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(training, field, value)
    write_audit(db, user, "update", "training", training.id, payload.model_dump())
    db.commit()
    db.refresh(training)
    return training


@router.post("/assign")
def assign_participant(payload: ParticipantTrainingCreate, db: Session = Depends(get_db), user: User = Depends(require_roles(UserRole.admin, UserRole.worker))):
    participant = db.get(Participant, payload.participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="Nie znaleziono uczestnika")
    if not participant.is_complete or participant.status in {ParticipantStatus.reserve, ParticipantStatus.needs_data}:
        raise HTTPException(status_code=422, detail="Nie można przypisać uczestnika z brakami danych do aktywnego szkolenia")
    if not db.get(Training, payload.training_id):
        raise HTTPException(status_code=404, detail="Nie znaleziono szkolenia")
    enrollment = ParticipantTraining(**payload.model_dump())
    db.add(enrollment)
    write_audit(db, user, "assign", "participant_training", participant.id, payload.model_dump())
    db.commit()
    return {"status": "ok"}


@router.post("/bootstrap")
def bootstrap_trainings(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.worker)),
):
    templates = [
        {"name": "Doradztwo zawodowe", "description": "Indywidualny plan działania", "hours_count": 16},
        {"name": "Kompetencje cyfrowe", "description": "Narzędzia biurowe i internet", "hours_count": 24},
        {"name": "Aktywizacja społeczna", "description": "Komunikacja i współpraca", "hours_count": 20},
        {"name": "Przygotowanie do pracy", "description": "CV, rozmowa kwalifikacyjna, BHP", "hours_count": 18},
    ]

    existing_by_name = {item.name: item for item in db.query(Training).all()}
    created_trainings = 0
    for template in templates:
        if template["name"] in existing_by_name:
            continue
        training = Training(
            name=template["name"],
            description=template["description"],
            hours_count=template["hours_count"],
            status=TrainingStatus.active,
        )
        db.add(training)
        db.flush()
        existing_by_name[training.name] = training
        created_trainings += 1

    trainings = list(existing_by_name.values())
    if not trainings:
        db.commit()
        return {"status": "ok", "created_trainings": 0, "assigned_participants": 0}

    assigned_participants = 0
    participants = db.query(Participant).order_by(Participant.id.asc()).all()
    for index, participant in enumerate(participants):
        already_assigned = (
            db.query(ParticipantTraining.id)
            .filter(ParticipantTraining.participant_id == participant.id)
            .first()
        )
        if already_assigned:
            continue
        training = trainings[index % len(trainings)]
        db.add(ParticipantTraining(participant_id=participant.id, training_id=training.id))
        assigned_participants += 1

    write_audit(
        db,
        user,
        "bootstrap",
        "training",
        None,
        {"created_trainings": created_trainings, "assigned_participants": assigned_participants},
    )
    db.commit()
    return {"status": "ok", "created_trainings": created_trainings, "assigned_participants": assigned_participants}
