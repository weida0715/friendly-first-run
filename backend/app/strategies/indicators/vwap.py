"""VWAP custom indicator."""

from __future__ import annotations

import polars as pl

from app.strategies.indicators.base import CustomIndicator


class VWAPIndicator(CustomIndicator):
    """Compute cumulative volume-weighted average price for each split.

    Params:
        df: Polars LazyFrame with `high`, `low`, `close`, and `volume` columns.
        output: Name of the returned VWAP column; accepts any non-empty string, default `vwap`.
    Outputs:
        Returns the input LazyFrame with one new Float64 column named by `output`.
    """

    indicator_name = "vwap"
    name = indicator_name
    parameter_schema = {"output": "string"}
    parameter_constraints = {"output": {"required": False, "default": "vwap"}}
    default_values = {"output": "vwap"}
    output_columns = ("vwap",)
    warmup_period = 0

    def apply(self, df: pl.LazyFrame, output: str = "vwap") -> pl.LazyFrame:
        typical_price = ((pl.col("high") + pl.col("low") + pl.col("close")) / 3).cast(pl.Float64)
        volume = pl.col("volume").cast(pl.Float64)
        return df.with_columns(((typical_price * volume).cum_sum() / volume.cum_sum()).alias(output))
