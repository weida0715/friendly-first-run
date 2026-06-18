"""Train-only feature scaling for model-ready split data."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import polars as pl

from app.strategies.splits.split_result import SplitResult


@dataclass(frozen=True)
class ScalingResult:
    splits: SplitResult
    metadata: dict[str, Any]


class FeatureScaler:
    """Fit standard scaling statistics on train only and transform all splits."""

    strategy_name = "standard"

    def scale(self, splits: SplitResult, feature_columns: list[str] | None = None) -> ScalingResult:
        if not feature_columns:
            train_cols = splits.train_df.collect_schema().names()
            feature_columns = [c for c in train_cols if c not in {"timestamp", "target", "_row_id"}]
        train_df = splits.train_df.collect()
        stats: dict[str, dict[str, float]] = {}
        expressions = []
        for col in feature_columns:
            if col not in train_df.columns:
                continue
            mean = float(train_df.select(pl.col(col).cast(pl.Float64).mean()).item() or 0.0)
            std = float(train_df.select(pl.col(col).cast(pl.Float64).std()).item() or 0.0) or 1.0
            stats[col] = {"mean": mean, "std": std}
            expressions.append(((pl.col(col).cast(pl.Float64) - mean) / std).alias(col))
        scaler_metadata = {"strategy": self.strategy_name, "stats": stats, "feature_columns": list(stats)}
        if not expressions:
            return ScalingResult(splits, scaler_metadata)
        metadata = {**(splits.metadata or {}), "scaler": scaler_metadata}
        scaled = SplitResult(
            train_df=splits.train_df.with_columns(expressions),
            validation_df=splits.validation_df.with_columns(expressions),
            test_df=splits.test_df.with_columns(expressions),
            train_boundary=splits.train_boundary,
            validation_boundary=splits.validation_boundary,
            test_boundary=splits.test_boundary,
            row_counts=splits.row_counts,
            split_strategy_params=splits.split_strategy_params,
            metadata=metadata,
        )
        return ScalingResult(scaled, scaler_metadata)
