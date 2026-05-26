from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import User, UserRole
from app.services.dictionaries import seed_counties

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    if settings.seed_admin:
        db = SessionLocal()
        try:
            seed_counties(db)
            existing = db.query(User).filter(User.email == settings.admin_email).first()
            if not existing:
                db.add(
                    User(
                        email=settings.admin_email,
                        full_name="Administrator",
                        role=UserRole.admin,
                        password_hash=hash_password(settings.admin_password),
                    )
                )
                db.commit()
        finally:
            db.close()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router)
