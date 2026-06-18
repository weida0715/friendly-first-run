"""Add UpdatedAt column to BTCUSDTKline.

Revision ID: 20260509_0004
Revises: 20260503_0003
Create Date: 2026-05-09 17:17:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260509_0004"
down_revision = "20260503_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add and backfill BTCUSDTKline.UpdatedAt for ORM compatibility."""

    op.add_column(
        "BTCUSDTKline",
        sa.Column("UpdatedAt", sa.DateTime(), nullable=True),
    )

    op.execute(
        'UPDATE "BTCUSDTKline" SET "UpdatedAt" = "CreatedAt" WHERE "UpdatedAt" IS NULL'
    )

    op.alter_column("BTCUSDTKline", "UpdatedAt", nullable=False)


def downgrade() -> None:
    """Remove BTCUSDTKline.UpdatedAt."""

    op.drop_column("BTCUSDTKline", "UpdatedAt")
