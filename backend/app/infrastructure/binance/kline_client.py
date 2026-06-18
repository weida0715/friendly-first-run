"""Binance Spot adapter for BTCUSDT 1m kline retrieval."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
import time
from typing import Any, Sequence

from binance.spot import Spot

from app.domain.models.btcusdt_kline import BTCUSDTKline

BTCUSDT_SYMBOL = "BTCUSDT"
BTCUSDT_INTERVAL = "1m"
DEFAULT_LIMIT = 1000
BINANCE_MAX_KLINE_LIMIT = 1000
BINANCE_MAX_LIMIT = BINANCE_MAX_KLINE_LIMIT
ONE_MINUTE_MS = 60_000


class MarketDataValidationError(ValueError):
    """Raised when market data request parameters are invalid."""


class BinanceKlineClient:
    """Fetches and normalizes Binance BTCUSDT 1m kline data."""

    def __init__(
        self,
        *,
        spot_client: Spot | None = None,
        base_url: str | None = None,
        max_retries: int = 3,
        retry_delay_seconds: float = 0.25,
    ) -> None:
        if spot_client is not None:
            self._spot_client = spot_client
        elif base_url:
            self._spot_client = Spot(base_url=base_url)
        else:
            self._spot_client = Spot()
        self._max_retries = max_retries
        self._retry_delay_seconds = retry_delay_seconds

    def fetch_klines(
        self,
        *,
        start: datetime,
        end: datetime,
        symbol: str = BTCUSDT_SYMBOL,
        interval: str = BTCUSDT_INTERVAL,
        limit: int = DEFAULT_LIMIT,
    ) -> list[BTCUSDTKline]:
        """Fetch BTCUSDT 1m klines from Binance and normalize to domain entities."""
        normalized_start, normalized_end = self._validate_request(
            start=start,
            end=end,
            symbol=symbol,
            interval=interval,
            limit=limit,
        )

        start_ms = _datetime_to_ms(normalized_start)
        end_ms = _datetime_to_ms(normalized_end)
        cursor_ms = start_ms
        normalized: list[BTCUSDTKline] = []

        while cursor_ms <= end_ms:
            rows = self._request_klines(
                start_ms=cursor_ms,
                end_ms=end_ms,
                symbol=symbol,
                interval=interval,
                limit=limit,
            )
            if not rows:
                break

            now = datetime.now(UTC)
            for row in rows:
                normalized.append(normalize_kline(row, now=now))

            last_open_time_ms = int(rows[-1][0])
            next_cursor = last_open_time_ms + ONE_MINUTE_MS
            if next_cursor <= cursor_ms:
                break
            cursor_ms = next_cursor

        return normalized

    def _request_klines(
        self,
        *,
        start_ms: int,
        end_ms: int,
        symbol: str,
        interval: str,
        limit: int,
    ) -> list[list[Any]]:
        last_error: Exception | None = None
        for attempt in range(1, self._max_retries + 1):
            try:
                return self._spot_client.klines(
                    symbol=symbol,
                    interval=interval,
                    startTime=start_ms,
                    endTime=end_ms,
                    limit=limit,
                )
            except Exception as exc:  # pragma: no cover - connector-specific exception types vary
                last_error = exc
                if attempt == self._max_retries:
                    break
                time.sleep(self._retry_delay_seconds)

        detail = "unknown error"
        if last_error is not None:
            detail = f"{last_error.__class__.__name__}: {last_error}"
        raise RuntimeError(
            f"Failed to fetch BTCUSDT 1m klines from Binance ({detail})") from last_error

    @staticmethod
    def _validate_request(
        *,
        start: datetime,
        end: datetime,
        symbol: str,
        interval: str,
        limit: int,
    ) -> tuple[datetime, datetime]:
        if symbol != BTCUSDT_SYMBOL:
            raise MarketDataValidationError(
                "Only BTCUSDT klines are supported")
        if interval != BTCUSDT_INTERVAL:
            raise MarketDataValidationError(
                "Only 1m BTCUSDT klines are supported")

        normalized_start = _ensure_utc_datetime(start)
        normalized_end = _ensure_utc_datetime(end)
        if normalized_start >= normalized_end:
            raise MarketDataValidationError("start must be earlier than end")
        if limit < 1 or limit > BINANCE_MAX_KLINE_LIMIT:
            raise MarketDataValidationError(
                f"limit must be between 1 and {BINANCE_MAX_KLINE_LIMIT}"
            )

        return normalized_start, normalized_end

    @staticmethod
    def _normalize_row(row: list[Any], *, now: datetime) -> BTCUSDTKline:
        return normalize_kline(row, now=now)


def normalize_kline(raw: Sequence[Any], now: datetime | None = None) -> BTCUSDTKline:
    """Normalize a Binance raw kline array into a BTCUSDTKline entity."""
    if len(raw) < 11:
        raise ValueError("Binance kline row must contain at least 11 entries")

    normalized_now = _ensure_utc_datetime(now or datetime.now(UTC))
    return BTCUSDTKline(
        timestamp=_ms_to_datetime(int(raw[0])),
        open=Decimal(str(raw[1])),
        high=Decimal(str(raw[2])),
        low=Decimal(str(raw[3])),
        close=Decimal(str(raw[4])),
        volume=Decimal(str(raw[5])),
        created_at=normalized_now,
        updated_at=normalized_now,
    )


def _datetime_to_ms(value: datetime) -> int:
    normalized = _ensure_utc_datetime(value)
    return int(normalized.timestamp() * 1000)


def _ensure_utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _ms_to_datetime(value: int) -> datetime:
    return datetime.fromtimestamp(value / 1000, tz=UTC)
