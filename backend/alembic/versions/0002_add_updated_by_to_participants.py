"""add updated_by to participants

Revision ID: 0002
Revises: 0001_initial
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

revision = '0002'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('participants', sa.Column('updated_by_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('participants', 'updated_by_id')
