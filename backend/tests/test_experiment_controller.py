from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from app import create_app
from app.domain.models.blueprint import Blueprint
from app.domain.models.experiment import Experiment
from app.domain.models.favorite_blueprint import FavoriteBlueprint
from app.domain.models.model import Model
from app.domain.value_objects.validation_result import ValidationResult
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
from app.services.queue_service import QueueUnavailableError
from app.infrastructure.database.orm.experiment_log_orm import ExperimentLogORM


class _FakeQueuePosition:
    def __init__(self, job_id: str = "job-test-1", position: int = 0, queue_name: str = "experiments") -> None:
        self.job_id = job_id
        self.position = position
        self.queue_name = queue_name
        self.eta_seconds = None


class _FakeQueueService:
    def enqueue_job(self, spec):  # noqa: ANN001
        _ = spec
        return _FakeQueuePosition()


class _UnavailableQueueService:
    def enqueue_job(self, spec):  # noqa: ANN001
        _ = spec
        raise QueueUnavailableError("redis down")


class _EmptyQueueService:
    def get_active_jobs(self):
        return []


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def test_experiment_blueprint_options_returns_approved_only() -> None:
    client = _client()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner001",
        "email": "owner001@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner001@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        uow.blueprints.add(Blueprint(None, owner.user_id, "BP Draft", None, {
        }, {}, {}, "Draft", None, 1, None, now, now))
        uow.blueprints.add(Blueprint(None, owner.user_id, "BP Approved", None, {
        }, {}, {}, "Approved", now, 2, None, now, now))
        uow.blueprints.add(Blueprint(None, owner.user_id, "BP Rejected", None, {
        }, {}, {}, "Rejected", now, 3, None, now, now))
        uow.blueprints.add(Blueprint(None, owner.user_id, "BP Disapproved", None, {
        }, {}, {}, "Disapproved", now, 4, None, now, now))

    response = client.get("/api/experiments/blueprint-options")
    assert response.status_code == 200
    items = response.get_json()["data"]["items"]
    names = {item["name"] for item in items}
    assert names == {"BP Approved"}
    assert items[0]["indicatorCount"] == 0
    assert items[0]["architectureName"] == "Architecture"


def test_experiment_blueprint_options_search_paginates_and_sorts_latest() -> None:
    client = _client()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner003",
        "email": "owner003@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner003@example.com")
        older = datetime(2026, 1, 1, 12, 0, 0)
        newer = datetime(2026, 1, 2, 12, 0, 0)
        uow.blueprints.add(Blueprint(None, owner.user_id, "Alpha Search", None, {
            "selected": ["RSI", "MACD"],
        }, {}, {"name": "logistic_regressor_arc"}, "Approved", older, 1, None, older, older))
        uow.blueprints.add(Blueprint(None, owner.user_id, "Beta Search", None, {
            "definitions": [{"name": "SMA"}],
        }, {}, {"name": "random_forest_arc"}, "Approved", newer, 2, None, newer, newer))

    response = client.get("/api/experiments/blueprint-options?search=search&page=1&pageSize=1")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["total"] == 2
    assert data["totalPages"] == 2
    assert data["items"][0]["name"] == "Beta Search"
    assert data["items"][0]["ownerName"] == "owner"
    assert data["items"][0]["indicatorCount"] == 1
    assert data["items"][0]["architectureName"] == "random_forest_arc"


def test_experiment_blueprint_options_favorite_sort() -> None:
    client = _client()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner004",
        "email": "owner004@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner004@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner004@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        plain = uow.blueprints.add(Blueprint(None, owner.user_id, "Plain BP", None, {
        }, {}, {}, "Approved", now, 1, None, now, now))
        favored = uow.blueprints.add(Blueprint(None, owner.user_id, "Favored BP", None, {
        }, {}, {}, "Approved", now, 1, None, now, now))
        uow.favorite_blueprints.add(FavoriteBlueprint(owner.user_id, favored.blueprint_id, now))

    response = client.get("/api/experiments/blueprint-options?sort=favorite")
    assert response.status_code == 200
    items = response.get_json()["data"]["items"]
    assert [item["name"] for item in items[:2]] == ["Favored BP", "Plain BP"]
    assert items[0]["isFavorited"] is True


def test_create_experiment_requires_authentication() -> None:
    client = _client()

    response = client.post("/api/experiments/", json={})

    assert response.status_code == 401


def test_create_experiment_returns_422_with_structured_errors() -> None:
    from app.controllers import experiment_controller as module

    client = _client()
    module._build_queue_service = lambda: _FakeQueueService()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner002",
        "email": "owner002@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner002@example.com",
        "password": "securepass",
    })

    response = client.post("/api/experiments/", json={
        "name": "",
        "symbol": "ETHUSDT",
        "train_split": "x",
    })

    assert response.status_code == 422
    payload = response.get_json()
    assert payload["ok"] is False
    assert "data" in payload and "errors" in payload["data"]
    assert "name" in payload["data"]["errors"]
    assert "symbol" in payload["data"]["errors"]


def test_create_experiment_persists_and_returns_created_payload() -> None:
    from app.controllers import experiment_controller as module

    client = _client()
    module._build_queue_service = lambda: _FakeQueueService()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner003",
        "email": "owner003@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner003@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner003@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        created_bp = uow.blueprints.add(Blueprint(
            None,
            owner.user_id,
            "BP Approved",
            None,
            {},
            {},
            {},
            "Approved",
            now,
            1,
            None,
            now,
            now,
        ))

    response = client.post("/api/experiments/", json={
        "name": "Exp Created",
        "description": "Create flow",
        "symbol": "BTCUSDT",
        "interval": "1m",
        "start_date": "2026-01-01T00:00:00Z",
        "end_date": "2026-01-10T00:00:00Z",
        "train_split": 80,
        "val_split": 10,
        "test_split": 10,
        "blueprint_id": created_bp.blueprint_id,
        "parameter_overrides": {"window": 20},
    })

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["ok"] is True
    experiment = payload["data"]["experiment"]
    assert experiment["id"] is not None
    assert experiment["status"] == "Queued"
    assert experiment["progress"] == 0.0
    assert payload["data"]["job"]["id"] == "job-test-1"
    assert payload["data"]["queue"]["position"] == 0
    assert payload["data"]["queue"]["queueName"] == "experiments"

    with UnitOfWork() as uow:
        persisted = uow.experiments.get_by_id(experiment["id"])
        blueprint_after = uow.blueprints.get_by_id(created_bp.blueprint_id)
        assert persisted is not None
        assert persisted.name == "Exp Created"
        assert persisted.user_id == owner.user_id
        assert persisted.blueprint_id == created_bp.blueprint_id
        assert persisted.train_split == Decimal("0.80")
        assert persisted.val_split == Decimal("0.10")
        assert persisted.test_split == Decimal("0.10")
        assert persisted.parameter_overrides == {"window": 20}
        assert blueprint_after is not None
        assert blueprint_after.architecture == {}
        models = uow.models.list_by_experiment(experiment["id"])
        assert persisted.compiled_blueprint_snapshot is not None
        assert persisted.compiled_experiment_snapshot is not None
        assert persisted.max_permutation_count == 1
        assert len(models) == 1
        assert models[0].parameter_hash


def test_create_experiment_clamps_requested_permutations_to_system_limit(monkeypatch) -> None:
    from app.controllers import experiment_controller as module

    client = _client()
    module._build_queue_service = lambda: _FakeQueueService()
    monkeypatch.setattr(module, "get_runtime_settings", lambda: {"max_requested_permutations": 1})
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner010",
        "email": "owner010@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner010@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner010@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        created_bp = uow.blueprints.add(Blueprint(
            None,
            owner.user_id,
            "BP Approved",
            None,
            {},
            {},
            {"parameters": {"C": [1, 2]}},
            "Approved",
            now,
            1,
            None,
            now,
            now,
        ))

    response = client.post("/api/experiments/", json={
        "name": "Exp Clamped",
        "description": "Clamp flow",
        "symbol": "BTCUSDT",
        "interval": "1m",
        "start_date": "2026-01-01T00:00:00Z",
        "end_date": "2026-01-10T00:00:00Z",
        "train_split": 80,
        "val_split": 10,
        "test_split": 10,
        "blueprint_id": created_bp.blueprint_id,
        "parameter_overrides": {"window": 20},
    })

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["data"]["experiment"]["requestedPermutationCount"] == 1

    with UnitOfWork() as uow:
        experiment_id = int(payload["data"]["experiment"]["id"])
        persisted = uow.experiments.get_by_id(experiment_id)
        models = uow.models.list_by_experiment(experiment_id)
        assert persisted is not None
        assert persisted.requested_permutation_count == 1
        assert len(models) == 1


def test_list_and_detail_endpoints_enforce_ownership() -> None:
    from app.controllers import experiment_controller as module

    client = _client()
    module._build_queue_service = lambda: _FakeQueueService()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner004",
        "email": "owner004@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner004@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner004@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        bp = uow.blueprints.add(Blueprint(None, owner.user_id, "BP Approved", None, {
        }, {}, {}, "Approved", now, 1, None, now, now))

    create = client.post("/api/experiments/", json={
        "name": "Owned Exp",
        "symbol": "BTCUSDT",
        "interval": "1m",
        "start_date": "2026-01-01T00:00:00Z",
        "end_date": "2026-01-10T00:00:00Z",
        "train_split": 80,
        "val_split": 10,
        "test_split": 10,
        "blueprint_id": bp.blueprint_id,
        "parameter_overrides": {},
    })
    exp_id = create.get_json()["data"]["experiment"]["id"]

    list_response = client.get("/api/experiments/?status=Queued&search=Owned")
    assert list_response.status_code == 200
    assert len(list_response.get_json()["data"]["items"]) == 1

    detail_response = client.get(f"/api/experiments/{exp_id}")
    assert detail_response.status_code == 200
    assert detail_response.get_json()["data"]["experiment"]["id"] == exp_id

    other = _client()
    other.post("/api/auth/register", json={
        "name": "other",
        "username": "other004",
        "email": "other004@example.com",
        "password": "securepass",
    })
    other.post("/api/auth/login", json={
        "email": "other004@example.com",
        "password": "securepass",
    })
    forbidden = other.get(f"/api/experiments/{exp_id}")
    assert forbidden.status_code == 403


def test_create_experiment_date_parse_guard_returns_422_not_500(monkeypatch) -> None:
    from app.controllers import experiment_controller as module
    module._build_queue_service = lambda: _FakeQueueService()

    client = _client()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner005",
        "email": "owner005@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner005@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner005@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        created_bp = uow.blueprints.add(Blueprint(
            None,
            owner.user_id,
            "BP Approved",
            None,
            {},
            {},
            {},
            "Approved",
            now,
            1,
            None,
            now,
            now,
        ))

    monkeypatch.setattr(module.ExperimentValidator, "validate", classmethod(
        lambda cls, payload, actor, blueprint_repo: ValidationResult.success()))

    response = client.post("/api/experiments/", json={
        "name": "Guard Date Parse",
        "symbol": "BTCUSDT",
        "interval": "1m",
        "start_date": None,
        "end_date": "2026-01-10T00:00:00Z",
        "train_split": 0.8,
        "val_split": 0.1,
        "test_split": 0.1,
        "blueprint_id": created_bp.blueprint_id,
        "parameter_overrides": {},
    })

    assert response.status_code == 422
    payload = response.get_json()
    assert payload["ok"] is False
    assert payload["data"]["errors"]["startDate"]


def test_create_experiment_with_candlestick_amount_derives_date_range_and_creates() -> None:
    from app.controllers import experiment_controller as module

    client = _client()
    module._build_queue_service = lambda: _FakeQueueService()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner006",
        "email": "owner006@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner006@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner006@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        created_bp = uow.blueprints.add(Blueprint(
            None,
            owner.user_id,
            "BP Approved",
            None,
            {},
            {},
            {},
            "Approved",
            now,
            1,
            None,
            now,
            now,
        ))

    response = client.post("/api/experiments/", json={
        "name": "Candlestick Mode",
        "symbol": "BTCUSDT",
        "interval": "1m",
        "end_date": "2026-01-10T00:00:00Z",
        "candlestick_amount": 1000,
        "train_split": 80,
        "val_split": 10,
        "test_split": 10,
        "blueprint_id": created_bp.blueprint_id,
        "parameter_overrides": {},
    })

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["ok"] is True

    experiment_id = payload["data"]["experiment"]["id"]
    with UnitOfWork() as uow:
        persisted = uow.experiments.get_by_id(experiment_id)
        assert persisted is not None
        assert persisted.end_date.isoformat() == "2026-01-10"
        # Date storage is day-granularity; 1000 minutes remains same date.
        assert persisted.start_date.isoformat() == "2026-01-10"


def test_create_experiment_returns_503_when_queue_unavailable() -> None:
    from app.controllers import experiment_controller as module

    client = _client()
    module._build_queue_service = lambda: _UnavailableQueueService()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner007",
        "email": "owner007@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner007@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner007@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        created_bp = uow.blueprints.add(Blueprint(
            None,
            owner.user_id,
            "BP Approved",
            None,
            {},
            {},
            {},
            "Approved",
            now,
            1,
            None,
            now,
            now,
        ))

    response = client.post("/api/experiments/", json={
        "name": "Queue Down",
        "symbol": "BTCUSDT",
        "interval": "1m",
        "start_date": "2026-01-01T00:00:00Z",
        "end_date": "2026-01-10T00:00:00Z",
        "train_split": 80,
        "val_split": 10,
        "test_split": 10,
        "blueprint_id": created_bp.blueprint_id,
        "parameter_overrides": {},
    })

    assert response.status_code == 503
    payload = response.get_json()
    assert payload["ok"] is False
    assert payload["error"]["code"] == "QUEUE_UNAVAILABLE"


def test_detail_counts_only_completed_result_logs_as_executed_and_normalizes_running_status() -> None:
    from app.controllers import experiment_controller as module

    class _LiveQueueService:
        def get_active_jobs(self):
            return [{"job_id": "job-running-1", "state": "queued"}]

    class _LiveMetadataService:
        def get_job_detail(self, job_id):
            return {"job_id": job_id, "state": "queued", "payload_experiment_id": experiment.experiment_id, "queue_name": "experiments", "position": 0}

    client = _client()
    module._build_queue_service = lambda: _LiveQueueService()
    module._build_job_metadata_service = lambda: _LiveMetadataService()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner008",
        "email": "owner008@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner008@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner008@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        bp = uow.blueprints.add(Blueprint(None, owner.user_id, "BP Approved", None, {}, {}, {}, "Approved", now, 1, None, now, now))
        experiment = uow.experiments.add(Experiment(
            experiment_id=None,
            user_id=owner.user_id,
            blueprint_id=bp.blueprint_id,
            name="Large Search",
            description=None,
            interval="1m",
            start_date=now.date(),
            end_date=now.date(),
            train_split=Decimal("0.80"),
            val_split=Decimal("0.10"),
            test_split=Decimal("0.10"),
            parameter_overrides={},
            status="Queued",
            progress=Decimal("12.50"),
            current_stage="Permutation 198/6912: running backtest (198/6912)",
            eta_seconds=None,
            success=None,
            created_at=now,
            completed_at=None,
            start_datetime=now,
            end_datetime=now,
            compiled_blueprint_snapshot={},
            compiled_experiment_snapshot={"max_permutation_count": 6912, "requested_permutation_count": 6912},
            deterministic=True,
            seed=42,
            max_permutation_count=6912,
            requested_permutation_count=6912,
        ))
        created_models = [
            uow.models.add(Model(None, experiment.experiment_id, {"i": index}, None, None, None, None, now, f"hash-{index}"))
            for index in range(3)
        ]
        uow.experiment_logs.add_metrics_log(
            experiment_id=experiment.experiment_id,
            model_id=created_models[0].model_id,
            metrics={"type": "backtest", "trade_win_rate_pct": 50, "total_return_net_pct": 1.2},
            timestamp=now,
        )

    response = client.get(f"/api/experiments/{experiment.experiment_id}")
    assert response.status_code == 200
    payload = response.get_json()["data"]["experiment"]
    assert payload["status"] == "Running"
    assert payload["runPlan"]["requestedPermutationCount"] == 6912
    assert payload["runPlan"]["executedPermutationCount"] == 1
    assert payload["resultSummary"]["modelsCount"] == 3
    assert payload["resultSummary"]["executedModels"] == 1


def test_list_normalizes_active_queued_status_to_running() -> None:
    client = _client()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner009",
        "email": "owner009@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner009@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner009@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        bp = uow.blueprints.add(Blueprint(None, owner.user_id, "BP Approved", None, {}, {}, {}, "Approved", now, 1, None, now, now))
        uow.experiments.add(Experiment(
            experiment_id=None,
            user_id=owner.user_id,
            blueprint_id=bp.blueprint_id,
            name="Feed Running Search",
            description=None,
            interval="15m",
            start_date=now.date(),
            end_date=now.date(),
            train_split=Decimal("0.80"),
            val_split=Decimal("0.10"),
            test_split=Decimal("0.10"),
            parameter_overrides={},
            status="Queued",
            progress=Decimal("60.19"),
            current_stage="Permutation 931/6912: training architecture (931/6912)",
            eta_seconds=None,
            success=None,
            created_at=now,
            completed_at=None,
            start_datetime=now,
            end_datetime=now,
            compiled_blueprint_snapshot={},
            compiled_experiment_snapshot={"max_permutation_count": 6912, "requested_permutation_count": 6912},
            deterministic=True,
            seed=42,
            max_permutation_count=6912,
            requested_permutation_count=6912,
        ))

    response = client.get("/api/experiments/?search=Feed%20Running")
    assert response.status_code == 200
    items = response.get_json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["status"] == "Running"
    assert items[0]["currentStage"] == "Permutation 931/6912: training architecture (931/6912)"


def test_list_reconciles_queued_experiment_when_queue_job_is_missing() -> None:
    from app.controllers import experiment_controller as module

    client = _client()
    module._build_queue_service = lambda: _EmptyQueueService()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner011",
        "email": "owner011@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner011@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner011@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        bp = uow.blueprints.add(Blueprint(None, owner.user_id, "BP Approved", None, {}, {}, {}, "Approved", now, 1, None, now, now))
        experiment = uow.experiments.add(Experiment(
            experiment_id=None,
            user_id=owner.user_id,
            blueprint_id=bp.blueprint_id,
            name="Stale Queue",
            description=None,
            interval="15m",
            start_date=now.date(),
            end_date=now.date(),
            train_split=Decimal("0.80"),
            val_split=Decimal("0.10"),
            test_split=Decimal("0.10"),
            parameter_overrides={},
            status="Queued",
            progress=Decimal("0"),
            current_stage=None,
            eta_seconds=None,
            success=None,
            created_at=now,
            completed_at=None,
            start_datetime=now,
            end_datetime=now,
            compiled_blueprint_snapshot={},
            compiled_experiment_snapshot={"max_permutation_count": 10, "requested_permutation_count": 10},
            deterministic=True,
            seed=42,
            max_permutation_count=10,
            requested_permutation_count=10,
        ))

    response = client.get("/api/experiments/?status=Queued")
    assert response.status_code == 200
    items = response.get_json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["status"] == "Failed"
    assert "worker stopped or job disappeared" in (items[0]["currentStage"] or "")

    with UnitOfWork() as uow:
        persisted = uow.experiments.get_by_id(experiment.experiment_id)
        assert persisted is not None
        assert str(persisted.status) == "Failed"
        assert persisted.completed_at is not None


def test_detail_clamps_completed_count_to_current_training_permutation() -> None:
    from app.controllers import experiment_controller as module

    class _LiveQueueService:
        def get_active_jobs(self):
            return [{"job_id": "job-running-2", "state": "running"}]

    class _LiveMetadataService:
        def get_job_detail(self, job_id):
            return {"job_id": job_id, "state": "running", "payload_experiment_id": experiment.experiment_id, "queue_name": "experiments", "position": None}

    client = _client()
    module._build_queue_service = lambda: _LiveQueueService()
    module._build_job_metadata_service = lambda: _LiveMetadataService()
    client.post("/api/auth/register", json={
        "name": "owner",
        "username": "owner010",
        "email": "owner010@example.com",
        "password": "securepass",
    })
    client.post("/api/auth/login", json={
        "email": "owner010@example.com",
        "password": "securepass",
    })

    with UnitOfWork() as uow:
        owner = uow.users.get_by_email("owner010@example.com")
        now = datetime(2026, 1, 1, 12, 0, 0)
        bp = uow.blueprints.add(Blueprint(None, owner.user_id, "BP Approved", None, {}, {}, {}, "Approved", now, 1, None, now, now))
        experiment = uow.experiments.add(Experiment(
            experiment_id=None,
            user_id=owner.user_id,
            blueprint_id=bp.blueprint_id,
            name="Clamp Search",
            description=None,
            interval="15m",
            start_date=now.date(),
            end_date=now.date(),
            train_split=Decimal("0.80"),
            val_split=Decimal("0.10"),
            test_split=Decimal("0.10"),
            parameter_overrides={},
            status="Queued",
            progress=Decimal("60.19"),
            current_stage="Permutation 3/6912: training architecture (3/6912)",
            eta_seconds=None,
            success=None,
            created_at=now,
            completed_at=None,
            start_datetime=now,
            end_datetime=now,
            compiled_blueprint_snapshot={},
            compiled_experiment_snapshot={"max_permutation_count": 6912, "requested_permutation_count": 6912},
            deterministic=True,
            seed=42,
            max_permutation_count=6912,
            requested_permutation_count=6912,
        ))
        created_models = [
            uow.models.add(Model(None, experiment.experiment_id, {"i": index}, None, None, None, None, now, f"clamp-hash-{index}"))
            for index in range(5)
        ]
        for model in created_models:
            uow.experiment_logs.add_metrics_log(
                experiment_id=experiment.experiment_id,
                model_id=model.model_id,
                metrics={"type": "backtest", "trade_win_rate_pct": 50, "total_return_net_pct": 1.2},
                timestamp=now,
            )

    response = client.get(f"/api/experiments/{experiment.experiment_id}")
    assert response.status_code == 200
    payload = response.get_json()["data"]["experiment"]
    assert payload["status"] == "Running"
    assert payload["runPlan"]["executedPermutationCount"] == 2


def test_create_experiment_slashless_route_does_not_redirect() -> None:
    client = _client()
    response = client.post("/api/experiments", json={})
    assert response.status_code != 308
    assert response.status_code in {401, 422}


def test_create_experiment_returns_json_when_unexpected_error_occurs() -> None:
    from app.controllers import experiment_controller as module

    client = _client()
    original = module._build_queue_service
    module._build_queue_service = lambda: (
        _ for _ in ()).throw(RuntimeError("boom"))
    try:
        register = client.post("/api/auth/register", json={
            "name": "owner",
            "username": "owner999",
            "email": "owner999@example.com",
            "password": "securepass",
        })
        assert register.status_code in {200, 201}
        login = client.post(
            "/api/auth/login", json={"email": "owner999@example.com", "password": "securepass"})
        assert login.status_code == 200
        response = client.post("/api/experiments", json={})
        assert response.status_code == 500
        assert response.content_type.startswith("application/json")
        assert response.get_json(
        )["error"]["code"] == "EXPERIMENT_CREATE_FAILED"
    finally:
        module._build_queue_service = original
