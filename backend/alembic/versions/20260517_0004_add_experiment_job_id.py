"""Add JobID column to Experiment for queue linkage.

Revision ID: 20260517_0004
Revises: 20260509_0003
Create Date: 2026-05-17 22:05:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260517_0004"
down_revision = "20260509_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("Experiment", sa.Column(
        "JobID", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("Experiment", "JobID")
