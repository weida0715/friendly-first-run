"""RFC-002 strict ERD baseline schema.

Revision ID: 20260503_0001
Revises:
Create Date: 2026-05-03 00:35:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260503_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create strict ERD tables for RFC-002 baseline."""

    op.create_table(
        "User",
        sa.Column("UserID", sa.Integer(), primary_key=True,
                  autoincrement=True, nullable=False),
        sa.Column("Username", sa.String(length=12),
                  nullable=False, unique=True),
        sa.Column("Email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("PasswordHash", sa.String(length=255), nullable=False),
        sa.Column("Name", sa.String(length=100), nullable=False),
        sa.Column("Role", sa.Enum("User", "Moderator", "Admin",
                  name="RoleEnum", native_enum=False), nullable=False),
        sa.Column(
            "Status",
            sa.Enum("Enabled", "Disabled", "Pending",
                    name="UserStatusEnum", native_enum=False),
            nullable=False,
        ),
        sa.Column("CreatedAt", sa.DateTime(), nullable=False),
        sa.Column("UpdatedAt", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "Blueprint",
        sa.Column("BlueprintID", sa.Integer(), primary_key=True,
                  autoincrement=True, nullable=False),
        sa.Column("UserID", sa.Integer(), sa.ForeignKey(
            "User.UserID"), nullable=False),
        sa.Column("Name", sa.String(length=100), nullable=False),
        sa.Column("Description", sa.Text(), nullable=True),
        sa.Column("Indicators", sa.JSON(), nullable=False),
        sa.Column("Features", sa.JSON(), nullable=False),
        sa.Column("Architecture", sa.JSON(), nullable=False),
        sa.Column(
            "ApprovalState",
            sa.Enum("Draft", "Pending", "Approved", "Rejected",
                    name="ApprovalStateEnum", native_enum=False),
            nullable=False,
        ),
        sa.Column("SubmittedAt", sa.DateTime(), nullable=True),
        sa.Column("Version", sa.Integer(), nullable=False),
        sa.Column("ParentID", sa.Integer(), sa.ForeignKey(
            "Blueprint.BlueprintID"), nullable=True),
        sa.Column("CreatedAt", sa.DateTime(), nullable=False),
        sa.Column("UpdatedAt", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("UserID", "Name", "Version",
                            name="uq_Blueprint_UserID_Name_Version"),
        sa.CheckConstraint("ParentID IS NULL OR ParentID <> BlueprintID",
                           name="ck_Blueprint_ParentID_not_self"),
    )

    op.create_table(
        "Experiment",
        sa.Column("ExperimentID", sa.Integer(), primary_key=True,
                  autoincrement=True, nullable=False),
        sa.Column("UserID", sa.Integer(), sa.ForeignKey(
            "User.UserID"), nullable=False),
        sa.Column("BlueprintID", sa.Integer(), sa.ForeignKey(
            "Blueprint.BlueprintID"), nullable=False),
        sa.Column("Name", sa.String(length=100), nullable=False),
        sa.Column("Description", sa.Text(), nullable=True),
        sa.Column(
            "Interval",
            sa.Enum("1m", "5m", "15m", "1h", "4h", "1d",
                    name="ExperimentIntervalEnum", native_enum=False),
            nullable=False,
        ),
        sa.Column("StartDate", sa.Date(), nullable=False),
        sa.Column("EndDate", sa.Date(), nullable=False),
        sa.Column("TrainSplit", sa.Numeric(3, 2), nullable=False),
        sa.Column("ValSplit", sa.Numeric(3, 2), nullable=False),
        sa.Column("TestSplit", sa.Numeric(3, 2), nullable=False),
        sa.Column("ParameterOverrides", sa.JSON(), nullable=True),
        sa.Column(
            "Status",
            sa.Enum(
                "Queued", "Running", "Completed", "Failed", "Cancelled", name="ExperimentStatusEnum", native_enum=False
            ),
            nullable=False,
        ),
        sa.Column("Progress", sa.Numeric(5, 2), nullable=True),
        sa.Column("CurrentStage", sa.String(length=50), nullable=True),
        sa.Column("EtaSeconds", sa.Integer(), nullable=True),
        sa.Column("Success", sa.Boolean(), nullable=True),
        sa.Column("CreatedAt", sa.DateTime(), nullable=False),
        sa.Column("CompletedAt", sa.DateTime(), nullable=True),
        sa.CheckConstraint(
            "TrainSplit + ValSplit + TestSplit = 1.00", name="ck_Experiment_SplitSum"),
        sa.CheckConstraint("ValSplit >= 0.10 AND TestSplit >= 0.10",
                           name="ck_Experiment_MinValTestSplit"),
    )

    op.create_table(
        "Model",
        sa.Column("ModelID", sa.Integer(), primary_key=True,
                  autoincrement=True, nullable=False),
        sa.Column("ExperimentID", sa.Integer(), sa.ForeignKey(
            "Experiment.ExperimentID"), nullable=False),
        sa.Column("Parameters", sa.JSON(), nullable=False),
        sa.Column("Sharpe", sa.Numeric(10, 4), nullable=True),
        sa.Column("Accuracy", sa.Numeric(5, 4), nullable=True),
        sa.Column("Precision", sa.Numeric(5, 4), nullable=True),
        sa.Column("Recall", sa.Numeric(5, 4), nullable=True),
        sa.Column("CreatedAt", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "ExperimentLog",
        sa.Column("ExperimentLogID", sa.Integer(), primary_key=True,
                  autoincrement=True, nullable=False),
        sa.Column("ExperimentID", sa.Integer(), sa.ForeignKey(
            "Experiment.ExperimentID"), nullable=False),
        sa.Column("ModelID", sa.Integer(), sa.ForeignKey(
            "Model.ModelID"), nullable=False),
        sa.Column("Timestamp", sa.DateTime(), nullable=False),
        sa.Column("Signal", sa.SmallInteger(), nullable=False),
        sa.Column("Prediction", sa.Numeric(10, 4), nullable=True),
        sa.Column("Metrics", sa.JSON(), nullable=True),
        sa.Column("CreatedAt", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "FavoriteModel",
        sa.Column("UserID", sa.Integer(), sa.ForeignKey(
            "User.UserID"), primary_key=True, nullable=False),
        sa.Column("ModelID", sa.Integer(), sa.ForeignKey(
            "Model.ModelID"), primary_key=True, nullable=False),
        sa.Column("CreatedAt", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "FavoriteBlueprint",
        sa.Column("UserID", sa.Integer(), sa.ForeignKey(
            "User.UserID"), primary_key=True, nullable=False),
        sa.Column("BlueprintID", sa.Integer(), sa.ForeignKey(
            "Blueprint.BlueprintID"), primary_key=True, nullable=False),
        sa.Column("CreatedAt", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "BTCUSDTKline",
        sa.Column("Timestamp", sa.DateTime(),
                  primary_key=True, nullable=False),
        sa.Column("Open", sa.Numeric(15, 8), nullable=False),
        sa.Column("High", sa.Numeric(15, 8), nullable=False),
        sa.Column("Low", sa.Numeric(15, 8), nullable=False),
        sa.Column("Close", sa.Numeric(15, 8), nullable=False),
        sa.Column("Volume", sa.Numeric(20, 8), nullable=False),
        sa.Column("CreatedAt", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    """Drop strict ERD tables in reverse dependency order."""

    op.drop_table("BTCUSDTKline")
    op.drop_table("FavoriteBlueprint")
    op.drop_table("FavoriteModel")
    op.drop_table("ExperimentLog")
    op.drop_table("Model")
    op.drop_table("Experiment")
    op.drop_table("Blueprint")
    op.drop_table("User")
