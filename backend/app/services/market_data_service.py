"""Market data service for refresh/use-case orchestration."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Callable

from app.infrastructure.binance import BTCUSDT_INTERVAL, BTCUSDT_SYMBOL, BinanceKlineClient
from app.repositories.unit_of_work import UnitOfWork


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
