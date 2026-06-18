"""Ichimoku Cloud custom indicator."""

from __future__ import annotations

import polars as pl

from app.strategies.indicators.base import CustomIndicator


class IchimokuCloudIndicator(CustomIndicator):
    """Compute Ichimoku Cloud conversion, base, and leading span columns.

    Params:
        df: Polars LazyFrame with `high` and `low` columns.
        conversion_period: Positive integer rolling window for conversion line, default 9.
        base_period: Positive integer rolling window for base line, default 26.
        span_b_period: Positive integer rolling window for span B, default 52.
        displacement: Non-negative integer forward displacement for leading spans, default 26.
    Outputs:
        Returns the input LazyFrame with `ichimoku_conversion`, `ichimoku_base`, `ichimoku_span_a`, and `ichimoku_span_b` Float64 columns.
    """

    indicator_name = "ichimoku_cloud"
    name = indicator_name
    parameter_schema = {"conversion_period": "integer", "base_period": "integer", "span_b_period": "integer", "displacement": "integer"}
    parameter_constraints = {"conversion_period": {"min": 1, "default": 9}, "base_period": {"min": 1, "default": 26}, "span_b_period": {"min": 1, "default": 52}, "displacement": {"min": 0, "default": 26}}
    default_values = {"conversion_period": 9, "base_period": 26, "span_b_period": 52, "displacement": 26}
    warmup_period = 52
    output_columns = (
        "ichimoku_conversion",
        "ichimoku_base",
        "ichimoku_span_a",
        "ichimoku_span_b",
    )

    def apply(
        self,
        df: pl.LazyFrame,
        conversion_period: int = 9,
        base_period: int = 26,
        span_b_period: int = 52,
        displacement: int = 26,
    ) -> pl.LazyFrame:
        high = pl.col("high").cast(pl.Float64)
        low = pl.col("low").cast(pl.Float64)
        conversion = ((high.rolling_max(conversion_period) + low.rolling_min(conversion_period)) / 2).alias("ichimoku_conversion")
        baseline = ((high.rolling_max(base_period) + low.rolling_min(base_period)) / 2).alias("ichimoku_base")
        span_a = ((conversion + baseline) / 2).shift(displacement).alias("ichimoku_span_a")
        span_b = (((high.rolling_max(span_b_period) + low.rolling_min(span_b_period)) / 2).shift(displacement)).alias("ichimoku_span_b")
        return df.with_columns([conversion, baseline, span_a, span_b])
