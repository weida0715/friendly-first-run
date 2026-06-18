import polars as pl

from app.strategies.indicator_strategy import CustomIndicatorStrategy, drop_warmup_nulls
from app.strategies.scaling_strategy import StandardScalerStrategy
from app.strategies.data_split_strategy import SplitResult
from app.strategies.target_strategy import ForwardReturnTargetStrategy, RocLookaheadTargetStrategy


def _frame():
    return pl.DataFrame({
        "timestamp": list(range(80)),
        "open": [float(i) for i in range(1, 81)],
        "high": [float(i + 1) for i in range(1, 81)],
        "low": [float(i - 1) for i in range(1, 81)],
        "close": [float(i) for i in range(1, 81)],
        "volume": [10.0] * 80,
    }).lazy()


def test_indicators_create_features_and_targets_are_binary():
    indicators = CustomIndicatorStrategy().apply(_frame(), {"indicators": ["vwap", "ichimoku_cloud", {"name": "quantile_flag", "params": {"window": 5}}]})
    out = drop_warmup_nulls(ForwardReturnTargetStrategy(lookahead_period=1).generate(indicators)).collect()
    assert {"vwap", "ichimoku_conversion", "ichimoku_base", "close_quantile_flag", "target"}.issubset(out.columns)
    assert out["vwap"].dtype != pl.Int8
    assert set(out["target"].drop_nulls().unique().to_list()).issubset({0, 1})


def test_roc_lookahead_target_is_binary():
    out = RocLookaheadTargetStrategy(lookahead_period=2).generate(_frame()).collect()
    assert set(out["target"].drop_nulls().unique().to_list()).issubset({0, 1})


def test_scaler_fits_train_only():
    train = pl.DataFrame({"timestamp": [1, 2, 3], "close": [10.0, 20.0, 30.0], "target": [0, 1, 1]}).lazy()
    val = pl.DataFrame({"timestamp": [4], "close": [100.0], "target": [1]}).lazy()
    test = pl.DataFrame({"timestamp": [5], "close": [200.0], "target": [0]}).lazy()
    result = StandardScalerStrategy().scale(SplitResult(train_df=train, validation_df=val, test_df=test), {"feature_columns": ["close"]})
    assert result.metadata["stats"]["close"]["mean"] == 20.0
    assert result.splits.validation.collect()["close"][0] > 1.0
