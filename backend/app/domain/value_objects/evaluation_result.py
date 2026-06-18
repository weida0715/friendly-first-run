"""Evaluation result value object."""

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass(frozen=True, slots=True)
class EvaluationResult:
    """Immutable evaluation metrics payload."""

    sharpe: Decimal | None
    accuracy: Decimal | None
    precision: Decimal | None
    recall: Decimal | None
    metrics: dict[str, Any] | None = None
