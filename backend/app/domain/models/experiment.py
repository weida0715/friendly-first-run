"""Strict ERD-aligned Experiment domain entity."""

from dataclasses import dataclass
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any, Literal

Interval = Literal["1m", "5m", "15m", "30m", "1h", "2h", "4h", "1d"]
ExperimentStatus = Literal["Queued", "Running",
                           "Completed", "Failed", "Cancelled"]


@dataclass(slots=True)
class Experiment:
    """Represents the ERD-defined Experiment entity."""

    experiment_id: int | None
    user_id: int
    blueprint_id: int
    name: str
    description: str | None
    interval: Interval
    start_date: date
    end_date: date
    train_split: Decimal
    val_split: Decimal
    test_split: Decimal
    parameter_overrides: dict[str, Any] | None
    status: ExperimentStatus
    progress: Decimal | None
    current_stage: str | None
    eta_seconds: int | None
    success: bool | None
    created_at: datetime
    completed_at: datetime | None
    job_id: str | None = None
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    compiled_blueprint_snapshot: dict[str, Any] | None = None
    compiled_experiment_snapshot: dict[str, Any] | None = None
    deterministic: bool = True
    seed: int = 42
    max_permutation_count: int | None = None
    requested_permutation_count: int | None = None

    @property
    def ExperimentID(self) -> int | None: return self.experiment_id
    @property
    def UserID(self) -> int: return self.user_id
    @property
    def BlueprintID(self) -> int: return self.blueprint_id
    @property
    def Name(self) -> str: return self.name
    @property
    def Description(self) -> str | None: return self.description
    @property
    def Interval(self) -> Interval: return self.interval
    @property
    def StartDate(self) -> date: return self.start_date
    @property
    def EndDate(self) -> date: return self.end_date

    @property
    def StartDateTime(
        self) -> datetime: return self.start_datetime or datetime.combine(self.start_date, time.min)

    @property
    def EndDateTime(
        self) -> datetime: return self.end_datetime or datetime.combine(self.end_date, time.max)

    @property
    def TrainSplit(self) -> Decimal: return self.train_split
    @property
    def ValSplit(self) -> Decimal: return self.val_split
    @property
    def TestSplit(self) -> Decimal: return self.test_split

    @property
    def ParameterOverrides(
        self) -> dict[str, Any] | None: return self.parameter_overrides

    @property
    def Status(self) -> ExperimentStatus: return self.status
    @property
    def Progress(self) -> Decimal | None: return self.progress
    @property
    def CurrentStage(self) -> str | None: return self.current_stage
    @property
    def EtaSeconds(self) -> int | None: return self.eta_seconds
    @property
    def Success(self) -> bool | None: return self.success
    @property
    def CreatedAt(self) -> datetime: return self.created_at
    @property
    def CompletedAt(self) -> datetime | None: return self.completed_at
    @property
    def JobID(self) -> str | None: return self.job_id
