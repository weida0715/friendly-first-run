"""Wilder RSI custom indicator."""

from __future__ import annotations

import polars as pl

from app.strategies.indicators.base import CustomIndicator


class WilderRSIIndicator(CustomIndicator):
    indicator_name = "wilder_rsi"
    name = indicator_name
    parameter_schema = {"period": "integer"}
    parameter_constraints = {"period": {"min": 1, "default": 14}}
    default_values = {"period": 14}
    output_columns = ("wilder_rsi_<period>",)
    warmup_period = 14

    def apply(self, df: pl.LazyFrame, period: int = 14) -> pl.LazyFrame:
        delta = pl.col("close").cast(pl.Float64).diff(1).alias("_delta")
        gain = pl.when(pl.col("_delta") > 0).then(pl.col("_delta")).otherwise(0.0).alias("_gain")
        loss = pl.when(pl.col("_delta") < 0).then(-pl.col("_delta")).otherwise(0.0).alias("_loss")
        avg_gain = pl.col("_gain").ewm_mean(alpha=1 / period, adjust=False).alias("_avg_gain")
        avg_loss = pl.col("_loss").ewm_mean(alpha=1 / period, adjust=False).alias("_avg_loss")
        rsi = (
            pl.when(pl.col("_avg_loss") == 0)
            .then(pl.when(pl.col("_avg_gain") == 0).then(0.0).otherwise(100.0))
            .otherwise(100 - 100 / (1 + pl.col("_avg_gain") / pl.col("_avg_loss")))
            .alias(f"wilder_rsi_{period}")
        )
        return df.with_columns([delta]).with_columns([gain, loss]).with_columns([avg_gain, avg_loss]).with_columns([rsi]).drop(["_delta", "_gain", "_loss", "_avg_gain", "_avg_loss"])
