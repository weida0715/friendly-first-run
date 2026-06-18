"""Base contracts for binary target strategies."""

from __future__ import annotations

import polars as pl


class TargetStrategy:
    target_name: str
    parameter_schema: dict
    parameter_constraints: dict
    default_values: dict
    output_column = "target"
    binary_label_rule: str

    def generate(self, df: pl.LazyFrame) -> pl.LazyFrame:
        raise NotImplementedError
