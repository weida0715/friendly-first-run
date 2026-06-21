from datetime import UTC, datetime, timedelta

import math

import polars as pl

from app.strategies.targets.plot_target_direction_relationships import (
    aggregate_ohlcv_interval,
    _cohort_frame,
    summarize_target_profitability,
    summarize_target_verification,
    simulate_predictions_by_precision_recall,
)


def _sample_frame() -> pl.DataFrame:
    return pl.DataFrame(
        {
            "timestamp": [
                datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 1, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 2, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 3, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 4, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 5, 0, tzinfo=UTC),
            ],
            "open": [100.0, 100.0, 110.0, 99.0, 108.9, 98.01],
            "high": [101.0, 111.0, 110.0, 109.0, 109.9, 108.0],
            "low": [99.0, 99.0, 99.0, 98.0, 98.0, 97.0],
            "close": [100.0, 110.0, 99.0, 108.9, 98.01, 107.811],
            "volume": [10.0] * 6,
            "target": [0, 1, 0, 1, 1, 0],
        }
    )


def test_target_profitability_helper_filters_target_bars_and_computes_returns() -> None:
    frame = _sample_frame()

    signal_frame = _cohort_frame(frame, 1, target_value=1)
    assert signal_frame["target"].to_list() == [1, 1, 1]

    report = summarize_target_profitability(frame, horizons=(1, 2))
    assert len(report) == 2
    assert report[0]["all"]["count"] == 5
    assert report[0]["signal"]["count"] == 3
    assert report[0]["all_count"] == 5
    assert report[0]["signal_count"] == 3
    assert report[0]["non_signal_count"] == 2
    assert math.isclose(report[0]["signal_spread"], -0.1333333333333334, rel_tol=1e-9)
    assert math.isclose(report[0]["lift"], -0.05333333333333336, rel_tol=1e-9)
    assert math.isclose(report[0]["all"]["mean"], 0.02, rel_tol=1e-9)
    assert math.isclose(report[0]["signal"]["mean"], -0.03333333333333333, rel_tol=1e-9)
    assert math.isclose(report[0]["all"]["profit_factor"], 1.5, rel_tol=1e-9)
    assert math.isclose(report[0]["signal"]["profit_factor"], 0.5, rel_tol=1e-9)

    costed = summarize_target_profitability(frame, horizons=(1,), cost_bps=50)
    assert math.isclose(costed[0]["all"]["mean"], 0.015, rel_tol=1e-9)


def test_cohort_frame_excludes_null_target_rows_from_baseline() -> None:
    frame = _sample_frame().with_columns(
        pl.Series("target", [0, 1, 0, None, 1, 0], dtype=pl.Int8)
    )
    all_frame = _cohort_frame(frame, 1)
    assert all_frame["target"].null_count() == 0
    assert all_frame.height == 4
    assert all_frame["forward_return"].len() == 4


def test_mock_prediction_bridge_preserves_null_targets_and_binary_output() -> None:
    frame = _sample_frame().with_columns(
        pl.Series("target", [0, 1, 0, None, 1, 0], dtype=pl.Int8)
    )
    mock_frame = simulate_predictions_by_precision_recall(frame, precision=0.6, recall=0.5, seed=7)
    assert mock_frame["target"].null_count() == 1
    assert set(mock_frame["target"].drop_nulls().unique().to_list()).issubset({0, 1})


def test_interval_aggregation_and_target_verification_metrics() -> None:
    minute_frame = pl.DataFrame(
        {
            "timestamp": [datetime(2026, 1, 1, 0, 0, tzinfo=UTC) + timedelta(minutes=i) for i in range(90)],
            "open": [float(i) for i in range(90)],
            "high": [float(i) + 0.5 for i in range(90)],
            "low": [float(i) - 0.5 for i in range(90)],
            "close": [float(i) + 0.25 for i in range(90)],
            "volume": [1.0] * 90,
        }
    )
    resampled = aggregate_ohlcv_interval(minute_frame, "45m")
    assert resampled.height == 2
    assert resampled["open"].to_list()[0] == 0.0
    assert resampled["close"].to_list()[-1] == 89.25

    verification_frame = _sample_frame().select("timestamp").with_columns(
        pl.Series("forward_return", [1, 1, 0, 1, 0, 0]),
        pl.Series("quantile_flag", [1, 1, 0, 0, 0, 0]),
        pl.Series("candle_direction", [0, 0, 0, 1, 1, 0]),
    )
    verification = summarize_target_verification(
        verification_frame,
        ("forward_return", "quantile_flag", "candle_direction"),
    )
    assert len(verification["positive_rates"]) == 3
    assert verification["positive_rates"][0]["positive_rate"] == 0.5
    assert all(item["count"] == 6 for item in verification["positive_rates"])
    pair = next(
        item for item in verification["pairwise"]
        if item["target_a"] == "forward_return" and item["target_b"] == "quantile_flag"
    )
    assert math.isclose(pair["jaccard"], 0.6666666666666666, rel_tol=1e-9)
    assert pair["correlation"] is not None
