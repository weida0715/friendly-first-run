from __future__ import annotations

from datetime import datetime, timedelta, UTC

import polars as pl

from app.factories.blueprint_factory import BlueprintFactory
from app.factories.indicator_factory import IndicatorFactory
from app.strategies.indicator_strategy import IndicatorPipelineStrategy, drop_warmup_nulls


def _frame(rows: int = 60) -> pl.LazyFrame:
    start = datetime(2026, 1, 1, tzinfo=UTC)
    close = [float(i + 1) for i in range(rows)]
    return pl.DataFrame(
        {
            "timestamp": [start + timedelta(minutes=i) for i in range(rows)],
            "open": [value - 0.2 for value in close],
            "high": [value + 1.0 for value in close],
            "low": [value - 1.0 for value in close],
            "close": close,
            "volume": [100.0 + i for i in range(rows)],
        }
    ).lazy()


def test_indicator_factory_exposes_new_custom_metadata() -> None:
    metadata = IndicatorFactory.metadata("rolling_volatility")
    assert metadata["name"] == "rolling_volatility"
    assert metadata["parameter_constraints"]["window"]["default"] == 12
    assert metadata["output_columns"] == ["<column>_volatility_<window>"]


def test_blueprint_factory_normalizes_new_indicator_names() -> None:
    normalized = BlueprintFactory.normalize_payload(
        {
            "architecture": {"name": "logistic_regressor_arc"},
            "indicators": {
                "selected": [
                    "rolling_volatility",
                    "wilder_rsi",
                    "price_range_position",
                    "trend_strength",
                    "time_features",
                    "sma_crossover",
                ]
            },
        }
    )

    assert normalized["indicators"]["selected"] == [
        "rolling_volatility",
        "wilder_rsi",
        "price_range_position",
        "trend_strength",
        "time_features",
        "sma_crossover",
    ]
    assert "hour" in normalized["features"]["indicator_outputs"]
    assert "signal" in normalized["features"]["indicator_outputs"]


def test_indicator_pipeline_applies_new_custom_indicators() -> None:
    cfg = {
        "indicators": [
            {"name": "rolling_volatility", "params": {"window": 5}},
            {"name": "wilder_rsi", "params": {"period": 5}},
            {"name": "price_range_position", "params": {"period": 5}},
            {"name": "trend_strength", "params": {"fast_period": 3, "slow_period": 8}},
            {"name": "time_features", "params": {}},
            {"name": "sma_crossover", "params": {"short_window": 3, "long_window": 8}},
        ]
    }

    out = drop_warmup_nulls(IndicatorPipelineStrategy().apply(_frame(), cfg)).collect()

    assert "close_volatility_5" in out.columns
    assert "wilder_rsi_5" in out.columns
    assert "price_range_position" in out.columns
    assert "trend_strength" in out.columns
    assert {"hour", "minute", "weekday"}.issubset(out.columns)
    assert {"crossover", "signal"}.issubset(out.columns)
    assert out["price_range_position"].drop_nulls().min() >= 0.0
    assert out["price_range_position"].drop_nulls().max() <= 1.0
    assert out["wilder_rsi_5"].drop_nulls().max() <= 100.0

