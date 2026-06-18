"""Experiment log download endpoints."""
from __future__ import annotations
import csv
import io
import json
from flask import Blueprint, Response, request
from app.controllers._access import build_access_control
from app.executors.default_experiment_executor import DefaultExperimentExecutor, _build_round_log_rows
from app.infrastructure.database.orm.blueprint_orm import BlueprintORM
from app.infrastructure.database.orm.experiment_orm import ExperimentORM
from app.infrastructure.database.orm.user_orm import UserORM
from app.repositories.unit_of_work import UnitOfWork
from app.responses import error_response, ok_response
from app.services.access_control_service import AccessControlService
from app.strategies.trading.long_only_single_position_strategy import BACKTEST_FIELDS
from app.strategies.logs.confusion_metrics_log_strategy import CONFUSION_FIELDS
from app.strategies.logs.parameter_correlation_strategy import build_parameter_correlation

blueprint = Blueprint("logs", __name__)


class LogsDownloadController:
    pass


def _require_experiment(experiment_id: int):
    actor = build_access_control().require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor, None
    with UnitOfWork() as uow:
        exp = uow.experiments.get_by_id(
            experiment_id) if uow.experiments else None
        public = bool(uow.session.query(ExperimentORM.ExperimentID)
            .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
            .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
            .filter(
                ExperimentORM.ExperimentID == experiment_id,
                UserORM.Status == "Enabled",
                ExperimentORM.Status == "Completed",
                ExperimentORM.Success.is_(True),
                BlueprintORM.ApprovalState == "Approved",
            )
            .first())
        allowed = exp is not None and (
            exp.user_id == actor.user_id
            or AccessControlService.is_staff(actor)
            or public
        )
        if not allowed:
            return None, None
    return actor, exp


def _require_completed(exp):
    if str(exp.status) != "Completed" or exp.success is not True:
        return error_response("Only completed successful experiments can be exported", 409)
    return None


def _csv_response(rows, headers, filename):
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return Response(buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})


def _logs_by_type(experiment_id: int, log_type: str):
    with UnitOfWork() as uow:
        if not uow.experiment_logs:
            return []
        if hasattr(uow.experiment_logs, "list_by_experiment_and_type"):
            return uow.experiment_logs.list_by_experiment_and_type(experiment_id, log_type)
        return [log for log in uow.experiment_logs.list_by_experiment(experiment_id) if (log.metrics or {}).get("type") == log_type]


def _round_rows(model_id: int):
    with UnitOfWork() as uow:
        if not uow.experiment_logs:
            return []
        if hasattr(uow.experiment_logs, "list_by_model_and_type"):
            return uow.experiment_logs.list_by_model_and_type(model_id, "round")
        return [log for log in uow.experiment_logs.list_by_model(model_id) if (log.metrics or {}).get("type") == "round"]


def _round_log_unavailable_response():
    return error_response("Round log could not be regenerated for this model.", 409)


def _regenerate_round_rows(experiment_id: int, public_model_id: int):
    executor = DefaultExperimentExecutor()
    ctx = executor.ExecutionContext(experiment_id=experiment_id)
    ctx.config = executor.load_config(ctx)
    with UnitOfWork() as uow:
        if uow.models is None:
            return []
        models = uow.models.list_by_experiment(experiment_id)
    if public_model_id < 0 or public_model_id >= len(models):
        return []
    model = models[public_model_id]
    params = dict(model.Parameters or {})
    if model.ParameterHash and "parameter_hash" not in params:
        params["parameter_hash"] = model.ParameterHash
    if ctx.config is not None:
        ctx.config["_current_params"] = params

    try:
        raw_klines = executor.load_klines(ctx)
        interval_data = executor.aggregate_interval(raw_klines, ctx)
        executor.validate_range(interval_data, ctx)
        base_splits = executor.split_data(interval_data, ctx)
        compiled_blueprint = executor.compile_blueprint(ctx)
        active_splits = executor.prepare_permutation_splits(
            base_splits, params, ctx)
        architecture = executor.create_architecture(
            compiled_blueprint, params, ctx)
        train_params = params.get("architecture", params)
        architecture.train(active_splits.train, **train_params)
        predictions = architecture.predict(active_splits.test)
        if ctx.config is not None:
            ctx.config["_latest_test_data"] = active_splits.test
            ctx.config["_latest_predictions"] = predictions
        test_rows = active_splits.test.collect().height
        return _build_round_log_rows(
            ctx,
            int(model.ModelID or 0),
            model.ParameterHash,
            max_rows=max(1, test_rows),
        )
    except Exception:
        return []


def _build_public_model_id_maps(experiment_id: int):
    with UnitOfWork() as uow:
        models = uow.models.list_by_experiment(
            experiment_id) if uow.models else []
    internal_to_public = {}
    public_to_internal = {}
    model_metrics_rows = []
    for index, model in enumerate(models):
        if model.model_id is None:
            continue
        internal_to_public[int(model.model_id)] = index
        public_to_internal[index] = int(model.model_id)
        model_metrics_rows.append({
            "modelId": index,
            "parameter_hash": model.parameter_hash,
            "sharpe": model.sharpe,
            "accuracy": model.accuracy,
            "precision": model.precision,
            "recall": model.recall,
            "parameters": model.parameters or {},
        })
    return internal_to_public, public_to_internal, model_metrics_rows


def _with_public_model_ids(experiment_id: int, rows: list[dict]) -> list[dict]:
    internal_to_public, _, _ = _build_public_model_id_maps(experiment_id)
    mapped = []
    for row in rows:
        next_row = dict(row)
        internal_model_id = next_row.get("model_id")
        if internal_model_id is None:
            internal_model_id = next_row.get("ModelID")
        if internal_model_id is not None:
            public_model_id = internal_to_public.get(int(internal_model_id))
            next_row.pop("model_id", None)
            next_row.pop("ModelID", None)
            if public_model_id is not None:
                next_row["modelId"] = public_model_id
        mapped.append(next_row)
    return mapped


@blueprint.get("/")
def index(): return ok_response(
    {"controller": "LogsDownloadController", "implemented": True})


@blueprint.get("/experiments/<int:experiment_id>/<string:artifact>")
def download(experiment_id: int, artifact: str):
    actor, exp = _require_experiment(experiment_id)
    if actor is not None and not hasattr(actor, "user_id"):
        return actor
    if exp is None:
        return error_response("Experiment is not accessible", 403)
    incomplete = _require_completed(exp)
    if incomplete is not None:
        return incomplete
    if artifact == "backtest":
        rows = _with_public_model_ids(experiment_id, [
                                      l.metrics or {} for l in _logs_by_type(experiment_id, "backtest")])
        selected = [r for r in rows if r.get(
            "type") in {None, "backtest"} and any(k in r for k in BACKTEST_FIELDS)]
        if not selected:
            return error_response("Backtest results are not available yet.", 409)
        return _csv_response(selected, ["modelId", *BACKTEST_FIELDS], f"experiment-{experiment_id}-backtest.csv")
    if artifact == "confusion":
        rows = _with_public_model_ids(experiment_id, [
                                      l.metrics or {} for l in _logs_by_type(experiment_id, "confusion")])
        selected = [r for r in rows if r.get("type") in {None, "confusion"} and any(
            k in r for k in CONFUSION_FIELDS)]
        if not selected:
            return error_response("Confusion metrics are not available yet.", 409)
        return _csv_response(selected, ["modelId", *CONFUSION_FIELDS], f"experiment-{experiment_id}-confusion.csv")
    if artifact == "parameter-correlation":
        rows = _with_public_model_ids(experiment_id, [
                                      l.metrics or {} for l in _logs_by_type(experiment_id, "backtest")])
        backtest_rows = [r for r in rows if r.get(
            "type") in {None, "backtest"} and any(k in r for k in BACKTEST_FIELDS)]
        by_model = {r.get("modelId"): r for r in backtest_rows}
        _, _, model_metrics_rows = _build_public_model_id_maps(experiment_id)
        correlation_rows = []
        for model in model_metrics_rows:
            metrics = by_model.get(model["modelId"]) or {}
            if metrics:
                correlation_rows.append(
                    {**(model.get("parameters") or {}), **metrics})
        selected = build_parameter_correlation(
            correlation_rows, metric="total_return_net_pct", n_boot=80, min_n=10, random_state=int(exp.seed or 0))
        if not selected:
            return error_response("Parameter correlations are not available yet.", 409)
        headers = ["cohort_pct", "feature", "n_rows", "corr",
                   "corr_med", "ci_lo", "ci_hi", "sign_stability"]
        return _csv_response(selected, headers, f"experiment-{experiment_id}-parameter-correlation.csv")
    if artifact == "console":
        rows = [l.metrics or {}
                for l in _logs_by_type(experiment_id, "console")]
        return _csv_response([r for r in rows if r.get("type") == "console"], ["timestamp", "level", "message"], f"experiment-{experiment_id}-console.csv")
    if artifact == "split-metadata":
        rows = [l.metrics or {}
                for l in _logs_by_type(experiment_id, "split_metadata")]
        return _csv_response([r for r in rows if r.get("type") == "split_metadata"], ["split", "start", "end", "rows"], f"experiment-{experiment_id}-split-metadata.csv")
    if artifact == "model-metrics":
        _, _, model_metrics_rows = _build_public_model_id_maps(experiment_id)
        if not model_metrics_rows:
            return error_response("Model metrics are not available yet.", 409)
        return _csv_response(model_metrics_rows, ["modelId", "parameter_hash", "sharpe", "accuracy", "precision", "recall"], f"experiment-{experiment_id}-model-metrics.csv")
    if artifact == "experiment-config":
        body = json.dumps({"id": exp.experiment_id, "name": exp.name, "interval": exp.interval,
                          "parameterOverrides": exp.parameter_overrides or {}}, default=str)
        return Response(body, mimetype="application/json", headers={"Content-Disposition": f"attachment; filename=experiment-{experiment_id}-config.json"})
    return error_response("Unknown log artifact", 404)


@blueprint.get("/experiments/<int:experiment_id>/models/<int:model_id>/round")
def model_round_log(experiment_id: int, model_id: int):
    actor = build_access_control().require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor
    with UnitOfWork() as uow:
        experiment = uow.experiments.get_by_id(
            experiment_id) if uow.experiments else None
        if experiment is None or experiment.user_id != actor.user_id:
            return error_response("Experiment is not accessible", 403)
        incomplete = _require_completed(experiment)
        if incomplete is not None:
            return incomplete
        models = uow.models.list_by_experiment(
            experiment_id) if uow.models else []
        if model_id < 0 or model_id >= len(models):
            return error_response("Model is not accessible", 404)
        internal_model_id = int(models[model_id].model_id)
        logs = _round_rows(internal_model_id)
    rows = []
    for log in logs:
        metrics = log.metrics or {}
        if metrics.get("type") != "round":
            continue
        rows.append({
            "roundIndex": metrics.get("round_index"),
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "predicted": metrics.get("predicted", log.prediction),
            "actual": metrics.get("actual"),
            "outcome": metrics.get("outcome", "none"),
            "signal": log.signal,
            "parameterHash": metrics.get("parameter_hash"),
        })
    if not rows:
        rows = _regenerate_round_rows(experiment_id, model_id)
    if not rows:
        return _round_log_unavailable_response()
    return ok_response({"data": {"experimentId": experiment_id, "modelId": model_id, "rows": rows}})


@blueprint.get("/experiments/<int:experiment_id>/models/<int:model_id>/round.csv")
def model_round_log_csv(experiment_id: int, model_id: int):
    actor = build_access_control().require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor
    with UnitOfWork() as uow:
        experiment = uow.experiments.get_by_id(
            experiment_id) if uow.experiments else None
        if experiment is None or experiment.user_id != actor.user_id:
            return error_response("Experiment is not accessible", 403)
        incomplete = _require_completed(experiment)
        if incomplete is not None:
            return incomplete
        models = uow.models.list_by_experiment(
            experiment_id) if uow.models else []
        if model_id < 0 or model_id >= len(models):
            return error_response("Model is not accessible", 404)
        internal_model_id = int(models[model_id].model_id)
        logs = _round_rows(internal_model_id)
    rows = []
    for log in logs:
        metrics = log.metrics or {}
        if metrics.get("type") != "round":
            continue
        rows.append({
            "roundIndex": metrics.get("round_index"),
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "predicted": metrics.get("predicted", log.prediction),
            "actual": metrics.get("actual"),
            "outcome": metrics.get("outcome", "none"),
            "signal": log.signal,
            "parameterHash": metrics.get("parameter_hash"),
        })
    if not rows:
        rows = _regenerate_round_rows(experiment_id, model_id)
    if not rows:
        return _round_log_unavailable_response()
    return _csv_response(rows, ["roundIndex", "timestamp", "predicted", "actual", "outcome", "signal", "parameterHash"], f"experiment-{experiment_id}-model-{model_id}-round-log.csv")
