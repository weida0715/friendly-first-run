from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from app import create_app
from app.controllers import experiment_controller
from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment_log import ExperimentLog
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import (  # noqa: F401
    blueprint_orm,
    btcusdt_kline_orm,
    experiment_log_orm,
    experiment_orm,
    favorite_blueprint_orm,
    favorite_model_orm,
    user_orm,
)
from app.infrastructure.database.orm.experiment_orm import ExperimentORM
from app.infrastructure.database.orm.model_orm import ModelORM
from app.infrastructure.database.orm.user_orm import UserORM
from app.infrastructure.database.session import configure_engine, get_engine
from app.repositories.unit_of_work import UnitOfWork


class _FakeQueuePosition:
    job_id = "journey-job-1"
    position = 0
    queue_name = "experiments"
    eta_seconds = None


class _FakeQueueService:
    def get_active_queue_snapshot(self):
        return {"running_jobs": 0, "queue_depth": 0, "active_jobs_total": 0, "active_jobs": []}

    def enqueue_job(self, spec):  # noqa: ANN001
        _ = spec
        return _FakeQueuePosition()


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def _register_and_login(client, username: str, email: str) -> str:
    client.post(
        "/api/auth/register",
        json={"name": username, "username": username, "email": email, "password": "securepass"},
    )
    login = client.post("/api/auth/login", json={"email": email, "password": "securepass"})
    return login.headers.get("Set-Cookie", "").split(";", 1)[0]


def _login(client, email: str) -> str:
    login = client.post("/api/auth/login", json={"email": email, "password": "securepass"})
    return login.headers.get("Set-Cookie", "").split(";", 1)[0]


def test_fyp_core_journey_reaches_rankings_and_public_hub(monkeypatch) -> None:
    monkeypatch.setattr(experiment_controller, "_build_queue_service", lambda: _FakeQueueService())

    client = _client()
    owner_cookie = _register_and_login(client, "journeyowner", "journey-owner@example.com")
    client.post(
        "/api/auth/register",
        json={
            "name": "journeymod",
            "username": "journeymod",
            "email": "journey-mod@example.com",
            "password": "securepass",
        },
    )

    now = datetime(2026, 1, 1, 12, 0, 0)
    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("journey-owner@example.com")
        mod = uow.users.get_by_email("journey-mod@example.com")
        uow.session.get(UserORM, mod.user_id).Role = "Moderator"
        blueprint = uow.blueprints.add(
            Blueprint(
                None,
                owner.user_id,
                "Journey Blueprint",
                "Integration journey blueprint",
                {},
                {},
                {},
                "Draft",
                None,
                1,
                None,
                now,
                now,
            )
        )

    pending = client.post(
        f"/api/blueprints/{blueprint.blueprint_id}/request-approval",
        headers={"Cookie": owner_cookie},
    )
    assert pending.status_code == 200

    mod_cookie = _login(client, "journey-mod@example.com")
    approved = client.post(
        f"/api/blueprints/{blueprint.blueprint_id}/approve",
        headers={"Cookie": mod_cookie},
    )
    assert approved.status_code == 200
    assert approved.get_json()["data"]["blueprint"]["approvalState"] == "Approved"

    owner_cookie = _login(client, "journey-owner@example.com")
    created = client.post(
        "/api/experiments/",
        headers={"Cookie": owner_cookie},
        json={
            "name": "Journey Experiment",
            "symbol": "BTCUSDT",
            "interval": "1m",
            "start_date": "2026-01-01T00:00:00Z",
            "end_date": "2026-01-10T00:00:00Z",
            "train_split": 80,
            "val_split": 10,
            "test_split": 10,
            "blueprint_id": blueprint.blueprint_id,
            "parameter_overrides": {},
        },
    )
    assert created.status_code == 201, created.get_json()
    created_payload = created.get_json()["data"]
    assert created_payload["experiment"]["status"] == "Queued"
    assert created_payload["job"]["id"] == "journey-job-1"

    experiment_id = created_payload["experiment"]["id"]
    with UnitOfWork() as uow:
        experiment = uow.session.get(ExperimentORM, experiment_id)
        assert experiment.CompiledBlueprintSnapshot
        assert experiment.CompiledExperimentSnapshot
        experiment.Status = "Completed"
        experiment.Success = True
        experiment.Progress = Decimal("100")
        experiment.CompletedAt = now

        model = uow.session.query(ModelORM).filter_by(ExperimentID=experiment_id).one()
        assert model.ParameterHash
        model.Sharpe = Decimal("1.50")
        model.Accuracy = Decimal("0.82")
        model.Precision = Decimal("0.76")
        model.Recall = Decimal("0.71")
        uow.experiment_logs.add(
            ExperimentLog(
                None,
                experiment_id,
                model.ModelID,
                now,
                1,
                Decimal("1.0"),
                {
                    "type": "backtest",
                    "total_return_net_pct": 12.5,
                    "trade_win_rate_pct": 58.0,
                    "max_drawdown_pct": 9.0,
                },
                now,
            )
        )
        model_id = model.ModelID
        parameter_hash = model.ParameterHash

    viewer_cookie = _register_and_login(client, "journeyviewer", "journey-viewer@example.com")

    rankings = client.get("/api/models/rankings?q=Journey", headers={"Cookie": viewer_cookie})
    assert rankings.status_code == 200
    ranking_items = rankings.get_json()["data"]["items"]
    assert [item["id"] for item in ranking_items] == [model_id]
    assert ranking_items[0]["metrics"]["total_return_net_pct"] == 12.5

    hub_models = client.get("/api/hub/?tab=models&q=Journey", headers={"Cookie": viewer_cookie})
    assert hub_models.status_code == 200
    assert [item["parameterHash"] for item in hub_models.get_json()["data"]["items"]] == [parameter_hash]

    hub_experiments = client.get("/api/hub/?tab=experiments&q=Journey", headers={"Cookie": viewer_cookie})
    assert hub_experiments.status_code == 200
    assert [item["name"] for item in hub_experiments.get_json()["data"]["items"]] == ["Journey Experiment"]
