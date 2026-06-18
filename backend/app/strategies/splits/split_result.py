"""Split result value object for split-first experiment execution."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import polars as pl


@dataclass(frozen=True)
class SplitResult:
    train_df: pl.LazyFrame
    validation_df: pl.LazyFrame
    test_df: pl.LazyFrame
    train_boundary: dict[str, Any] = field(default_factory=dict)
    validation_boundary: dict[str, Any] = field(default_factory=dict)
    test_boundary: dict[str, Any] = field(default_factory=dict)
    row_counts: dict[str, int] = field(default_factory=dict)
    split_strategy_params: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def train(self) -> pl.LazyFrame:
        return self.train_df

    @property
    def validation(self) -> pl.LazyFrame:
        return self.validation_df

    @property
    def test(self) -> pl.LazyFrame:
        return self.test_df

    @property
    def val_df(self) -> pl.LazyFrame:
        return self.validation_df

    @property
    def counts(self) -> dict[str, int]:
        return self.row_counts
