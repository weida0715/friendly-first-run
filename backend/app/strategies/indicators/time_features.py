"""Timestamp-derived time features."""

from __future__ import annotations

import polars as pl

from app.strategies.indicators.base import CustomIndicator


class TimeFeaturesIndicator(CustomIndicator):
    indicator_name = "time_features"
    name = indicator_name
    parameter_schema = {}
    parameter_constraints = {}
    default_values = {}
    output_columns = ("hour", "minute", "weekday")
    warmup_period = 0

    def apply(self, df: pl.LazyFrame) -> pl.LazyFrame:
        timestamp = pl.col("timestamp")
        return df.with_columns(
            [
                timestamp.dt.hour().alias("hour"),
                timestamp.dt.minute().alias("minute"),
                timestamp.dt.weekday().alias("weekday"),
            ]
        )
