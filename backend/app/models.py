import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    worker = "worker"
    readonly = "readonly"


class ParticipantStatus(str, enum.Enum):
    reserve = "Lista rezerwowa"
    active = "Spóźniony"
    in_training = "W trakcie szkolenia"
    completed = "Ukończył szkolenie"
    resigned = "Zrezygnował"
    interrupted = "Przerwany udział"
    needs_data = "Wymaga uzupełnienia danych"


class TrainingStatus(str, enum.Enum):
    planned = "planowane"
    active = "aktywne"
    completed = "zakończone"
    cancelled = "anulowane"


class EnrollmentStatus(str, enum.Enum):
    enrolled = "zapisany"
    in_progress = "w trakcie"
    completed = "ukończone"
    failed = "nieukończone"
    resigned = "zrezygnował"


class ProgramType(str, enum.Enum):
    career_advisor = "doradca zawodowy"
    digital_skills = "kompetencje cyfrowe"
    psychologist = "psycholog"
    vocational_training = "szkolenia zawodowe"
    legal_advisor = "doradca prawny"
    job_placement = "pośrednictwo zawodowe"
    social_activation = "warsztaty aktywizacji społecznej"
    work_activation = "warsztaty aktywizacji zawodowej"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.worker)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class County(Base):
    __tablename__ = "counties"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    source: Mapped[str] = mapped_column(String(255), default="ppatrzyk/polska-geojson")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    pesel: Mapped[str | None] = mapped_column(String(11), nullable=True, unique=True, index=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    voivodeship: Mapped[str | None] = mapped_column(String(120), nullable=True)
    county: Mapped[str | None] = mapped_column(String(120), nullable=True)
    commune: Mapped[str | None] = mapped_column(String(120), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(12), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pup_zus_status: Mapped[str | None] = mapped_column(String(120), nullable=True)
    exclusion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    disability_status: Mapped[str | None] = mapped_column(String(120), nullable=True)
    health_status: Mapped[str | None] = mapped_column(String(120), nullable=True)
    life_situation: Mapped[str | None] = mapped_column(String(255), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(40), nullable=True)
    labor_market_status: Mapped[str | None] = mapped_column(String(255), nullable=True)
    education: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_contacts: Mapped[str | None] = mapped_column(Text, nullable=True)
    guardian: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[ParticipantStatus] = mapped_column(Enum(ParticipantStatus), default=ParticipantStatus.reserve)
    is_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    warning_reasons: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    trainings: Mapped[list["ParticipantTraining"]] = relationship(back_populates="participant", cascade="all, delete-orphan")
    updated_by: Mapped["User | None"] = relationship("User", foreign_keys=[updated_by_id])

    @property
    def updated_by_name(self) -> str | None:
        return self.updated_by.full_name if self.updated_by else None

    __mapper_args__ = {"version_id_col": version}


class Training(Base):
    __tablename__ = "trainings"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    schedule: Mapped[str | None] = mapped_column(Text, nullable=True)
    hours_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[TrainingStatus] = mapped_column(Enum(TrainingStatus), default=TrainingStatus.planned)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    participants: Mapped[list["ParticipantTraining"]] = relationship(back_populates="training", cascade="all, delete-orphan")


class ParticipantTraining(Base):
    __tablename__ = "participant_trainings"
    __table_args__ = (UniqueConstraint("participant_id", "training_id", name="uq_participant_training"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"))
    training_id: Mapped[int] = mapped_column(ForeignKey("trainings.id", ondelete="CASCADE"))
    status: Mapped[EnrollmentStatus] = mapped_column(Enum(EnrollmentStatus), default=EnrollmentStatus.enrolled)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    attendance: Mapped[str | None] = mapped_column(Text, nullable=True)
    result: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    participant: Mapped[Participant] = relationship(back_populates="trainings")
    training: Mapped[Training] = relationship(back_populates="participants")


class ProgramAssignment(Base):
    __tablename__ = "program_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"))
    program_type: Mapped[ProgramType] = mapped_column(Enum(ProgramType))
    status: Mapped[str] = mapped_column(String(80), default="zaplanowany")
    planned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(primary_key=True)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"))
    training_id: Mapped[int | None] = mapped_column(ForeignKey("trainings.id", ondelete="SET NULL"), nullable=True)
    program_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    date: Mapped[date] = mapped_column(Date)
    present: Mapped[bool] = mapped_column(Boolean, default=False)
    hours: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    participant_id: Mapped[int] = mapped_column(ForeignKey("participants.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    document_type: Mapped[str] = mapped_column(String(120))
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    received_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(120))
    entity_type: Mapped[str] = mapped_column(String(120))
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    changes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
