from __future__ import annotations

from datetime import datetime

from app import create_app
from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment import Experiment
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


class _FakeMetadataService:
    def __init__(self, experiment_id: int) -> None:
        self._experiment_id = experiment_id

    def get_job_detail(self, job_id: str) -> dict[str, object]:
        return {
            "job_id": job_id,
            "state": "queued",
            "job_type": "EXPERIMENT_EXECUTION",
            "queue_name": "experiments",
            "queue_position": 0,
            "worker_name": None,
            "enqueued_at": "2026-01-01T00:00:00+00:00",
            "started_at": None,
            "ended_at": None,
            "error_snippet": None,
            "payload_experiment_id": self._experiment_id,
        }


class _FakeQueueService:
    def remove_job_from_queue(self, job_id: str) -> bool:
        _ = job_id
        return True

    def cancel_running_job(self, job_id: str) -> bool:
        _ = job_id
        return True


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def _seed_owned_experiment(owner_email: str = "ownerjob@example.com") -> int:
    with UnitOfWork() as uow:
        owner = uow.users.get_by_email(owner_email)
        now = datetime(2026, 1, 1, 12, 0, 0)
        bp = uow.blueprints.add(Blueprint(None, owner.user_id, "BP", None, {
        }, {}, {}, "Approved", now, 1, None, now, now))
        exp = uow.experiments.add(Experiment(None, owner.user_id, bp.blueprint_id, "EXP", None, "1m", now.date(
        ), now.date(), 0.8, 0.1, 0.1, {}, "Queued", 0, None, None, None, now, None))
        return int(exp.experiment_id or 0)


def test_job_detail_owner_can_view() -> None:
    from app.controllers import job_controller as module

    client = _client()
    client.post("/api/auth/register", json={"name": "owner", "username": "ownerjob",
                "email": "ownerjob@example.com", "password": "securepass"})
    client.post("/api/auth/login",
                json={"email": "ownerjob@example.com", "password": "securepass"})

    exp_id = _seed_owned_experiment("ownerjob@example.com")
    module._build_job_metadata_service = lambda: _FakeMetadataService(exp_id)

    response = client.get("/api/jobs/job-1")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True
    assert payload["data"]["job"]["id"] == "job-1"
    assert payload["data"]["job"]["experiment"]["id"] == exp_id


def test_job_detail_unauthorized_user_gets_403() -> None:
    from app.controllers import job_controller as module

    client = _client()
    client.post("/api/auth/register", json={"name": "owner", "username": "ownerjob2",
                "email": "ownerjob2@example.com", "password": "securepass"})
    client.post(
        "/api/auth/login", json={"email": "ownerjob2@example.com", "password": "securepass"})
    exp_id = _seed_owned_experiment("ownerjob2@example.com")

    module._build_job_metadata_service = lambda: _FakeMetadataService(exp_id)

    client.post("/api/auth/logout")
    client.post("/api/auth/register", json={
                "name": "other", "username": "otherjob", "email": "otherjob@example.com", "password": "securepass"})
    client.post(
        "/api/auth/login", json={"email": "otherjob@example.com", "password": "securepass"})

    response = client.get("/api/jobs/job-1")
    assert response.status_code == 403


def test_job_owner_can_cancel_queued_job() -> None:
    from app.controllers import job_controller as module

    client = _client()
    client.post("/api/auth/register", json={"name": "owner", "username": "ownercancel",
                "email": "ownercancel@example.com", "password": "securepass"})
    client.post("/api/auth/login",
                json={"email": "ownercancel@example.com", "password": "securepass"})

    exp_id = _seed_owned_experiment("ownercancel@example.com")
    module._build_job_metadata_service = lambda: _FakeMetadataService(exp_id)
    module._build_queue_service = lambda: _FakeQueueService()

    response = client.post("/api/jobs/job-1/cancel")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True
    assert payload["data"]["job"]["id"] == "job-1"
    assert payload["data"]["job"]["cancelled"] is True


def test_job_index_returns_accessible_items() -> None:
    from app.controllers import job_controller as module

    client = _client()
    client.post("/api/auth/register", json={"name": "owner", "username": "ownerlist",
                "email": "ownerlist@example.com", "password": "securepass"})
    client.post("/api/auth/login",
                json={"email": "ownerlist@example.com", "password": "securepass"})

    exp_id = _seed_owned_experiment("ownerlist@example.com")
    module._build_job_metadata_service = lambda: _FakeMetadataService(exp_id)

    class _Q:
        def get_active_jobs(self):
            return [{"job_id": "job-1"}]

    module._build_queue_service = lambda: _Q()
    response = client.get("/api/jobs/")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True
    assert len(payload["data"]["items"]) == 1
