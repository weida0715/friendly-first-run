from __future__ import annotations

from sqlalchemy import text

from app.infrastructure.database.base import Base
from app.infrastructure.database.session import SessionLocal, get_engine

PRESERVED_TABLES = {"User", "BTCUSDTKline"}


def main() -> int:
    """Remove all rows from every mapped table except preserved datasets."""
    get_engine()
    target_tables = [
        table for table in reversed(Base.metadata.sorted_tables)
        if table.name not in PRESERVED_TABLES
    ]

    if not target_tables:
        print("cleanup complete preserved=User,BTCUSDTKline")
        return 0

    with SessionLocal() as session:
        table_list = ", ".join(f'"{table.name}"' for table in target_tables)
        print(f"truncating {len(target_tables)} tables", flush=True)
        session.execute(text(f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE"))
        session.commit()

    print("cleanup complete preserved=User,BTCUSDTKline")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
