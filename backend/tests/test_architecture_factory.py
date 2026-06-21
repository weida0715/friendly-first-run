from __future__ import annotations

import polars as pl
import pytest

from app.factories.architecture_factory import ArchitectureFactory
from app.factories.blueprint_factory import BlueprintFactory
from app.factories.indicator_factory import IndicatorFactory
from app.factories.target_strategy_factory import TargetStrategyFactory
from app.strategies.logs.confusion_metrics_log_strategy import ConfusionMetricsLogStrategy
from app.strategies.trading.long_only_single_position_strategy import LongOnlySinglePositionStrategy


def _model_frame():
    return pl.DataFrame({
        "timestamp": list(range(12)),
        "close": [float(i) for i in range(12)],
        "feature": [float(i % 3) for i in range(12)],
        "target": [0, 1] * 6,
    }).lazy()


def test_architecture_factory_resolves_initial_architectures():
    assert ArchitectureFactory.create(
        "logistic_regressor_arc").name == "logistic_regressor_arc"
    assert ArchitectureFactory.create(
        "ridge_classifier_arc").name == "ridge_classifier_arc"


def test_invalid_architecture_rejected():
    with pytest.raises(ValueError, match="Unsupported architecture"):
        ArchitectureFactory.create("bad_arc")


def test_architecture_metadata_contains_required_fields():
    metadata = ArchitectureFactory.metadata("logistic_regressor_arc")
    assert metadata["name"] == "logistic_regressor_arc"
    assert metadata["display_name"]
    assert "C" in metadata["hyperparameters"]
    assert metadata["default_values"]["max_iter"] == 200
    assert metadata["prediction_output_shape"]["_preds"] == "list[int]"
    assert metadata["supports_probabilities"] is True


def test_indicator_and_target_metadata_expose_constraints():
    indicator = IndicatorFactory.metadata("vwap")
    target = TargetStrategyFactory.metadata("forward_return")
    assert indicator["parameter_constraints"]["output"]["default"] == "vwap"
    assert target["parameter_constraints"]["lookahead_period"]["min"] == 1
    assert target["output_column"] == "target"
    quantile_target = TargetStrategyFactory.metadata("quantile_flag")
    assert quantile_target["parameter_constraints"]["q"]["max"] == 1.0
    assert quantile_target["default_values"]["lookahead_period"] == 1
    candle_target = TargetStrategyFactory.metadata("candle_direction")
    assert candle_target["parameter_constraints"]["lookahead_period"]["min"] == 1
    assert candle_target["binary_label_rule"].startswith("1 when close[t+lookahead]")
    triple_barrier = TargetStrategyFactory.metadata("triple_barrier")
    assert triple_barrier["default_values"]["take_profit"] == 0.006
    assert triple_barrier["parameter_constraints"]["stop_loss"]["min"] == 0.0
    cost_adjusted = TargetStrategyFactory.metadata("cost_adjusted_forward_return")
    assert cost_adjusted["parameter_constraints"]["cost_bps"]["min"] == 0.0
    mfe_mae = TargetStrategyFactory.metadata("mfe_mae_trade_quality")
    assert mfe_mae["default_values"]["min_edge"] == 0.0


def test_prediction_output_contracts():
    train = _model_frame()
    test = _model_frame()
    logreg = ArchitectureFactory.create("logistic_regressor_arc")
    logreg.train(train)
    logreg_pred = logreg.predict(test)
    assert set(logreg_pred) == {"_preds", "_probs"}
    assert len(logreg_pred["_preds"]) == 12

    ridge = ArchitectureFactory.create("ridge_classifier_arc")
    ridge.train(train)
    ridge_pred = ridge.predict(test)
    assert "_preds" in ridge_pred
    assert len(ridge_pred["_preds"]) == 12


def test_ridge_classifier_handles_single_class_training_data():
    frame = pl.DataFrame({
        "timestamp": list(range(8)),
        "close": [100.0 + i for i in range(8)],
        "feature": [float(i) for i in range(8)],
        "target": [1] * 8,
    }).lazy()

    ridge = ArchitectureFactory.create("ridge_classifier_arc")
    ridge.train(frame)
    predictions = ridge.predict(frame)

    assert predictions["_preds"] == [1] * 8


def test_real_architecture_predictions_can_create_backtest_trades():
    train = pl.DataFrame({
        "timestamp": list(range(20)),
        "close": [100.0 + i for i in range(20)],
        "signal_feature": [0.0] * 10 + [10.0] * 10,
        "target": [0] * 10 + [1] * 10,
    }).lazy()
    test = pl.DataFrame({
        "timestamp": list(range(20, 28)),
        "close": [120.0, 121.0, 122.0, 121.0, 123.0, 124.0, 125.0, 126.0],
        "signal_feature": [10.0, 10.0, 0.0, 10.0, 0.0, 10.0, 10.0, 0.0],
        "target": [1, 1, 0, 1, 0, 1, 1, 0],
    }).lazy()

    architecture = ArchitectureFactory.create("logistic_regressor_arc")
    architecture.train(train, class_weight="balanced", C=10, max_iter=500)
    predictions = architecture.predict(test)
    assert sum(predictions["_preds"]) > 0

    backtest = LongOnlySinglePositionStrategy().run(
        test, predictions, {"cost_round_trip_bps": 0})
    assert backtest.metrics["trades_count"] > 0

    confusion = ConfusionMetricsLogStrategy().build({
        "y_true": test.collect()["target"].to_list(),
        "y_pred": predictions["_preds"],
        "x": [1.0] * len(predictions["_preds"]),
    })
    assert confusion["pred_pos_count"] > 0


def test_ridge_classifier_treats_null_class_weight_as_none():
    train = pl.DataFrame({
        "timestamp": list(range(12)),
        "close": [float(i) for i in range(12)],
        "feature": [float(i % 3) for i in range(12)],
        "target": [0, 1] * 6,
    }).lazy()

    ridge = ArchitectureFactory.create("ridge_classifier_arc")
    ridge.train(train, class_weight="null")
    predictions = ridge.predict(train)

    assert len(predictions["_preds"]) == 12


def test_blueprint_factory_normalizes_without_target_strategy():
    normalized = BlueprintFactory.normalize_payload({
        "architecture": {"name": "logistic_regressor_arc", "parameters": {"C": "0.5"}},
        "indicators": {"selected": ["vwap"], "params": {"vwap": {"output": "my_vwap"}}},
    })
    assert normalized["architecture"]["name"] == "logistic_regressor_arc"
    assert normalized["architecture"]["parameters"]["C"] == "0.5"
    assert normalized["indicators"]["parameters"]["vwap"]["output"] == "my_vwap"
    assert "target" not in normalized
