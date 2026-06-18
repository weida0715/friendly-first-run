"""Authenticated public discovery endpoints."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from flask import Blueprint, request
from sqlalchemy import or_, select

from app.controllers._access import build_access_control
from app.infrastructure.database.orm.blueprint_orm import BlueprintORM
from app.infrastructure.database.orm.experiment_orm import ExperimentORM
from app.infrastructure.database.orm.model_orm import ModelORM
from app.infrastructure.database.orm.user_orm import UserORM
from app.repositories.unit_of_work import UnitOfWork
from app.responses import error_response, ok_response

blueprint = Blueprint("public_hub", __name__)


class PublicHubController:
    """Coordinates public discovery use cases."""

    pass


def _iso(value: Any) -> str | None:
    return value.isoformat() if hasattr(value, "isoformat") else None


def _number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _date_arg(name: str):
    raw = request.args.get(name)
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


def _public_base(statement):
    return (
        statement
        .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
        .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
        .where(
            UserORM.Status == "Enabled",
            ExperimentORM.Status == "Completed",
            ExperimentORM.Success.is_(True),
            BlueprintORM.ApprovalState == "Approved",
        )
    )


def _user_item(user: UserORM) -> dict[str, Any]:
    return {
        "id": user.UserID,
        "username": user.Username,
        "name": user.Name,
        "createdAt": _iso(user.CreatedAt),
        "detailPath": f"/profile?userId={user.UserID}",
    }


def _experiment_item(experiment: ExperimentORM, owner: UserORM, bp: BlueprintORM) -> dict[str, Any]:
    return {
        "id": experiment.ExperimentID,
        "name": experiment.Name,
        "status": str(experiment.Status),
        "interval": str(experiment.Interval),
        "completedAt": _iso(experiment.CompletedAt),
        "owner": {"id": owner.UserID, "username": owner.Username, "name": owner.Name},
        "blueprint": {"id": bp.BlueprintID, "name": bp.Name, "version": bp.Version},
        "detailPath": f"/experiments/{experiment.ExperimentID}",
    }


def _model_item(model: ModelORM, experiment: ExperimentORM, owner: UserORM, bp: BlueprintORM) -> dict[str, Any]:
    return {
        "id": model.ModelID,
        "experiment": {"id": experiment.ExperimentID, "name": experiment.Name},
        "owner": {"id": owner.UserID, "username": owner.Username, "name": owner.Name},
        "blueprint": {"id": bp.BlueprintID, "name": bp.Name, "version": bp.Version},
        "metrics": {
            "sharpe": _number(model.Sharpe),
            "accuracy": _number(model.Accuracy),
            "precision": _number(model.Precision),
            "recall": _number(model.Recall),
        },
        "parameterHash": model.ParameterHash,
        "createdAt": _iso(model.CreatedAt),
        "detailPath": f"/models/{model.ModelID}",
    }


def _blueprint_item(bp: BlueprintORM, owner: UserORM) -> dict[str, Any]:
    return {
        "id": bp.BlueprintID,
        "name": bp.Name,
        "description": bp.Description,
        "approvalState": str(bp.ApprovalState),
        "version": bp.Version,
        "owner": {"id": owner.UserID, "username": owner.Username, "name": owner.Name},
        "updatedAt": _iso(bp.UpdatedAt),
        "detailPath": f"/blueprints/{bp.BlueprintID}",
    }


def _auth():
    actor = build_access_control().require_authenticated(request)
    return actor if hasattr(actor, "user_id") else None, actor


@blueprint.get("/")
def index():
    actor, response = _auth()
    if actor is None:
        return response

    tab = request.args.get("tab") or "users"
    q = (request.args.get("q") or "").strip()
    owner_id_raw = request.args.get("ownerId") or request.args.get("owner_id")
    owner_id = None
    if owner_id_raw:
        try:
            owner_id = int(owner_id_raw)
        except ValueError:
            return error_response("Invalid owner ID format", 400)
    metric = request.args.get("metric")
    status_filter = request.args.get("status")
    from_date = _date_arg("from")
    to_date = _date_arg("to")

    with UnitOfWork() as uow:
        if tab == "users":
            statement = select(UserORM).where(UserORM.Status == "Enabled")
            if q:
                like = f"%{q}%"
                statement = statement.where(or_(UserORM.Username.ilike(like), UserORM.Name.ilike(like)))
            rows = uow.session.scalars(statement.order_by(UserORM.Username).limit(50)).all()
            return ok_response({"data": {"tab": tab, "items": [_user_item(row) for row in rows]}})

        if tab == "experiments":
            statement = _public_base(select(ExperimentORM, UserORM, BlueprintORM))
            if q:
                like = f"%{q}%"
                statement = statement.where(or_(ExperimentORM.Name.ilike(like), UserORM.Username.ilike(like), BlueprintORM.Name.ilike(like)))
            if owner_id is not None:
                statement = statement.where(ExperimentORM.UserID == owner_id)
            if status_filter:
                statement = statement.where(ExperimentORM.Status == status_filter)
            if from_date:
                statement = statement.where(ExperimentORM.CompletedAt >= from_date)
            if to_date:
                statement = statement.where(ExperimentORM.CompletedAt <= to_date)
            rows = uow.session.execute(statement.order_by(ExperimentORM.CompletedAt.desc()).limit(50)).all()
            return ok_response({"data": {"tab": tab, "items": [_experiment_item(*row) for row in rows]}})

        if tab == "models":
            statement = _public_base(
                select(ModelORM, ExperimentORM, UserORM, BlueprintORM)
                .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            )
            if q:
                like = f"%{q}%"
                statement = statement.where(or_(ExperimentORM.Name.ilike(like), UserORM.Username.ilike(like), BlueprintORM.Name.ilike(like), ModelORM.ParameterHash.ilike(like)))
            if owner_id is not None:
                statement = statement.where(ExperimentORM.UserID == owner_id)
            sort_column = {"accuracy": ModelORM.Accuracy, "precision": ModelORM.Precision, "recall": ModelORM.Recall}.get(metric or "", ModelORM.Sharpe)
            rows = uow.session.execute(statement.order_by(sort_column.desc().nullslast(), ModelORM.ModelID.desc()).limit(50)).all()
            return ok_response({"data": {"tab": tab, "items": [_model_item(*row) for row in rows]}})

        if tab == "blueprints":
            statement = (
                select(BlueprintORM, UserORM)
                .join(UserORM, UserORM.UserID == BlueprintORM.UserID)
                .where(BlueprintORM.ApprovalState == "Approved", UserORM.Status == "Enabled")
            )
            if q:
                like = f"%{q}%"
                statement = statement.where(or_(BlueprintORM.Name.ilike(like), BlueprintORM.Description.ilike(like), UserORM.Username.ilike(like)))
            if owner_id is not None:
                statement = statement.where(BlueprintORM.UserID == owner_id)
            rows = uow.session.execute(statement.order_by(BlueprintORM.UpdatedAt.desc()).limit(50)).all()
            return ok_response({"data": {"tab": tab, "items": [_blueprint_item(*row) for row in rows]}})

    return error_response("Unknown hub tab", 404)


@blueprint.get("/users/<int:user_id>")
def public_profile(user_id: int):
    actor, response = _auth()
    if actor is None:
        return response

    with UnitOfWork() as uow:
        user = uow.session.get(UserORM, user_id)
        if user is None or user.Status != "Enabled":
            return error_response("User profile is not visible", 404)

        exp_rows = uow.session.execute(
            _public_base(select(ExperimentORM, UserORM, BlueprintORM))
            .where(ExperimentORM.UserID == user_id)
            .order_by(ExperimentORM.CompletedAt.desc())
            .limit(10)
        ).all()
        model_rows = uow.session.execute(
            _public_base(
                select(ModelORM, ExperimentORM, UserORM, BlueprintORM)
                .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            )
            .where(ExperimentORM.UserID == user_id)
            .order_by(ModelORM.ModelID.desc())
            .limit(10)
        ).all()
        blueprint_rows = uow.session.execute(
            select(BlueprintORM, UserORM)
            .join(UserORM, UserORM.UserID == BlueprintORM.UserID)
            .where(BlueprintORM.UserID == user_id, BlueprintORM.ApprovalState == "Approved")
            .order_by(BlueprintORM.UpdatedAt.desc())
            .limit(10)
        ).all()

    return ok_response({
        "data": {
            "user": _user_item(user),
            "experiments": [_experiment_item(*row) for row in exp_rows],
            "models": [_model_item(*row) for row in model_rows],
            "blueprints": [_blueprint_item(*row) for row in blueprint_rows],
        }
    })
