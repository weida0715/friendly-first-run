"""Compatibility revision to bridge missing 20260503_0003.

Revision ID: 20260503_0003
Revises: 20260503_0002
Create Date: 2026-05-09 17:20:00
"""

from __future__ import annotations


# revision identifiers, used by Alembic.
revision = "20260503_0003"
down_revision = "20260503_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """No-op compatibility migration."""


def downgrade() -> None:
    """No-op compatibility migration."""
