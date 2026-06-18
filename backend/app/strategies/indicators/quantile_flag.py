"""Rolling quantile flag custom indicator."""

from __future__ import annotations

import polars as pl

from app.strategies.indicators.base import CustomIndicator


class QuantileFlagIndicator(CustomIndicator):
    """Compute a binary flag when a column is above its rolling quantile threshold.

    Params:
        df: Polars LazyFrame containing the selected `column`.
        column: Source column name to compare against the rolling quantile; accepts an existing numeric column, default `close`.
        window: Positive integer rolling window size, default 20.
        quantile: Float in [0.0, 1.0] used as the rolling quantile, default 0.8.
        output: Name of the returned flag column; accepts any non-empty string, default `<column>_quantile_flag`.
    Outputs:
        Returns the input LazyFrame with one new Int8 binary column named by `output` containing 0 or 1.
    """

    indicator_name = "quantile_flag"
    name = indicator_name
    parameter_schema = {"column": "string", "window": "integer", "quantile": "number", "output": "string"}
    parameter_constraints = {"column": {"required": True, "default": "close"}, "window": {"min": 1, "default": 20}, "quantile": {"min": 0.0, "max": 1.0, "default": 0.8}, "output": {"required": False}}
    default_values = {"column": "close", "window": 20, "quantile": 0.8, "output": None}
    output_columns = ("<column>_quantile_flag",)
    warmup_period = 20

    def apply(
        self,
        df: pl.LazyFrame,
        column: str = "close",
        window: int = 20,
        quantile: float = 0.8,
        output: str | None = None,
    ) -> pl.LazyFrame:
        output_name = output or f"{column}_quantile_flag"
        threshold = pl.col(column).cast(pl.Float64).rolling_quantile(quantile, window_size=window)
        return df.with_columns((pl.col(column).cast(pl.Float64) >= threshold).cast(pl.Int8).alias(output_name))
