from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app import create_app
from app.controllers import market_data_controller
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
from app.infrastructure.database.orm.user_orm import UserORM


def _register_and_login_admin(client, username: str, email: str) -> str:
    client.post(
        "/api/auth/register",
        json={"name": "Admin", "username": username, "email": email, "password": "securepass"},
    )
    with UnitOfWork() as uow:
        admin = uow.users.get_by_email(email)
        uow.session.get(UserORM, admin.UserID).Role = "Admin"
        uow.session.flush()
    login = client.post("/api/auth/login", json={"email": email, "password": "securepass"})
    raw_cookie = login.headers.get("Set-Cookie")
    return raw_cookie.split(";", 1)[0] if raw_cookie else ""


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


def test_market_data_target_preview_returns_aligned_labels_and_confusion_stats() -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        uow.market_data.upsert_klines(
            [
                BTCUSDTKline(timestamp=base, open=Decimal("100"), high=Decimal("111"), low=Decimal("99"), close=Decimal("110"), volume=Decimal("1"), created_at=base),
                BTCUSDTKline(timestamp=base.replace(minute=1), open=Decimal("120"), high=Decimal("121"), low=Decimal("99"), close=Decimal("111"), volume=Decimal("1"), created_at=base.replace(minute=1)),
                BTCUSDTKline(timestamp=base.replace(minute=2), open=Decimal("100"), high=Decimal("106"), low=Decimal("99"), close=Decimal("105"), volume=Decimal("1"), created_at=base.replace(minute=2)),
                BTCUSDTKline(timestamp=base.replace(minute=3), open=Decimal("105"), high=Decimal("121"), low=Decimal("104"), close=Decimal("120"), volume=Decimal("1"), created_at=base.replace(minute=3)),
            ]
        )

    response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "forward_return",
            "target_params": {"lookahead_period": 1, "return_threshold": 0},
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:03:00Z",
        },
    )

    assert response.status_code == 200
    body = response.get_json()
    summary = body["data"]["summary"]
    economics = body["data"]["economics"]["horizons"]
    rows = body["data"]["rows"]
    assert body["data"]["mode"]["previewMode"] == "true_label"
    assert body["data"]["mode"]["entryAssumption"] == "next_open"
    assert body["data"]["bridge"] is None
    assert body["data"]["strategy"]["binaryLabelRule"].startswith("1 when close[t+lookahead]")
    assert summary["rowCount"] == 4
    assert summary["labeledCount"] == 3
    assert summary["tailNullCount"] == 1
    assert summary["positiveCount"] == 2
    assert summary["negativeCount"] == 1
    assert summary["confusion"]["tp_count"] == 2
    assert summary["confusion"]["tn_count"] == 1
    assert summary["confusion"]["precision_pct"] == 100.0
    assert economics[0]["horizon"] == 1
    assert economics[0]["signalCount"] == 2
    assert rows[0]["target"] == 1
    assert rows[1]["target"] == 0
    assert rows[2]["target"] == 1
    assert rows[3]["target"] is None


@pytest.mark.parametrize(
    ("target_strategy", "target_params"),
    [
        ("candle_direction", {"lookahead_period": "1"}),
        ("cost_adjusted_forward_return", {"lookahead_period": "1", "cost_bps": "15"}),
        ("volatility_adjusted_forward_return", {"lookahead_period": "1", "volatility_period": "3", "volatility_multiplier": "0.75"}),
    ],
)
def test_market_data_target_preview_accepts_string_target_params(
    target_strategy: str,
    target_params: dict[str, str],
) -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        candles = []
        for minute in range(6):
            timestamp = base.replace(minute=minute)
            price = Decimal("100") + Decimal(minute)
            candles.append(
                BTCUSDTKline(
                    timestamp=timestamp,
                    open=price,
                    high=price + Decimal("1"),
                    low=price - Decimal("1"),
                    close=price + Decimal("0.5"),
                    volume=Decimal("1"),
                    created_at=timestamp,
                )
            )
        uow.market_data.upsert_klines(candles)

    response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": target_strategy,
            "target_params": target_params,
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:05:00Z",
        },
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["data"]["strategy"]["name"] == target_strategy
    assert body["data"]["summary"]["rowCount"] == 6


def test_market_data_target_preview_caps_large_ranges(monkeypatch: pytest.MonkeyPatch) -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        candles = []
        for minute in range(8):
            timestamp = base.replace(minute=minute)
            price = Decimal("100") + Decimal(minute)
            candles.append(
                BTCUSDTKline(
                    timestamp=timestamp,
                    open=price,
                    high=price + Decimal("1"),
                    low=price - Decimal("1"),
                    close=price + Decimal("0.5"),
                    volume=Decimal("1"),
                    created_at=timestamp,
                )
            )
        uow.market_data.upsert_klines(candles)

    monkeypatch.setattr(market_data_controller, "MAX_TARGET_PREVIEW_RAW_ROWS", 5)
    response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "forward_return",
            "target_params": {"lookahead_period": 1, "return_threshold": 0},
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:07:00Z",
        },
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["data"]["range"]["previewTruncated"] is True
    assert body["data"]["range"]["previewRowLimit"] == 5
    assert body["data"]["range"]["candles"] == 5
    assert body["data"]["rows"][0]["timestamp"] == "2026-01-01T00:03:00Z"
    assert body["data"]["rows"][-1]["timestamp"] == "2026-01-01T00:07:00Z"


def test_market_data_target_preview_supports_entry_alignment_and_costs() -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        uow.market_data.upsert_klines(
            [
                BTCUSDTKline(timestamp=base, open=Decimal("100"), high=Decimal("101"), low=Decimal("89"), close=Decimal("90"), volume=Decimal("1"), created_at=base),
                BTCUSDTKline(timestamp=base.replace(minute=1), open=Decimal("100"), high=Decimal("111"), low=Decimal("99"), close=Decimal("110"), volume=Decimal("1"), created_at=base.replace(minute=1)),
                BTCUSDTKline(timestamp=base.replace(minute=2), open=Decimal("120"), high=Decimal("131"), low=Decimal("119"), close=Decimal("130"), volume=Decimal("1"), created_at=base.replace(minute=2)),
            ]
        )

    next_open = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "forward_return",
            "target_params": {"lookahead_period": 1, "return_threshold": 0},
            "entry_assumption": "next_open",
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:02:00Z",
        },
    )
    current_close = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "forward_return",
            "target_params": {"lookahead_period": 1, "return_threshold": 0},
            "entry_assumption": "current_close",
            "evaluation_cost_bps": 100,
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:02:00Z",
        },
    )

    assert next_open.status_code == 200
    assert current_close.status_code == 200
    next_body = next_open.get_json()
    current_body = current_close.get_json()
    assert next_body["data"]["mode"]["entryAssumption"] == "next_open"
    assert current_body["data"]["mode"]["entryAssumption"] == "current_close"
    assert next_body["data"]["economics"]["horizons"][0]["allMeanPct"] != current_body["data"]["economics"]["horizons"][0]["allMeanPct"]
    assert current_body["data"]["mode"]["evaluationCostBps"] == 100.0


def test_market_data_target_preview_keeps_profit_factor_json_safe() -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        uow.market_data.upsert_klines(
            [
                BTCUSDTKline(timestamp=base, open=Decimal("100"), high=Decimal("101"), low=Decimal("99"), close=Decimal("101"), volume=Decimal("1"), created_at=base),
                BTCUSDTKline(timestamp=base.replace(minute=1), open=Decimal("101"), high=Decimal("103"), low=Decimal("100"), close=Decimal("102"), volume=Decimal("1"), created_at=base.replace(minute=1)),
                BTCUSDTKline(timestamp=base.replace(minute=2), open=Decimal("102"), high=Decimal("104"), low=Decimal("101"), close=Decimal("103"), volume=Decimal("1"), created_at=base.replace(minute=2)),
            ]
        )

    response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "forward_return",
            "target_params": {"lookahead_period": 1, "return_threshold": 0},
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:02:00Z",
        },
    )

    assert response.status_code == 200
    raw_body = response.get_data(as_text=True)
    assert "Infinity" not in raw_body
    body = response.get_json()
    horizons = body["data"]["economics"]["horizons"]
    assert horizons[0]["allProfitFactor"] is None
    assert horizons[0]["signalProfitFactor"] is None


def test_market_data_target_preview_supports_mock_prediction_bridge() -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        uow.market_data.upsert_klines(
            [
                BTCUSDTKline(timestamp=base, open=Decimal("100"), high=Decimal("101"), low=Decimal("99"), close=Decimal("100"), volume=Decimal("1"), created_at=base),
                BTCUSDTKline(timestamp=base.replace(minute=1), open=Decimal("100"), high=Decimal("111"), low=Decimal("99"), close=Decimal("110"), volume=Decimal("1"), created_at=base.replace(minute=1)),
                BTCUSDTKline(timestamp=base.replace(minute=2), open=Decimal("110"), high=Decimal("121"), low=Decimal("109"), close=Decimal("120"), volume=Decimal("1"), created_at=base.replace(minute=2)),
                BTCUSDTKline(timestamp=base.replace(minute=3), open=Decimal("120"), high=Decimal("131"), low=Decimal("119"), close=Decimal("130"), volume=Decimal("1"), created_at=base.replace(minute=3)),
            ]
        )

    response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "forward_return",
            "target_params": {"lookahead_period": 1, "return_threshold": 0},
            "preview_mode": "mock_prediction",
            "mock_precision": 0.6,
            "mock_recall": 0.5,
            "mock_seed": 7,
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:03:00Z",
        },
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["data"]["mode"]["previewMode"] == "mock_prediction"
    assert body["data"]["bridge"]["requestedPrecisionPct"] == 60.0
    assert body["data"]["bridge"]["requestedRecallPct"] == 50.0
    assert body["data"]["bridge"]["actualPrecisionPct"] is not None
    assert body["data"]["summary"]["labeledCount"] >= 0
    assert body["data"]["economics"]["horizons"][0]["horizon"] == 1


def test_market_data_target_preview_respects_requested_interval() -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        candles = []
        for minute in range(10):
            timestamp = base.replace(minute=minute)
            if minute < 5:
                open_price = Decimal("100") + Decimal(minute * 2)
                close_price = open_price + Decimal("2")
            else:
                open_price = Decimal("110") - Decimal((minute - 5) * 2)
                close_price = open_price - Decimal("2")
            candles.append(
                BTCUSDTKline(
                    timestamp=timestamp,
                    open=open_price,
                    high=max(open_price, close_price) + Decimal("1"),
                    low=min(open_price, close_price) - Decimal("1"),
                    close=close_price,
                    volume=Decimal("1"),
                    created_at=timestamp,
                )
            )
        uow.market_data.upsert_klines(candles)

    response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "5m",
            "target_strategy": "forward_return",
            "target_params": {"lookahead_period": 1, "return_threshold": 0},
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:09:00Z",
        },
    )

    assert response.status_code == 200
    body = response.get_json()
    summary = body["data"]["summary"]
    rows = body["data"]["rows"]
    assert body["data"]["interval"] == "5m"
    assert summary["rowCount"] == 2
    assert summary["tailNullCount"] == 1
    assert summary["confusion"]["fp_count"] == 1
    assert rows[0]["time"] < rows[1]["time"]


def test_market_data_target_preview_allows_zero_lookahead_in_preview_only() -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        uow.market_data.upsert_klines(
            [
                BTCUSDTKline(timestamp=base, open=Decimal("100"), high=Decimal("111"), low=Decimal("99"), close=Decimal("110"), volume=Decimal("1"), created_at=base),
                BTCUSDTKline(timestamp=base.replace(minute=1), open=Decimal("110"), high=Decimal("120"), low=Decimal("109"), close=Decimal("100"), volume=Decimal("1"), created_at=base.replace(minute=1)),
                BTCUSDTKline(timestamp=base.replace(minute=2), open=Decimal("100"), high=Decimal("130"), low=Decimal("99"), close=Decimal("120"), volume=Decimal("1"), created_at=base.replace(minute=2)),
                BTCUSDTKline(timestamp=base.replace(minute=3), open=Decimal("120"), high=Decimal("140"), low=Decimal("119"), close=Decimal("115"), volume=Decimal("1"), created_at=base.replace(minute=3)),
            ]
        )

    response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "candle_direction",
            "target_params": {"lookahead_period": 0},
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:03:00Z",
        },
    )

    assert response.status_code == 200
    body = response.get_json()
    summary = body["data"]["summary"]
    rows = body["data"]["rows"]
    assert body["data"]["strategy"]["name"] == "candle_direction"
    assert summary["lookaheadPeriod"] == 0
    assert summary["labeledCount"] == 4
    assert summary["tailNullCount"] == 0
    assert rows[0]["target"] == 1
    assert rows[1]["target"] == 0
    assert rows[2]["target"] == 1
    assert rows[3]["target"] == 0


def test_market_data_target_preview_reports_tail_nulls_for_short_series() -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        uow.market_data.upsert_klines(
            [
                BTCUSDTKline(timestamp=base, open=Decimal("100"), high=Decimal("101"), low=Decimal("99"), close=Decimal("100"), volume=Decimal("1"), created_at=base),
                BTCUSDTKline(timestamp=base.replace(minute=1), open=Decimal("100"), high=Decimal("102"), low=Decimal("99"), close=Decimal("101"), volume=Decimal("1"), created_at=base.replace(minute=1)),
                BTCUSDTKline(timestamp=base.replace(minute=2), open=Decimal("101"), high=Decimal("103"), low=Decimal("100"), close=Decimal("102"), volume=Decimal("1"), created_at=base.replace(minute=2)),
            ]
        )

    response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "roc_lookahead",
            "target_params": {"lookahead_period": 2, "roc_threshold": 0},
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:02:00Z",
        },
    )

    assert response.status_code == 200
    body = response.get_json()
    summary = body["data"]["summary"]
    rows = body["data"]["rows"]
    assert summary["tailNullCount"] == 2
    assert summary["labeledCount"] == 1
    assert rows[0]["target"] == 1
    assert rows[1]["target"] is None
    assert rows[2]["target"] is None


def test_market_data_target_preview_changes_candle_direction_with_lookahead() -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        candles = []
        for minute in range(6):
            timestamp = base.replace(minute=minute)
            open_price = Decimal("100") + Decimal(minute)
            close_price = open_price + (Decimal("2") if minute % 2 == 0 else Decimal("-2"))
            candles.append(
                BTCUSDTKline(
                    timestamp=timestamp,
                    open=open_price,
                    high=max(open_price, close_price) + Decimal("1"),
                    low=min(open_price, close_price) - Decimal("1"),
                    close=close_price,
                    volume=Decimal("1"),
                    created_at=timestamp,
                )
            )
        uow.market_data.upsert_klines(candles)

    low_response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "candle_direction",
            "target_params": {"lookahead_period": 1},
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:05:00Z",
        },
    )
    high_response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "candle_direction",
            "target_params": {"lookahead_period": 100},
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:05:00Z",
        },
    )

    assert low_response.status_code == 200
    assert high_response.status_code == 200
    low_body = low_response.get_json()
    high_body = high_response.get_json()
    assert low_body["data"]["summary"]["labeledCount"] == 5
    assert high_body["data"]["summary"]["labeledCount"] == 0
    assert low_body["data"]["rows"][0]["target"] in {0, 1}
    assert high_body["data"]["rows"][0]["target"] is None


def test_market_data_target_preview_surfaces_strategy_failures(monkeypatch: pytest.MonkeyPatch) -> None:
    client = _client()
    with UnitOfWork() as uow:
        base = datetime(2026, 1, 1, 0, 0, tzinfo=UTC)
        uow.market_data.upsert_klines(
            [
                BTCUSDTKline(timestamp=base, open=Decimal("100"), high=Decimal("101"), low=Decimal("99"), close=Decimal("100"), volume=Decimal("1"), created_at=base),
                BTCUSDTKline(timestamp=base.replace(minute=1), open=Decimal("100"), high=Decimal("101"), low=Decimal("99"), close=Decimal("100"), volume=Decimal("1"), created_at=base.replace(minute=1)),
            ]
        )

    class BrokenStrategy:
        def generate(self, _frame):
            raise RuntimeError("boom")

    monkeypatch.setattr(
        market_data_controller.TargetStrategyFactory,
        "create",
        classmethod(lambda _cls, *_args, **_kwargs: BrokenStrategy()),
    )

    response = client.post(
        "/api/market-data/btcusdt/target-preview",
        json={
            "interval": "1m",
            "target_strategy": "forward_return",
            "target_params": {"lookahead_period": 1, "return_threshold": 0},
            "start_datetime": "2026-01-01T00:00:00Z",
            "end_datetime": "2026-01-01T00:01:00Z",
        },
    )

    assert response.status_code == 500
    body = response.get_json()
    assert body["error"]["code"] == "TARGET_PREVIEW_FAILED"
    assert "boom" in body["error"]["message"]


def test_market_data_admin_controls_require_admin() -> None:
    client = _client()
    client.post(
        "/api/auth/register",
        json={"name": "User", "username": "userops", "email": "userops@example.com", "password": "securepass"},
    )
    login = client.post("/api/auth/login", json={"email": "userops@example.com", "password": "securepass"})
    cookie = login.headers.get("Set-Cookie").split(";", 1)[0]

    response = client.post("/api/market-data/btcusdt/admin/catch-up", headers={"Cookie": cookie})
    assert response.status_code == 403


def test_market_data_metadata_includes_cached_timestamp_bounds() -> None:
    client = _client()

    response = client.get("/api/market-data/btcusdt/metadata")

    assert response.status_code == 200
    body = response.get_json()["data"]
    assert body["latestTimestamp"] is None
    assert body["earliestTimestamp"] is None


def test_market_data_admin_catch_up_uses_latest_cached_timestamp(monkeypatch: pytest.MonkeyPatch) -> None:
    client = _client()
    _seed_candles()
    admin_cookie = _register_and_login_admin(client, "admincatch", "admincatch@example.com")

    captured: dict[str, datetime] = {}

    class FakeService:
        def get_latest_cached_btcusdt_1m_timestamp(self):
            with UnitOfWork() as uow:
                latest = uow.market_data.get_latest_timestamp() if uow.market_data else None
            return latest if latest is None or latest.tzinfo is not None else latest.replace(tzinfo=UTC)

        def refresh_btcusdt_1m(self, start: datetime, end: datetime):
            captured["start"] = start
            captured["end"] = end
            return type("Summary", (), {"inserted": 1, "updated": 0})()

    monkeypatch.setattr(market_data_controller, "MarketDataService", FakeService)

    response = client.post("/api/market-data/btcusdt/admin/catch-up", headers={"Cookie": admin_cookie})

    assert response.status_code == 200
    body = response.get_json()["data"]
    assert body["range"]["start"] == "2026-01-01T00:02:00+00:00"
    assert captured["start"] == datetime(2026, 1, 1, 0, 2, tzinfo=UTC)
    assert captured["end"] >= captured["start"]


def test_market_data_admin_clear_data_deletes_cached_rows(monkeypatch: pytest.MonkeyPatch) -> None:
    client = _client()
    _seed_candles()
    admin_cookie = _register_and_login_admin(client, "adminclear", "adminclear@example.com")

    response = client.delete("/api/market-data/btcusdt/admin/klines", headers={"Cookie": admin_cookie})

    assert response.status_code == 200
    with UnitOfWork() as uow:
        assert uow.market_data.count_range(
            datetime(2026, 1, 1, 0, 0, tzinfo=UTC),
            datetime(2026, 1, 1, 0, 2, tzinfo=UTC),
            interval="1m",
        ) == 0


def test_market_data_admin_catch_up_after_clear_defaults_to_earliest_start(monkeypatch: pytest.MonkeyPatch) -> None:
    client = _client()
    _seed_candles()
    admin_cookie = _register_and_login_admin(client, "adminretry", "adminretry@example.com")

    response = client.delete("/api/market-data/btcusdt/admin/klines", headers={"Cookie": admin_cookie})
    assert response.status_code == 200

    captured: dict[str, datetime] = {}

    class FakeService:
        def get_latest_cached_btcusdt_1m_timestamp(self):
            return None

        def refresh_btcusdt_1m(self, start: datetime, end: datetime):
            captured["start"] = start
            captured["end"] = end
            return type("Summary", (), {"inserted": 2, "updated": 0})()

    monkeypatch.setattr(market_data_controller, "MarketDataService", FakeService)

    response = client.post("/api/market-data/btcusdt/admin/catch-up", headers={"Cookie": admin_cookie})

    assert response.status_code == 200
    assert captured["start"] == datetime(2017, 8, 17, 0, 0, tzinfo=UTC)
    assert captured["end"] == captured["start"] + market_data_controller.ADMIN_CATCH_UP_WINDOW
    assert response.get_json()["data"]["hasMore"] is True
