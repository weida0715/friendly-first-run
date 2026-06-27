from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from app.domain.models.btcusdt_kline import BTCUSDTKline
from app.repositories.market_data_repository import UpsertSummary
from app.services.market_data_service import MarketDataRefreshError, MarketDataService


class FakeBinanceClient:
    def __init__(self, *, candles: list[BTCUSDTKline] | None = None, error: Exception | None = None):
        self._candles = candles or []
        self._error = error
        self.calls: list[tuple[datetime, datetime]] = []

    def fetch_klines(self, *, start: datetime, end: datetime) -> list[BTCUSDTKline]:
        self.calls.append((start, end))
        if self._error is not None:
            raise self._error
        return list(self._candles)


class FakeMarketDataRepository:
    def __init__(self, *, summary: UpsertSummary | None = None, error: Exception | None = None):
        self._summary = summary or UpsertSummary(inserted=0, updated=0)
        self._error = error
        self.received: list[list[BTCUSDTKline]] = []
        self.latest_timestamp: datetime | None = None
        self.earliest_timestamp: datetime | None = None
        self.range_timestamps: list[datetime] = []

    def upsert_klines(self, klines: list[BTCUSDTKline]) -> UpsertSummary:
        self.received.append(list(klines))
        if self._error is not None:
            raise self._error
        return self._summary

    def get_latest_timestamp(self) -> datetime | None:
        if self._error is not None:
            raise self._error
        return self.latest_timestamp

    def get_earliest_timestamp(self) -> datetime | None:
        if self._error is not None:
            raise self._error
        return self.earliest_timestamp

    def list_timestamps_range(self, start: datetime, end: datetime) -> list[datetime]:
        if self._error is not None:
            raise self._error
        return [ts for ts in self.range_timestamps if start <= ts <= end]


class FakeUnitOfWork:
    def __init__(self, repo: FakeMarketDataRepository | None):
        self.market_data = repo

    def __enter__(self) -> FakeUnitOfWork:
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # noqa: ANN001
        return None


def _make_candle(ts: datetime) -> BTCUSDTKline:
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


def test_refresh_btcusdt_1m_returns_summary_with_fetched_inserted_updated() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    end = start + timedelta(minutes=2)
    candles = [_make_candle(start), _make_candle(start + timedelta(minutes=1))]

    client = FakeBinanceClient(candles=candles)
    repo = FakeMarketDataRepository(
        summary=UpsertSummary(inserted=1, updated=1))
    service = MarketDataService(
        binance_client=client,
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    summary = service.refresh_btcusdt_1m(start, end)

    assert summary.symbol == "BTCUSDT"
    assert summary.interval == "1m"
    assert summary.start == start
    assert summary.end == end
    assert summary.fetched == 2
    assert summary.inserted == 1
    assert summary.updated == 1
    assert client.calls == [(start, end)]
    assert repo.received == [candles]


def test_refresh_btcusdt_1m_rejects_invalid_range_before_fetch() -> None:
    now = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    client = FakeBinanceClient(candles=[])
    repo = FakeMarketDataRepository()
    service = MarketDataService(
        binance_client=client,
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    with pytest.raises(ValueError, match="start must be earlier than end"):
        service.refresh_btcusdt_1m(now, now)

    assert client.calls == []
    assert repo.received == []


def test_refresh_btcusdt_1m_wraps_fetch_failures() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    end = start + timedelta(minutes=1)

    client = FakeBinanceClient(error=RuntimeError("binance down"))
    repo = FakeMarketDataRepository()
    service = MarketDataService(
        binance_client=client,
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    with pytest.raises(MarketDataRefreshError, match="Failed to fetch BTCUSDT 1m candles"):
        service.refresh_btcusdt_1m(start, end)

    assert repo.received == []


def test_refresh_btcusdt_1m_raises_when_market_data_repo_missing() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    end = start + timedelta(minutes=1)

    service = MarketDataService(
        binance_client=FakeBinanceClient(candles=[]),
        unit_of_work_factory=lambda: FakeUnitOfWork(None),
    )

    with pytest.raises(MarketDataRefreshError, match="Market data repository is unavailable"):
        service.refresh_btcusdt_1m(start, end)


def test_refresh_btcusdt_1m_wraps_persistence_failures() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    end = start + timedelta(minutes=1)
    candles = [_make_candle(start)]

    client = FakeBinanceClient(candles=candles)
    repo = FakeMarketDataRepository(error=RuntimeError("db write failure"))
    service = MarketDataService(
        binance_client=client,
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    with pytest.raises(MarketDataRefreshError, match="Failed to persist BTCUSDT 1m candles"):
        service.refresh_btcusdt_1m(start, end)


def test_get_latest_cached_btcusdt_1m_timestamp_returns_repo_value() -> None:
    repo = FakeMarketDataRepository()
    repo.latest_timestamp = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    service = MarketDataService(
        binance_client=FakeBinanceClient(candles=[]),
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    latest = service.get_latest_cached_btcusdt_1m_timestamp()
    assert latest == repo.latest_timestamp


def test_get_earliest_cached_btcusdt_1m_timestamp_returns_repo_value() -> None:
    repo = FakeMarketDataRepository()
    repo.earliest_timestamp = datetime(2026, 1, 2, 0, 0, tzinfo=UTC)
    service = MarketDataService(
        binance_client=FakeBinanceClient(candles=[]),
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    earliest = service.get_earliest_cached_btcusdt_1m_timestamp()
    assert earliest == repo.earliest_timestamp


def test_list_cached_btcusdt_1m_timestamps_returns_range_values() -> None:
    repo = FakeMarketDataRepository()
    repo.range_timestamps = [
        datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 1, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 3, tzinfo=UTC),
    ]
    service = MarketDataService(
        binance_client=FakeBinanceClient(candles=[]),
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    values = service.list_cached_btcusdt_1m_timestamps(
        datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 3, tzinfo=UTC),
    )
    assert values == repo.range_timestamps


def test_discover_missing_btcusdt_1m_ranges_returns_head_internal_and_tail_gaps() -> None:
    repo = FakeMarketDataRepository()
    repo.range_timestamps = [
        datetime(2026, 1, 1, 0, 1, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 2, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 5, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 6, tzinfo=UTC),
    ]
    service = MarketDataService(
        binance_client=FakeBinanceClient(candles=[]),
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    ranges, cached_points = service.discover_missing_btcusdt_1m_ranges(
        datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 8, tzinfo=UTC),
    )

    assert cached_points == 4
    assert ranges == [
        (
            datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
            datetime(2026, 1, 1, 0, 1, tzinfo=UTC),
        ),
        (
            datetime(2026, 1, 1, 0, 3, tzinfo=UTC),
            datetime(2026, 1, 1, 0, 5, tzinfo=UTC),
        ),
        (
            datetime(2026, 1, 1, 0, 7, tzinfo=UTC),
            datetime(2026, 1, 1, 0, 8, tzinfo=UTC),
        ),
    ]


def test_discover_missing_btcusdt_1m_ranges_treats_end_as_exclusive() -> None:
    repo = FakeMarketDataRepository()
    repo.range_timestamps = [
        datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 1, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 2, tzinfo=UTC),
    ]
    service = MarketDataService(
        binance_client=FakeBinanceClient(candles=[]),
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    ranges, cached_points = service.discover_missing_btcusdt_1m_ranges(
        datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
        datetime(2026, 1, 1, 0, 2, tzinfo=UTC),
    )

    assert cached_points == 2
    assert ranges == []
