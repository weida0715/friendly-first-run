from datetime import datetime, timedelta, UTC

import polars as pl

from app.strategies.data_split_strategy import RandomSplitStrategy, TimeBasedSequentialSplitStrategy
from app.execution.feature_scaler import FeatureScaler, scale_indicator_outputs
from app.strategies.indicator_strategy import IndicatorPipelineStrategy, drop_warmup_nulls
from app.strategies.target_strategy import TargetStrategyFactory


def _frame(rows=10):
    start = datetime(2026, 1, 1, tzinfo=UTC)
    return pl.DataFrame({
        "timestamp": [start + timedelta(minutes=i) for i in range(rows)],
        "open": list(range(rows)),
        "high": list(range(rows)),
        "low": list(range(rows)),
        "close": list(range(rows)),
        "volume": [1] * rows,
    }).lazy()


def test_time_based_split_is_chronological_without_future_leakage():
    result = TimeBasedSequentialSplitStrategy().split(_frame(10), {"train_split": 60, "val_split": 20, "test_split": 20})
    train = result.train.collect(); val = result.validation.collect(); test = result.test.collect()
    assert train["timestamp"].max() < val["timestamp"].min()
    assert val["timestamp"].max() < test["timestamp"].min()
    assert result.counts == {"train": 6, "validation": 2, "test": 2}


def test_random_split_reproducible_with_same_seed():
    cfg = {"train_split": 60, "val_split": 20, "test_split": 20, "seed": 7}
    first = RandomSplitStrategy().split(_frame(12), cfg)
    second = RandomSplitStrategy().split(_frame(12), cfg)
    assert first.metadata["permutation"] == second.metadata["permutation"]


def test_random_split_changes_with_different_seed():
    first = RandomSplitStrategy().split(_frame(12), {"train_split": 60, "val_split": 20, "test_split": 20, "seed": 7})
    second = RandomSplitStrategy().split(_frame(12), {"train_split": 60, "val_split": 20, "test_split": 20, "seed": 8})
    assert first.metadata["permutation"] != second.metadata["permutation"]


def test_time_based_sequential_split_is_stable_regardless_of_seed():
    first = TimeBasedSequentialSplitStrategy().split(_frame(12), {"train_split": 60, "val_split": 20, "test_split": 20, "seed": 7})
    second = TimeBasedSequentialSplitStrategy().split(_frame(12), {"train_split": 60, "val_split": 20, "test_split": 20, "seed": 99})
    assert first.train.collect().to_dicts() == second.train.collect().to_dicts()
    assert first.validation.collect().to_dicts() == second.validation.collect().to_dicts()
    assert first.test.collect().to_dicts() == second.test.collect().to_dicts()


def test_indicator_pipeline_does_not_use_rows_outside_each_split():
    start = datetime(2026, 1, 1, tzinfo=UTC)
    frame = pl.DataFrame({
        "timestamp": [start + timedelta(minutes=i) for i in range(10)],
        "open": list(range(10)),
        "high": list(range(10)),
        "low": list(range(10)),
        "close": list(range(10)),
        "volume": [1] * 10,
    }).lazy()
    split = TimeBasedSequentialSplitStrategy().split(frame, {"train_split": 60, "val_split": 20, "test_split": 20})
    cfg = {"indicators": [{"name": "vwap", "params": {"output": "vwap_feature"}}]}

    pipeline = IndicatorPipelineStrategy()
    train = drop_warmup_nulls(pipeline.apply(split.train, cfg)).collect()
    validation = drop_warmup_nulls(pipeline.apply(split.validation, cfg)).collect()
    test = drop_warmup_nulls(pipeline.apply(split.test, cfg)).collect()

    assert train["timestamp"].to_list() == split.train.collect()["timestamp"].to_list()
    assert validation["timestamp"].to_list() == split.validation.collect()["timestamp"].to_list()
    assert test["timestamp"].to_list() == split.test.collect()["timestamp"].to_list()


def test_target_generation_does_not_cross_split_boundaries():
    start = datetime(2026, 1, 1, tzinfo=UTC)
    frame = pl.DataFrame({
        "timestamp": [start + timedelta(minutes=i) for i in range(10)],
        "open": [100 + i for i in range(10)],
        "high": [101 + i for i in range(10)],
        "low": [99 + i for i in range(10)],
        "close": [100 + i for i in range(10)],
        "volume": [1] * 10,
    }).lazy()
    split = TimeBasedSequentialSplitStrategy().split(frame, {"train_split": 60, "val_split": 20, "test_split": 20})
    strategy = TargetStrategyFactory.create("forward_return", {"lookahead_period": 1, "return_threshold": 0.0})

    train = strategy.generate(split.train).collect()
    validation = strategy.generate(split.validation).collect()
    test = strategy.generate(split.test).collect()

    assert train.height == split.train.collect().height
    assert validation.height == split.validation.collect().height
    assert test.height == split.test.collect().height
    assert train["target"].to_list()[-1] is None
    assert validation["target"].to_list()[-1] is None
    assert test["target"].to_list()[-1] is None


def test_feature_scaler_fits_on_train_only():
    start = datetime(2026, 1, 1, tzinfo=UTC)
    frame = pl.DataFrame({
        "timestamp": [start + timedelta(minutes=i) for i in range(10)],
        "close": [0.0, 0.0, 0.0, 0.0, 0.0, 100.0, 100.0, 100.0, 100.0, 100.0],
        "target": [0, 1] * 5,
    }).lazy()
    split = TimeBasedSequentialSplitStrategy().split(frame, {"train_split": 50, "val_split": 30, "test_split": 20})

    scaled = FeatureScaler().scale(split, ["close"])
    train = scaled.splits.train.collect()
    validation = scaled.splits.validation.collect()

    assert scaled.metadata["stats"]["close"]["mean"] == 0.0
    assert train["close"].to_list() == [0.0] * train.height
    assert all(value > 50 for value in validation["close"].to_list())


def test_indicator_output_scaler_applies_log_transform():
    frame = pl.DataFrame({
        "timestamp": [datetime(2026, 1, 1, tzinfo=UTC) + timedelta(minutes=i) for i in range(3)],
        "signal": [0.0, 1.0, 3.0],
    }).lazy()

    scaled = scale_indicator_outputs(frame, {"signal": "log_transform"}).collect()

    assert scaled["signal"].to_list()[0] == 0.0
    assert scaled["signal"].to_list()[1] > 0.0
