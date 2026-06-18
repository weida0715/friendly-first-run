from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone
from decimal import Decimal

import pytest

from app.infrastructure.binance.kline_client import (
    BINANCE_MAX_KLINE_LIMIT,
    BinanceKlineClient,
    MarketDataValidationError,
    normalize_kline,
)


class DummySpotClient:
    def __init__(self, responses=None, fail_times: int = 0):
        self.responses = responses or []
        self.fail_times = fail_times
        self.calls: list[dict] = []

    def klines(self, **kwargs):
        self.calls.append(kwargs)
        if self.fail_times > 0:
            self.fail_times -= 1
            raise RuntimeError("transient error")
        if self.responses:
            return self.responses.pop(0)
        return []


def _row(
    open_time_ms: int,
    open_: str,
    high: str,
    low: str,
    close: str,
    volume: str,
    close_time_ms: int | None = None,
    quote_volume: str = "0",
    trade_count: int = 0,
    taker_buy_base_volume: str = "0",
    taker_buy_quote_volume: str = "0",
):
    close_time_ms = close_time_ms if close_time_ms is not None else open_time_ms + 59_999
    return [
        open_time_ms,
        open_,
        high,
        low,
        close,
        volume,
        close_time_ms,
        quote_volume,
        trade_count,
        taker_buy_base_volume,
        taker_buy_quote_volume,
        "0",
    ]


def test_normalize_kline_preserves_decimal_values_and_sets_timestamps() -> None:
    now = datetime(2026, 1, 1, 0, 1, tzinfo=UTC)
    open_time = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    raw = _row(
        _datetime_to_ms(open_time),
        "50000.12345678",
        "50001.23456789",
        "49999.98765432",
        "50000.00000001",
        "123.12345678",
        quote_volume="987654.12345678",
        trade_count=321,
        taker_buy_base_volume="45.67890000",
        taker_buy_quote_volume="12345.67890000",
    )

    candle = normalize_kline(raw, now=now)

    assert candle.Timestamp == open_time
    assert candle.Open == Decimal("50000.12345678")
    assert candle.High == Decimal("50001.23456789")
    assert candle.Low == Decimal("49999.98765432")
    assert candle.Close == Decimal("50000.00000001")
    assert candle.Volume == Decimal("123.12345678")
    assert candle.CreatedAt == now
    assert candle.UpdatedAt == now


def test_normalize_kline_rejects_short_rows() -> None:
    with pytest.raises(ValueError, match="Binance kline row must contain at least 11 entries"):
        normalize_kline([1, "1", "1", "1", "1", "1", 1, "1", 1, "1"])


def test_fetch_klines_normalizes_rows_and_enforces_symbol_interval() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    row = _row(_datetime_to_ms(start), "100.1",
               "101.2", "99.3", "100.9", "12.5")

    spot = DummySpotClient(responses=[[row], []])
    client = BinanceKlineClient(spot_client=spot, retry_delay_seconds=0)

    candles = client.fetch_klines(
        start=start, end=start + timedelta(minutes=2))

    assert len(candles) == 1
    assert candles[0].Timestamp == start
    assert candles[0].Open == Decimal("100.1")
    assert candles[0].High == Decimal("101.2")
    assert candles[0].Low == Decimal("99.3")
    assert candles[0].Close == Decimal("100.9")
    assert candles[0].Volume == Decimal("12.5")
    assert candles[0].CreatedAt == candles[0].UpdatedAt

    assert spot.calls[0]["symbol"] == "BTCUSDT"
    assert spot.calls[0]["interval"] == "1m"


def test_fetch_klines_paginates_until_empty() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    t0 = _datetime_to_ms(start)
    t1 = t0 + 60_000
    t2 = t1 + 60_000

    spot = DummySpotClient(
        responses=[
            [_row(t0, "1", "1", "1", "1", "1"),
             _row(t1, "2", "2", "2", "2", "2")],
            [_row(t2, "3", "3", "3", "3", "3")],
            [],
        ]
    )

    client = BinanceKlineClient(spot_client=spot, retry_delay_seconds=0)
    candles = client.fetch_klines(
        start=start, end=start + timedelta(minutes=5), limit=2)

    assert [c.Close for c in candles] == [
        Decimal("1"), Decimal("2"), Decimal("3")]
    assert len(spot.calls) == 3
    assert spot.calls[0]["startTime"] == t0
    assert spot.calls[1]["startTime"] == t2


def test_fetch_klines_pagination_keeps_btcusdt_1m_and_limit_per_page() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    t0 = _datetime_to_ms(start)
    t1 = t0 + 60_000
    t2 = t1 + 60_000

    spot = DummySpotClient(
        responses=[
            [_row(t0, "10", "11", "9", "10.5", "1"), _row(
                t1, "11", "12", "10", "11.5", "1")],
            [_row(t2, "12", "13", "11", "12.5", "1")],
            [],
        ]
    )
    client = BinanceKlineClient(spot_client=spot, retry_delay_seconds=0)

    candles = client.fetch_klines(
        start=start, end=start + timedelta(minutes=5), limit=2)

    assert len(candles) == 3
    assert len(spot.calls) == 3
    assert [call["symbol"]
            for call in spot.calls] == ["BTCUSDT", "BTCUSDT", "BTCUSDT"]
    assert [call["interval"] for call in spot.calls] == ["1m", "1m", "1m"]
    assert [call["limit"] for call in spot.calls] == [2, 2, 2]
    assert spot.calls[0]["startTime"] == t0
    assert spot.calls[1]["startTime"] == t2


def test_fetch_klines_validates_date_range_and_limit() -> None:
    spot = DummySpotClient()
    client = BinanceKlineClient(spot_client=spot, retry_delay_seconds=0)
    now = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)

    with pytest.raises(MarketDataValidationError, match="start must be earlier than end"):
        client.fetch_klines(start=now, end=now)

    with pytest.raises(MarketDataValidationError, match="limit must be between 1 and 1000"):
        client.fetch_klines(start=now, end=now + timedelta(minutes=1), limit=0)

    with pytest.raises(MarketDataValidationError, match="limit must be between 1 and 1000"):
        client.fetch_klines(start=now, end=now +
                            timedelta(minutes=1), limit=1001)


def test_fetch_klines_validates_symbol_and_interval_before_calling_binance() -> None:
    now = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)

    bad_symbol_spot = DummySpotClient()
    client_bad_symbol = BinanceKlineClient(
        spot_client=bad_symbol_spot, retry_delay_seconds=0)
    with pytest.raises(MarketDataValidationError, match="Only BTCUSDT klines are supported"):
        client_bad_symbol.fetch_klines(
            start=now, end=now + timedelta(minutes=1), symbol="ETHUSDT")
    assert bad_symbol_spot.calls == []

    bad_interval_spot = DummySpotClient()
    client_bad_interval = BinanceKlineClient(
        spot_client=bad_interval_spot, retry_delay_seconds=0)
    with pytest.raises(MarketDataValidationError, match="Only 1m BTCUSDT klines are supported"):
        client_bad_interval.fetch_klines(
            start=now, end=now + timedelta(minutes=1), interval="5m")
    assert bad_interval_spot.calls == []


def test_fetch_klines_normalizes_timezone_to_utc_for_request_and_domain() -> None:
    start_local = datetime(
        2026, 1, 1, 8, 0, tzinfo=timezone(timedelta(hours=8)))
    end_local = start_local + timedelta(minutes=2)
    start_utc = start_local.astimezone(UTC)

    spot = DummySpotClient(
        responses=[[_row(_datetime_to_ms(start_utc), "10", "11", "9", "10.5", "3")], []])
    client = BinanceKlineClient(spot_client=spot, retry_delay_seconds=0)

    candles = client.fetch_klines(start=start_local, end=end_local)

    assert spot.calls[0]["startTime"] == _datetime_to_ms(start_utc)
    assert candles[0].Timestamp == start_utc


def test_binance_max_kline_limit_constant_is_1000() -> None:
    assert BINANCE_MAX_KLINE_LIMIT == 1000


def test_fetch_klines_retries_then_succeeds() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)

    spot = DummySpotClient(responses=[[[_datetime_to_ms(start), "1", "1", "1", "1", "1", _datetime_to_ms(
        start)+59999, "0", 0, "0", "0", "0"]], []], fail_times=1)
    client = BinanceKlineClient(
        spot_client=spot, max_retries=2, retry_delay_seconds=0)

    candles = client.fetch_klines(
        start=start, end=start + timedelta(minutes=2))

    assert len(candles) == 1
    assert len(spot.calls) >= 2


def test_fetch_klines_raises_after_retry_exhaustion() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)

    spot = DummySpotClient(fail_times=2)
    client = BinanceKlineClient(
        spot_client=spot, max_retries=2, retry_delay_seconds=0)

    with pytest.raises(RuntimeError, match="Failed to fetch BTCUSDT 1m klines from Binance \(RuntimeError: transient error\)"):
        client.fetch_klines(start=start, end=start + timedelta(minutes=1))

    assert len(spot.calls) == 2


def test_fetch_klines_rejects_malformed_row() -> None:
    start = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    malformed_row = [_datetime_to_ms(
        start), "1", "1", "1", "1", "1", _datetime_to_ms(start)+59999, "1", 1, "1"]

    spot = DummySpotClient(responses=[[malformed_row]])
    client = BinanceKlineClient(spot_client=spot, retry_delay_seconds=0)

    with pytest.raises(ValueError, match="Binance kline row must contain at least 11 entries"):
        client.fetch_klines(start=start, end=start + timedelta(minutes=1))


def test_client_initializes_spot_without_base_url_arg_when_unset(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class FakeSpot:
        def __init__(self, *args, **kwargs):  # noqa: ANN002, ANN003
            captured["args"] = args
            captured["kwargs"] = kwargs

    import app.infrastructure.binance.kline_client as module

    monkeypatch.setattr(module, "Spot", FakeSpot)
    client = module.BinanceKlineClient(spot_client=None, base_url=None)

    assert isinstance(client, module.BinanceKlineClient)
    assert captured["kwargs"] == {}


def _datetime_to_ms(value: datetime) -> int:
    return int(value.timestamp() * 1000)
