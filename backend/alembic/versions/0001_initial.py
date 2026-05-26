"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-25
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "worker", "readonly", name="userrole"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "participants",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("first_name", sa.String(120)),
        sa.Column("last_name", sa.String(120)),
        sa.Column("pesel", sa.String(11), unique=True),
        sa.Column("birth_date", sa.Date()),
        sa.Column("phone", sa.String(40)),
        sa.Column("voivodeship", sa.String(120)),
        sa.Column("county", sa.String(120)),
        sa.Column("commune", sa.String(120)),
        sa.Column("city", sa.String(120)),
        sa.Column("postal_code", sa.String(12)),
        sa.Column("address", sa.String(255)),
        sa.Column("pup_zus_status", sa.String(120)),
        sa.Column("education", sa.String(120)),
        sa.Column("notes", sa.Text()),
        sa.Column("extra_contacts", sa.Text()),
        sa.Column("guardian", sa.String(120)),
        sa.Column("status", sa.Enum("reserve", "active", "in_training", "completed", "resigned", "interrupted", "needs_data", name="participantstatus"), nullable=False),
        sa.Column("is_complete", sa.Boolean(), nullable=False),
        sa.Column("warning_reasons", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
    )
    op.create_table(
        "counties",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("external_id", sa.String(40), nullable=False, unique=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("source", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "trainings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("instructor", sa.String(255)),
        sa.Column("schedule", sa.Text()),
        sa.Column("hours_count", sa.Integer(), nullable=False),
        sa.Column("status", sa.Enum("planned", "active", "completed", "cancelled", name="trainingstatus"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "participant_trainings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("participant_id", sa.Integer(), sa.ForeignKey("participants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("training_id", sa.Integer(), sa.ForeignKey("trainings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.Enum("enrolled", "in_progress", "completed", "failed", "resigned", name="enrollmentstatus"), nullable=False),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
        sa.Column("attendance", sa.Text()),
        sa.Column("result", sa.String(120)),
        sa.Column("notes", sa.Text()),
        sa.UniqueConstraint("participant_id", "training_id", name="uq_participant_training"),
    )
    op.create_table(
        "program_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("participant_id", sa.Integer(), sa.ForeignKey("participants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("program_type", sa.Enum("career_advisor", "digital_skills", "psychologist", "vocational_training", "legal_advisor", "job_placement", "social_activation", "work_activation", name="programtype"), nullable=False),
        sa.Column("status", sa.String(80), nullable=False),
        sa.Column("planned_at", sa.DateTime()),
        sa.Column("completed_at", sa.DateTime()),
        sa.Column("notes", sa.Text()),
    )
    op.create_table(
        "attendance",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("participant_id", sa.Integer(), sa.ForeignKey("participants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("training_id", sa.Integer(), sa.ForeignKey("trainings.id", ondelete="SET NULL")),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("present", sa.Boolean(), nullable=False),
        sa.Column("hours", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text()),
    )
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("participant_id", sa.Integer(), sa.ForeignKey("participants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("document_type", sa.String(120), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False),
        sa.Column("received_at", sa.DateTime()),
        sa.Column("file_path", sa.String(500)),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("actor_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("action", sa.String(120), nullable=False),
        sa.Column("entity_type", sa.String(120), nullable=False),
        sa.Column("entity_id", sa.Integer()),
        sa.Column("changes", sa.JSON()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    for table in ["audit_logs", "documents", "attendance", "program_assignments", "participant_trainings", "trainings", "counties", "participants", "users"]:
        op.drop_table(table)
