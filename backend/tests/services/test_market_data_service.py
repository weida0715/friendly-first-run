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
    def __init__(self, *, summary: UpsertSummary | None = None):
        self._summary = summary or UpsertSummary(inserted=0, updated=0)
        self.received: list[list[BTCUSDTKline]] = []

    def upsert_klines(self, klines: list[BTCUSDTKline]) -> UpsertSummary:
        self.received.append(list(klines))
        return self._summary


class FakeUnitOfWork:
    def __init__(self, repo: FakeMarketDataRepository | None):
        self.market_data = repo

    def __enter__(self) -> FakeUnitOfWork:
        return self

    def __exit__(self, exc_type, exc, tb) -> None:  # noqa: ANN001
        return None


def _make_candle(ts: datetime, *, close: str = "1.5", volume: str = "10") -> BTCUSDTKline:
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


def test_refresh_summary_reports_inserted_and_updated_counts() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    end = start + timedelta(minutes=2)
    candles = [_make_candle(start), _make_candle(
        start + timedelta(minutes=1), close="2.0", volume="12")]

    client = FakeBinanceClient(candles=candles)
    repo = FakeMarketDataRepository(
        summary=UpsertSummary(inserted=1, updated=1))
    service = MarketDataService(
        binance_client=client,
        unit_of_work_factory=lambda: FakeUnitOfWork(repo),
    )

    summary = service.refresh_btcusdt_1m(start, end)

    assert summary.fetched == 2
    assert summary.inserted == 1
    assert summary.updated == 1
    assert repo.received == [candles]


def test_refresh_safe_handling_on_binance_failure_skips_persistence() -> None:
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
