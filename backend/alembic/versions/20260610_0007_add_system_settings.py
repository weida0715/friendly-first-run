"""Add admin-managed system settings.

Revision ID: 20260610_0007
Revises: 20260602_0006
Create Date: 2026-06-10
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260610_0007"
down_revision = "20260602_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "SystemSetting",
        sa.Column("Key", sa.String(length=100), primary_key=True),
        sa.Column("Value", sa.String(length=500), nullable=False),
        sa.Column("UpdatedAt", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("SystemSetting")