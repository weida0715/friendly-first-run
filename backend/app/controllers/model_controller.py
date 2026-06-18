"""Model detail, ranking, library, and favorite routes."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from flask import Blueprint, request

from app.controllers._access import build_access_control
from app.domain.models.favorite_model import FavoriteModel
from app.repositories.unit_of_work import UnitOfWork
from app.responses import error_response, ok_response
from app.services.access_control_service import AccessControlService

blueprint = Blueprint("models", __name__)

DIRECT_SORTS = {
    "model_id": "model_id",
    "sharpe": "sharpe",
    "accuracy": "accuracy",
    "precision": "precision",
    "recall": "recall",
    "total_return_net_pct": "total_return_net_pct",
    "trade_win_rate_pct": "trade_win_rate_pct",
    "experiment_name": "experiment_name",
    "blueprint_name": "blueprint_name",
    "owner": "owner",
    "created_at": "created_at",
    "createdAt": "created_at",
}


class ModelController:
    """Coordinates model read and favorite use cases."""

    @staticmethod
    def _can_access(experiment, blueprint_item, context) -> bool:
        if context is None:
            return False
        approval_state = blueprint_item.ApprovalState.value if hasattr(blueprint_item.ApprovalState, "value") else blueprint_item.ApprovalState
        return (
            experiment.UserID == context.user_id
            or AccessControlService.is_staff(context)
            or approval_state == "Approved"
        )


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


def _int_arg(name: str) -> int | None:
    raw = request.args.get(name)
    if raw in (None, ""):
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def _filter_rules_arg() -> list[dict[str, Any]]:
    raw = request.args.get("filters")
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [item for item in parsed if isinstance(item, dict)]


def _metric_value(log_metrics: dict[str, Any], key: str) -> Any:
    aliases = {
        "false_positive_rate": ["false_positive_rate", "false_positive_rate_pct", "fpr", "fpr_pct"],
        "auc": ["auc", "roc_auc", "auc_score"],
    }
    for candidate in aliases.get(key, [key]):
        if candidate in log_metrics:
            return log_metrics[candidate]
    return None


def _merge_model_logs(logs) -> dict[str, Any]:
    merged: dict[str, Any] = {}
    summaries: list[dict[str, Any]] = []
    for log in logs:
        metrics = dict(log.Metrics or {})
        if metrics:
            summaries.append(metrics)
            merged.update(metrics)
    return {"latest": merged, "items": summaries}


def _model_item(model, experiment, blueprint_item, owner, *, is_favorited: bool, log_metrics: dict[str, Any] | None = None) -> dict[str, Any]:
    logs = log_metrics or {}
    latest = logs.get("latest", {}) if isinstance(logs, dict) else {}
    metrics = {
        "sharpe": _number(model.Sharpe),
        "accuracy": _number(model.Accuracy),
        "precision": _number(model.Precision),
        "recall": _number(model.Recall),
        "maxDrawdown": _metric_value(latest, "max_drawdown_pct"),
        "winRate": _metric_value(latest, "trade_win_rate_pct"),
        "auc": _metric_value(latest, "auc"),
        "falsePositiveRate": _metric_value(latest, "false_positive_rate"),
        **latest,
    }
    return {
        "id": model.ModelID,
        "experiment": {
            "id": experiment.ExperimentID,
            "name": experiment.Name,
            "status": str(experiment.Status.value if hasattr(experiment.Status, "value") else experiment.Status),
        },
        "blueprint": {
            "id": blueprint_item.BlueprintID,
            "name": blueprint_item.Name,
            "approvalState": str(blueprint_item.ApprovalState.value if hasattr(blueprint_item.ApprovalState, "value") else blueprint_item.ApprovalState),
            "version": blueprint_item.Version,
        },
        "owner": {"id": owner.UserID, "username": owner.Username, "name": owner.Name},
        "parameters": model.Parameters or {},
        "parameterHash": model.ParameterHash,
        "metrics": metrics,
        "logMetrics": logs.get("items", []) if isinstance(logs, dict) else [],
        "createdAt": _iso(model.CreatedAt),
        "isFavorited": is_favorited,
        "detailPath": f"/models/{model.ModelID}",
    }


def _require_context():
    access_control = build_access_control()
    context = access_control.require_authenticated(request)
    return access_control, context


def _ranked_item(model, experiment, blueprint_item, owner, is_favorited: bool, key: str, value: Any) -> dict[str, Any]:
    item = _model_item(model, experiment, blueprint_item, owner, is_favorited=is_favorited)
    item["rankMetric"] = {"key": key, "value": _number(value)}
    return item


def _ranked_log_item(model, experiment, blueprint_item, owner, is_favorited: bool, key: str, value: Any) -> dict[str, Any]:
    item = _model_item(model, experiment, blueprint_item, owner, is_favorited=is_favorited, log_metrics={"latest": {key: value}, "items": []})
    item["rankMetric"] = {"key": key, "value": _number(value)}
    return item


@blueprint.get("/highlights")
def get_model_highlights():
    access_control, context = _require_context()
    if not hasattr(context, "user_id"):
        return context

    scope = request.args.get("scope") or "all"

    with UnitOfWork() as uow:
        sharpe_rows = []
        accuracy_rows = []
        total_return_rows = []
        win_rate_rows = []
        if scope in {"all", "direct"}:
            sharpe_rows = uow.models.list_top_accessible_by_metric(
                context.user_id,
                "sharpe",
                is_staff=AccessControlService.is_staff(context),
                include_favorited_for_user_id=context.user_id,
            )
            accuracy_rows = uow.models.list_top_accessible_by_metric(
                context.user_id,
                "accuracy",
                is_staff=AccessControlService.is_staff(context),
                include_favorited_for_user_id=context.user_id,
            )
        if scope in {"all", "log"}:
            total_return_rows = uow.models.list_top_accessible_by_log_metric(
                context.user_id,
                "total_return_net_pct",
                is_staff=AccessControlService.is_staff(context),
                include_favorited_for_user_id=context.user_id,
            )
            win_rate_rows = uow.models.list_top_accessible_by_log_metric(
                context.user_id,
                "trade_win_rate_pct",
                is_staff=AccessControlService.is_staff(context),
                include_favorited_for_user_id=context.user_id,
            )

    return ok_response({
        "data": {
            "sharpe": [_ranked_item(*row, "sharpe", row[0].Sharpe) for row in sharpe_rows],
            "accuracy": [_ranked_item(*row, "accuracy", row[0].Accuracy) for row in accuracy_rows],
            "totalReturn": [
                _ranked_log_item(model, experiment, blueprint_item, owner, is_favorited, "total_return_net_pct", value)
                for model, experiment, blueprint_item, owner, is_favorited, value in total_return_rows
            ],
            "winRate": [
                _ranked_log_item(model, experiment, blueprint_item, owner, is_favorited, "trade_win_rate_pct", value)
                for model, experiment, blueprint_item, owner, is_favorited, value in win_rate_rows
            ],
        }
    })


@blueprint.get("/rankings")
def get_model_rankings():
    access_control, context = _require_context()
    if not hasattr(context, "user_id"):
        return context

    sort = DIRECT_SORTS.get(request.args.get("sort") or "sharpe", "sharpe")
    order = "asc" if request.args.get("order") == "asc" else "desc"
    page = _int_arg("page") or 1
    page_size = max(1, min(_int_arg("pageSize") or 20, 100))
    experiment_id = _int_arg("experimentId") or _int_arg("experiment_id")
    blueprint_id = _int_arg("blueprintId") or _int_arg("blueprint_id")
    search = request.args.get("q") or None
    filters = _filter_rules_arg()
    include_incomplete = str(request.args.get("includeIncomplete") or "").lower() == "true"

    with UnitOfWork() as uow:
        rows, total = uow.models.list_accessible_page(
            context.user_id,
            is_staff=AccessControlService.is_staff(context),
            experiment_id=experiment_id,
            blueprint_id=blueprint_id,
            include_favorited_for_user_id=context.user_id,
            sort=sort,
            order=order,
            page=page,
            page_size=page_size,
            q=search,
            filters=filters,
            include_incomplete=include_incomplete,
        )
        metrics_by_model = uow.models.backtest_metrics_for_models([int(model.ModelID) for model, *_ in rows if model.ModelID is not None])
        items = [
            _model_item(
                model,
                experiment,
                blueprint_item,
                owner,
                is_favorited=is_favorited,
                log_metrics={"latest": metrics_by_model.get(int(model.ModelID), {}), "items": []},
            )
            for model, experiment, blueprint_item, owner, is_favorited in rows
        ]

    total_pages = max(1, (total + page_size - 1) // page_size)
    return ok_response({"data": {"items": items, "page": page, "pageSize": page_size, "total": total, "totalPages": total_pages, "sort": sort, "order": order}})


@blueprint.get("/library/owned")
def list_owned_models():
    access_control, context = _require_context()
    if not hasattr(context, "user_id"):
        return context
    experiment_id = _int_arg("experimentId") or _int_arg("experiment_id")
    blueprint_id = _int_arg("blueprintId") or _int_arg("blueprint_id")
    with UnitOfWork() as uow:
        rows = uow.models.list_owned(context.user_id, experiment_id=experiment_id, blueprint_id=blueprint_id)
        items = [
            _model_item(model, experiment, blueprint_item, owner, is_favorited=is_favorited)
            for model, experiment, blueprint_item, owner, is_favorited in rows
        ]
    return ok_response({"data": {"items": items}})


@blueprint.get("/library/favorited")
def list_favorited_models():
    access_control, context = _require_context()
    if not hasattr(context, "user_id"):
        return context
    experiment_id = _int_arg("experimentId") or _int_arg("experiment_id")
    blueprint_id = _int_arg("blueprintId") or _int_arg("blueprint_id")
    with UnitOfWork() as uow:
        rows = uow.favorite_models.list_favorited_models_for_user(
            context.user_id,
            is_staff=AccessControlService.is_staff(context),
            experiment_id=experiment_id,
            blueprint_id=blueprint_id,
        )
        items = [
            _model_item(model, experiment, blueprint_item, owner, is_favorited=True)
            for model, experiment, blueprint_item, owner, _ in rows
        ]
    return ok_response({"data": {"items": items}})


@blueprint.get("/<int:model_id>")
def get_model_detail(model_id: int):
    access_control, context = _require_context()
    if not hasattr(context, "user_id"):
        return context

    with UnitOfWork() as uow:
        row = uow.models.get_detail_row(model_id)
        if row is None:
            return error_response("Model not found", 404, code="MODEL_NOT_FOUND")
        model, experiment, blueprint_item, owner = row
        if not ModelController._can_access(experiment, blueprint_item, context):
            return access_control.forbidden_response("Model is not accessible")
        is_favorited = uow.favorite_models.exists(context.user_id, model_id)
        item = _model_item(
            model,
            experiment,
            blueprint_item,
            owner,
            is_favorited=is_favorited,
            log_metrics=_merge_model_logs(uow.experiment_logs.list_by_model(model_id)),
        )
    return ok_response({"data": {"model": item}})


@blueprint.post("/<int:model_id>/favorite")
def favorite_model(model_id: int):
    access_control, context = _require_context()
    if not hasattr(context, "user_id"):
        return context
    with UnitOfWork() as uow:
        row = uow.models.get_detail_row(model_id)
        if row is None:
            return error_response("Model not found", 404, code="MODEL_NOT_FOUND")
        _, experiment, blueprint_item, _ = row
        if not ModelController._can_access(experiment, blueprint_item, context):
            return access_control.forbidden_response("Model is not accessible")
        if not uow.favorite_models.exists(context.user_id, model_id):
            uow.favorite_models.add(FavoriteModel(user_id=context.user_id, model_id=model_id, created_at=datetime.now(timezone.utc)))
    return ok_response({"data": {"favorited": True}})


@blueprint.delete("/<int:model_id>/favorite")
def unfavorite_model(model_id: int):
    access_control, context = _require_context()
    if not hasattr(context, "user_id"):
        return context
    with UnitOfWork() as uow:
        row = uow.models.get_detail_row(model_id)
        if row is None:
            return error_response("Model not found", 404, code="MODEL_NOT_FOUND")
        _, experiment, blueprint_item, _ = row
        if not ModelController._can_access(experiment, blueprint_item, context):
            return access_control.forbidden_response("Model is not accessible")
        uow.favorite_models.remove(context.user_id, model_id)
    return ok_response({"data": {"favorited": False}})
