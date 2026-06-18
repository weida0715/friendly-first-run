from __future__ import annotations

import argparse

from app.scripts._market_data_cli import resolve_range
from app.services.market_data_service import MarketDataRefreshError, MarketDataService


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Incrementally refresh BTCUSDT 1m klines into local cache")
    parser.add_argument(
        "--start", type=str, help="ISO-8601 UTC start timestamp (e.g. 2024-01-01T00:00:00Z)")
    parser.add_argument("--end", type=str,
                        help="ISO-8601 UTC end timestamp or 'now'")
    parser.add_argument("--lookback-hours", type=int,
                        help="Use a relative lookback window ending at now")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        start, end = resolve_range(
            start=args.start, end=args.end, lookback_hours=args.lookback_hours)
    except ValueError as exc:
        parser.error(str(exc))

    service = MarketDataService()
    try:
        summary = service.refresh_btcusdt_1m(start=start, end=end)
    except MarketDataRefreshError as exc:
        print(f"refresh failed: {exc}")
        return 1

    print(
        "refresh complete "
        f"symbol={summary.symbol} interval={summary.interval} "
        f"start={summary.start.isoformat()} end={summary.end.isoformat()} "
        f"fetched={summary.fetched} inserted={summary.inserted} updated={summary.updated}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
