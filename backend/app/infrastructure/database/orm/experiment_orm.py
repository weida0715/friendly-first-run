"""SQLAlchemy ORM mapping for the ERD Experiment table."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Enum, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.infrastructure.database.base import Base
from app.infrastructure.database.enums import ExperimentInterval, ExperimentStatus


class ExperimentORM(Base):
    """ORM mapping for Experiment."""

    __tablename__ = "Experiment"
    __table_args__ = (
        CheckConstraint(
            "TrainSplit + ValSplit + TestSplit = 1.00",
            name="ck_Experiment_SplitSum",
        ),
        CheckConstraint(
            "ValSplit >= 0.10 AND TestSplit >= 0.10",
            name="ck_Experiment_MinValTestSplit",
        ),
    )

    experiment_id: Mapped[int] = mapped_column(
        "ExperimentID", Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        "UserID", ForeignKey("User.UserID"), nullable=False)
    blueprint_id: Mapped[int] = mapped_column(
        "BlueprintID", ForeignKey("Blueprint.BlueprintID"), nullable=False)
    name: Mapped[str] = mapped_column("Name", String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(
        "Description", Text, nullable=True)
    interval: Mapped[ExperimentInterval] = mapped_column(
        "Interval",
        Enum(ExperimentInterval, values_callable=lambda e: [
             item.value for item in e], native_enum=False),
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column("StartDate", Date, nullable=False)
    end_date: Mapped[date] = mapped_column("EndDate", Date, nullable=False)
    start_datetime: Mapped[datetime | None] = mapped_column(
        "StartDateTime", DateTime, nullable=True)
    end_datetime: Mapped[datetime | None] = mapped_column(
        "EndDateTime", DateTime, nullable=True)
    train_split: Mapped[Decimal] = mapped_column(
        "TrainSplit", Numeric(3, 2), nullable=False)
    val_split: Mapped[Decimal] = mapped_column(
        "ValSplit", Numeric(3, 2), nullable=False)
    test_split: Mapped[Decimal] = mapped_column(
        "TestSplit", Numeric(3, 2), nullable=False)
    parameter_overrides: Mapped[dict | None] = mapped_column(
        "ParameterOverrides", JSON, nullable=True)
    status: Mapped[ExperimentStatus] = mapped_column(
        "Status",
        Enum(ExperimentStatus, values_callable=lambda e: [
             item.value for item in e], native_enum=False),
        nullable=False,
    )
    progress: Mapped[Decimal | None] = mapped_column(
        "Progress", Numeric(5, 2), nullable=True)
    current_stage: Mapped[str | None] = mapped_column(
        "CurrentStage", String(50), nullable=True)
    eta_seconds: Mapped[int | None] = mapped_column(
        "EtaSeconds", Integer, nullable=True)
    success: Mapped[bool | None] = mapped_column(
        "Success", Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        "CreatedAt", DateTime, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(
        "CompletedAt", DateTime, nullable=True)
    job_id: Mapped[str | None] = mapped_column(
        "JobID", String(64), nullable=True)
    compiled_blueprint_snapshot: Mapped[dict | None] = mapped_column("CompiledBlueprintSnapshot", JSON, nullable=True)
    compiled_experiment_snapshot: Mapped[dict | None] = mapped_column("CompiledExperimentSnapshot", JSON, nullable=True)
    deterministic: Mapped[bool] = mapped_column("Deterministic", Boolean, nullable=False, default=True)
    seed: Mapped[int] = mapped_column("Seed", Integer, nullable=False, default=42)
    max_permutation_count: Mapped[int | None] = mapped_column("MaxPermutationCount", Integer, nullable=True)
    requested_permutation_count: Mapped[int | None] = mapped_column("RequestedPermutationCount", Integer, nullable=True)

    ExperimentID = synonym("experiment_id")
    UserID = synonym("user_id")
    BlueprintID = synonym("blueprint_id")
    Name = synonym("name")
    Description = synonym("description")
    Interval = synonym("interval")
    StartDate = synonym("start_date")
    EndDate = synonym("end_date")
    StartDateTime = synonym("start_datetime")
    EndDateTime = synonym("end_datetime")
    TrainSplit = synonym("train_split")
    ValSplit = synonym("val_split")
    TestSplit = synonym("test_split")
    ParameterOverrides = synonym("parameter_overrides")
    Status = synonym("status")
    Progress = synonym("progress")
    CurrentStage = synonym("current_stage")
    EtaSeconds = synonym("eta_seconds")
    Success = synonym("success")
    CreatedAt = synonym("created_at")
    CompletedAt = synonym("completed_at")
    JobID = synonym("job_id")
    CompiledBlueprintSnapshot = synonym("compiled_blueprint_snapshot")
    CompiledExperimentSnapshot = synonym("compiled_experiment_snapshot")
    Deterministic = synonym("deterministic")
    Seed = synonym("seed")
    MaxPermutationCount = synonym("max_permutation_count")
    RequestedPermutationCount = synonym("requested_permutation_count")

    User = relationship("UserORM", back_populates="Experiments")
    Blueprint = relationship("BlueprintORM", back_populates="Experiments")
    Models = relationship("ModelORM", back_populates="Experiment")
    Logs = relationship("ExperimentLogORM", back_populates="Experiment")
