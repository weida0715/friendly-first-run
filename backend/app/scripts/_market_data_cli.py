from __future__ import annotations

from datetime import UTC, datetime, timedelta


def parse_iso_datetime(value: str) -> datetime:
    raw = value.strip()
    if raw.lower() == "now":
        return datetime.now(UTC)
    normalized = raw.replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def resolve_range(*, start: str | None, end: str | None, lookback_hours: int | None) -> tuple[datetime, datetime]:
    if lookback_hours is not None:
        if start is not None or end is not None:
            raise ValueError(
                "--lookback-hours cannot be combined with --start/--end")
        if lookback_hours <= 0:
            raise ValueError("--lookback-hours must be greater than 0")
        resolved_end = datetime.now(UTC)
        resolved_start = resolved_end - timedelta(hours=lookback_hours)
        return resolved_start, resolved_end

    if start is None or end is None:
        raise ValueError(
            "either provide --lookback-hours or both --start and --end")

    resolved_start = parse_iso_datetime(start)
    resolved_end = parse_iso_datetime(end)
    if resolved_start >= resolved_end:
        raise ValueError("start must be earlier than end")
    return resolved_start, resolved_end
