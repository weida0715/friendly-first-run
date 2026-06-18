from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from app import create_app
from app.domain.models.btcusdt_kline import BTCUSDTKline
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import (  # noqa: F401
    blueprint_orm,
    btcusdt_kline_orm,
    experiment_log_orm,
    experiment_orm,
    favorite_blueprint_orm,
    favorite_model_orm,
    model_orm,
    user_orm,
)
from app.infrastructure.database.session import configure_engine, get_engine
from app.repositories.unit_of_work import UnitOfWork


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def _seed_candles() -> None:
    t0 = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
    t1 = datetime(2026, 1, 1, 0, 1, tzinfo=UTC)
    with UnitOfWork() as uow:
        uow.market_data.upsert_klines(
            [
                BTCUSDTKline(
                    timestamp=t0,
                    open=Decimal("50000.1"),
                    high=Decimal("50010.2"),
                    low=Decimal("49990.3"),
                    close=Decimal("50005.4"),
                    volume=Decimal("12.34"),
                    created_at=t0,
                    updated_at=t0,
                ),
                BTCUSDTKline(
                    timestamp=t1,
                    open=Decimal("50005.4"),
                    high=Decimal("50020.0"),
                    low=Decimal("50000.0"),
                    close=Decimal("50015.9"),
                    volume=Decimal("8.90"),
                    created_at=t1,
                    updated_at=t1,
                ),
            ]
        )


def test_market_data_kline_endpoint_returns_cached_items() -> None:
    client = _client()
    _seed_candles()

    response = client.get(
        "/api/market-data/btcusdt/klines"
        "?start=2026-01-01T00:00:00Z&end=2026-01-01T00:02:00Z&interval=1m"
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["ok"] is True
    assert body["data"]["symbol"] == "BTCUSDT"
    assert body["data"]["interval"] == "1m"
    assert len(body["data"]["items"]) == 2
    assert body["data"]["items"][0]["timestamp"] == "2026-01-01T00:00:00Z"
    assert body["data"]["items"][0]["open"] == "50000.10000000"


def test_market_data_kline_endpoint_returns_empty_items_for_empty_cache() -> None:
    client = _client()
    response = client.get(
        "/api/market-data/btcusdt/klines"
        "?start=2026-01-01T00:00:00Z&end=2026-01-01T00:02:00Z&interval=1m"
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["ok"] is True
    assert body["data"]["items"] == []


def test_market_data_kline_endpoint_without_range_returns_all_cached_items() -> None:
    client = _client()
    _seed_candles()

    response = client.get(
        "/api/market-data/btcusdt/klines?interval=1m&limit=1")
    assert response.status_code == 200
    body = response.get_json()
    assert body["ok"] is True
    assert len(body["data"]["items"]) == 1
    assert body["data"]["has_more"] is True
    assert body["data"]["next_before"] is not None


def test_market_data_kline_endpoint_validates_params() -> None:
    client = _client()

    missing = client.get("/api/market-data/btcusdt/klines")
    assert missing.status_code == 200
    assert missing.get_json()["ok"] is True

    bad_interval = client.get(
        "/api/market-data/btcusdt/klines"
        "?start=2026-01-01T00:00:00Z&end=2026-01-01T00:02:00Z&interval=5m"
    )
    assert bad_interval.status_code == 400

    bad_range = client.get(
        "/api/market-data/btcusdt/klines"
        "?start=2026-01-02T00:00:00Z&end=2026-01-01T00:00:00Z&interval=1m"
    )
    assert bad_range.status_code == 400

    half_range = client.get(
        "/api/market-data/btcusdt/klines"
        "?start=2026-01-01T00:00:00Z&interval=1m"
    )
    assert half_range.status_code == 400
