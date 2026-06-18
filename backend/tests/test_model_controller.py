from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal

from app import create_app
from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment import Experiment
from app.domain.models.experiment_log import ExperimentLog
from app.domain.models.model import Model
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
from app.repositories.experiment_log_repository import ExperimentLogRepository
from app.repositories.unit_of_work import UnitOfWork


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def _register(client, username: str, email: str):
    client.post("/api/auth/register", json={"name": username, "username": username, "email": email, "password": "securepass"})


def _cookie(client, email: str):
    response = client.post("/api/auth/login", json={"email": email, "password": "securepass"})
    raw_cookie = response.headers.get("Set-Cookie")
    return raw_cookie.split(";", 1)[0] if raw_cookie else None


def _seed():
    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner@example.com")
        viewer = uow.users.get_by_email("viewer@example.com")
        public_bp = uow.blueprints.add(Blueprint(None, owner.user_id, "Approved BP", None, {}, {}, {}, "Approved", now, 1, None, now, now))
        private_bp = uow.blueprints.add(Blueprint(None, owner.user_id, "Private BP", None, {}, {}, {}, "Draft", None, 1, None, now, now))
        public_exp = uow.experiments.add(Experiment(None, owner.user_id, public_bp.blueprint_id, "Public EXP", None, "1h", date(2025, 1, 1), date(2025, 2, 1), Decimal("0.80"), Decimal("0.10"), Decimal("0.10"), None, "Completed", Decimal("100"), None, None, True, now, now))
        private_exp = uow.experiments.add(Experiment(None, owner.user_id, private_bp.blueprint_id, "Private EXP", None, "1h", date(2025, 1, 1), date(2025, 2, 1), Decimal("0.80"), Decimal("0.10"), Decimal("0.10"), None, "Completed", Decimal("100"), None, None, True, now, now))
        slow = uow.models.add(Model(None, public_exp.experiment_id, {"c": 1}, Decimal("0.5"), Decimal("0.70"), Decimal("0.60"), Decimal("0.50"), now, "slow"))
        fast = uow.models.add(Model(None, public_exp.experiment_id, {"c": 2}, Decimal("1.5"), Decimal("0.90"), Decimal("0.80"), Decimal("0.70"), now, "fast"))
        private = uow.models.add(Model(None, private_exp.experiment_id, {"c": 3}, Decimal("2.5"), Decimal("0.95"), Decimal("0.90"), Decimal("0.80"), now, "private"))
        uow.experiment_logs.add(ExperimentLog(None, public_exp.experiment_id, fast.model_id, now, 1, Decimal("1.0"), {"type": "backtest", "max_drawdown_pct": 8, "trade_win_rate_pct": 55, "total_return_net_pct": 12}, now))
    return {"viewer": viewer.user_id, "slow": slow.model_id, "fast": fast.model_id, "private": private.model_id, "public_exp": public_exp.experiment_id, "public_bp": public_bp.blueprint_id}


def test_model_detail_access_public_and_private_rules() -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    ids = _seed()
    owner_cookie = _cookie(client, "owner@example.com")

    owner_detail = client.get(f"/api/models/{ids['private']}", headers={"Cookie": owner_cookie})
    assert owner_detail.status_code == 200

    viewer_cookie = _cookie(client, "viewer@example.com")
    public_detail = client.get(f"/api/models/{ids['fast']}", headers={"Cookie": viewer_cookie})
    assert public_detail.status_code == 200
    assert public_detail.get_json()["data"]["model"]["metrics"]["max_drawdown_pct"] == 8

    private_detail = client.get(f"/api/models/{ids['private']}", headers={"Cookie": viewer_cookie})
    assert private_detail.status_code == 403


def test_rankings_sort_filter_library_and_favorites(monkeypatch) -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    ids = _seed()
    viewer_cookie = _cookie(client, "viewer@example.com")
    monkeypatch.setattr(ExperimentLogRepository, "list_by_model", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("rankings/library must not load model logs")))

    ranked = client.get("/api/models/rankings?sort=sharpe&order=desc", headers={"Cookie": viewer_cookie})
    assert ranked.status_code == 200
    items = ranked.get_json()["data"]["items"]
    assert [item["id"] for item in items] == [ids["fast"], ids["slow"]]

    filtered = client.get(f"/api/models/rankings?experimentId={ids['public_exp']}&blueprintId={ids['public_bp']}", headers={"Cookie": viewer_cookie})
    assert filtered.status_code == 200
    assert {item["id"] for item in filtered.get_json()["data"]["items"]} == {ids["fast"], ids["slow"]}

    assert client.post(f"/api/models/{ids['fast']}/favorite", headers={"Cookie": viewer_cookie}).status_code == 200
    assert client.post(f"/api/models/{ids['fast']}/favorite", headers={"Cookie": viewer_cookie}).status_code == 200
    favorited = client.get("/api/models/library/favorited", headers={"Cookie": viewer_cookie})
    assert [item["id"] for item in favorited.get_json()["data"]["items"]] == [ids["fast"]]

    assert client.delete(f"/api/models/{ids['fast']}/favorite", headers={"Cookie": viewer_cookie}).status_code == 200
    assert client.get("/api/models/library/favorited", headers={"Cookie": viewer_cookie}).get_json()["data"]["items"] == []

    owner_cookie = _cookie(client, "owner@example.com")
    owned = client.get("/api/models/library/owned", headers={"Cookie": owner_cookie})
    assert {item["id"] for item in owned.get_json()["data"]["items"]} == {ids["slow"], ids["fast"], ids["private"]}


def test_rankings_paginates_before_logs_for_large_experiment(monkeypatch) -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    ids = _seed()
    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        for index in range(60):
            model = uow.models.add(Model(None, ids["public_exp"], {"i": index}, Decimal(str(index)), Decimal("0.50"), Decimal("0.50"), Decimal("0.50"), now, f"bulk-{index}"))
            for log_index in range(5):
                uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], model.model_id, now, 1, Decimal("1.0"), {"type": "backtest", "row": log_index}, now))

    monkeypatch.setattr(ExperimentLogRepository, "list_by_model", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("rankings must not load model logs")))
    viewer_cookie = _cookie(client, "viewer@example.com")
    response = client.get("/api/models/rankings?sort=sharpe&order=desc&pageSize=20", headers={"Cookie": viewer_cookie})
    payload = response.get_json()["data"]

    assert response.status_code == 200
    assert len(payload["items"]) == 20
    assert payload["total"] == 62
    assert payload["totalPages"] == 4


def test_rankings_search_sort_and_flexible_filters() -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    ids = _seed()
    viewer_cookie = _cookie(client, "viewer@example.com")

    search = client.get("/api/models/rankings?q=Approved", headers={"Cookie": viewer_cookie})
    assert {item["id"] for item in search.get_json()["data"]["items"]} == {ids["slow"], ids["fast"]}

    between = json.dumps([{"column": "sharpe", "op": "between", "min": "1", "max": "2"}])
    filtered = client.get(f"/api/models/rankings?filters={between}", headers={"Cookie": viewer_cookie})
    assert [item["id"] for item in filtered.get_json()["data"]["items"]] == [ids["fast"]]

    combined = json.dumps([
        {"column": "experiment_name", "op": "contains", "value": "Public"},
        {"column": "accuracy", "op": "min", "value": "0.8"},
    ])
    combined_response = client.get(f"/api/models/rankings?sort=model_id&order=asc&filters={combined}", headers={"Cookie": viewer_cookie})
    payload = combined_response.get_json()["data"]
    assert [item["id"] for item in payload["items"]] == [ids["fast"]]
    assert payload["total"] == 1


def test_rankings_metric_sort_excludes_incomplete_and_sorts_nulls_last() -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    ids = _seed()
    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        zero = uow.models.add(Model(None, ids["public_exp"], {"z": 1}, Decimal("0"), Decimal("0"), Decimal("0"), Decimal("0"), now, "zero"))
        nullish = uow.models.add(Model(None, ids["public_exp"], {"n": 1}, None, None, None, None, now, "null"))
        tied = uow.models.add(Model(None, ids["public_exp"], {"t": 1}, Decimal("1.5"), Decimal("0.90"), Decimal("0.70"), Decimal("0.60"), now, "tie"))

    viewer_cookie = _cookie(client, "viewer@example.com")
    ranked = client.get("/api/models/rankings?sort=accuracy&order=desc", headers={"Cookie": viewer_cookie})
    ranked_ids = [item["id"] for item in ranked.get_json()["data"]["items"]]
    assert ranked_ids[:2] == [tied.model_id, ids["fast"]]
    assert zero.model_id not in ranked_ids
    assert nullish.model_id not in ranked_ids

    included = client.get("/api/models/rankings?sort=sharpe&order=desc&includeIncomplete=true", headers={"Cookie": viewer_cookie})
    included_ids = [item["id"] for item in included.get_json()["data"]["items"]]
    assert zero.model_id in included_ids
    assert nullish.model_id in included_ids
    assert included_ids.index(nullish.model_id) > included_ids.index(ids["slow"])


def test_model_highlights_return_sql_limited_direct_and_backtest_metrics(monkeypatch) -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    ids = _seed()
    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        best_accuracy = uow.models.add(Model(None, ids["public_exp"], {"a": 1}, Decimal("0.8"), Decimal("0.98"), Decimal("0.50"), Decimal("0.50"), now, "best-accuracy"))
        best_return = uow.models.add(Model(None, ids["public_exp"], {"r": 1}, Decimal("0"), Decimal("0"), Decimal("0"), Decimal("0"), now, "best-return"))
        uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], best_return.model_id, now, 1, Decimal("1.0"), {"type": "backtest", "total_return_net_pct": 25, "trade_win_rate_pct": 75}, now))
        uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], best_accuracy.model_id, now, 1, Decimal("1.0"), {"type": "round", "total_return_net_pct": 999, "trade_win_rate_pct": 999}, now))
        uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], ids["slow"], now, 1, Decimal("1.0"), {"type": "backtest", "total_return_net_pct": 5, "trade_win_rate_pct": 40}, now))
        uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], ids["private"], now, 1, Decimal("1.0"), {"type": "backtest", "total_return_net_pct": 1000, "trade_win_rate_pct": 1000}, now))
        for index in range(50):
            model = uow.models.add(Model(None, ids["public_exp"], {"bulk": index}, Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), now, f"bulk-highlight-{index}"))
            for log_index in range(10):
                uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], model.model_id, now, 1, Decimal("1.0"), {"type": "backtest", "row": log_index, "total_return_net_pct": 1, "trade_win_rate_pct": 1}, now))

    monkeypatch.setattr(ExperimentLogRepository, "list_by_model", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("highlights must not load model logs")))
    viewer_cookie = _cookie(client, "viewer@example.com")
    response = client.get("/api/models/highlights", headers={"Cookie": viewer_cookie})
    payload = response.get_json()["data"]

    assert response.status_code == 200
    assert payload["sharpe"][0]["id"] == ids["fast"]
    assert payload["accuracy"][0]["id"] == best_accuracy.model_id
    assert len(payload["sharpe"]) <= 3
    assert len(payload["accuracy"]) <= 3
    assert payload["totalReturn"][0]["id"] == best_return.model_id
    assert payload["totalReturn"][0]["rankMetric"]["value"] == 25
    assert payload["winRate"][0]["id"] == best_return.model_id
    assert payload["winRate"][0]["rankMetric"]["value"] == 75
    assert ids["private"] not in {item["id"] for group in payload.values() for item in group}


def test_rankings_populates_backtest_metrics_for_current_page_only(monkeypatch) -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    ids = _seed()
    monkeypatch.setattr(ExperimentLogRepository, "list_by_model", lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("rankings must not load per-model logs")))

    viewer_cookie = _cookie(client, "viewer@example.com")
    response = client.get("/api/models/rankings?sort=sharpe&order=desc&pageSize=1", headers={"Cookie": viewer_cookie})
    item = response.get_json()["data"]["items"][0]

    assert response.status_code == 200
    assert item["id"] == ids["fast"]
    assert item["metrics"]["total_return_net_pct"] == 12
    assert item["metrics"]["trade_win_rate_pct"] == 55
    assert item["metrics"]["winRate"] == 55


def test_rankings_can_sort_by_backtest_return_and_win_rate() -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    ids = _seed()
    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        high_return = uow.models.add(Model(None, ids["public_exp"], {"r": 1}, Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), now, "high-return-sort"))
        high_win_rate = uow.models.add(Model(None, ids["public_exp"], {"w": 1}, Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), now, "high-win-sort"))
        uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], high_return.model_id, now, 1, Decimal("1.0"), {"type": "backtest", "total_return_net_pct": 30, "trade_win_rate_pct": 20}, now))
        uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], high_win_rate.model_id, now, 1, Decimal("1.0"), {"type": "backtest", "total_return_net_pct": 2, "trade_win_rate_pct": 90}, now))

    viewer_cookie = _cookie(client, "viewer@example.com")
    by_return = client.get("/api/models/rankings?sort=total_return_net_pct&order=desc", headers={"Cookie": viewer_cookie})
    by_win = client.get("/api/models/rankings?sort=trade_win_rate_pct&order=desc", headers={"Cookie": viewer_cookie})

    assert by_return.get_json()["data"]["items"][0]["id"] == high_return.model_id
    assert by_win.get_json()["data"]["items"][0]["id"] == high_win_rate.model_id


def test_rankings_can_filter_by_backtest_return_and_win_rate() -> None:
    client = _client()
    _register(client, "owner001", "owner@example.com")
    _register(client, "viewer01", "viewer@example.com")
    ids = _seed()
    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        low = uow.models.add(Model(None, ids["public_exp"], {"low": 1}, Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), now, "low-log-filter"))
        high = uow.models.add(Model(None, ids["public_exp"], {"high": 1}, Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), Decimal("0.1"), now, "high-log-filter"))
        uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], low.model_id, now, 1, Decimal("1.0"), {"type": "backtest", "total_return_net_pct": 3, "trade_win_rate_pct": 30}, now))
        uow.experiment_logs.add(ExperimentLog(None, ids["public_exp"], high.model_id, now, 1, Decimal("1.0"), {"type": "backtest", "total_return_net_pct": 20, "trade_win_rate_pct": 80}, now))

    viewer_cookie = _cookie(client, "viewer@example.com")
    return_filter = json.dumps([{"column": "total_return_net_pct", "op": "min", "value": "10"}])
    win_filter = json.dumps([{"column": "trade_win_rate_pct", "op": "between", "min": "70", "max": "90"}])

    by_return = client.get(f"/api/models/rankings?filters={return_filter}", headers={"Cookie": viewer_cookie})
    by_win = client.get(f"/api/models/rankings?filters={win_filter}", headers={"Cookie": viewer_cookie})

    assert high.model_id in {item["id"] for item in by_return.get_json()["data"]["items"]}
    assert low.model_id not in {item["id"] for item in by_return.get_json()["data"]["items"]}
    assert high.model_id in {item["id"] for item in by_win.get_json()["data"]["items"]}
    assert low.model_id not in {item["id"] for item in by_win.get_json()["data"]["items"]}
