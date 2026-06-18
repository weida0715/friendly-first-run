"""Split result value object."""

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True, slots=True)
class SplitResult:
    """Immutable train/validation/test split result."""

    train_split: Decimal
    val_split: Decimal
    test_split: Decimal
