"""Time-based sequential split strategy."""

from __future__ import annotations

from typing import Any

import polars as pl

from app.strategies.splits.base import DataSplitStrategy, build_split_result, split_sizes
from app.strategies.splits.split_result import SplitResult


class TimeBasedSequentialSplitStrategy(DataSplitStrategy):
    """Create contiguous train/validation/test splits ordered by timestamp."""

    strategy_name = "time_based_sequential"

    def split(self, df: pl.LazyFrame, cfg: dict[str, Any]) -> SplitResult:
        materialized = df.sort("timestamp").collect()
        train_count, val_count, test_count = split_sizes(materialized.height, cfg)
        train = materialized.slice(0, train_count)
        validation = materialized.slice(train_count, val_count)
        test = materialized.slice(train_count + val_count, test_count)
        params = {"train_split": cfg.get("train_split", 80), "val_split": cfg.get("val_split", 10), "test_split": cfg.get("test_split", 10)}
        return build_split_result(train=train, validation=validation, test=test, strategy=self.strategy_name, params=params)
