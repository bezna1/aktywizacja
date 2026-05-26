from fastapi import APIRouter

from app.api import auth, dashboard, dictionaries, import_xlsx, participants, trainings

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(dictionaries.router)
api_router.include_router(participants.router)
api_router.include_router(trainings.router)
api_router.include_router(import_xlsx.router)
