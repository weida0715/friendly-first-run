"""Candle-direction binary target strategy."""

from __future__ import annotations

import polars as pl

from app.strategies.targets.base import TargetStrategy


class CandleDirectionTargetStrategy(TargetStrategy):
    """Generate target=1 when the lookahead candle closes above its open, else 0."""

    target_name = "candle_direction"
    parameter_schema = {"lookahead_period": "integer"}
    parameter_constraints = {"lookahead_period": {"min": 1, "max": 1440}}
    default_values = {"lookahead_period": 1}
    binary_label_rule = "1 when close[t+lookahead] > open[t+lookahead], otherwise 0"

    def __init__(self, lookahead_period: int = 1) -> None:
        if lookahead_period < 1:
            raise ValueError("lookahead_period must be >= 1")
        self.lookahead_period = lookahead_period

    def generate(self, df: pl.LazyFrame) -> pl.LazyFrame:
        return df.with_columns(
            (
                pl.col("close").cast(pl.Float64).shift(-self.lookahead_period)
                > pl.col("open").cast(pl.Float64).shift(-self.lookahead_period)
            )
            .cast(pl.Int8)
            .alias(self.output_column)
        )
