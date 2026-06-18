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


def _login(client, username, email):
    client.post("/api/auth/register", json={"name": username, "username": username, "email": email, "password": "securepass"})
    login = client.post("/api/auth/login", json={"email": email, "password": "securepass"})
    return login.headers.get("Set-Cookie", "").split(";", 1)[0]


def _seed(owner_email: str, *, status="Completed", success=True):
    now = datetime(2026, 1, 1, 12)
    with UnitOfWork() as uow:
        owner = uow.users.get_by_email(owner_email)
        owner_row = uow.session.get(UserORM, owner.UserID)
        bp = BlueprintORM(UserID=owner.UserID, Name="Export BP", Description=None, Indicators={}, Features={}, Architecture={}, ApprovalState="Approved", SubmittedAt=now, Version=1, CreatedAt=now, UpdatedAt=now)
        uow.session.add(bp)
        uow.session.flush()
        exp = ExperimentORM(UserID=owner.UserID, BlueprintID=bp.BlueprintID, Name="Export Exp", Description=None, Interval="1m", StartDate=date(2026, 1, 1), EndDate=date(2026, 1, 2), TrainSplit=0.8, ValSplit=0.1, TestSplit=0.1, ParameterOverrides={}, Status=status, Progress=100, CurrentStage=None, EtaSeconds=None, Success=success, CreatedAt=now, CompletedAt=now if success else None, Deterministic=True, Seed=42)
        uow.session.add(exp)
        uow.session.flush()
        uow.session.add(ModelORM(ExperimentID=exp.ExperimentID, Parameters={}, Sharpe=1.0, Accuracy=0.8, Precision=0.7, Recall=0.6, CreatedAt=now, ParameterHash="hash"))
        assert owner_row.Status == "Enabled"
        return exp.ExperimentID


def test_completed_public_experiment_export_for_non_owner_and_auth_rules():
    client = _client()
    assert client.get("/api/logs/experiments/1/model-metrics").status_code == 401
    _login(client, "ownerexport", "ownerexport@example.com")
    viewer_cookie = _login(client, "viewerexport", "viewerexport@example.com")
    experiment_id = _seed("ownerexport@example.com")

    response = client.get(f"/api/logs/experiments/{experiment_id}/model-metrics", headers={"Cookie": viewer_cookie})
    assert response.status_code == 200
    assert b"modelId,parameter_hash,sharpe,accuracy,precision,recall" in response.data


def test_incomplete_experiment_export_rejected():
    client = _client()
    owner_cookie = _login(client, "ownerrunning", "ownerrunning@example.com")
    experiment_id = _seed("ownerrunning@example.com", status="Running", success=None)

    response = client.get(f"/api/logs/experiments/{experiment_id}/model-metrics", headers={"Cookie": owner_cookie})
    assert response.status_code == 409
