"""Market data cache read endpoints."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from flask import Blueprint, request

from app.repositories.unit_of_work import UnitOfWork
from app.responses import ok_response, validation_error_response

blueprint = Blueprint("market_data", __name__)

DEFAULT_API_KLINE_LIMIT = 5000
MAX_API_KLINE_LIMIT = 20000


def _parse_iso8601(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _to_utc_iso(value: datetime) -> str:
    normalized = value if value.tzinfo is not None else value.replace(
        tzinfo=UTC)
    return normalized.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _coerce_datetime(value: datetime | str) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo is not None else value.replace(tzinfo=UTC)
    parsed = datetime.fromisoformat(value)
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


def _extract_kline_fields(item) -> tuple[datetime, object, object, object, object, object]:
    if isinstance(item, tuple):
        ts = _coerce_datetime(item[0])
        return ts, item[1], item[2], item[3], item[4], item[5]

    ts = _coerce_datetime(getattr(item, "Timestamp"))
    return ts, item.Open, item.High, item.Low, item.Close, item.Volume


def _format_decimal_8(value: object) -> str:
    return f"{Decimal(str(value)):.8f}"


@blueprint.get("/btcusdt/klines")
def get_btcusdt_klines():
    start_raw = request.args.get("start", type=str)
    end_raw = request.args.get("end", type=str)
    interval = request.args.get("interval", default="1m", type=str)
    limit = request.args.get(
        "limit", default=DEFAULT_API_KLINE_LIMIT, type=int)
    before_raw = request.args.get("before", type=str)

    errors: dict[str, str] = {}
    if interval != "1m":
        errors["interval"] = "Only 1m interval is supported"
    if limit <= 0 or limit > MAX_API_KLINE_LIMIT:
        errors["limit"] = f"limit must be between 1 and {MAX_API_KLINE_LIMIT}"
    if errors:
        return validation_error_response(errors, status_code=400)

    start: datetime | None = None
    end: datetime | None = None
    if start_raw is not None:
        try:
            start = _parse_iso8601(start_raw)
        except ValueError:
            return validation_error_response({"start": "Invalid ISO-8601 datetime"}, status_code=400)
    if end_raw is not None:
        try:
            end = _parse_iso8601(end_raw)
        except ValueError:
            return validation_error_response({"end": "Invalid ISO-8601 datetime"}, status_code=400)
    if (start is None) != (end is None):
        return validation_error_response(
            {"range": "start and end must be provided together"}, status_code=400
        )
    if start is not None and end is not None and start >= end:
        return validation_error_response({"range": "start must be earlier than end"}, status_code=400)

    before: datetime | None = None
    if before_raw is not None:
        try:
            before = _parse_iso8601(before_raw)
        except ValueError:
            return validation_error_response({"before": "Invalid ISO-8601 datetime"}, status_code=400)

    with UnitOfWork() as uow:
        if start is None or end is None:
            items = uow.market_data.list_latest_chunk(
                limit=limit, before=before, interval="1m")
            has_more = False
            next_before: str | None = None
            if items:
                earliest_in_chunk = items[0].Timestamp
                repo_earliest = uow.market_data.get_earliest_timestamp()
                if repo_earliest is not None and earliest_in_chunk > repo_earliest:
                    has_more = True
                    next_before = _to_utc_iso(earliest_in_chunk)
        else:
            items = uow.market_data.list_range_projection(
                start=start,
                end=end,
                interval="1m",
                limit=limit,
            )
            has_more = False
            next_before = None

    return ok_response(
        {
            "data": {
                "symbol": "BTCUSDT",
                "interval": "1m",
                "has_more": has_more,
                "next_before": next_before,
                "items": [
                    {
                        "time": int(ts.timestamp()),
                        "timestamp": _to_utc_iso(ts),
                        "open": _format_decimal_8(open_),
                        "high": _format_decimal_8(high),
                        "low": _format_decimal_8(low),
                        "close": _format_decimal_8(close),
                        "volume": _format_decimal_8(volume),
                    }
                    for ts, open_, high, low, close, volume in (_extract_kline_fields(item) for item in items)
                ],
            }
        }
    )


@blueprint.get("/btcusdt/metadata")
def get_btcusdt_metadata():
    with UnitOfWork() as uow:
        latest = uow.market_data.get_latest_timestamp() if uow.market_data else None
        earliest = uow.market_data.get_earliest_timestamp() if uow.market_data else None

    return ok_response(
        {
            "data": {
                "symbol": "BTCUSDT",
                "interval": "1m",
                "latestTimestamp": latest.isoformat() + "Z" if latest else None,
                "earliestTimestamp": earliest.isoformat() + "Z" if earliest else None,
            }
        }
    )
