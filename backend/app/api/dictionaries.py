from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import County, User
from app.schemas import CountyRead

router = APIRouter(prefix="/dictionaries", tags=["dictionaries"])


@router.get("/counties", response_model=list[CountyRead])
def list_counties(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[County]:
    return db.query(County).order_by(County.name.asc()).all()
