"""Forward-return binary target strategy."""

from __future__ import annotations

import polars as pl

from app.strategies.targets.base import TargetStrategy


class ForwardReturnTargetStrategy(TargetStrategy):
    """Generate `target=1` when future close return exceeds a threshold, else `0`."""

    target_name = "forward_return"
    parameter_schema = {"lookahead_period": "integer", "return_threshold": "number"}
    parameter_constraints = {"lookahead_period": {"min": 1, "max": 1440}, "return_threshold": {"min": -1.0, "max": 1.0}}
    default_values = {"lookahead_period": 1, "return_threshold": 0.0}
    binary_label_rule = "1 when close[t+lookahead] / close[t] - 1 > return_threshold, otherwise 0"

    def __init__(self, lookahead_period: int = 1, return_threshold: float = 0.0) -> None:
        if lookahead_period < 1:
            raise ValueError("lookahead_period must be >= 1")
        self.lookahead_period = lookahead_period
        self.return_threshold = return_threshold

    def generate(self, df: pl.LazyFrame) -> pl.LazyFrame:
        future_return = (pl.col("close").shift(-self.lookahead_period).cast(pl.Float64) / pl.col("close").cast(pl.Float64)) - 1.0
        return df.with_columns((future_return > self.return_threshold).cast(pl.Int8).alias(self.output_column))
