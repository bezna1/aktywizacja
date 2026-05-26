"""add program_type to attendance

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('attendance', sa.Column('program_type', sa.String(120), nullable=True))


def downgrade() -> None:
    op.drop_column('attendance', 'program_type')
