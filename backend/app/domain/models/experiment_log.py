"""Strict ERD-aligned ExperimentLog domain entity."""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any


@dataclass(slots=True)
class ExperimentLog:
    """Represents the ERD-defined ExperimentLog entity."""

    experiment_log_id: int | None
    experiment_id: int
    model_id: int
    timestamp: datetime
    signal: int
    prediction: Decimal | None
    metrics: dict[str, Any] | None
    created_at: datetime

    @property
    def ExperimentLogID(self) -> int | None: return self.experiment_log_id
    @property
    def ExperimentID(self) -> int: return self.experiment_id
    @property
    def ModelID(self) -> int: return self.model_id
    @property
    def Timestamp(self) -> datetime: return self.timestamp
    @property
    def Signal(self) -> int: return self.signal
    @property
    def Prediction(self) -> Decimal | None: return self.prediction
    @property
    def Metrics(self) -> dict[str, Any] | None: return self.metrics
    @property
    def CreatedAt(self) -> datetime: return self.created_at
