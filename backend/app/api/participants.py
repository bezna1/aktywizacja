from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models import Attendance, Document, Participant, ParticipantStatus, ParticipantTraining, ProgramAssignment, Training, User, UserRole
from app.schemas import ParticipantCreate, ParticipantRead, ParticipantUpdate
from app.services.audit import write_audit
from app.validation import REQUIRED_PARTICIPANT_FIELDS, participant_warnings

router = APIRouter(prefix="/participants", tags=["participants"])


def apply_status(participant: Participant) -> None:
    data = {key: getattr(participant, key) for key in REQUIRED_PARTICIPANT_FIELDS}
    warnings = participant_warnings(data)
    participant.warning_reasons = warnings
    participant.is_complete = not warnings
    if warnings and participant.status == ParticipantStatus.active:
        participant.status = ParticipantStatus.needs_data
    if participant.status is None:
        participant.status = ParticipantStatus.active if participant.is_complete else ParticipantStatus.needs_data
    if participant.status == ParticipantStatus.reserve:
        participant.status = ParticipantStatus.needs_data
    if not participant.is_complete and participant.status != ParticipantStatus.needs_data:
        participant.status = ParticipantStatus.needs_data


@router.get("", response_model=list[ParticipantRead])
def list_participants(
    status: ParticipantStatus | None = None,
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Participant]:
    query = db.query(Participant)
    if status:
        query = query.filter(Participant.status == status)
    if q:
        like = f"%{q}%"
        query = query.filter((Participant.last_name.ilike(like)) | (Participant.first_name.ilike(like)) | (Participant.pesel.ilike(like)))
    return query.order_by(Participant.last_name.asc().nullslast(), Participant.first_name.asc().nullslast()).limit(200).all()


@router.get("/{participant_id}/profile")
def participant_profile(
    participant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    participant = db.get(Participant, participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="Nie znaleziono uczestnika")

    enrollments = (
        db.query(ParticipantTraining, Training)
        .join(Training, Training.id == ParticipantTraining.training_id)
        .filter(ParticipantTraining.participant_id == participant_id)
        .order_by(ParticipantTraining.start_date.desc().nullslast(), ParticipantTraining.id.desc())
        .all()
    )
    attendance = (
        db.query(Attendance)
        .filter(Attendance.participant_id == participant_id)
        .order_by(Attendance.date.desc(), Attendance.id.desc())
        .all()
    )
    documents = (
        db.query(Document)
        .filter(Document.participant_id == participant_id)
        .order_by(Document.received_at.desc().nullslast(), Document.id.desc())
        .all()
    )
    programs = (
        db.query(ProgramAssignment)
        .filter(ProgramAssignment.participant_id == participant_id)
        .order_by(ProgramAssignment.planned_at.desc().nullslast(), ProgramAssignment.id.desc())
        .all()
    )

    return {
        "participant": ParticipantRead.model_validate(participant),
        "trainings": [
            {
                "training_id": training.id,
                "training_name": training.name,
                "status": enrollment.status,
                "start_date": enrollment.start_date,
                "end_date": enrollment.end_date,
                "attendance": enrollment.attendance,
                "result": enrollment.result,
                "notes": enrollment.notes,
            }
            for enrollment, training in enrollments
        ],
        "attendance": [
            {
                "date": item.date,
                "present": item.present,
                "hours": item.hours,
                "notes": item.notes,
                "program_type": item.program_type,
            }
            for item in attendance
        ],
        "documents": [
            {
                "name": item.name,
                "document_type": item.document_type,
                "is_required": item.is_required,
                "received_at": item.received_at,
                "file_path": item.file_path,
            }
            for item in documents
        ],
        "programs": [
            {
                "program_type": item.program_type,
                "status": item.status,
                "planned_at": item.planned_at,
                "completed_at": item.completed_at,
                "notes": item.notes,
            }
            for item in programs
        ],
    }


@router.post("", response_model=ParticipantRead)
def create_participant(
    payload: ParticipantCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.worker)),
) -> Participant:
    participant = Participant(**payload.model_dump(exclude={"version"}))
    participant.updated_by_id = user.id
    apply_status(participant)
    if participant.is_complete:
        participant.status = ParticipantStatus.active
    db.add(participant)
    try:
        db.flush()
        write_audit(db, user, "create", "participant", participant.id, payload.model_dump())
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="PESEL już istnieje przy innym uczestniku") from exc
    db.refresh(participant)
    return participant


@router.put("/{participant_id}", response_model=ParticipantRead)
def update_participant(
    participant_id: int,
    payload: ParticipantUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.worker)),
) -> Participant:
    participant = db.get(Participant, participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="Nie znaleziono uczestnika")
    if payload.version is not None and payload.version != participant.version:
        raise HTTPException(status_code=409, detail="Konflikt edycji: rekord został zmieniony przez innego użytkownika")
    before = {key: getattr(participant, key) for key in payload.model_dump(exclude_unset=True).keys() if key != "version"}
    for key, value in payload.model_dump(exclude_unset=True, exclude={"version"}).items():
        setattr(participant, key, value)
    participant.updated_by_id = user.id
    apply_status(participant)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="PESEL już istnieje przy innym uczestniku") from exc
    except StaleDataError as exc:
        raise HTTPException(status_code=409, detail="Konflikt edycji") from exc
    after = {key: getattr(participant, key) for key in before}
    write_audit(db, user, "update", "participant", participant.id, {"before": before, "after": after})
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="PESEL już istnieje przy innym uczestniku") from exc
    db.refresh(participant)
    return participant


@router.post("/{participant_id}/activate", response_model=ParticipantRead)
def activate_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin)),
) -> Participant:
    participant = db.get(Participant, participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="Nie znaleziono uczestnika")
    apply_status(participant)
    if not participant.is_complete:
        raise HTTPException(status_code=422, detail={"message": "Nie można aktywować bez kompletu danych", "missing": participant.warning_reasons})
    participant.status = ParticipantStatus.active
    write_audit(db, user, "activate", "participant", participant.id)
    db.commit()
    db.refresh(participant)
    return participant


@router.delete("/purge")
def purge_participants(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin)),
):
    deleted_attendance = db.query(Attendance).delete(synchronize_session=False)
    deleted_documents = db.query(Document).delete(synchronize_session=False)
    deleted_programs = db.query(ProgramAssignment).delete(synchronize_session=False)
    deleted_trainings_links = db.query(ParticipantTraining).delete(synchronize_session=False)
    deleted_participants = db.query(Participant).delete(synchronize_session=False)
    write_audit(
        db,
        user,
        "purge",
        "participant",
        None,
        {
            "participants": deleted_participants,
            "attendance": deleted_attendance,
            "documents": deleted_documents,
            "programs": deleted_programs,
            "participant_trainings": deleted_trainings_links,
        },
    )
    db.commit()
    return {"status": "ok", "deleted_participants": deleted_participants}


class AttendanceUpsert(BaseModel):
    date: date_type
    present: bool
    hours: int = 0
    notes: str | None = None
    program_type: str | None = None


@router.put("/{participant_id}/attendance")
def upsert_attendance(
    participant_id: int,
    payload: AttendanceUpsert,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.worker)),
):
    participant = db.get(Participant, participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="Nie znaleziono uczestnika")
    query = db.query(Attendance).filter(
        Attendance.participant_id == participant_id,
        Attendance.date == payload.date,
    )
    if payload.program_type is not None:
        query = query.filter(Attendance.program_type == payload.program_type)
    else:
        query = query.filter(Attendance.program_type.is_(None))
    record = query.first()
    if record:
        record.present = payload.present
        record.hours = payload.hours
        if payload.notes is not None:
            record.notes = payload.notes
    else:
        record = Attendance(
            participant_id=participant_id,
            date=payload.date,
            present=payload.present,
            hours=payload.hours,
            notes=payload.notes,
            program_type=payload.program_type,
        )
        db.add(record)
    write_audit(db, user, "upsert_attendance", "attendance", participant_id, {"date": str(payload.date), "present": payload.present, "program_type": payload.program_type})
    db.commit()
    db.refresh(record)
    return {"id": record.id, "date": record.date, "present": record.present, "hours": record.hours, "notes": record.notes, "program_type": record.program_type}


@router.delete("/{participant_id}/attendance")
def delete_attendance(
    participant_id: int,
    date: date_type = Query(...),
    program_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.worker)),
):
    query = db.query(Attendance).filter(
        Attendance.participant_id == participant_id,
        Attendance.date == date,
    )
    if program_type is not None:
        query = query.filter(Attendance.program_type == program_type)
    else:
        query = query.filter(Attendance.program_type.is_(None))
    record = query.first()
    if record:
        write_audit(db, user, "delete_attendance", "attendance", participant_id, {"date": str(date), "program_type": program_type})
        db.delete(record)
        db.commit()
    return {"status": "ok"}
