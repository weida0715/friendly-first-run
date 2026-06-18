"""Experiment configuration value object."""

from dataclasses import dataclass, field
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any


@dataclass(frozen=True, slots=True, init=False)
class ExperimentConfig:
    """Immutable experiment configuration payload."""

    interval: str
    start_datetime: datetime
    end_datetime: datetime
    train_split: Decimal
    val_split: Decimal
    test_split: Decimal
    split_strategy: str = "time_based_sequential"
    target_strategy: str = "forward_return"
    deterministic: bool = True
    seed: int = 42
    parameter_overrides: dict[str, Any] | None = None

    def __init__(
        self,
        *,
        interval: str,
        train_split: Decimal,
        val_split: Decimal,
        test_split: Decimal,
        start_datetime: datetime | None = None,
        end_datetime: datetime | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        split_strategy: str = "time_based_sequential",
        target_strategy: str = "forward_return",
        deterministic: bool = True,
        seed: int = 42,
        parameter_overrides: dict[str, Any] | None = None,
    ) -> None:
        if start_datetime is None:
            if start_date is None:
                raise TypeError("start_datetime or start_date is required")
            start_datetime = datetime.combine(start_date, time.min)
        if end_datetime is None:
            if end_date is None:
                raise TypeError("end_datetime or end_date is required")
            end_datetime = datetime.combine(end_date, time.max)

        object.__setattr__(self, "interval", interval)
        object.__setattr__(self, "start_datetime", start_datetime)
        object.__setattr__(self, "end_datetime", end_datetime)
        object.__setattr__(self, "train_split", train_split)
        object.__setattr__(self, "val_split", val_split)
        object.__setattr__(self, "test_split", test_split)
        object.__setattr__(self, "split_strategy", split_strategy)
        object.__setattr__(self, "target_strategy", target_strategy)
        object.__setattr__(self, "deterministic", deterministic)
        object.__setattr__(self, "seed", seed)
        object.__setattr__(self, "parameter_overrides", parameter_overrides)

    @property
    def start_date(self):
        return self.start_datetime.date()

    @property
    def end_date(self):
        return self.end_datetime.date()
