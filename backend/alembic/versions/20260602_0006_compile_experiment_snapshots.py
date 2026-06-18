"""Add compiled experiment snapshots and model parameter hashes.

Revision ID: 20260602_0006
Revises: 20260519_0005
Create Date: 2026-06-02
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260602_0006"
down_revision = "20260519_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("Experiment", sa.Column("CompiledBlueprintSnapshot", sa.JSON(), nullable=True))
    op.add_column("Experiment", sa.Column("CompiledExperimentSnapshot", sa.JSON(), nullable=True))
    op.add_column("Experiment", sa.Column("Deterministic", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("Experiment", sa.Column("Seed", sa.Integer(), nullable=False, server_default="42"))
    op.add_column("Experiment", sa.Column("MaxPermutationCount", sa.Integer(), nullable=True))
    op.add_column("Experiment", sa.Column("RequestedPermutationCount", sa.Integer(), nullable=True))
    op.add_column("Model", sa.Column("ParameterHash", sa.String(length=64), nullable=True))
    op.create_unique_constraint("uq_Model_ExperimentID_ParameterHash", "Model", ["ExperimentID", "ParameterHash"])


def downgrade() -> None:
    op.drop_constraint("uq_Model_ExperimentID_ParameterHash", "Model", type_="unique")
    op.drop_column("Model", "ParameterHash")
    op.drop_column("Experiment", "RequestedPermutationCount")
    op.drop_column("Experiment", "MaxPermutationCount")
    op.drop_column("Experiment", "Seed")
    op.drop_column("Experiment", "Deterministic")
    op.drop_column("Experiment", "CompiledExperimentSnapshot")
    op.drop_column("Experiment", "CompiledBlueprintSnapshot")
