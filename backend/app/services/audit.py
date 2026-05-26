from sqlalchemy.orm import Session

from app.models import AuditLog, User


def _json_safe(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def write_audit(db: Session, actor: User | None, action: str, entity_type: str, entity_id: int | None, changes: dict | None = None) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor.id if actor else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            changes=_json_safe(changes) if changes else None,
        )
    )
