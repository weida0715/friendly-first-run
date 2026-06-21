"""Rolling volatility custom indicator."""

from __future__ import annotations

import polars as pl

from app.strategies.indicators.base import CustomIndicator


class RollingVolatilityIndicator(CustomIndicator):
    indicator_name = "rolling_volatility"
    name = indicator_name
    parameter_schema = {"column": "string", "window": "integer"}
    parameter_constraints = {
        "column": {"required": False, "default": "close"},
        "window": {"min": 1, "default": 12},
    }
    default_values = {"column": "close", "window": 12}
    output_columns = ("<column>_volatility_<window>",)
    warmup_period = 12

    def apply(self, df: pl.LazyFrame, column: str = "close", window: int = 12) -> pl.LazyFrame:
        return df.with_columns(
            pl.col(column).cast(pl.Float64).rolling_std(window_size=window).alias(f"{column}_volatility_{window}")
        )
