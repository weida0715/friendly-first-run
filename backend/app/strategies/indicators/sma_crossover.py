"""SMA crossover custom indicator."""

from __future__ import annotations

import polars as pl

from app.strategies.indicators.base import CustomIndicator


class SMACrossoverIndicator(CustomIndicator):
    indicator_name = "sma_crossover"
    name = indicator_name
    parameter_schema = {"short_window": "integer", "long_window": "integer", "crossover_bull": "integer", "crossover_bear": "integer"}
    parameter_constraints = {
        "short_window": {"min": 1, "default": 10},
        "long_window": {"min": 1, "default": 30},
        "crossover_bull": {"default": 2},
        "crossover_bear": {"default": -2},
    }
    default_values = {"short_window": 10, "long_window": 30, "crossover_bull": 2, "crossover_bear": -2}
    output_columns = ("crossover", "signal")
    warmup_period = 30

    def apply(
        self,
        df: pl.LazyFrame,
        short_window: int = 10,
        long_window: int = 30,
        crossover_bull: int = 2,
        crossover_bear: int = -2,
    ) -> pl.LazyFrame:
        short = pl.col("close").cast(pl.Float64).rolling_mean(window_size=short_window).alias("_sma_short")
        long = pl.col("close").cast(pl.Float64).rolling_mean(window_size=long_window).alias("_sma_long")
        relation = (
            pl.when(pl.col("_sma_short") > pl.col("_sma_long"))
            .then(1)
            .when(pl.col("_sma_short") < pl.col("_sma_long"))
            .then(-1)
            .otherwise(0)
            .alias("_sma_relation")
        )
        crossover = (pl.col("_sma_relation") - pl.col("_sma_relation").shift(1)).alias("crossover")
        signal = (
            pl.when(pl.col("crossover") == crossover_bull)
            .then(1)
            .when(pl.col("crossover") == crossover_bear)
            .then(-1)
            .otherwise(0)
            .alias("signal")
        )
        return df.with_columns([short, long]).with_columns([relation]).with_columns([crossover]).with_columns([signal]).drop(["_sma_short", "_sma_long", "_sma_relation"])
