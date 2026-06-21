import polars as pl
import pytest

from app.strategies.indicator_strategy import CustomIndicatorStrategy, drop_warmup_nulls
from app.strategies.scaling_strategy import StandardScalerStrategy
from app.strategies.data_split_strategy import SplitResult
from app.strategies.targets.forward_return_target_strategy import ForwardReturnTargetStrategy
from app.strategies.targets.candle_direction_target_strategy import CandleDirectionTargetStrategy
from app.strategies.targets.quantile_flag_target_strategy import QuantileFlagTargetStrategy
from app.strategies.targets.roc_lookahead_target_strategy import RocLookaheadTargetStrategy
from app.strategies.targets.trade_quality_target_strategies import (
    CostAdjustedForwardReturnTargetStrategy,
    MfeMaeTradeQualityTargetStrategy,
    TripleBarrierTargetStrategy,
    VolatilityAdjustedForwardReturnTargetStrategy,
)


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


def test_quantile_flag_target_is_binary_and_shifted():
    out = QuantileFlagTargetStrategy(roc_period=4, q=0.5, lookahead_period=1).generate(_frame()).collect()
    assert "roc_4" in out.columns
    assert set(out["target"].drop_nulls().unique().to_list()).issubset({0, 1})
    assert out["target"].null_count() > 0


def test_quantile_flag_target_can_fit_a_cutoff_and_apply_it() -> None:
    fitted = QuantileFlagTargetStrategy(roc_period=4, q=0.5, lookahead_period=1).fit(_frame())
    assert fitted.cutoff is not None
    out = fitted.generate(_frame()).collect()
    assert "target" in out.columns
    assert set(out["target"].drop_nulls().unique().to_list()).issubset({0, 1})


def test_candle_direction_target_is_binary():
    out = CandleDirectionTargetStrategy(lookahead_period=1).generate(_frame()).collect()
    assert set(out["target"].drop_nulls().unique().to_list()).issubset({0, 1})


def test_cost_adjusted_forward_return_target_applies_a_cost_buffer() -> None:
    frame = pl.DataFrame(
        {
            "timestamp": list(range(5)),
            "open": [100.0] * 5,
            "high": [101.0] * 5,
            "low": [99.0] * 5,
            "close": [100.0, 100.8, 101.2, 101.3, 101.4],
            "volume": [10.0] * 5,
        }
    )
    out = CostAdjustedForwardReturnTargetStrategy(lookahead_period=1, cost_bps=50).generate(frame.lazy()).collect()
    assert out["target"].to_list()[:2] == [1, 0]


def test_triple_barrier_target_hits_take_profit_before_stop_loss() -> None:
    frame = pl.DataFrame(
        {
            "timestamp": list(range(5)),
            "open": [100.0, 100.3, 99.6, 99.5, 99.4],
            "high": [100.2, 100.7, 99.7, 99.6, 99.5],
            "low": [99.9, 100.1, 99.2, 99.0, 98.9],
            "close": [100.0, 100.3, 99.6, 99.5, 99.4],
            "volume": [10.0] * 5,
        }
    )
    out = TripleBarrierTargetStrategy(lookahead_period=2, take_profit=0.006, stop_loss=0.004).generate(frame.lazy()).collect()
    assert out["target"].to_list()[:2] == [1, 0]


def test_volatility_adjusted_forward_return_target_uses_recent_volatility() -> None:
    frame = pl.DataFrame(
        {
            "timestamp": list(range(6)),
            "open": [100.0, 100.1, 100.2, 100.3, 100.4, 105.0],
            "high": [100.1, 100.2, 100.3, 100.4, 105.2, 105.3],
            "low": [99.9, 100.0, 100.1, 100.2, 100.3, 104.8],
            "close": [100.0, 100.1, 100.2, 100.3, 100.4, 105.0],
            "volume": [10.0] * 6,
        }
    )
    out = VolatilityAdjustedForwardReturnTargetStrategy(
        lookahead_period=1,
        volatility_period=3,
        volatility_multiplier=0.75,
    ).generate(frame.lazy()).collect()
    assert out["target"].drop_nulls().to_list()[-1] == 1


def test_mfe_mae_trade_quality_target_scores_excursions() -> None:
    frame = pl.DataFrame(
        {
            "timestamp": list(range(5)),
            "open": [100.0, 101.0, 101.5, 101.2, 101.1],
            "high": [100.2, 101.6, 101.7, 101.3, 101.2],
            "low": [99.9, 100.8, 101.1, 101.0, 100.9],
            "close": [100.0, 101.0, 101.5, 101.2, 101.1],
            "volume": [10.0] * 5,
        }
    )
    out = MfeMaeTradeQualityTargetStrategy(lookahead_period=2, min_edge=0.0).generate(frame.lazy()).collect()
    assert out["target"].drop_nulls().to_list()[0] == 1


def test_mfe_mae_trade_quality_target_handles_short_future_window() -> None:
    frame = pl.DataFrame(
        {
            "timestamp": [0, 1],
            "open": [100.0, 101.0],
            "high": [100.2, 101.2],
            "low": [99.8, 100.8],
            "close": [100.0, 101.0],
            "volume": [10.0, 10.0],
        }
    )
    out = MfeMaeTradeQualityTargetStrategy(lookahead_period=3, min_edge=0.0).generate(frame.lazy()).collect()
    assert out["target"].to_list() == [None, None]


@pytest.mark.parametrize(
    ("strategy", "low_kwargs", "high_kwargs"),
    [
        (ForwardReturnTargetStrategy, {"lookahead_period": 1}, {"lookahead_period": 100}),
        (RocLookaheadTargetStrategy, {"lookahead_period": 1}, {"lookahead_period": 100}),
        (QuantileFlagTargetStrategy, {"roc_period": 4, "q": 0.5, "lookahead_period": 1}, {"roc_period": 4, "q": 0.5, "lookahead_period": 100}),
        (CandleDirectionTargetStrategy, {"lookahead_period": 1}, {"lookahead_period": 100}),
    ],
)
def test_lookahead_period_changes_target_output(strategy, low_kwargs, high_kwargs):
    low = strategy(**low_kwargs).generate(_frame()).collect()["target"].to_list()
    high = strategy(**high_kwargs).generate(_frame()).collect()["target"].to_list()
    assert low != high
    assert high.count(None) >= low.count(None)


@pytest.mark.parametrize(
    ("strategy", "kwargs"),
    [
        (ForwardReturnTargetStrategy, {"lookahead_period": 0}),
        (RocLookaheadTargetStrategy, {"lookahead_period": 0}),
        (QuantileFlagTargetStrategy, {"roc_period": 4, "q": 0.5, "lookahead_period": 0}),
        (CandleDirectionTargetStrategy, {"lookahead_period": 0}),
    ],
)
def test_lookahead_period_zero_is_rejected(strategy, kwargs):
    with pytest.raises(ValueError, match="lookahead_period must be >= 1"):
        strategy(**kwargs)


@pytest.mark.parametrize(
    ("kwargs", "message"),
    [
        ({"roc_period": 0, "q": 0.5, "lookahead_period": 1}, "roc_period must be >= 1"),
        ({"roc_period": 4, "q": 0.0, "lookahead_period": 1}, "q must be between 0 and 1"),
        ({"roc_period": 4, "q": 1.0, "lookahead_period": 1}, "q must be between 0 and 1"),
    ],
)
def test_quantile_flag_parameter_validation(kwargs, message):
    with pytest.raises(ValueError, match=message):
        QuantileFlagTargetStrategy(**kwargs)


def test_scaler_fits_train_only():
    train = pl.DataFrame({"timestamp": [1, 2, 3], "close": [10.0, 20.0, 30.0], "target": [0, 1, 1]}).lazy()
    val = pl.DataFrame({"timestamp": [4], "close": [100.0], "target": [1]}).lazy()
    test = pl.DataFrame({"timestamp": [5], "close": [200.0], "target": [0]}).lazy()
    result = StandardScalerStrategy().scale(SplitResult(train_df=train, validation_df=val, test_df=test), {"feature_columns": ["close"]})
    assert result.metadata["stats"]["close"]["mean"] == 20.0
    assert result.splits.validation.collect()["close"][0] > 1.0
