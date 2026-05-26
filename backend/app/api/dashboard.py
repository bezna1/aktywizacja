from datetime import datetime, timedelta, date

from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Attendance, AuditLog, Participant, ParticipantStatus, ProgramAssignment, User
from app.schemas import DashboardRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

ACTIVE_STATUSES = {ParticipantStatus.in_training, ParticipantStatus.active}
COMPLETED_STATUS = ParticipantStatus.completed
RESIGNED_STATUSES = {ParticipantStatus.resigned, ParticipantStatus.interrupted}


@router.get("", response_model=DashboardRead)
def dashboard(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DashboardRead:
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    upcoming = (
        db.query(func.count(ProgramAssignment.id))
        .filter(ProgramAssignment.planned_at.between(now, now + timedelta(days=14)))
        .scalar() or 0
    )
    overdue = (
        db.query(func.count(ProgramAssignment.id))
        .filter(ProgramAssignment.planned_at < now, ProgramAssignment.completed_at.is_(None))
        .scalar() or 0
    )

    all_participants = db.query(Participant).all()
    status_breakdown: dict[str, int] = {}
    for p in all_participants:
        label = p.status.value
        status_breakdown[label] = status_breakdown.get(label, 0) + 1

    active_count = sum(1 for p in all_participants if p.status in ACTIVE_STATUSES)
    in_training_count = sum(1 for p in all_participants if p.status == ParticipantStatus.in_training)
    completed_total = sum(1 for p in all_participants if p.status == COMPLETED_STATUS)
    resigned_total = sum(1 for p in all_participants if p.status in RESIGNED_STATUSES)
    reserve_count = sum(1 for p in all_participants if p.status == ParticipantStatus.reserve)
    needs_data_count = sum(1 for p in all_participants if p.status == ParticipantStatus.needs_data)
    incomplete_count = sum(1 for p in all_participants if not p.is_complete)

    completed_this_month = sum(
        1 for p in all_participants
        if p.status == COMPLETED_STATUS and p.updated_at >= month_start
    )

    finished = completed_total + resigned_total
    completion_rate = round(completed_total / finished * 100, 1) if finished > 0 else 0.0

    # statystyki miesięczne — ostatnie 6 miesięcy
    monthly_stats = []
    for offset in range(5, -1, -1):
        ref = now - timedelta(days=offset * 30)
        y, m = ref.year, ref.month
        added = sum(
            1 for p in all_participants
            if p.created_at.year == y and p.created_at.month == m
        )
        completed_m = sum(
            1 for p in all_participants
            if p.status == COMPLETED_STATUS and p.updated_at.year == y and p.updated_at.month == m
        )
        monthly_stats.append({
            "month": f"{y}-{m:02d}",
            "label": f"{m:02d}/{y}",
            "added": added,
            "completed": completed_m,
        })

    # alerty systemowe — dynamiczne
    alerts = []
    if incomplete_count > 0:
        alerts.append(f"{incomplete_count} uczestnik(ów) ma niekompletne dane — uzupełnij przed przypisaniem do szkolenia")
    if needs_data_count > 0:
        alerts.append(f"{needs_data_count} uczestnik(ów) wymaga uzupełnienia danych")
    if overdue > 0:
        alerts.append(f"{overdue} zaległych terminów programowych — wymagają weryfikacji")
    missing_att = db.query(func.count(Attendance.id)).filter(Attendance.present.is_(False)).scalar() or 0
    if missing_att > 0:
        alerts.append(f"Sprawdź obecności — {missing_att} nieobecności do weryfikacji")
    if not alerts:
        alerts.append("Brak alertów — system w dobrej kondycji")

    recent = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(8).all()

    return DashboardRead(
        active_participants=active_count,
        reserve_participants=needs_data_count,
        incomplete_participants=incomplete_count,
        upcoming_deadlines=upcoming,
        overdue_deadlines=overdue,
        missing_attendance=missing_att,
        system_alerts=alerts,
        recent_actions=[
            {"action": item.action, "entity": item.entity_type, "entity_id": item.entity_id, "created_at": item.created_at.isoformat()}
            for item in recent
        ],
        in_training_count=in_training_count,
        completed_total=completed_total,
        completed_this_month=completed_this_month,
        resigned_total=resigned_total,
        reserve_count=reserve_count,
        completion_rate=completion_rate,
        monthly_stats=monthly_stats,
        status_breakdown=status_breakdown,
    )
