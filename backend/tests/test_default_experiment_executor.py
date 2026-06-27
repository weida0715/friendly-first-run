from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal

import polars as pl
import pytest

from app.domain.models.btcusdt_kline import BTCUSDTKline
from app.domain.models.experiment import Experiment
from app.executors.default_experiment_executor import (
    DefaultExperimentExecutor,
    ExperimentCancelledError,
    ExperimentExecutionError,
    _apply_signal_threshold,
    _build_round_log_rows,
    candles_to_lazyframe,
)
from app.executors.experiment_executor import ExperimentExecutor
from app.strategies.data_split_strategy import SplitResult


class _TracingExecutor(ExperimentExecutor):
    def __init__(self) -> None:
        self.events: list[str] = []

    def load_config(self, ctx: ExperimentExecutor.ExecutionContext) -> dict[str, object]:
        self.events.append("load_config")
        return {"dummy": True}

    def load_klines(self, ctx: ExperimentExecutor.ExecutionContext):
        self.events.append("load_klines")
        return "raw_klines"

    def aggregate_interval(self, raw_klines, ctx: ExperimentExecutor.ExecutionContext):
        assert raw_klines == "raw_klines"
        self.events.append("aggregate_interval")
        return "interval_data"

    def validate_range(self, interval_data, ctx: ExperimentExecutor.ExecutionContext) -> None:
        assert interval_data == "interval_data"
        self.events.append("validate_experiment_range")

    def split_data(self, interval_data, ctx: ExperimentExecutor.ExecutionContext) -> SplitResult:
        assert interval_data == "interval_data"
        self.events.append("split_data")
        frame = pl.DataFrame({"timestamp": [datetime(2026, 1, 1, 0, 0, tzinfo=UTC)], "close": [1.0], "target": [1]}).lazy()
        return SplitResult(train_df=frame, validation_df=frame, test_df=frame)

    def compute_indicators_per_split(self, splits: SplitResult, ctx: ExperimentExecutor.ExecutionContext) -> SplitResult:
        assert isinstance(splits, SplitResult)
        self.events.append("compute_indicators_per_split")
        return splits

    def generate_targets_per_split(self, splits: SplitResult, ctx: ExperimentExecutor.ExecutionContext) -> SplitResult:
        assert isinstance(splits, SplitResult)
        self.events.append("generate_targets_per_split")
        return splits

    def scale_features(self, splits: SplitResult, ctx: ExperimentExecutor.ExecutionContext) -> SplitResult:
        assert isinstance(splits, SplitResult)
        self.events.append("scale_features")
        return splits

    def compile_blueprint(self, ctx: ExperimentExecutor.ExecutionContext) -> dict[str, object]:
        self.events.append("compile_blueprint")
        return {"architecture": {"name": "dummy"}}

    def generate_parameter_permutations(self, compiled_blueprint: dict[str, object], ctx: ExperimentExecutor.ExecutionContext) -> list[dict[str, object]]:
        self.events.append("generate_parameter_permutations")
        return [{"parameter_hash": "hash-1"}]

    def create_architecture(self, compiled_blueprint: dict[str, object], params: dict[str, object], ctx: ExperimentExecutor.ExecutionContext):
        self.events.append("create_architecture")

        class _Architecture:
            def __init__(self, outer: _TracingExecutor) -> None:
                self.outer = outer

            def train(self, train_data, **hyperparameters):
                self.outer.events.append("train")
                return {"model": True}

            def predict(self, test_data):
                self.outer.events.append("predict")
                return {"_preds": [1]}

            def evaluate(self, test_data):
                self.outer.events.append("evaluate")
                return {"accuracy": 1.0}

        return _Architecture(self)

    def run_backtest(self, predictions: dict[str, object], test_data, ctx: ExperimentExecutor.ExecutionContext) -> object:
        self.events.append("run_backtest")

        class _Backtest:
            metrics = {"sharpe_per_bar": 1.0}

        return _Backtest()

    def persist_model_artifact(self, ctx: ExperimentExecutor.ExecutionContext, params: dict[str, object], trained_model, evaluation: dict[str, object], backtest: object) -> None:
        self.events.append("persist_model_artifact")

    def persist_logs(self, ctx: ExperimentExecutor.ExecutionContext, evaluation: dict[str, object], backtest: object) -> None:
        self.events.append("persist_logs")

    def update_progress(self, ctx: ExperimentExecutor.ExecutionContext) -> None:
        self.events.append("update_progress")

    def mark_running(self, ctx: ExperimentExecutor.ExecutionContext) -> None:
        self.events.append("mark_running")

    def mark_completed(self, ctx: ExperimentExecutor.ExecutionContext) -> None:
        self.events.append("mark_completed")

    def build_execution_result(self, ctx: ExperimentExecutor.ExecutionContext) -> dict[str, object]:
        return {"events": list(self.events)}


def _experiment(*, start: date, end: date) -> Experiment:
    return Experiment(
        experiment_id=1,
        user_id=1,
        blueprint_id=1,
        name="exp",
        description=None,
        interval="1m",
        start_date=start,
        end_date=end,
        train_split=Decimal("0.7"),
        val_split=Decimal("0.15"),
        test_split=Decimal("0.15"),
        parameter_overrides=None,
        status="Queued",
        progress=None,
        current_stage=None,
        eta_seconds=None,
        success=None,
        created_at=datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
        completed_at=None,
    )


def _candle(ts: datetime) -> BTCUSDTKline:
    return BTCUSDTKline(
        timestamp=ts,
        open=Decimal("1"),
        high=Decimal("2"),
        low=Decimal("0.5"),
        close=Decimal("1.5"),
        volume=Decimal("10"),
        created_at=ts,
        updated_at=ts,
    )


class _FakeMarketDataRepo:
    def __init__(self, candles: list[BTCUSDTKline], events: list[str]):
        self._candles = candles
        self._events = events
        self.last_args: tuple[datetime, datetime, str] | None = None

    def list_range(self, start: datetime, end: datetime, interval: str = "1m") -> list[BTCUSDTKline]:
        self._events.append("list_range")
        self.last_args = (start, end, interval)
        return list(self._candles)


class _FakeUoW:
    def __init__(self, repo: _FakeMarketDataRepo | None):
        self.market_data = repo

    def __enter__(self) -> _FakeUoW:
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # noqa: ANN001
        return None


class _FakeExperimentRepo:
    def __init__(self, experiment: Experiment | None) -> None:
        self._experiment = experiment

    def get_by_id(self, experiment_id: int) -> Experiment | None:
        _ = experiment_id
        return self._experiment


class _FakeExperimentUoW:
    def __init__(self, experiment: Experiment | None) -> None:
        self.experiments = _FakeExperimentRepo(experiment)

    def __enter__(self) -> _FakeExperimentUoW:
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # noqa: ANN001
        return None


class _FakeMarketDataService:
    def __init__(self, *, events: list[str], error: Exception | None = None):
        self._events = events
        self._error = error
        self.calls: list[tuple[datetime, datetime]] = []

    def refresh_btcusdt_1m(self, start: datetime, end: datetime):
        self._events.append("refresh")
        self.calls.append((start, end))
        if self._error is not None:
            raise self._error


def test_load_data_queries_persisted_cache_without_refresh() -> None:
    events: list[str] = []
    exp = _experiment(start=date(2026, 1, 1), end=date(2026, 1, 1))
    candles = [_candle(datetime(2026, 1, 1, 0, 0, tzinfo=UTC))]

    service = _FakeMarketDataService(events=events)
    repo = _FakeMarketDataRepo(candles, events)
    executor = DefaultExperimentExecutor(
        market_data_service=service,
        unit_of_work_factory=lambda: _FakeUoW(repo),
        min_required_candles=1,
    )

    loaded = executor.load_data(exp)

    assert isinstance(loaded, pl.LazyFrame)
    loaded_df = loaded.collect()
    assert loaded_df.columns == ["timestamp",
                                 "open", "high", "low", "close", "volume"]
    assert loaded_df.to_dicts() == [
        {
            "timestamp": candles[0].Timestamp,
            "open": candles[0].Open,
            "high": candles[0].High,
            "low": candles[0].Low,
            "close": candles[0].Close,
            "volume": candles[0].Volume,
        }
    ]
    assert service.calls == []
    assert events == ["list_range"]


def test_load_data_uses_persisted_cache_only() -> None:
    events: list[str] = []
    exp = _experiment(start=date(2026, 1, 1), end=date(2026, 1, 1))
    candles = [_candle(datetime(2026, 1, 1, 0, 0, tzinfo=UTC))]

    service = _FakeMarketDataService(events=events)
    repo = _FakeMarketDataRepo(candles, events)
    executor = DefaultExperimentExecutor(
        market_data_service=service,
        unit_of_work_factory=lambda: _FakeUoW(repo),
        min_required_candles=1,
    )

    loaded = executor.load_data(exp)
    loaded_df = loaded.collect()
    assert loaded_df.height == 1
    assert loaded_df.item(0, "timestamp") == candles[0].Timestamp
    assert service.calls == []
    assert events == ["list_range"]


def test_load_data_raises_when_cache_insufficient_even_without_refresh_failure() -> None:
    exp = _experiment(start=date(2026, 1, 1), end=date(2026, 1, 1))
    service = _FakeMarketDataService(events=[])
    repo = _FakeMarketDataRepo([], [])
    executor = DefaultExperimentExecutor(
        market_data_service=service,
        unit_of_work_factory=lambda: _FakeUoW(repo),
        min_required_candles=1,
    )

    with pytest.raises(ExperimentExecutionError, match="run market data ingestion first"):
        executor.load_data(exp)


def test_load_data_uses_full_day_datetime_bounds() -> None:
    exp = _experiment(start=date(2026, 1, 1), end=date(2026, 1, 2))
    service = _FakeMarketDataService(events=[])
    repo = _FakeMarketDataRepo(
        [_candle(datetime(2026, 1, 1, 0, 0, tzinfo=UTC))], [])
    executor = DefaultExperimentExecutor(
        market_data_service=service,
        unit_of_work_factory=lambda: _FakeUoW(repo),
        min_required_candles=1,
    )

    executor.load_data(exp)

    assert repo.last_args is not None
    start, end, interval = repo.last_args
    assert start == datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)
    assert end == datetime(2026, 1, 2, 23, 59, 59, 999999, tzinfo=UTC)
    assert repo.last_args[0] == start
    assert repo.last_args[1] == end
    assert interval == "1m"


def test_candles_to_lazyframe_preserves_order_from_repository() -> None:
    t0 = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    t1 = datetime(2026, 1, 1, 0, 1, tzinfo=UTC)
    candles = [_candle(t0), _candle(t1)]

    df = candles_to_lazyframe(candles).collect()

    assert list(df["timestamp"]) == [t0, t1]
    assert df.columns == ["timestamp", "open",
                          "high", "low", "close", "volume"]


def test_round_log_rows_are_disabled_by_default_to_avoid_log_explosion() -> None:
    ctx = ExperimentExecutor.ExecutionContext(experiment_id=1)
    ctx.config = {
        "_latest_test_data": pl.DataFrame({
            "timestamp": [datetime(2026, 1, 1, 0, i, tzinfo=UTC) for i in range(3)],
            "target": [1, 0, 1],
        }).lazy(),
        "_latest_predictions": {"_preds": [1, 1, 0]},
    }

    assert _build_round_log_rows(ctx, 10, "hash") == []


def test_round_log_rows_honor_explicit_cap() -> None:
    ctx = ExperimentExecutor.ExecutionContext(experiment_id=1)
    ctx.config = {
        "_latest_test_data": pl.DataFrame({
            "timestamp": [datetime(2026, 1, 1, 0, i, tzinfo=UTC) for i in range(5)],
            "target": [1, 0, 1, 0, 1],
        }).lazy(),
        "_latest_predictions": {"_preds": [1, 1, 0, 0, 1], "_raw_values": [0.91, 0.82, 0.41, 0.12, 0.77]},
    }

    rows = _build_round_log_rows(ctx, 10, "hash", max_rows=2)

    assert len(rows) == 2
    assert [row["round_index"] for row in rows] == [0, 1]
    assert rows[0]["prediction"] == Decimal("0.91")
    assert rows[0]["signal"] == 1


def test_signal_threshold_preserves_raw_probabilities() -> None:
    predictions = _apply_signal_threshold({"_preds": [0, 0, 0], "_probs": [0.4, 0.6, 0.8]}, 0.7)

    assert predictions["_preds"] == [0, 0, 1]
    assert predictions["_raw_values"] == [0.4, 0.6, 0.8]


def test_check_cancelled_raises_for_cancelled_experiment() -> None:
    experiment = _experiment(start=date(2026, 1, 1), end=date(2026, 1, 2))
    experiment.status = "Cancelled"
    executor = DefaultExperimentExecutor(unit_of_work_factory=lambda: _FakeExperimentUoW(experiment))

    with pytest.raises(ExperimentCancelledError):
        executor.check_cancelled(ExperimentExecutor.ExecutionContext(experiment_id=experiment.experiment_id or 1))


def test_execute_follows_golden_template_method_order() -> None:
    executor = _TracingExecutor()

    result = executor.execute(1)

    assert result["events"] == [
        "load_config",
        "mark_running",
        "load_klines",
        "aggregate_interval",
        "validate_experiment_range",
        "split_data",
        "compute_indicators_per_split",
        "generate_targets_per_split",
        "scale_features",
        "compile_blueprint",
        "generate_parameter_permutations",
        "create_architecture",
        "train",
        "predict",
        "evaluate",
        "run_backtest",
        "persist_model_artifact",
        "persist_logs",
        "update_progress",
        "mark_completed",
    ]
