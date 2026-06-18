"""RFC-005 add Disapproved approval state.

Revision ID: 20260503_0002
Revises: 20260503_0001
Create Date: 2026-05-03 20:16:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260503_0002"
down_revision = "20260503_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("Blueprint") as batch_op:
        batch_op.alter_column(
            "ApprovalState",
            existing_type=sa.Enum("Draft", "Pending", "Approved",
                                  "Rejected", name="ApprovalStateEnum", native_enum=False),
            type_=sa.Enum("Draft", "Pending", "Approved", "Rejected",
                          "Disapproved", name="ApprovalStateEnum", native_enum=False),
            existing_nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("Blueprint") as batch_op:
        batch_op.alter_column(
            "ApprovalState",
            existing_type=sa.Enum("Draft", "Pending", "Approved", "Rejected",
                                  "Disapproved", name="ApprovalStateEnum", native_enum=False),
            type_=sa.Enum("Draft", "Pending", "Approved", "Rejected",
                          name="ApprovalStateEnum", native_enum=False),
            existing_nullable=False,
        )
