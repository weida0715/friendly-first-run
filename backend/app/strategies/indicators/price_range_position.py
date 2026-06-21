"""Price range position custom indicator."""

from __future__ import annotations

import polars as pl

from app.strategies.indicators.base import CustomIndicator


class PriceRangePositionIndicator(CustomIndicator):
    indicator_name = "price_range_position"
    name = indicator_name
    parameter_schema = {"period": "integer"}
    parameter_constraints = {"period": {"min": 1, "default": 24}}
    default_values = {"period": 24}
    output_columns = ("price_range_position",)
    warmup_period = 24

    def apply(self, df: pl.LazyFrame, period: int = 24) -> pl.LazyFrame:
        low = pl.col("low").cast(pl.Float64).rolling_min(window_size=period)
        high = pl.col("high").cast(pl.Float64).rolling_max(window_size=period)
        close = pl.col("close").cast(pl.Float64)
        return df.with_columns(((close - low) / (high - low + 1e-10)).alias("price_range_position"))
