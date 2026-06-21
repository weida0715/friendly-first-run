"""SQLAlchemy-backed repository for BTCUSDTKline market data."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import delete, func, select, text
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from app.domain.models.btcusdt_kline import BTCUSDTKline
from app.infrastructure.database.orm.btcusdt_kline_orm import BTCUSDTKlineORM


@dataclass(frozen=True, slots=True)
class UpsertSummary:
    inserted: int
    updated: int


class MarketDataRepository:
    """BTCUSDTKline persistence operations using RFC-002 ORM mappings."""

    SUPPORTED_INTERVALS = {
        "1m": "1 minute",
        "5m": "5 minutes",
        "15m": "15 minutes",
        "30m": "30 minutes",
        "1h": "1 hour",
        "2h": "2 hours",
        "4h": "4 hours",
        "1d": "1 day",
    }

    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _normalize_utc_naive(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value
        return value.astimezone(UTC).replace(tzinfo=None)

    @staticmethod
    def _to_domain(row: BTCUSDTKlineORM) -> BTCUSDTKline:
        return BTCUSDTKline(
            timestamp=row.Timestamp,
            open=row.Open,
            high=row.High,
            low=row.Low,
            close=row.Close,
            volume=row.Volume,
            created_at=row.CreatedAt,
            updated_at=row.UpdatedAt,
        )

    def add(self, kline: BTCUSDTKline) -> BTCUSDTKline:
        self.upsert_one(kline)
        return kline

    def upsert_one(self, kline: BTCUSDTKline) -> UpsertSummary:
        return self.upsert_klines([kline])

    def upsert_klines(self, klines: list[BTCUSDTKline]) -> UpsertSummary:
        if not klines:
            return UpsertSummary(inserted=0, updated=0)

        latest_by_timestamp: dict[datetime, BTCUSDTKline] = {
            kline.Timestamp: kline for kline in klines
        }
        timestamps = [
            self._normalize_utc_naive(ts) for ts in latest_by_timestamp.keys()]

        existing_timestamps = set(
            self._session.scalars(
                select(BTCUSDTKlineORM.Timestamp).where(
                    BTCUSDTKlineORM.Timestamp.in_(timestamps))
            ).all()
        )
        # Note: pre-read of existing timestamps intentionally favors precise
        # inserted/updated summary accounting over minimum DB round-trips.

        inserted = 0
        updated = 0
        for ts in timestamps:
            if ts in existing_timestamps:
                updated += 1
            else:
                inserted += 1

        dialect = self._session.bind.dialect.name if self._session.bind else ""
        all_values = [
            {
                "Timestamp": self._normalize_utc_naive(kline.Timestamp),
                "Open": kline.Open,
                "High": kline.High,
                "Low": kline.Low,
                "Close": kline.Close,
                "Volume": kline.Volume,
                "CreatedAt": self._normalize_utc_naive(kline.CreatedAt),
                "UpdatedAt": self._normalize_utc_naive(kline.UpdatedAt or kline.CreatedAt),
            }
            for kline in latest_by_timestamp.values()
        ]

        if dialect == "postgresql":
            stmt = postgresql_insert(BTCUSDTKlineORM).values(all_values)
            stmt = stmt.on_conflict_do_update(
                index_elements=[BTCUSDTKlineORM.timestamp],
                set_={
                    "Open": stmt.excluded.Open,
                    "High": stmt.excluded.High,
                    "Low": stmt.excluded.Low,
                    "Close": stmt.excluded.Close,
                    "Volume": stmt.excluded.Volume,
                    "UpdatedAt": stmt.excluded.UpdatedAt,
                },
            )
        else:
            stmt = sqlite_insert(BTCUSDTKlineORM).values(all_values)
            stmt = stmt.on_conflict_do_update(
                index_elements=[BTCUSDTKlineORM.timestamp],
                set_={
                    "Open": stmt.excluded.Open,
                    "High": stmt.excluded.High,
                    "Low": stmt.excluded.Low,
                    "Close": stmt.excluded.Close,
                    "Volume": stmt.excluded.Volume,
                    "UpdatedAt": stmt.excluded.UpdatedAt,
                },
            )

        self._session.execute(stmt)

        self._session.flush()
        return UpsertSummary(inserted=inserted, updated=updated)

    def get_by_timestamp(self, timestamp: datetime) -> BTCUSDTKline | None:
        row = self._session.get(BTCUSDTKlineORM, timestamp)
        return self._to_domain(row) if row else None

    def get_latest_timestamp(self) -> datetime | None:
        return self._session.scalar(select(func.max(BTCUSDTKlineORM.Timestamp)))

    def get_earliest_timestamp(self) -> datetime | None:
        return self._session.scalar(select(func.min(BTCUSDTKlineORM.Timestamp)))

    def list_timestamps_range(self, start: datetime, end: datetime) -> list[datetime]:
        return list(
            self._session.scalars(
                select(BTCUSDTKlineORM.Timestamp)
                .where(
                    BTCUSDTKlineORM.Timestamp >= start,
                    BTCUSDTKlineORM.Timestamp <= end,
                )
                .order_by(BTCUSDTKlineORM.Timestamp)
            ).all()
        )

    def count_range(self, start: datetime, end: datetime, interval: str = "1m") -> int:
        if interval != "1m":
            raise ValueError("Only BTCUSDT 1m interval is supported")

        return int(
            self._session.scalar(
                select(func.count())
                .select_from(BTCUSDTKlineORM)
                .where(
                    BTCUSDTKlineORM.Timestamp >= start,
                    BTCUSDTKlineORM.Timestamp <= end,
                )
            )
            or 0
        )

    def list_range(self, start: datetime, end: datetime, interval: str = "1m") -> list[BTCUSDTKline]:
        if interval != "1m":
            raise ValueError("Only BTCUSDT 1m interval is supported")

        rows = self._session.scalars(
            select(BTCUSDTKlineORM)
            .where(BTCUSDTKlineORM.Timestamp >= start, BTCUSDTKlineORM.Timestamp <= end)
            .order_by(BTCUSDTKlineORM.Timestamp)
        ).all()
        return [self._to_domain(row) for row in rows]

    def list_range_projection(
        self,
        start: datetime,
        end: datetime,
        interval: str = "1m",
        limit: int | None = None,
    ) -> list[tuple[datetime, object, object, object, object, object]]:
        if interval not in self.SUPPORTED_INTERVALS:
            raise ValueError(f"Unsupported BTCUSDT interval: {interval}")

        dialect = self._session.bind.dialect.name if self._session.bind else ""
        if interval != "1m" and dialect == "postgresql":
            sql = text("""
                WITH bucketed AS (
                    SELECT
                        date_bin(CAST(:interval AS interval), "Timestamp", TIMESTAMP '1970-01-01') AS bucket,
                        "Timestamp",
                        "Open",
                        "High",
                        "Low",
                        "Close",
                        "Volume"
                    FROM "BTCUSDTKline"
                    WHERE "Timestamp" >= :start_time
                      AND "Timestamp" <  :end_time
                ),
                ranked AS (
                    SELECT
                        *,
                        row_number() OVER (PARTITION BY bucket ORDER BY "Timestamp" ASC) AS rn_open,
                        row_number() OVER (PARTITION BY bucket ORDER BY "Timestamp" DESC) AS rn_close
                    FROM bucketed
                )
                SELECT
                    bucket AS "Timestamp",
                    max("Open") FILTER (WHERE rn_open = 1) AS "Open",
                    max("High") AS "High",
                    min("Low") AS "Low",
                    max("Close") FILTER (WHERE rn_close = 1) AS "Close",
                    sum("Volume") AS "Volume"
                FROM ranked
                GROUP BY bucket
                ORDER BY bucket
            """)
            rows = self._session.execute(sql, {
                "interval": self.SUPPORTED_INTERVALS[interval],
                "start_time": start,
                "end_time": end,
            }).all()
            return list(rows[:limit] if limit is not None else rows)

        if interval != "1m":
            # SQLite/test fallback: callers can still aggregate this 1m projection in Polars.
            interval = "1m"

        stmt = (
            select(
                BTCUSDTKlineORM.Timestamp,
                BTCUSDTKlineORM.Open,
                BTCUSDTKlineORM.High,
                BTCUSDTKlineORM.Low,
                BTCUSDTKlineORM.Close,
                BTCUSDTKlineORM.Volume,
            )
            .where(BTCUSDTKlineORM.Timestamp >= start, BTCUSDTKlineORM.Timestamp <= end)
            .order_by(BTCUSDTKlineORM.Timestamp)
        )
        if limit is not None:
            stmt = stmt.limit(limit)

        rows = self._session.execute(stmt).all()
        return list(rows)

    def list_latest_chunk(self, *, limit: int, before: datetime | None = None, interval: str = "1m") -> list[BTCUSDTKline]:
        if interval != "1m":
            raise ValueError("Only BTCUSDT 1m interval is supported")

        stmt = select(BTCUSDTKlineORM)
        if before is not None:
            stmt = stmt.where(BTCUSDTKlineORM.Timestamp < before)
        rows = self._session.scalars(
            stmt.order_by(BTCUSDTKlineORM.Timestamp.desc()).limit(limit)
        ).all()
        rows = list(reversed(rows))
        return [self._to_domain(row) for row in rows]

    def clear_all(self) -> int:
        result = self._session.execute(delete(BTCUSDTKlineORM))
        self._session.flush()
        return int(result.rowcount or 0)
