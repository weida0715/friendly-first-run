"""Seeded random split strategy."""

from __future__ import annotations

from typing import Any

import polars as pl

from app.strategies.splits.base import DataSplitStrategy, build_split_result, split_sizes
from app.strategies.splits.split_result import SplitResult


class RandomSplitStrategy(DataSplitStrategy):
    """Create seeded random train/validation/test splits and persist permutation metadata."""

    strategy_name = "random"

    def split(self, df: pl.LazyFrame, cfg: dict[str, Any]) -> SplitResult:
        seed = int(cfg.get("seed", 42))
        materialized = df.sort("timestamp").with_row_index("_row_id").collect()
        train_count, val_count, test_count = split_sizes(materialized.height, cfg)
        shuffled = materialized.sample(fraction=1.0, shuffle=True, seed=seed)
        train = shuffled.slice(0, train_count).sort("timestamp")
        validation = shuffled.slice(train_count, val_count).sort("timestamp")
        test = shuffled.slice(train_count + val_count, test_count).sort("timestamp")
        params = {
            "seed": seed,
            "train_split": cfg.get("train_split", 80),
            "val_split": cfg.get("val_split", 10),
            "test_split": cfg.get("test_split", 10),
            "permutation": shuffled["_row_id"].to_list() if "_row_id" in shuffled.columns else [],
        }
        result = build_split_result(train=train, validation=validation, test=test, strategy=self.strategy_name, params=params)
        result.metadata["seed"] = seed
        result.metadata["permutation"] = params["permutation"]
        return result
