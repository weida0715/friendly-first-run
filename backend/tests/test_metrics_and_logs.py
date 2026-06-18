from __future__ import annotations
from datetime import datetime
from decimal import Decimal
import polars as pl
from app.strategies.trading.long_only_single_position_strategy import BACKTEST_FIELDS, LongOnlySinglePositionStrategy
from app.strategies.logs.confusion_metrics_log_strategy import CONFUSION_FIELDS, ConfusionMetricsLogStrategy
from app.strategies.logs.backtest_log_strategy import BacktestLogStrategy
from app.strategies.logs.reproducibility_log_strategy import ReproducibilityLogStrategy
from app.strategies.metrics import BinaryClassificationMetricsStrategy, ContinuousMetricsStrategy
from app.repositories.unit_of_work import UnitOfWork
from app import create_app
from app.infrastructure.database.base import Base
from app.infrastructure.database.session import configure_engine, get_engine
from app.infrastructure.database.orm.user_orm import UserORM
from app.infrastructure.database.orm.blueprint_orm import BlueprintORM
from app.infrastructure.database.orm.btcusdt_kline_orm import BTCUSDTKlineORM
from app.infrastructure.database.orm.experiment_orm import ExperimentORM
from app.infrastructure.database.orm.model_orm import ModelORM
from app.infrastructure.database.orm.experiment_log_orm import ExperimentLogORM


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def _df():
    return pl.DataFrame({"timestamp": [datetime(2026, 1, 1, 0, i) for i in range(5)], "close": [100.0, 101.0, 99.0, 102.0, 103.0]}).lazy()


def test_backtest_schema_long_only_and_cost():
    no_cost = LongOnlySinglePositionStrategy().run(
        _df(), {"_preds": [1, 1, 0, 1, 0]}, {"cost_round_trip_bps": 0})
    with_cost = LongOnlySinglePositionStrategy().run(
        _df(), {"_preds": [1, 1, 0, 1, 0]}, {"cost_round_trip_bps": 10})
    assert list(no_cost.metrics.keys()) == BACKTEST_FIELDS
    assert all(t["side"] == "long" for t in no_cost.trades)
    assert all(t["exit_index"] > t["entry_index"] for t in no_cost.trades)
    assert with_cost.metrics["total_return_net_pct"] < no_cost.metrics["total_return_net_pct"]


def test_confusion_log_exact_schema_and_binary_metrics():
    log = ConfusionMetricsLogStrategy().build(
        {"y_true": [1, 0, 1, 0], "y_pred": [1, 1, 0, 0], "x": [2.0, -1.0, 0.5, -0.2]})
    assert list(log.keys()) == CONFUSION_FIELDS
    metrics = BinaryClassificationMetricsStrategy().compute(
        {"y_true": [1, 0, 1, 0], "y_pred": [1, 1, 0, 0]})
    assert metrics["accuracy"] == 0.5
    assert metrics["precision"] == 0.5
    assert metrics["recall"] == 0.5
    assert metrics["f1_score"] == 0.5


def test_continuous_metrics_are_sane():
    metrics = ContinuousMetricsStrategy().compute(
        {"returns": [1.0, -0.5, 2.0]})
    assert metrics["mean_return"] == 0.8333333333333334
    assert metrics["median_return"] == 1.0
    assert metrics["max_drawdown"] >= 0


def test_backtest_and_reproducibility_log_builders_are_deterministic():
    result = LongOnlySinglePositionStrategy().run(
        _df(), {"_preds": [1, 0, 1, 0, 0]}, {"cost_round_trip_bps": 5})
    assert BacktestLogStrategy().build(
        {"metrics": result.metrics}) == result.metrics
    payload = {"seed": 42, "random_state": {"seed": 42}, "architecture_parameters": {"C": 1}, "split_strategy_parameters": {"strategy": "time"}, "target_parameters": {"lookahead": 1}, "indicator_parameters": {"vwap": {}}, "interval": "1m", "data_range": {
        "start": "a", "end": "b"}, "btcusdt_timestamp_basis": "timestamp", "compiled_blueprint_snapshot": {"id": 1}, "compiled_experiment_config_snapshot": {"id": 2}, "parameter_hash": "abc", "split_boundaries": {"train": "x"}, "scaler_statistics": {"mean": 0}}
    one = ReproducibilityLogStrategy().build(payload)
    two = ReproducibilityLogStrategy().build(payload)
    assert one == two
    assert set(one) == set(payload)


def test_round_log_endpoint_returns_prediction_history():
    from app.controllers import logs_download_controller as module

    client = _client()
    client.post("/api/auth/register", json={"name": "owner", "username": "owner_round",
                "email": "owner_round@example.com", "password": "securepass"})
    client.post("/api/auth/login",
                json={"email": "owner_round@example.com", "password": "securepass"})
    module.build_access_control = lambda: type("_Access", (), {"require_authenticated": staticmethod(
        lambda request: type("_Actor", (), {"user_id": 1})())})()

    with UnitOfWork() as uow:
        now = datetime(2026, 1, 1, 12, 0, 0)
        owner = UserORM(
            Username="owner_round",
            Email="owner_round@example.com",
            PasswordHash="hash",
            Name="Owner",
            Role="User",
            Status="Enabled",
            CreatedAt=now,
            UpdatedAt=now,
        )
        uow.session.add(owner)
        uow.session.flush()
        blueprint = BlueprintORM(
            UserID=owner.UserID,
            Name="Blueprint Round",
            Description=None,
            Indicators={},
            Features={},
            Architecture={},
            ApprovalState="Approved",
            SubmittedAt=now,
            Version=1,
            CreatedAt=now,
            UpdatedAt=now,
        )
        uow.session.add(blueprint)
        uow.session.flush()
        experiment = ExperimentORM(
            UserID=owner.UserID,
            BlueprintID=blueprint.BlueprintID,
            Name="exp",
            Description=None,
            Interval="1m",
            StartDate=datetime(2026, 1, 1).date(),
            EndDate=datetime(2026, 1, 2).date(),
            TrainSplit=0.8,
            ValSplit=0.1,
            TestSplit=0.1,
            ParameterOverrides={},
            Status="Completed",
            Progress=100,
            CurrentStage=None,
            EtaSeconds=None,
            Success=True,
            CreatedAt=now,
            CompletedAt=now,
            JobID=None,
            Deterministic=True,
            Seed=42,
        )
        uow.session.add(experiment)
        uow.session.flush()
        model = ModelORM(
            ExperimentID=experiment.ExperimentID,
            Parameters={},
            Sharpe=None,
            Accuracy=None,
            Precision=None,
            Recall=None,
            CreatedAt=now,
            ParameterHash="hash-1",
        )
        uow.session.add(model)
        uow.session.flush()
        uow.session.add(ExperimentLogORM(
            ExperimentID=experiment.ExperimentID,
            ModelID=model.ModelID,
            Timestamp=now,
            Signal=1,
            Prediction=1,
            Metrics={"type": "round", "predicted": 1,
                     "actual": 1, "outcome": "win", "round_index": 0},
            CreatedAt=now,
        ))

    response = client.get(
        f"/api/logs/experiments/{experiment.ExperimentID}/models/0/round")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["data"]["experimentId"] == experiment.ExperimentID
    assert payload["data"]["modelId"] == 0
    row = payload["data"]["rows"][0]
    assert row["predicted"] == 1
    assert row["actual"] == 1
    assert row["outcome"] == "win"


def test_round_log_endpoints_regenerate_when_persisted_round_logs_are_missing(monkeypatch):
    from app.controllers import logs_download_controller as module

    client = _client()
    client.post("/api/auth/register", json={"name": "owner", "username": "owner_round_disabled",
                "email": "owner_round_disabled@example.com", "password": "securepass"})
    client.post("/api/auth/login",
                json={"email": "owner_round_disabled@example.com", "password": "securepass"})
    module.build_access_control = lambda: type("_Access", (), {"require_authenticated": staticmethod(
        lambda request: type("_Actor", (), {"user_id": 1})())})()
    with UnitOfWork() as uow:
        now = datetime(2026, 1, 1, 12, 0, 0)
        owner = UserORM(
            Username="owner_round_disabled",
            Email="owner_round_disabled@example.com",
            PasswordHash="hash",
            Name="Owner",
            Role="User",
            Status="Enabled",
            CreatedAt=now,
            UpdatedAt=now,
        )
        uow.session.add(owner)
        uow.session.flush()
        blueprint = BlueprintORM(
            UserID=owner.UserID,
            Name="Blueprint Round Disabled",
            Description=None,
            Indicators={},
            Features={},
            Architecture={},
            ApprovalState="Approved",
            SubmittedAt=now,
            Version=1,
            CreatedAt=now,
            UpdatedAt=now,
        )
        uow.session.add(blueprint)
        uow.session.flush()
        experiment = ExperimentORM(
            UserID=owner.UserID,
            BlueprintID=blueprint.BlueprintID,
            Name="exp-disabled",
            Description=None,
            Interval="1m",
            StartDate=datetime(2026, 1, 1).date(),
            EndDate=datetime(2026, 1, 2).date(),
            TrainSplit=0.8,
            ValSplit=0.1,
            TestSplit=0.1,
            ParameterOverrides={},
            Status="Completed",
            Progress=100,
            CurrentStage=None,
            EtaSeconds=None,
            Success=True,
            CreatedAt=now,
            CompletedAt=now,
            JobID=None,
            Deterministic=True,
            Seed=42,
        )
        uow.session.add(experiment)
        uow.session.flush()
        for minute, close in enumerate([100.0, 101.0, 99.0, 102.0, 103.0]):
            ts = datetime(2026, 1, 1, 0, minute, 0)
            uow.session.add(BTCUSDTKlineORM(
                Timestamp=ts,
                Open=Decimal(str(close - 0.5)),
                High=Decimal(str(close + 0.5)),
                Low=Decimal(str(close - 1.0)),
                Close=Decimal(str(close)),
                Volume=Decimal("1000"),
                CreatedAt=ts,
                UpdatedAt=ts,
            ))
        uow.session.flush()
        model = ModelORM(
            ExperimentID=experiment.ExperimentID,
            Parameters={"architecture": {"C": 1.0}},
            Sharpe=None,
            Accuracy=None,
            Precision=None,
            Recall=None,
            CreatedAt=now,
            ParameterHash="hash-disabled",
        )
        uow.session.add(model)
        uow.session.flush()

    response = client.get(
        f"/api/logs/experiments/{experiment.ExperimentID}/models/0/round")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["data"]["rows"]
    assert payload["data"]["rows"][0]["parameter_hash"] == "hash-disabled"

    csv_response = client.get(
        f"/api/logs/experiments/{experiment.ExperimentID}/models/0/round.csv")
    assert csv_response.status_code == 200
    assert "roundIndex" in csv_response.get_data(as_text=True)


def test_round_log_endpoints_return_clear_error_when_regeneration_fails(monkeypatch):
    from app.controllers import logs_download_controller as module

    client = _client()
    client.post("/api/auth/register", json={"name": "owner", "username": "owner_round_empty",
                "email": "owner_round_empty@example.com", "password": "securepass"})
    client.post("/api/auth/login",
                json={"email": "owner_round_empty@example.com", "password": "securepass"})
    module.build_access_control = lambda: type("_Access", (), {"require_authenticated": staticmethod(
        lambda request: type("_Actor", (), {"user_id": 1})())})()
    monkeypatch.setattr(module, "_regenerate_round_rows",
                        lambda *_args, **_kwargs: [])

    with UnitOfWork() as uow:
        now = datetime(2026, 1, 1, 12, 0, 0)
        owner = UserORM(
            Username="owner_round_empty",
            Email="owner_round_empty@example.com",
            PasswordHash="hash",
            Name="Owner",
            Role="User",
            Status="Enabled",
            CreatedAt=now,
            UpdatedAt=now,
        )
        uow.session.add(owner)
        uow.session.flush()
        blueprint = BlueprintORM(
            UserID=owner.UserID,
            Name="Blueprint Round Empty",
            Description=None,
            Indicators={},
            Features={},
            Architecture={},
            ApprovalState="Approved",
            SubmittedAt=now,
            Version=1,
            CreatedAt=now,
            UpdatedAt=now,
        )
        uow.session.add(blueprint)
        uow.session.flush()
        experiment = ExperimentORM(
            UserID=owner.UserID,
            BlueprintID=blueprint.BlueprintID,
            Name="exp-empty",
            Description=None,
            Interval="1m",
            StartDate=datetime(2026, 1, 1).date(),
            EndDate=datetime(2026, 1, 2).date(),
            TrainSplit=0.8,
            ValSplit=0.1,
            TestSplit=0.1,
            ParameterOverrides={},
            Status="Completed",
            Progress=100,
            CurrentStage=None,
            EtaSeconds=None,
            Success=True,
            CreatedAt=now,
            CompletedAt=now,
            JobID=None,
            Deterministic=True,
            Seed=42,
        )
        uow.session.add(experiment)
        uow.session.flush()
        model = ModelORM(
            ExperimentID=experiment.ExperimentID,
            Parameters={"architecture": {"C": 1.0}},
            Sharpe=None,
            Accuracy=None,
            Precision=None,
            Recall=None,
            CreatedAt=now,
            ParameterHash="hash-empty",
        )
        uow.session.add(model)
        uow.session.flush()

    response = client.get(
        f"/api/logs/experiments/{experiment.ExperimentID}/models/0/round")
    assert response.status_code == 409
    assert "could not be regenerated" in response.get_json()[
        "error"]["message"]

    csv_response = client.get(
        f"/api/logs/experiments/{experiment.ExperimentID}/models/0/round.csv")
    assert csv_response.status_code == 409
    assert "could not be regenerated" in csv_response.get_json()[
        "error"]["message"]


def test_confusion_uses_execution_aligned_return_quadrants():
    log = ConfusionMetricsLogStrategy().build({
        "y_true": [1, 0, 1, 0],
        "y_pred": [1, 1, 0, 0],
        "x": [2.0, -1.0, 0.5, -0.2],
        "open": [100, 100, 100, 100],
        "price_change": [0, 10, -5, 3],
        "execution_lag_bars": 1,
        "outlier_quantiles": None,
    })
    assert log["tp_mean_return_pct"] == 10.0
    assert log["fp_mean_return_pct"] == -5.0
    assert log["tn_mean_return_pct"] is None
    assert log["fn_mean_return_pct"] == 3.0


def test_parameter_correlation_defaults_to_total_return_net_pct():
    from app.strategies.logs.parameter_correlation_strategy import build_parameter_correlation
    rows = [{"C": i, "total_return_net_pct": i * 2.0, "constant": 1}
            for i in range(12)]
    result = build_parameter_correlation(
        rows, n_boot=20, min_n=10, random_state=42)
    assert result
    assert result[0]["feature"] == "C"
    assert result[0]["corr"] > 0.9


def test_long_only_single_position_holds_consecutive_positive_predictions():
    frame = pl.DataFrame({
        "timestamp": [datetime(2026, 1, 1, 0, i) for i in range(5)],
        "close": [100.0, 101.0, 102.0, 103.0, 104.0],
    }).lazy()
    result = LongOnlySinglePositionStrategy().run(
        frame, {"_preds": [1, 1, 1, 0, 0]}, {"execution_lag_bars": 0})
    assert result.metrics["trades_count"] == 1
    assert result.trades[0]["entry_index"] == 0
    assert result.trades[0]["exit_index"] == 3


def test_long_only_single_position_uses_execution_lag_for_entry_and_exit():
    frame = pl.DataFrame({
        "timestamp": [datetime(2026, 1, 1, 0, i) for i in range(5)],
        "close": [100.0, 101.0, 102.0, 103.0, 104.0],
    }).lazy()
    result = LongOnlySinglePositionStrategy().run(
        frame, {"_preds": [1, 1, 0, 0, 0]}, {"execution_lag_bars": 1})
    assert result.metrics["trades_count"] == 1
    assert result.trades[0]["entry_index"] == 1
    assert result.trades[0]["exit_index"] == 3


def test_long_only_single_position_force_closes_open_trade_at_final_bar():
    frame = pl.DataFrame({
        "timestamp": [datetime(2026, 1, 1, 0, i) for i in range(4)],
        "close": [100.0, 101.0, 102.0, 103.0],
    }).lazy()
    result = LongOnlySinglePositionStrategy().run(
        frame, {"_preds": [0, 1, 1, 1]}, {"execution_lag_bars": 0})
    assert result.metrics["trades_count"] == 1
    assert result.trades[0]["entry_index"] == 1
    assert result.trades[0]["exit_index"] == 3


def test_confusion_filters_invalid_binary_labels_without_crashing():
    log = ConfusionMetricsLogStrategy().build({
        "y_true": [1, None, float("nan"), 0, ""],
        "y_pred": [1, 1, 0, 1, 0],
        "x": [2.0, 9.0, 8.0, -1.0, 7.0],
        "outlier_quantiles": None,
    })
    assert log["n_kept"] == 2
    assert log["pred_pos_count"] == 2
    assert log["tp_count"] == 1
    assert log["fp_count"] == 1


def test_confusion_return_means_use_same_filtered_rows_as_x_stats():
    log = ConfusionMetricsLogStrategy().build({
        "y_true": [1, 1, 0],
        "y_pred": [1, 1, 1],
        "x": [2.0, 999.0, -1.0],
        "open": [100.0, 100.0, 100.0],
        "price_change": [2.0, 999.0, -1.0],
        "execution_lag_bars": 0,
        "outlier_quantiles": (0.0, 0.5),
    })
    assert log["n_kept"] == 2
    assert log["tp_count"] == 1
    assert log["fp_count"] == 1
    assert log["tp_mean_return_pct"] == 2.0
    assert log["fp_mean_return_pct"] == -1.0
