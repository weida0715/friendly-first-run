from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy import func, select
from sqlalchemy.orm import sessionmaker

from app.domain.models.btcusdt_kline import BTCUSDTKline
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import btcusdt_kline_orm  # noqa: F401
from app.infrastructure.database.orm.btcusdt_kline_orm import BTCUSDTKlineORM
from app.repositories.market_data_repository import MarketDataRepository, UpsertSummary


def _session():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def test_btcusdt_kline_timestamp_upsert_and_range_retrieval() -> None:
    session = _session()
    repo = MarketDataRepository(session)

    ts = datetime(2026, 1, 1, 0, 0, 0)
    row1 = repo.add(
        BTCUSDTKline(
            timestamp=ts,
            open=Decimal("100.0"),
            high=Decimal("110.0"),
            low=Decimal("90.0"),
            close=Decimal("105.0"),
            volume=Decimal("10.0"),
            created_at=ts,
            updated_at=ts,
        )
    )

    row2 = repo.add(
        BTCUSDTKline(
            timestamp=ts,
            open=Decimal("200.0"),
            high=Decimal("220.0"),
            low=Decimal("180.0"),
            close=Decimal("210.0"),
            volume=Decimal("20.0"),
            created_at=ts,
            updated_at=ts + timedelta(minutes=1),
        )
    )

    later_ts = ts + timedelta(hours=1)
    repo.add(
        BTCUSDTKline(
            timestamp=later_ts,
            open=Decimal("300.0"),
            high=Decimal("330.0"),
            low=Decimal("270.0"),
            close=Decimal("315.0"),
            volume=Decimal("30.0"),
            created_at=later_ts,
            updated_at=later_ts,
        )
    )
    session.commit()

    assert row1.Timestamp == row2.Timestamp == ts
    fetched = repo.get_by_timestamp(ts)
    assert fetched.Close == Decimal("210.0")
    assert fetched.Volume == Decimal("20.0")
    assert fetched.CreatedAt == ts
    assert fetched.UpdatedAt == ts + timedelta(minutes=1)

    ranged = repo.list_range(ts, later_ts)
    assert len(ranged) == 2
    assert [k.Timestamp for k in ranged] == [ts, later_ts]


def test_upsert_klines_returns_inserted_updated_summary_and_preserves_created_at() -> None:
    session = _session()
    repo = MarketDataRepository(session)

    ts = datetime(2026, 1, 1, 0, 0, 0)
    created = datetime(2026, 1, 1, 0, 0, 5)
    updated1 = datetime(2026, 1, 1, 0, 0, 5)
    updated2 = datetime(2026, 1, 1, 0, 1, 5)

    s1 = repo.upsert_klines([
        BTCUSDTKline(
            timestamp=ts,
            open=Decimal("1"),
            high=Decimal("2"),
            low=Decimal("0.5"),
            close=Decimal("1.5"),
            volume=Decimal("9"),
            created_at=created,
            updated_at=updated1,
        )
    ])
    assert s1 == UpsertSummary(inserted=1, updated=0)

    s2 = repo.upsert_klines([
        BTCUSDTKline(
            timestamp=ts,
            open=Decimal("10"),
            high=Decimal("20"),
            low=Decimal("5"),
            close=Decimal("15"),
            volume=Decimal("90"),
            created_at=datetime(2030, 1, 1, 0, 0, 0),
            updated_at=updated2,
        )
    ])
    assert s2 == UpsertSummary(inserted=0, updated=1)

    session.commit()
    fetched = repo.get_by_timestamp(ts)
    assert fetched is not None
    assert fetched.Close == Decimal("15")
    assert fetched.CreatedAt == created
    assert fetched.UpdatedAt == updated2

    row_count = session.scalar(
        select(func.count()).select_from(BTCUSDTKlineORM))
    assert row_count == 1


def test_upsert_klines_empty_and_interval_validation() -> None:
    session = _session()
    repo = MarketDataRepository(session)

    assert repo.upsert_klines([]) == UpsertSummary(inserted=0, updated=0)

    now = datetime(2026, 1, 1, 0, 0, 0)
    with pytest.raises(ValueError, match="Only BTCUSDT 1m interval is supported"):
        repo.list_range(now, now + timedelta(minutes=1), interval="5m")


def test_postgres_projection_uses_epoch_bucket_and_naive_utc_bounds() -> None:
    class _Dialect:
        name = "postgresql"

    class _Bind:
        dialect = _Dialect()

    class _Result:
        def all(self):
            return []

    class _Session:
        bind = _Bind()

        def __init__(self) -> None:
            self.sql = ""
            self.params = {}

        def execute(self, sql, params):  # noqa: ANN001
            self.sql = str(sql)
            self.params = params
            return _Result()

    session = _Session()
    repo = MarketDataRepository(session)

    repo.list_range_projection(
        datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
        datetime(2026, 1, 2, 0, 0, tzinfo=UTC),
        interval="1h",
    )

    assert "date_bin" not in session.sql
    assert "to_timestamp" in session.sql
    assert session.params["interval_seconds"] == 3600
    assert session.params["start_time"].tzinfo is None
    assert session.params["end_time"].tzinfo is None
