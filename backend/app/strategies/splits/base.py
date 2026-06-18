"""Base contracts and helpers for split strategies."""

from __future__ import annotations

from typing import Any

import polars as pl

from app.strategies.splits.split_result import SplitResult


class DataSplitStrategy:
    def split(self, df: pl.LazyFrame, cfg: dict[str, Any]) -> SplitResult:
        raise NotImplementedError


def split_percentages(cfg: dict[str, Any]) -> tuple[float, float, float]:
    train = float(cfg.get("train_split", cfg.get("train", 80)))
    val = float(cfg.get("val_split", cfg.get("validation", cfg.get("val", 10))))
    test = float(cfg.get("test_split", cfg.get("test", 10)))
    total = train + val + test
    if total <= 0:
        raise ValueError("Split percentages must be positive")
    return train / total, val / total, test / total


def split_sizes(row_count: int, cfg: dict[str, Any]) -> tuple[int, int, int]:
    train_pct, val_pct, _ = split_percentages(cfg)
    train_count = int(row_count * train_pct)
    val_count = int(row_count * val_pct)
    if row_count >= 3:
        train_count = max(1, min(train_count, row_count - 2))
        val_count = max(1, min(val_count, row_count - train_count - 1))
    test_count = row_count - train_count - val_count
    return train_count, val_count, test_count


def boundary(frame: pl.DataFrame) -> dict[str, Any]:
    if frame.height == 0 or "timestamp" not in frame.columns:
        return {"start": None, "end": None}
    return {"start": frame["timestamp"][0], "end": frame["timestamp"][frame.height - 1]}


def build_split_result(
    *,
    train: pl.DataFrame,
    validation: pl.DataFrame,
    test: pl.DataFrame,
    strategy: str,
    params: dict[str, Any],
) -> SplitResult:
    row_counts = {"train": train.height, "validation": validation.height, "test": test.height}
    metadata = {
        "strategy": strategy,
        "counts": row_counts,
        "boundaries": {"train": boundary(train), "validation": boundary(validation), "test": boundary(test)},
        "split_strategy_params": params,
    }
    return SplitResult(
        train_df=train.lazy(),
        validation_df=validation.lazy(),
        test_df=test.lazy(),
        train_boundary=metadata["boundaries"]["train"],
        validation_boundary=metadata["boundaries"]["validation"],
        test_boundary=metadata["boundaries"]["test"],
        row_counts=row_counts,
        split_strategy_params=params,
        metadata=metadata,
    )
