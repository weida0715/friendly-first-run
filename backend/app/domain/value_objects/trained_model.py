"""Trained model value object."""

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass(frozen=True, slots=True)
class TrainedModel:
    """Immutable trained-model summary payload."""

    model_id: int | None
    parameters: dict[str, Any]
    sharpe: Decimal | None = None
    accuracy: Decimal | None = None
    precision: Decimal | None = None
    recall: Decimal | None = None
