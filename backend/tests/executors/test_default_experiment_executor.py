from __future__ import annotations

from datetime import UTC, date, datetime
from decimal import Decimal

import polars as pl
import pytest

from app.domain.models.btcusdt_kline import BTCUSDTKline
from app.domain.models.experiment import Experiment
from app.executors.default_experiment_executor import (
    DefaultExperimentExecutor,
    ExperimentExecutionError,
)


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


def _candle(ts: datetime, *, close: str = "1.5", volume: str = "10") -> BTCUSDTKline:
    return BTCUSDTKline(
        timestamp=ts,
        open=Decimal("1"),
        high=Decimal("2"),
        low=Decimal("0.5"),
        close=Decimal(close),
        volume=Decimal(volume),
        created_at=ts,
        updated_at=ts,
    )


class _FakeMarketDataRepo:
    def __init__(self, candles: list[BTCUSDTKline], events: list[str]):
        self._candles = candles
        self._events = events
        self.calls: list[tuple[datetime, datetime, str]] = []

    def list_range(self, start: datetime, end: datetime, interval: str = "1m") -> list[BTCUSDTKline]:
        self._events.append("list_range")
        self.calls.append((start, end, interval))
        return list(self._candles)


class _FakeUoW:
    def __init__(self, repo: _FakeMarketDataRepo | None):
        self.market_data = repo

    def __enter__(self) -> _FakeUoW:
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # noqa: ANN001
        return None


class _FakeMarketDataService:
    def __init__(self, *, events: list[str], error: Exception | None = None, returned=None):
        self._events = events
        self._error = error
        self._returned = returned
        self.calls: list[tuple[datetime, datetime]] = []

    def refresh_btcusdt_1m(self, start: datetime, end: datetime):
        self._events.append("refresh")
        self.calls.append((start, end))
        if self._error is not None:
            raise self._error
        return self._returned


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
    assert service.calls == []
    assert events == ["list_range"]


def test_load_data_uses_repository_cache_not_refresh_return_payload() -> None:
    events: list[str] = []
    exp = _experiment(start=date(2026, 1, 1), end=date(2026, 1, 1))
    cache_candles = [
        _candle(datetime(2026, 1, 1, 0, 0, tzinfo=UTC), close="9.9", volume="99")]
    service_return = {"inserted": 999, "updated": 999}

    service = _FakeMarketDataService(events=events, returned=service_return)
    repo = _FakeMarketDataRepo(cache_candles, events)
    executor = DefaultExperimentExecutor(
        market_data_service=service,
        unit_of_work_factory=lambda: _FakeUoW(repo),
        min_required_candles=1,
    )

    loaded_df = executor.load_data(exp).collect()

    assert loaded_df.height == 1
    assert loaded_df.item(0, "close") == cache_candles[0].Close
    assert loaded_df.item(0, "volume") == cache_candles[0].Volume


def test_repeated_runs_are_deterministic_cache_load() -> None:
    events: list[str] = []
    exp = _experiment(start=date(2026, 1, 1), end=date(2026, 1, 1))
    candles = [_candle(datetime(2026, 1, 1, 0, 0, tzinfo=UTC), close="3.3")]

    service = _FakeMarketDataService(events=events)
    repo = _FakeMarketDataRepo(candles, events)
    executor = DefaultExperimentExecutor(
        market_data_service=service,
        unit_of_work_factory=lambda: _FakeUoW(repo),
        min_required_candles=1,
    )

    df1 = executor.load_data(exp).collect()
    df2 = executor.load_data(exp).collect()

    assert len(service.calls) == 0
    assert len(repo.calls) == 2
    assert events == ["list_range", "list_range"]
    assert df1.to_dicts() == df2.to_dicts()


def test_cache_load_does_not_depend_on_refresh_service() -> None:
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

    loaded = executor.load_data(exp).collect()

    assert loaded.height == 1
    assert service.calls == []
    assert events == ["list_range"]


def test_insufficient_cache_raises_execution_error() -> None:
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
