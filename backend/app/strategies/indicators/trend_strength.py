"""Trend strength custom indicator."""

from __future__ import annotations

import polars as pl

from app.strategies.indicators.base import CustomIndicator


class TrendStrengthIndicator(CustomIndicator):
    indicator_name = "trend_strength"
    name = indicator_name
    parameter_schema = {"fast_period": "integer", "slow_period": "integer"}
    parameter_constraints = {
        "fast_period": {"min": 1, "default": 20},
        "slow_period": {"min": 1, "default": 50},
    }
    default_values = {"fast_period": 20, "slow_period": 50}
    output_columns = ("trend_strength",)
    warmup_period = 50

    def apply(self, df: pl.LazyFrame, fast_period: int = 20, slow_period: int = 50) -> pl.LazyFrame:
        sma_fast = pl.col("close").cast(pl.Float64).rolling_mean(window_size=fast_period).alias("_sma_fast")
        sma_slow = pl.col("close").cast(pl.Float64).rolling_mean(window_size=slow_period).alias("_sma_slow")
        trend = (
            pl.when(pl.col("_sma_slow") == 0)
            .then(None)
            .otherwise((pl.col("_sma_fast") - pl.col("_sma_slow")) / pl.col("_sma_slow"))
            .alias("trend_strength")
        )
        return df.with_columns([sma_fast, sma_slow]).with_columns([trend]).drop(["_sma_fast", "_sma_slow"])
