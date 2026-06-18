from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.services.market_data_service import MarketDataRefreshError, RefreshSummary


def test_refresh_script_with_lookback_invokes_service(monkeypatch, capsys) -> None:
    from app.scripts import refresh_btcusdt_klines as script

    class FakeService:
        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            assert start < end
            return RefreshSummary(
                symbol="BTCUSDT",
                interval="1m",
                start=start,
                end=end,
                fetched=12,
                inserted=10,
                updated=2,
            )

    monkeypatch.setattr(script, "MarketDataService", FakeService)

    code = script.main(["--lookback-hours", "1"])
    out = capsys.readouterr().out

    assert code == 0
    assert "refresh complete" in out
    assert "inserted=10" in out


def test_refresh_script_returns_failure_on_service_error(monkeypatch, capsys) -> None:
    from app.scripts import refresh_btcusdt_klines as script

    class FailingService:
        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            raise MarketDataRefreshError("RuntimeError: boom")

    monkeypatch.setattr(script, "MarketDataService", FailingService)

    code = script.main(["--start", "2026-01-01T00:00:00Z",
                       "--end", "2026-01-01T01:00:00Z"])
    out = capsys.readouterr().out

    assert code == 1
    assert "refresh failed" in out
    assert "RuntimeError: boom" in out


def test_ingest_script_chunks_windows_and_aggregates(monkeypatch, capsys) -> None:
    from app.scripts import ingest_btcusdt_klines as script

    calls: list[tuple[datetime, datetime]] = []

    class FakeService:
        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            calls.append((start, end))
            return RefreshSummary(
                symbol="BTCUSDT",
                interval="1m",
                start=start,
                end=end,
                fetched=5,
                inserted=3,
                updated=2,
            )

    monkeypatch.setattr(script, "MarketDataService", FakeService)

    code = script.main([
        "--from", "2026-01-01T00:00:00Z",
        "--to", "2026-01-01T03:00:00Z",
        "--chunk-hours", "1",
    ])
    out = capsys.readouterr().out

    assert code == 0
    assert len(calls) == 3
    assert calls[0][0] == datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    assert "windows=3" in out
    assert "fetched=15" in out
    assert "inserted=9" in out
    assert "updated=6" in out


def test_ingest_script_returns_failure_on_window_error(monkeypatch, capsys) -> None:
    from app.scripts import ingest_btcusdt_klines as script

    class FailingService:
        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            raise MarketDataRefreshError("binance unavailable")

    monkeypatch.setattr(script, "MarketDataService", FailingService)

    code = script.main([
        "--from", "2026-01-01T00:00:00Z",
        "--to", "2026-01-01T01:00:00Z",
    ])
    out = capsys.readouterr().out

    assert code == 1
    assert "ingest failed" in out


def test_ingest_script_can_continue_on_error_within_failure_budget(monkeypatch, capsys) -> None:
    from app.scripts import ingest_btcusdt_klines as script

    calls = {"count": 0}

    class FlakyService:
        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            calls["count"] += 1
            if calls["count"] == 1:
                raise MarketDataRefreshError("first window failed")
            return RefreshSummary(
                symbol="BTCUSDT",
                interval="1m",
                start=start,
                end=end,
                fetched=4,
                inserted=2,
                updated=2,
            )

    monkeypatch.setattr(script, "MarketDataService", FlakyService)

    code = script.main([
        "--from", "2026-01-01T00:00:00Z",
        "--to", "2026-01-01T02:00:00Z",
        "--chunk-hours", "1",
        "--continue-on-error",
        "--max-failures", "2",
    ])
    out = capsys.readouterr().out

    assert code == 0
    assert "failed_windows=1" in out


def test_ingest_script_logs_periodic_progress(monkeypatch, capsys) -> None:
    from app.scripts import ingest_btcusdt_klines as script

    class FakeService:
        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            return RefreshSummary(
                symbol="BTCUSDT",
                interval="1m",
                start=start,
                end=end,
                fetched=1,
                inserted=1,
                updated=0,
            )

    ticks = iter([0.0, 2.0, 4.0, 6.0])

    monkeypatch.setattr(script, "MarketDataService", FakeService)
    monkeypatch.setattr(script.time, "monotonic", lambda: next(ticks))

    code = script.main([
        "--from", "2026-01-01T00:00:00Z",
        "--to", "2026-01-01T02:00:00Z",
        "--chunk-hours", "1",
        "--progress-seconds", "1",
    ])
    out = capsys.readouterr().out

    assert code == 0
    assert "progress cursor=" in out


def test_ingest_script_handles_keyboard_interrupt(monkeypatch, capsys) -> None:
    from app.scripts import ingest_btcusdt_klines as script

    class InterruptingService:
        def __init__(self) -> None:
            self.calls = 0

        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            self.calls += 1
            if self.calls == 1:
                return RefreshSummary(
                    symbol="BTCUSDT",
                    interval="1m",
                    start=start,
                    end=end,
                    fetched=2,
                    inserted=2,
                    updated=0,
                )
            raise KeyboardInterrupt()

    monkeypatch.setattr(script, "MarketDataService", InterruptingService)

    code = script.main([
        "--from", "2026-01-01T00:00:00Z",
        "--to", "2026-01-01T03:00:00Z",
        "--chunk-hours", "1",
    ])
    out = capsys.readouterr().out

    assert code == 130
    assert "interrupted cursor=" in out
    assert "ingest interrupted by user" in out


def test_ingest_script_resume_from_cache_skips_to_latest(monkeypatch, capsys) -> None:
    from app.scripts import ingest_btcusdt_klines as script

    calls: list[tuple[datetime, datetime]] = []

    class FakeService:
        def get_latest_cached_btcusdt_1m_timestamp(self) -> datetime | None:
            return datetime(2026, 1, 1, 1, 0, tzinfo=UTC)

        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            calls.append((start, end))
            return RefreshSummary(
                symbol="BTCUSDT",
                interval="1m",
                start=start,
                end=end,
                fetched=1,
                inserted=1,
                updated=0,
            )

    monkeypatch.setattr(script, "MarketDataService", FakeService)

    code = script.main([
        "--from", "2026-01-01T00:00:00Z",
        "--to", "2026-01-01T03:00:00Z",
        "--chunk-hours", "1",
        "--resume-from-cache",
    ])
    out = capsys.readouterr().out

    assert code == 0
    assert "resume-from-cache applied" in out
    assert calls[0][0] == datetime(2026, 1, 1, 1, 1, tzinfo=UTC)


def test_ingest_script_resume_from_cache_can_skip_entire_range(monkeypatch, capsys) -> None:
    from app.scripts import ingest_btcusdt_klines as script

    class FakeService:
        def get_latest_cached_btcusdt_1m_timestamp(self) -> datetime | None:
            return datetime(2026, 1, 1, 3, 0, tzinfo=UTC)

        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            raise AssertionError(
                "refresh should not be called when range is fully cached")

    monkeypatch.setattr(script, "MarketDataService", FakeService)

    code = script.main([
        "--from", "2026-01-01T00:00:00Z",
        "--to", "2026-01-01T03:00:00Z",
        "--resume-from-cache",
    ])
    out = capsys.readouterr().out

    assert code == 0
    assert "ingest skipped" in out


def test_ingest_script_reconcile_cache_fills_head_internal_and_tail(monkeypatch, capsys) -> None:
    from app.scripts import ingest_btcusdt_klines as script

    calls: list[tuple[datetime, datetime]] = []

    class FakeService:
        def list_cached_btcusdt_1m_timestamps(self, start: datetime, end: datetime) -> list[datetime]:
            return [
                datetime(2026, 1, 1, 1, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 2, 0, tzinfo=UTC),
            ]

        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            calls.append((start, end))
            return RefreshSummary("BTCUSDT", "1m", start, end, 1, 1, 0)

    monkeypatch.setattr(script, "MarketDataService", FakeService)
    code = script.main([
        "--from", "2026-01-01T00:00:00Z",
        "--to", "2026-01-01T03:00:00Z",
        "--chunk-hours", "2",
        "--reconcile-cache",
    ])
    out = capsys.readouterr().out

    assert code == 0
    assert "reconcile-cache" in out
    assert calls == [
        (datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
         datetime(2026, 1, 1, 1, 0, tzinfo=UTC)),
        (datetime(2026, 1, 1, 1, 1, tzinfo=UTC),
         datetime(2026, 1, 1, 2, 0, tzinfo=UTC)),
        (datetime(2026, 1, 1, 2, 1, tzinfo=UTC),
         datetime(2026, 1, 1, 3, 0, tzinfo=UTC)),
    ]


def test_ingest_script_reconcile_cache_fills_internal_gap(monkeypatch, capsys) -> None:
    from app.scripts import ingest_btcusdt_klines as script

    calls: list[tuple[datetime, datetime]] = []

    class FakeService:
        def list_cached_btcusdt_1m_timestamps(self, start: datetime, end: datetime) -> list[datetime]:
            return [
                datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
                datetime(2026, 1, 1, 0, 1, tzinfo=UTC),
                datetime(2026, 1, 1, 0, 4, tzinfo=UTC),
                datetime(2026, 1, 1, 0, 5, tzinfo=UTC),
            ]

        def refresh_btcusdt_1m(self, start: datetime, end: datetime) -> RefreshSummary:
            calls.append((start, end))
            return RefreshSummary("BTCUSDT", "1m", start, end, 1, 1, 0)

    monkeypatch.setattr(script, "MarketDataService", FakeService)
    code = script.main([
        "--from", "2026-01-01T00:00:00Z",
        "--to", "2026-01-01T00:05:00Z",
        "--reconcile-cache",
    ])
    out = capsys.readouterr().out

    assert code == 0
    assert "missing_ranges=1" in out
    assert calls == [
        (datetime(2026, 1, 1, 0, 2, tzinfo=UTC),
         datetime(2026, 1, 1, 0, 4, tzinfo=UTC)),
    ]


def test_range_helper_rejects_invalid_combinations() -> None:
    from app.scripts._market_data_cli import resolve_range

    with pytest.raises(ValueError, match="cannot be combined"):
        resolve_range(start="2026-01-01T00:00:00Z", end=None, lookback_hours=1)


def test_cleanup_database_preserves_user_and_btcusdt_kline(monkeypatch, capsys) -> None:
    from sqlalchemy import table

    from app.scripts import cleanup_database as script

    executed_statements: list[str] = []
    committed = {"value": False}

    class FakeSession:
        def __enter__(self) -> "FakeSession":
            return self

        def __exit__(self, exc_type, exc, tb) -> None:
            return None

        def execute(self, statement) -> None:
            executed_statements.append(str(statement))

        def commit(self) -> None:
            committed["value"] = True

    class FakeMetadata:
        sorted_tables = [
            table("User"),
            table("Experiment"),
            table("Model"),
            table("BTCUSDTKline"),
        ]

    class FakeBase:
        metadata = FakeMetadata()

    monkeypatch.setattr(script, "Base", FakeBase)
    monkeypatch.setattr(script, "SessionLocal", lambda: FakeSession())
    monkeypatch.setattr(script, "get_engine", lambda: object())

    code = script.main()
    out = capsys.readouterr().out

    assert code == 0
    assert committed["value"] is True
    assert executed_statements == ['TRUNCATE TABLE "Model", "Experiment" RESTART IDENTITY CASCADE']
    assert "truncating 2 tables" in out
    assert "cleanup complete" in out
