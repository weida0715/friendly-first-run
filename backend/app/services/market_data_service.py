"""Market data service for refresh/use-case orchestration."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Callable

from app.infrastructure.binance import BTCUSDT_INTERVAL, BTCUSDT_SYMBOL, BinanceKlineClient
from app.repositories.unit_of_work import UnitOfWork

RECONCILE_SCAN_CHUNK_DAYS = 30


@dataclass(slots=True)
class RefreshSummary:
    symbol: str
    interval: str
    start: datetime
    end: datetime
    fetched: int
    inserted: int
    updated: int


class MarketDataRefreshError(RuntimeError):
    """Raised when market data refresh fails."""


class MarketDataService:
    """Coordinates market data refresh operations and cache persistence."""

    def __init__(
        self,
        *,
        binance_client: BinanceKlineClient | None = None,
        unit_of_work_factory: Callable[[], UnitOfWork] = UnitOfWork,
    ) -> None:
        self._binance_client = binance_client or BinanceKlineClient()
        self._unit_of_work_factory = unit_of_work_factory

    def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
        start = _ensure_utc_datetime(start)
        end = _ensure_utc_datetime(end)
        if start >= end:
            raise ValueError("start must be earlier than end")

        try:
            candles = self._binance_client.fetch_klines(start=start, end=end)
        except Exception as exc:
            raise MarketDataRefreshError(
                f"Failed to fetch BTCUSDT 1m candles: {exc.__class__.__name__}: {exc}") from exc

        try:
            with self._unit_of_work_factory() as uow:
                if uow.market_data is None:
                    raise MarketDataRefreshError(
                        "Market data repository is unavailable")
                upsert_summary = uow.market_data.upsert_klines(candles)
        except MarketDataRefreshError:
            raise
        except Exception as exc:
            raise MarketDataRefreshError(
                f"Failed to persist BTCUSDT 1m candles: {exc.__class__.__name__}: {exc}") from exc

        return RefreshSummary(
            symbol=BTCUSDT_SYMBOL,
            interval=BTCUSDT_INTERVAL,
            start=start,
            end=end,
            fetched=len(candles),
            inserted=upsert_summary.inserted,
            updated=upsert_summary.updated,
        )

    def get_latest_cached_btcusdt_1m_timestamp(self) -> datetime | None:
        try:
            with self._unit_of_work_factory() as uow:
                if uow.market_data is None:
                    raise MarketDataRefreshError(
                        "Market data repository is unavailable")
                latest = uow.market_data.get_latest_timestamp()
        except MarketDataRefreshError:
            raise
        except Exception as exc:
            raise MarketDataRefreshError(
                f"Failed to read latest cached BTCUSDT 1m timestamp: {exc.__class__.__name__}: {exc}") from exc

        if latest is None:
            return None
        if latest.tzinfo is None:
            return latest.replace(tzinfo=UTC)
        return latest.astimezone(UTC)

    def get_earliest_cached_btcusdt_1m_timestamp(self) -> datetime | None:
        try:
            with self._unit_of_work_factory() as uow:
                if uow.market_data is None:
                    raise MarketDataRefreshError(
                        "Market data repository is unavailable")
                earliest = uow.market_data.get_earliest_timestamp()
        except MarketDataRefreshError:
            raise
        except Exception as exc:
            raise MarketDataRefreshError(
                f"Failed to read earliest cached BTCUSDT 1m timestamp: {exc.__class__.__name__}: {exc}") from exc

        if earliest is None:
            return None
        if earliest.tzinfo is None:
            return earliest.replace(tzinfo=UTC)
        return earliest.astimezone(UTC)

    def list_cached_btcusdt_1m_timestamps(self, start: datetime, end: datetime) -> list[datetime]:
        start = _ensure_utc_datetime(start)
        end = _ensure_utc_datetime(end)
        try:
            with self._unit_of_work_factory() as uow:
                if uow.market_data is None:
                    raise MarketDataRefreshError(
                        "Market data repository is unavailable")
                timestamps = uow.market_data.list_timestamps_range(start, end)
        except MarketDataRefreshError:
            raise
        except Exception as exc:
            raise MarketDataRefreshError(
                f"Failed to read cached BTCUSDT 1m timestamps: {exc.__class__.__name__}: {exc}") from exc

        normalized: list[datetime] = []
        for ts in timestamps:
            normalized.append(ts.replace(tzinfo=UTC)
                              if ts.tzinfo is None else ts.astimezone(UTC))
        return normalized

    def discover_missing_btcusdt_1m_ranges(
        self,
        start: datetime,
        end: datetime,
    ) -> tuple[list[tuple[datetime, datetime]], int]:
        start = _ensure_utc_datetime(start)
        end = _ensure_utc_datetime(end)
        if start >= end:
            return [], 0

        step = timedelta(minutes=1)
        scan_chunk = timedelta(days=RECONCILE_SCAN_CHUNK_DAYS)
        cursor = start
        next_missing_start = start
        total_cached = 0
        missing_ranges: list[tuple[datetime, datetime]] = []

        while cursor < end:
            scan_end = min(cursor + scan_chunk, end)
            cached = [
                timestamp
                for timestamp in self.list_cached_btcusdt_1m_timestamps(cursor, scan_end)
                if cursor <= timestamp < scan_end
            ]
            total_cached += len(cached)

            for timestamp in cached:
                if timestamp < next_missing_start:
                    continue
                if timestamp > next_missing_start:
                    missing_ranges.append((next_missing_start, timestamp))
                next_missing_start = timestamp + step

            cursor = scan_end

        if next_missing_start < end:
            missing_ranges.append((next_missing_start, end))

        return _merge_ranges(missing_ranges), total_cached

    def clear_btcusdt_1m_cache(self) -> int:
        try:
            with self._unit_of_work_factory() as uow:
                if uow.market_data is None:
                    raise MarketDataRefreshError(
                        "Market data repository is unavailable")
                cleared = uow.market_data.clear_all()
        except MarketDataRefreshError:
            raise
        except Exception as exc:
            raise MarketDataRefreshError(
                f"Failed to clear BTCUSDT 1m cache: {exc.__class__.__name__}: {exc}") from exc

        return cleared


def _ensure_utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _merge_ranges(ranges: list[tuple[datetime, datetime]]) -> list[tuple[datetime, datetime]]:
    merged: list[tuple[datetime, datetime]] = []
    for start, end in ranges:
        if start >= end:
            continue
        if not merged or start > merged[-1][1]:
            merged.append((start, end))
            continue
        previous_start, previous_end = merged[-1]
        merged[-1] = (previous_start, max(previous_end, end))
    return merged
