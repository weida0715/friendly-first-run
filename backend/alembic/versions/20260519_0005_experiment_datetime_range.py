"""Add experiment datetime range columns.

Revision ID: 20260519_0005
Revises: 20260517_0004
Create Date: 2026-05-19
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260519_0005"
down_revision = "20260517_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("Experiment", sa.Column(
        "StartDateTime", sa.DateTime(), nullable=True))
    op.add_column("Experiment", sa.Column(
        "EndDateTime", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("Experiment", "EndDateTime")
    op.drop_column("Experiment", "StartDateTime")
