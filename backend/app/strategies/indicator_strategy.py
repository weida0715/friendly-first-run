"""Unified indicator pipeline for custom and TA-Lib feature generation."""

from __future__ import annotations

from typing import Any

import polars as pl

from app.strategies.indicators.custom_indicator_strategy import CUSTOM_INDICATORS, CustomIndicatorFactory
from app.strategies.indicators.talib_indicator_strategy import TA_LIB_AVAILABLE, TalibIndicatorStrategy


class IndicatorStrategy:
    def apply(self, df: pl.LazyFrame, cfg: dict[str, Any]) -> pl.LazyFrame:
        raise NotImplementedError


class IndicatorPipelineStrategy(IndicatorStrategy):
    """Dispatch configured indicators per split and append feature columns."""

    def apply(self, df: pl.LazyFrame, cfg: dict[str, Any]) -> pl.LazyFrame:
        result = df
        talib_strategy = TalibIndicatorStrategy()
        for indicator in cfg.get("indicators") or []:
            if isinstance(indicator, str):
                name, params = indicator, {}
            else:
                name = indicator.get("name")
                params = indicator.get("params", {})
            if not name:
                continue
            normalized = str(name)
            if normalized in CUSTOM_INDICATORS:
                result = CustomIndicatorFactory.create(
                    normalized).apply(result, **params)
            else:
                result = talib_strategy.apply(result, normalized, params)
        return result


CustomIndicatorStrategy = IndicatorPipelineStrategy
UnifiedIndicatorStrategy = IndicatorPipelineStrategy


def drop_warmup_nulls(df: pl.LazyFrame) -> pl.LazyFrame:
    schema = df.collect_schema()
    float_columns = [
        column
        for column, dtype in schema.items()
        if dtype in {pl.Float32, pl.Float64}
    ]
    result = df.drop_nulls()
    if float_columns:
        result = result.filter(pl.all_horizontal(
            [pl.col(column).is_finite() for column in float_columns]))
    return result
