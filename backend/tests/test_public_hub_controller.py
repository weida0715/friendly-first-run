from __future__ import annotations

from datetime import date, datetime

from app import create_app
from app.infrastructure.database.base import Base
from app.infrastructure.database.orm import blueprint_orm, experiment_orm, model_orm, user_orm  # noqa: F401
from app.infrastructure.database.orm.blueprint_orm import BlueprintORM
from app.infrastructure.database.orm.experiment_orm import ExperimentORM
from app.infrastructure.database.orm.model_orm import ModelORM
from app.infrastructure.database.orm.user_orm import UserORM
from app.infrastructure.database.session import configure_engine, get_engine
from app.repositories.unit_of_work import UnitOfWork


def _client():
    configure_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=get_engine())
    return create_app("testing").test_client()


def _seed_public_private():
    now = datetime(2026, 1, 1, 12)
    with UnitOfWork() as uow:
        owner = UserORM(Username="owner001", Email="owner@example.com", PasswordHash="x", Name="Owner", Role="User", Status="Enabled", CreatedAt=now, UpdatedAt=now)
        disabled = UserORM(Username="disabled001", Email="disabled@example.com", PasswordHash="x", Name="Disabled", Role="User", Status="Disabled", CreatedAt=now, UpdatedAt=now)
        uow.session.add_all([owner, disabled])
        uow.session.flush()
        approved = BlueprintORM(UserID=owner.UserID, Name="Approved BP", Description="public", Indicators={}, Features={}, Architecture={}, ApprovalState="Approved", SubmittedAt=now, Version=1, CreatedAt=now, UpdatedAt=now)
        draft = BlueprintORM(UserID=owner.UserID, Name="Draft BP", Description=None, Indicators={}, Features={}, Architecture={}, ApprovalState="Draft", SubmittedAt=None, Version=1, CreatedAt=now, UpdatedAt=now)
        uow.session.add_all([approved, draft])
        uow.session.flush()
        public_exp = ExperimentORM(UserID=owner.UserID, BlueprintID=approved.BlueprintID, Name="Public Exp", Description=None, Interval="1m", StartDate=date(2026, 1, 1), EndDate=date(2026, 1, 2), TrainSplit=0.8, ValSplit=0.1, TestSplit=0.1, ParameterOverrides={}, Status="Completed", Progress=100, CurrentStage=None, EtaSeconds=None, Success=True, CreatedAt=now, CompletedAt=now, Deterministic=True, Seed=42)
        failed_exp = ExperimentORM(UserID=owner.UserID, BlueprintID=approved.BlueprintID, Name="Failed Exp", Description=None, Interval="1m", StartDate=date(2026, 1, 1), EndDate=date(2026, 1, 2), TrainSplit=0.8, ValSplit=0.1, TestSplit=0.1, ParameterOverrides={}, Status="Failed", Progress=100, CurrentStage=None, EtaSeconds=None, Success=False, CreatedAt=now, CompletedAt=now, Deterministic=True, Seed=42)
        draft_exp = ExperimentORM(UserID=owner.UserID, BlueprintID=draft.BlueprintID, Name="Draft Exp", Description=None, Interval="1m", StartDate=date(2026, 1, 1), EndDate=date(2026, 1, 2), TrainSplit=0.8, ValSplit=0.1, TestSplit=0.1, ParameterOverrides={}, Status="Completed", Progress=100, CurrentStage=None, EtaSeconds=None, Success=True, CreatedAt=now, CompletedAt=now, Deterministic=True, Seed=42)
        uow.session.add_all([public_exp, failed_exp, draft_exp])
        uow.session.flush()
        uow.session.add(ModelORM(ExperimentID=public_exp.ExperimentID, Parameters={}, Sharpe=1.2, Accuracy=0.8, Precision=0.7, Recall=0.6, CreatedAt=now, ParameterHash="abc"))
        return owner.UserID


def test_public_hub_visibility_and_search():
    client = _client()
    _seed_public_private()

    users = client.get("/api/hub/?tab=users").get_json()["data"]["items"]
    assert any(item["username"] == "owner001" for item in users)
    assert all(item["username"] != "disabled001" for item in users)

    experiments = client.get("/api/hub/?tab=experiments&q=Public").get_json()["data"]["items"]
    assert [item["name"] for item in experiments] == ["Public Exp"]

    blueprints = client.get("/api/hub/?tab=blueprints").get_json()["data"]["items"]
    assert [item["name"] for item in blueprints] == ["Approved BP"]

    models = client.get("/api/hub/?tab=models&metric=accuracy").get_json()["data"]["items"]
    assert models[0]["parameterHash"] == "abc"


def test_public_profile_returns_only_public_artifacts():
    client = _client()
    owner_id = _seed_public_private()

    response = client.get(f"/api/hub/users/{owner_id}")
    assert response.status_code == 200
    body = response.get_json()["data"]
    assert body["user"]["username"] == "owner001"
    assert body["summary"] == {"experiments": 1, "models": 1, "blueprints": 1}
    assert [item["name"] for item in body["experiments"]] == ["Public Exp"]
    assert [item["name"] for item in body["blueprints"]] == ["Approved BP"]
