from __future__ import annotations

import argparse
from datetime import UTC, datetime, timedelta
import time

from app.scripts._market_data_cli import parse_iso_datetime
from app.services.market_data_service import MarketDataRefreshError, MarketDataService

DEFAULT_EARLIEST_BINANCE_BTCUSDT_SPOT = "2017-08-17T00:00:00Z"
DEFAULT_CHUNK_HOURS = 24
RECONCILE_SCAN_CHUNK_DAYS = 30


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Full backfill/seed ingest for BTCUSDT 1m klines into local cache")
    parser.add_argument(
        "--from",
        dest="from_ts",
        type=str,
        default=DEFAULT_EARLIEST_BINANCE_BTCUSDT_SPOT,
        help="ISO-8601 UTC start timestamp (default: earliest Binance BTCUSDT spot date)",
    )
    parser.add_argument("--to", dest="to_ts", type=str, default="now",
                        help="ISO-8601 UTC end timestamp or 'now'")
    parser.add_argument("--chunk-hours", type=int, default=DEFAULT_CHUNK_HOURS,
                        help="Chunk size in hours for incremental upsert windows")
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Continue ingesting later windows even if one window fails",
    )
    parser.add_argument(
        "--max-failures",
        type=int,
        default=3,
        help="Maximum failed windows before abort when --continue-on-error is enabled",
    )
    parser.add_argument(
        "--progress-seconds",
        type=int,
        default=0,
        help="Print periodic progress every N seconds (0 disables periodic progress logs)",
    )
    parser.add_argument(
        "--resume-from-cache",
        action="store_true",
        help="Skip already-cached history by resuming from latest cached BTCUSDT 1m timestamp + 1 minute",
    )
    parser.add_argument(
        "--reconcile-cache",
        action="store_true",
        help="Fill only missing head/tail ranges around cached BTCUSDT data (skip already-covered middle range)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    start = parse_iso_datetime(args.from_ts)
    end = parse_iso_datetime(args.to_ts)
    if start >= end:
        parser.error("--from must be earlier than --to")
    if args.chunk_hours <= 0:
        parser.error("--chunk-hours must be greater than 0")
    if args.max_failures <= 0:
        parser.error("--max-failures must be greater than 0")
    if args.progress_seconds < 0:
        parser.error("--progress-seconds must be >= 0")

    service = MarketDataService()

    if args.resume_from_cache and args.reconcile_cache:
        parser.error(
            "--resume-from-cache cannot be combined with --reconcile-cache")

    if args.resume_from_cache:
        latest_cached = service.get_latest_cached_btcusdt_1m_timestamp()
        if latest_cached is not None:
            resume_start = latest_cached + timedelta(minutes=1)
            if resume_start > start:
                print(
                    f"resume-from-cache applied latest_cached={latest_cached.isoformat()} resume_start={resume_start.isoformat()}")
                start = resume_start

    ranges_to_process: list[tuple[datetime, datetime]] = []

    if args.reconcile_cache:
        step = timedelta(minutes=1)
        reconcile_scan_chunk = timedelta(days=RECONCILE_SCAN_CHUNK_DAYS)
        cursor_scan = start
        prev_cached_ts: datetime | None = None
        total_cached_points = 0

        while cursor_scan < end:
            scan_end = min(cursor_scan + reconcile_scan_chunk, end)
            cached = service.list_cached_btcusdt_1m_timestamps(
                cursor_scan, scan_end)
            total_cached_points += len(cached)

            if not cached:
                if prev_cached_ts is None:
                    ranges_to_process.append((cursor_scan, scan_end))
                else:
                    gap_start = prev_cached_ts + step
                    if scan_end > gap_start:
                        ranges_to_process.append((gap_start, scan_end))
            else:
                if prev_cached_ts is None:
                    if cursor_scan < cached[0]:
                        ranges_to_process.append((cursor_scan, cached[0]))
                else:
                    gap_start = prev_cached_ts + step
                    if cached[0] > gap_start:
                        ranges_to_process.append((gap_start, cached[0]))

                for prev, curr in zip(cached, cached[1:]):
                    gap_start = prev + step
                    if curr > gap_start:
                        ranges_to_process.append((gap_start, curr))

                prev_cached_ts = cached[-1]

            cursor_scan = scan_end

        if prev_cached_ts is not None:
            tail_start = prev_cached_ts + step
            if tail_start < end:
                ranges_to_process.append((tail_start, end))

        merged_ranges: list[tuple[datetime, datetime]] = []
        for rs, re in ranges_to_process:
            if rs >= re:
                continue
            if not merged_ranges:
                merged_ranges.append((rs, re))
                continue
            last_s, last_e = merged_ranges[-1]
            if rs <= last_e:
                merged_ranges[-1] = (last_s, max(last_e, re))
            else:
                merged_ranges.append((rs, re))
        ranges_to_process = merged_ranges
        print(
            f"reconcile-cache cached_points={total_cached_points} missing_ranges={len(ranges_to_process)}"
        )
    else:
        if start < end:
            ranges_to_process = [(start, end)]

    if not ranges_to_process:
        print(
            f"ingest skipped start={start.isoformat()} end={end.isoformat()} reason=no missing range"
        )
        return 0

    cursor = ranges_to_process[0][0]
    chunk = timedelta(hours=args.chunk_hours)
    total_fetched = 0
    total_inserted = 0
    total_updated = 0
    windows = 0
    failed_windows = 0
    last_progress_log_at = time.monotonic()

    def _print_progress(prefix: str = "progress") -> None:
        print(
            f"{prefix} cursor={cursor.isoformat()} end={end.isoformat()} "
            f"windows={windows} fetched={total_fetched} inserted={total_inserted} updated={total_updated} failed_windows={failed_windows}"
        )

    try:
        for range_start, range_end in ranges_to_process:
            cursor = range_start
            while cursor < range_end:
                window_end = min(cursor + chunk, range_end)
                try:
                    summary = service.refresh_btcusdt_1m(
                        start=cursor, end=window_end)
                except MarketDataRefreshError as exc:
                    failed_windows += 1
                    print(
                        f"ingest failed at window start={cursor.isoformat()} end={window_end.isoformat()}: {exc}")
                    if not args.continue_on_error or failed_windows >= args.max_failures:
                        return 1
                    cursor = window_end
                    continue

                windows += 1
                total_fetched += summary.fetched
                total_inserted += summary.inserted
                total_updated += summary.updated
                cursor = window_end

                if args.progress_seconds > 0:
                    now_mono = time.monotonic()
                    if now_mono - last_progress_log_at >= args.progress_seconds:
                        _print_progress()
                        last_progress_log_at = now_mono
    except KeyboardInterrupt:
        _print_progress(prefix="interrupted")
        print("ingest interrupted by user (KeyboardInterrupt)")
        return 130

    print(
        "ingest complete "
        f"symbol=BTCUSDT interval=1m "
        f"start={start.isoformat()} end={end.isoformat()} windows={windows} "
        f"fetched={total_fetched} inserted={total_inserted} updated={total_updated} failed_windows={failed_windows}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
