"""Strict ERD-aligned Model domain entity."""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any


@dataclass(slots=True)
class Model:
    """Represents the ERD-defined Model entity."""

    model_id: int | None
    experiment_id: int
    parameters: dict[str, Any]
    sharpe: Decimal | None
    accuracy: Decimal | None
    precision: Decimal | None
    recall: Decimal | None
    created_at: datetime | None
    parameter_hash: str | None = None

    @property
    def ModelID(self) -> int | None: return self.model_id
    @property
    def ExperimentID(self) -> int: return self.experiment_id
    @property
    def Parameters(self) -> dict[str, Any]: return self.parameters
    @property
    def Sharpe(self) -> Decimal | None: return self.sharpe
    @property
    def Accuracy(self) -> Decimal | None: return self.accuracy
    @property
    def Precision(self) -> Decimal | None: return self.precision
    @property
    def Recall(self) -> Decimal | None: return self.recall
    @property
    def CreatedAt(self) -> datetime | None: return self.created_at
    @property
    def ParameterHash(self) -> str | None: return self.parameter_hash
