from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import EnrollmentStatus, ParticipantStatus, TrainingStatus, UserRole
from app.validation import validate_pesel, validate_phone


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class CountyRead(BaseModel):
    id: int
    external_id: str
    name: str
    source: str
    model_config = ConfigDict(from_attributes=True)


class ParticipantBase(BaseModel):
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)
    pesel: str | None = Field(default=None, max_length=11)
    birth_date: date | None = None
    phone: str | None = None
    voivodeship: str | None = None
    county: str | None = None
    commune: str | None = None
    city: str | None = None
    postal_code: str | None = None
    address: str | None = None
    pup_zus_status: str | None = None
    exclusion: str | None = None
    disability_status: str | None = None
    health_status: str | None = None
    life_situation: str | None = None
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = None
    labor_market_status: str | None = None
    education: str | None = None
    notes: str | None = None
    extra_contacts: str | None = None
    guardian: str | None = None
    version: int | None = None


class ParticipantCreate(ParticipantBase):
    @field_validator("pesel")
    @classmethod
    def pesel_must_be_valid_when_present(cls, value: str | None) -> str | None:
        if value and not validate_pesel(value):
            raise ValueError("PESEL musi mieć dokładnie 11 cyfr")
        return value

    @field_validator("phone")
    @classmethod
    def phone_must_be_valid_when_present(cls, value: str | None) -> str | None:
        if value and not validate_phone(value):
            raise ValueError("Nieprawidłowy numer telefonu")
        return value


class ParticipantUpdate(ParticipantBase):
    status: ParticipantStatus | None = None

    @field_validator("pesel")
    @classmethod
    def pesel_must_be_valid_when_present(cls, value: str | None) -> str | None:
        if value and not validate_pesel(value):
            raise ValueError("PESEL musi mieć dokładnie 11 cyfr")
        return value

    @field_validator("phone")
    @classmethod
    def phone_must_be_valid_when_present(cls, value: str | None) -> str | None:
        if value and not validate_phone(value):
            raise ValueError("Nieprawidłowy numer telefonu")
        return value


class ParticipantRead(ParticipantBase):
    id: int
    status: ParticipantStatus
    is_complete: bool
    warning_reasons: list[str]
    created_at: datetime
    updated_at: datetime
    updated_by_name: str | None = None
    model_config = ConfigDict(from_attributes=True)


class TrainingCreate(BaseModel):
    name: str
    description: str | None = None
    instructor: str | None = None
    schedule: str | None = None
    hours_count: int = 0
    status: TrainingStatus = TrainingStatus.planned
    color: str | None = None


class TrainingRead(TrainingCreate):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ParticipantTrainingCreate(BaseModel):
    participant_id: int
    training_id: int
    status: EnrollmentStatus = EnrollmentStatus.enrolled
    start_date: date | None = None
    end_date: date | None = None
    attendance: str | None = None
    result: str | None = None
    notes: str | None = None


class DashboardRead(BaseModel):
    active_participants: int
    reserve_participants: int
    incomplete_participants: int
    upcoming_deadlines: int
    overdue_deadlines: int
    missing_attendance: int
    system_alerts: list[str]
    recent_actions: list[dict]
    # rozszerzone statystyki
    in_training_count: int = 0
    completed_total: int = 0
    completed_this_month: int = 0
    resigned_total: int = 0
    reserve_count: int = 0
    completion_rate: float = 0.0
    monthly_stats: list[dict] = []
    status_breakdown: dict[str, int] = {}


class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[dict]
