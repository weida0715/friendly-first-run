"""Experiment routes including wizard selection helpers."""

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from flask import Blueprint, current_app, request

from app.controllers._access import build_access_control
from app.controllers._services import build_job_metadata_service, build_queue_service
from app.domain.models.experiment import Experiment
from app.domain.models.model import Model
from app.execution.experiment_compiler import ExperimentCompilationError, ExperimentCompiler
from app.domain.value_objects.job_specification import JobSpecification
from app.infrastructure.database.orm.experiment_orm import ExperimentORM
from app.infrastructure.database.orm.experiment_log_orm import ExperimentLogORM
from app.infrastructure.database.orm.model_orm import ModelORM
from app.repositories.unit_of_work import UnitOfWork
from app.responses import error_response, ok_response, validation_error_response
from app.services.queue_service import QueueError, QueueJobNotFoundError, QueueUnavailableError
from app.validators.experiment_validator import ExperimentValidator
from app.strategies.logs.parameter_correlation_strategy import build_parameter_correlation
from app.services.system_settings_service import get_runtime_settings

blueprint = Blueprint("experiments", __name__)


class ExperimentController:
    """Coordinates experiment list, detail, and lifecycle use cases."""

    pass


def _parse_required_iso_datetime(payload: dict, key: str, error_field: str):
    raw = payload.get(key)
    if raw is None or (isinstance(raw, str) and not raw.strip()):
        return None, {error_field: [f"{error_field} is required."]}
    try:
        parsed = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        parsed = parsed.astimezone(timezone.utc)
        return parsed, None
    except ValueError:
        return None, {error_field: [f"{error_field} must be a valid datetime."]}


def _parse_required_experiment_datetime(payload: dict, datetime_key: str, date_key: str, error_field: str):
    candidate_payload = dict(payload)
    if candidate_payload.get(datetime_key) in (None, "") and candidate_payload.get(date_key) not in (None, ""):
        candidate_payload[datetime_key] = candidate_payload.get(date_key)
    return _parse_required_iso_datetime(candidate_payload, datetime_key, error_field)


def _normalize_split_for_storage(raw_value: object) -> Decimal:
    """Normalize split input for ERD storage.

    API accepts percentage-style input (e.g., 80/10/10) from RFC-007 wizard.
    Storage keeps fractional decimals (0.80/0.10/0.10) to satisfy DB checks.
    For backward compatibility, values already in [0, 1] are preserved.
    """

    value = Decimal(str(raw_value))
    if value > Decimal("1"):
        return value / Decimal("100")
    return value


MINUTES_PER_DAY = 24 * 60


def _to_utc_iso(value: datetime) -> str:
    normalized = value if value.tzinfo is not None else value.replace(
        tzinfo=timezone.utc)
    return normalized.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _display_status(status: object, current_stage: object = None, progress: object = None) -> str:
    """Normalize stale persisted status for user-facing experiment displays."""

    raw_status = str(status or "")
    status_key = raw_status.lower()
    try:
        progress_value = float(progress or 0)
    except (TypeError, ValueError):
        progress_value = 0.0
    if status_key == "queued" and current_stage and progress_value > 0:
        return "Running"
    if status_key == "queued" and current_stage:
        return "Running"
    return raw_status


def _reconcile_experiment_state(experiment_id: int, item: ExperimentORM) -> ExperimentORM:
    with UnitOfWork() as stale_uow:
        if stale_uow.experiments is not None:
            stale_uow.experiments.mark_failed(
                experiment_id,
                completed_at=datetime.now(timezone.utc),
                current_stage="Failed: worker stopped or job disappeared before completion",
            )
            return stale_uow.experiments.get_by_id(experiment_id) or item
    return item


def _parse_current_permutation_stage(current_stage: object) -> dict[str, int | str] | None:
    """Extract current permutation progress from executor stage text."""

    text = str(current_stage or "")
    match = re.search(
        r"Permutation\s+(\d+)\s*/\s*(\d+)\s*:\s*([^()]+)", text, re.IGNORECASE)
    if not match:
        return None
    return {
        "current": int(match.group(1)),
        "total": int(match.group(2)),
        "stage": match.group(3).strip(),
    }


def _clamp_completed_permutations_for_active_stage(completed_count: int, current_stage: object, status: object) -> int:
    """Prevent active detail cards from reporting completions ahead of the running permutation."""

    status_key = str(status or "").lower()
    if status_key not in {"queued", "running"}:
        return completed_count
    parsed = _parse_current_permutation_stage(current_stage)
    if parsed is None:
        return completed_count
    current = int(parsed["current"])
    stage = str(parsed["stage"]).lower()
    completed_limit = current if "complete" in stage else max(0, current - 1)
    return min(completed_count, completed_limit)


# Backward-compatible factory names used by tests/monkeypatches.
def _build_queue_service():
    return build_queue_service()


def _build_job_metadata_service():
    return build_job_metadata_service()


def _find_experiment_queue_job(
    *,
    queue_service,
    metadata_service,
    experiment_id: int,
) -> dict | None:
    if hasattr(queue_service, "get_job_id_for_experiment"):
        mapped_job_id = queue_service.get_job_id_for_experiment(experiment_id)
        if mapped_job_id:
            try:
                return metadata_service.get_job_detail(mapped_job_id)
            except QueueJobNotFoundError:
                pass
    if not hasattr(queue_service, "get_active_jobs"):
        return None
    active_jobs = queue_service.get_active_jobs()
    for active in active_jobs:
        job_id = str(active.get("job_id") or "")
        if not job_id:
            continue
        try:
            queue_job = metadata_service.get_job_detail(job_id)
        except QueueJobNotFoundError:
            continue
        if int(queue_job.get("payload_experiment_id") or 0) == experiment_id:
            return queue_job
    return None


def _build_public_model_id_maps(models: list[Model]) -> tuple[dict[int, int], dict[int, Model]]:
    internal_to_public: dict[int, int] = {}
    public_to_model: dict[int, Model] = {}
    for index, model in enumerate(models):
        if model.model_id is None:
            continue
        internal_to_public[int(model.model_id)] = index
        public_to_model[index] = model
    return internal_to_public, public_to_model


@blueprint.post("")
@blueprint.post("/")
def create_experiment():
    payload = request.get_json(silent=True) or {}
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor

    try:
        queue_service = _build_queue_service()
        with UnitOfWork() as uow:
            latest_kline_datetime = uow.market_data.get_latest_timestamp() if uow.market_data else None
            if latest_kline_datetime is not None and latest_kline_datetime.tzinfo is None:
                latest_kline_datetime = latest_kline_datetime.replace(
                    tzinfo=timezone.utc)
            effective_payload = dict(payload)
            if effective_payload.get("end_datetime") in (None, "") and effective_payload.get("end_date") in (None, "") and latest_kline_datetime is not None:
                effective_payload["end_datetime"] = _to_utc_iso(
                    latest_kline_datetime)
            if effective_payload.get("start_datetime") in (None, "") and effective_payload.get("start_date") in (None, "") and effective_payload.get("end_datetime") not in (None, ""):
                end_for_default = datetime.fromisoformat(
                    str(effective_payload["end_datetime"]).replace("Z", "+00:00"))
                effective_payload["start_datetime"] = _to_utc_iso(
                    end_for_default - timedelta(days=7))

            validation = ExperimentValidator.validate(
                effective_payload,
                actor=actor,
                blueprint_repo=uow.blueprints,
            )
            if not validation.ok:
                return validation_error_response(validation.errors, status_code=422)

            payload = effective_payload
            candlestick_amount = payload.get("candlestick_amount")
            uses_candlestick_mode = candlestick_amount not in (None, "")

            if uses_candlestick_mode:
                end_datetime, end_error = _parse_required_experiment_datetime(
                    payload, "end_datetime", "end_date", "endDate")
                if end_error:
                    return validation_error_response(end_error, status_code=422)

                candlestick_count = int(candlestick_amount)
                day_offset = (candlestick_count - 1) // MINUTES_PER_DAY
                start_datetime = end_datetime - timedelta(days=day_offset)
            else:
                start_datetime, start_error = _parse_required_experiment_datetime(
                    payload, "start_datetime", "start_date", "startDate")
                if start_error:
                    return validation_error_response(start_error, status_code=422)

                end_datetime, end_error = _parse_required_experiment_datetime(
                    payload, "end_datetime", "end_date", "endDate")
                if end_error:
                    return validation_error_response(end_error, status_code=422)

            start_date = start_datetime.date()
            end_date = end_datetime.date()
            selected_blueprint = uow.blueprints.get_by_id(
                int(payload["blueprint_id"]))
            compile_payload = {**payload, "start_datetime": _to_utc_iso(
                start_datetime), "end_datetime": _to_utc_iso(end_datetime)}
            try:
                compiled_plan = ExperimentCompiler.compile(
                    blueprint=selected_blueprint, experiment_payload=compile_payload)
            except ExperimentCompilationError as exc:
                return validation_error_response(exc.errors, status_code=422)

            runtime_settings = get_runtime_settings()
            max_requested = runtime_settings["max_requested_permutations"]
            if compiled_plan.requested_permutation_count > max_requested:
                return validation_error_response({
                    "requestedPermutationCount": [f"Requested permutations must be <= {max_requested}. Ask an admin to raise the system limit if needed."]
                }, status_code=422)

            experiment = Experiment(
                experiment_id=None,
                user_id=actor.user_id,
                blueprint_id=int(payload["blueprint_id"]),
                name=str(payload["name"]).strip(),
                description=payload.get("description"),
                interval=payload.get("interval", "1m"),
                start_date=start_date,
                end_date=end_date,
                train_split=_normalize_split_for_storage(
                    payload["train_split"]),
                val_split=_normalize_split_for_storage(payload["val_split"]),
                test_split=_normalize_split_for_storage(payload["test_split"]),
                parameter_overrides=payload.get("parameter_overrides") or {},
                status="Queued",
                progress=Decimal("0"),
                current_stage=None,
                eta_seconds=None,
                success=None,
                created_at=datetime.now(timezone.utc),
                completed_at=None,
                start_datetime=start_datetime,
                end_datetime=end_datetime,
                compiled_blueprint_snapshot=compiled_plan.compiled_blueprint_snapshot,
                compiled_experiment_snapshot=compiled_plan.compiled_experiment_snapshot,
                deterministic=compiled_plan.compiled_experiment_snapshot["deterministic"],
                seed=compiled_plan.compiled_experiment_snapshot["seed"],
                max_permutation_count=compiled_plan.max_permutation_count,
                requested_permutation_count=compiled_plan.requested_permutation_count,
            )
            created = uow.experiments.add(experiment)
            experiment_id = int(created.experiment_id or 0)
            models_to_add = [
                ModelORM(
                    ExperimentID=experiment_id,
                    Parameters=permutation,
                    CreatedAt=datetime.now(timezone.utc),
                    ParameterHash=parameter_hash,
                )
                for permutation in compiled_plan.permutations
                if (parameter_hash := permutation.get("parameter_hash"))
            ]
            if models_to_add:
                uow.session.add_all(models_to_add)

            job_spec = JobSpecification(
                job_type="EXPERIMENT_EXECUTION",
                payload={"experiment_id": experiment_id},
                requested_by_user_id=actor.user_id,
            )
            queue_position = queue_service.enqueue_job(job_spec)

            experiment_row = uow.session.get(
                ExperimentORM,
                int(created.experiment_id or 0),
            )
            if experiment_row is not None:
                experiment_row.JobID = queue_position.job_id
                uow.session.flush()
    except QueueUnavailableError:
        return error_response(
            "Queue service unavailable. Ensure Redis is running.",
            503,
            code="QUEUE_UNAVAILABLE",
        )
    except QueueError as exc:
        current_app.logger.exception("Experiment queue failure during create")
        return error_response(str(exc) or "Queue service failed.", 503, code="QUEUE_UNAVAILABLE")
    except Exception as exc:  # Keep API failures JSON instead of Werkzeug HTML.
        current_app.logger.exception("Experiment creation failed")
        return error_response(str(exc) or "Experiment creation failed.", 500, code="EXPERIMENT_CREATE_FAILED")

    return ok_response(
        {
            "data": {
                "experiment": {
                    "id": created.experiment_id,
                    "detailPath": f"/experiments/{created.experiment_id}",
                    "status": created.status,
                    "progress": float(created.progress or 0),
                    "startDatetime": _to_utc_iso(created.StartDateTime),
                    "endDatetime": _to_utc_iso(created.EndDateTime),
                    "maxPermutationCount": created.max_permutation_count,
                    "requestedPermutationCount": created.requested_permutation_count,
                },
                "job": {
                    "id": queue_position.job_id,
                },
                "queue": {
                    "position": queue_position.position,
                    "queueName": queue_position.queue_name,
                    "etaSeconds": queue_position.eta_seconds,
                },
            }
        },
        status_code=201,
    )


@blueprint.get("")
@blueprint.get("/")
def index():
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor

    status = request.args.get("status") or None
    search = request.args.get("search") or None

    with UnitOfWork() as uow:
        items = uow.experiments.list_by_user_filtered(
            actor.user_id, status=status, search=search)

    return ok_response(
        {
            "data": {
                "items": [
                    {
                        "id": item.experiment_id,
                        "name": item.name,
                        "status": _display_status(item.status, item.current_stage, item.progress),
                        "progress": float(item.progress or 0),
                        "currentStage": item.current_stage,
                        "interval": item.interval,
                        "startDate": item.start_date.isoformat(),
                        "endDate": item.end_date.isoformat(),
                        "startDatetime": _to_utc_iso(item.StartDateTime),
                        "endDatetime": _to_utc_iso(item.EndDateTime),
                        "blueprintId": item.blueprint_id,
                        "createdAt": item.created_at.isoformat(),
                        "completedAt": item.completed_at.isoformat() if item.completed_at else None,
                        "detailPath": f"/experiments/{item.experiment_id}",
                    }
                    for item in items
                ]
            }
        }
    )


@blueprint.get("/<int:experiment_id>")
def get_experiment_detail(experiment_id: int):
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor

    queue_service = _build_queue_service()
    metadata_service = _build_job_metadata_service()
    can_cancel_queued = False
    can_cancel_running = False
    queue_job = None
    runtime_warning = None

    with UnitOfWork() as uow:
        item = uow.experiments.get_by_id(experiment_id)
        if item is None:
            return access_control.forbidden_response("Experiment is not accessible")
        if item.user_id != actor.user_id:
            return access_control.forbidden_response("Experiment is not accessible")
        blueprint = uow.blueprints.get_by_id(item.blueprint_id)
        if uow.experiment_logs and hasattr(uow.experiment_logs, "list_metric_summaries_by_experiment"):
            logs = uow.experiment_logs.list_metric_summaries_by_experiment(
                experiment_id)
        else:
            logs = uow.experiment_logs.list_by_experiment(
                experiment_id) if uow.experiment_logs else []
        models = uow.models.list_by_experiment(
            experiment_id) if uow.models else []

    console_logs = []
    timeline_logs = []
    internal_to_public_model_id, _ = _build_public_model_id_maps(models)

    def _log_metrics_with_model_id(log):
        metrics = dict(log.metrics or {})
        internal_model_id = getattr(log, "model_id", None)
        if internal_model_id is None:
            internal_model_id = getattr(log, "ModelID", None)
        if internal_model_id is not None:
            metrics["modelId"] = internal_to_public_model_id.get(
                int(internal_model_id))
        return metrics

    backtest_logs = [_log_metrics_with_model_id(log) for log in logs if (log.metrics or {}).get(
        "type") == "backtest" or "trade_win_rate_pct" in (log.metrics or {})]
    confusion_metrics = [_log_metrics_with_model_id(log) for log in logs if (log.metrics or {}).get(
        "type") == "confusion" or "precision_pct" in (log.metrics or {})]
    display_status = _display_status(
        item.status, item.current_stage, item.progress)
    status_key = display_status.lower()
    is_completed = status_key == "completed"
    compiled_experiment = item.compiled_experiment_snapshot or {}
    compiled_blueprint = item.compiled_blueprint_snapshot or {}
    architecture = compiled_experiment.get(
        "architecture") or compiled_blueprint.get("architecture") or {}
    indicators = compiled_experiment.get(
        "indicators") or compiled_blueprint.get("indicators") or {}
    effective_parameters = compiled_experiment.get(
        "effective_parameters") or {}
    target_parameters = (
        compiled_experiment.get("target_params")
        or compiled_experiment.get("target_parameters")
        or effective_parameters.get("target")
        or compiled_blueprint.get("target_parameters")
        or compiled_blueprint.get("target_params")
        or {}
    )
    target = {"strategy": compiled_experiment.get("target_strategy") or compiled_blueprint.get(
        "target_strategy"), "parameters": target_parameters}
    split_effective = effective_parameters.get(
        "split") if isinstance(effective_parameters, dict) else {}
    resolved_split_strategy = (
        (split_effective or {}).get("strategy")
        or compiled_experiment.get("split_strategy")
        or (item.parameter_overrides or {}).get("split_strategy")
        or "time_based_sequential"
    )

    run_plan = {
        "maxPermutationCount": item.max_permutation_count or compiled_experiment.get("max_permutation_count") or len(models),
        "requestedPermutationCount": item.requested_permutation_count or compiled_experiment.get("requested_permutation_count") or len(models),
        "executedPermutationCount": 0,
        "selectedParameterHashes": compiled_experiment.get("selected_parameter_hashes") or [m.parameter_hash for m in models if m.parameter_hash],
        "deterministic": item.deterministic,
        "seed": item.seed,
    }
    model_summaries = [
        {
            "modelId": index,
            "id": m.model_id,
            "detailPath": f"/models/{m.model_id}" if m.model_id is not None else None,
            "parameterHash": m.parameter_hash,
            "parameters": m.parameters or {},
        }
        for index, m in enumerate(models)
    ]
    backtest_by_model = {row.get(
        "modelId"): row for row in backtest_logs if row.get("modelId") is not None}
    completed_model_ids = {
        row.get("modelId")
        for row in [*backtest_logs, *confusion_metrics]
        if row.get("modelId") is not None
    }
    metric_completed_count = len([
        model for model in models
        if model.sharpe is not None or model.accuracy is not None or model.precision is not None or model.recall is not None
    ])
    executed_permutation_count = _clamp_completed_permutations_for_active_stage(
        max(len(completed_model_ids), metric_completed_count),
        item.current_stage,
        display_status,
    )
    run_plan["executedPermutationCount"] = executed_permutation_count
    correlation_rows = []
    for public_model_id, model in enumerate(models):
        metrics = backtest_by_model.get(public_model_id) or {}
        if metrics:
            correlation_rows.append({**(model.parameters or {}), **metrics})
    parameter_correlations = build_parameter_correlation(
        correlation_rows, metric="total_return_net_pct", n_boot=80, min_n=10, random_state=int(item.seed or 0)
    )
    best_backtest = max(backtest_logs, key=lambda row: float(
        row.get("total_return_net_pct") or 0), default={})
    latest_backtest = backtest_logs[-1] if backtest_logs else {}
    latest_confusion = confusion_metrics[-1] if confusion_metrics else {}
    latest_model = model_summaries[-1] if model_summaries else {}
    log_statistics = {
        "backtestRows": len(backtest_logs),
        "confusionRows": len(confusion_metrics),
        "parameterCorrelationRows": len(parameter_correlations),
        "modelCount": len(models),
        "executedModelCount": executed_permutation_count,
        "bestTotalReturnNetPct": best_backtest.get("total_return_net_pct"),
        "bestModelId": best_backtest.get("modelId"),
        "latestTradeExpectancyPct": latest_backtest.get("trade_expectancy_pct"),
        "latestSharpePerBar": latest_backtest.get("sharpe_per_bar"),
        "latestPrecisionPct": latest_confusion.get("precision_pct"),
        "latestRecallPct": latest_confusion.get("recall_pct"),
        "latestModelId": latest_model.get("modelId"),
        "latestParameterHash": latest_model.get("parameterHash"),
    }

    def _num(value):
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _best(rows, key, reverse=True):
        candidates = [row for row in rows if _num(row.get(key)) is not None]
        return sorted(candidates, key=lambda row: _num(row.get(key)) or 0, reverse=reverse)[0] if candidates else {}

    return_values = sorted([value for value in (_num(row.get(
        "total_return_net_pct")) for row in backtest_logs) if value is not None])
    mean_return = sum(return_values) / \
        len(return_values) if return_values else None
    median_return = return_values[len(
        return_values) // 2] if return_values else None
    profitable_count = len([value for value in return_values if value > 0])
    best_return_model = _best(backtest_logs, "total_return_net_pct")
    p95_return = return_values[int(
        (len(return_values) - 1) * 0.95)] if return_values else None
    dashboard_warnings = []
    if status_key == "failed":
        dashboard_warnings.append(
            "Experiment failed; results and exported artifacts may be partial.")
    if best_return_model and p95_return is not None and (_num(best_return_model.get("total_return_net_pct")) or 0) > max(1, p95_return * 3):
        dashboard_warnings.append(
            "Best return is an extreme outlier; inspect drawdown, trade count, and consistency.")
    if best_return_model and (_num(best_return_model.get("trades_count")) or 0) < 100:
        dashboard_warnings.append(
            "Best-return model has fewer than 100 trades; statistical evidence may be weak.")
    if best_return_model and (_num(best_return_model.get("max_drawdown_pct")) or 0) > 50:
        dashboard_warnings.append("Best-return model has high drawdown risk.")

    model_dashboard = {
        "summary": {
            "status": display_status,
            "failureReason": item.current_stage if status_key == "failed" else None,
            "executedModels": executed_permutation_count,
            "requestedModels": run_plan["requestedPermutationCount"],
            "maxPermutations": run_plan["maxPermutationCount"],
            "profitableModelCount": profitable_count,
            "profitableModelPct": (profitable_count / len(return_values) * 100) if return_values else 0,
            "meanNetReturnPct": mean_return,
            "medianNetReturnPct": median_return,
            "bestNetReturnPct": best_return_model.get("total_return_net_pct"),
            "bestModelId": best_return_model.get("modelId"),
        },
        "warnings": dashboard_warnings,
        "bestModels": {
            "netReturn": best_return_model,
            "sharpe": _best(backtest_logs, "sharpe_per_bar"),
            "expectancy": _best(backtest_logs, "trade_expectancy_pct"),
            "lowestDrawdown": _best(backtest_logs, "max_drawdown_pct", reverse=False),
        },
        "leaderboard": sorted(backtest_logs, key=lambda row: _num(row.get("total_return_net_pct")) or float("-inf"), reverse=True)[:20],
        "returnDistribution": {
            "values": return_values,
            "best": return_values[-1] if return_values else None,
            "worst": return_values[0] if return_values else None,
            "mean": mean_return,
            "median": median_return,
        },
        "parameterInsights": parameter_correlations[:20],
    }
    artifact_availability = {
        "resultDownloads": is_completed and (bool(backtest_logs) or bool(confusion_metrics) or bool(models)),
        "backtest": is_completed and bool(backtest_logs),
        "confusion": is_completed and bool(confusion_metrics),
        "modelMetrics": is_completed and bool(models),
        "console": bool(console_logs),
        "experimentConfig": True,
    }

    if status_key in {"queued", "running"}:
        try:
            queue_job = _find_experiment_queue_job(
                queue_service=queue_service,
                metadata_service=metadata_service,
                experiment_id=experiment_id,
            )
            queue_state = str((queue_job or {}).get("state") or "").lower()
            can_cancel_queued = queue_state == "queued"
            can_cancel_running = queue_state in {"running", "", "unknown"}
            if not queue_job:
                item = _reconcile_experiment_state(experiment_id, item)
                status_key = "failed"
                display_status = "Failed"
                can_cancel_queued = False
                can_cancel_running = False
        except QueueUnavailableError:
            runtime_warning = "Queue service is unavailable; live job state could not be checked."

    return ok_response(
        {
            "data": {
                "experiment": {
                    "id": item.experiment_id,
                    "name": item.name,
                    "description": item.description,
                    "status": display_status,
                    "progress": float(item.progress or 0),
                    "interval": item.interval,
                    "startDate": item.start_date.isoformat(),
                    "endDate": item.end_date.isoformat(),
                    "startDatetime": _to_utc_iso(item.StartDateTime),
                    "endDatetime": _to_utc_iso(item.EndDateTime),
                    "splits": {
                        "train": float(item.train_split),
                        "val": float(item.val_split),
                        "test": float(item.test_split),
                    },
                    "parameterOverrides": item.parameter_overrides or {},
                    "blueprint": {
                        "id": item.blueprint_id,
                        "name": blueprint.name if blueprint else None,
                        "version": blueprint.version if blueprint else None,
                    },
                    "timestamps": {
                        "createdAt": item.created_at.isoformat(),
                        "completedAt": item.completed_at.isoformat() if item.completed_at else None,
                    },
                    "links": {
                        "models": f"/models?experiment_id={item.experiment_id}",
                        "jobs": f"/jobs?experiment_id={item.experiment_id}",
                        "logs": f"/logs?experiment_id={item.experiment_id}",
                    },
                    "canCancelQueued": can_cancel_queued,
                    "canCancelRunning": can_cancel_running,
                    "canDelete": True,
                    "canRetry": status_key in {"failed", "cancelled"},
                    "runtimeWarning": runtime_warning,
                    "currentStage": item.current_stage,
                    "etaSeconds": item.eta_seconds,
                    "job": {"id": (queue_job or {}).get("job_id") or item.job_id, "state": (queue_job or {}).get("state"), "queueName": (queue_job or {}).get("queue_name"), "position": (queue_job or {}).get("position")},
                    "resultSummary": {"status": display_status, "progress": float(item.progress or 0), "modelsCount": len(models), "executedModels": executed_permutation_count, **run_plan},
                    "configuration": {"interval": item.interval, "startDatetime": _to_utc_iso(item.StartDateTime), "endDatetime": _to_utc_iso(item.EndDateTime), "parameterOverrides": item.parameter_overrides or {}, "compiledExperimentSnapshot": compiled_experiment},
                    "runPlan": run_plan,
                    "artifactAvailability": artifact_availability,
                    "compiledBlueprintSnapshot": compiled_blueprint,
                    "architecture": architecture,
                    "indicators": indicators,
                    "target": target,
                    "readableBlueprint": {"name": compiled_blueprint.get("name") or (blueprint.name if blueprint else None), "version": compiled_blueprint.get("version") or (blueprint.version if blueprint else None), "approvalState": compiled_blueprint.get("approval_state")},
                    "readableArchitecture": {"name": architecture.get("display_name") or architecture.get("name"), "parameters": architecture.get("parameters") or {}},
                    "readableIndicators": {"selected": indicators.get("selected") if isinstance(indicators, dict) else [], "parameters": indicators.get("parameters") if isinstance(indicators, dict) else {}},
                    "readableTarget": target,
                    "split": {"strategy": resolved_split_strategy, "boundaries": (item.compiled_experiment_snapshot or {}).get("split_boundaries") or {}, "ratios": {"train": float(item.train_split), "val": float(item.val_split), "test": float(item.test_split)}},
                    "timeline": [],
                    "consoleLogs": [],
                    "logStatistics": log_statistics,
                    "dashboard": model_dashboard,
                    "backtestLogs": backtest_logs,
                    "confusionMetrics": confusion_metrics,
                    "parameterCorrelations": parameter_correlations,
                    "visualizations": {"equityCurve": [], "returnDistribution": [], "confusionBreakdown": [], "tradeOutcomeDistribution": []},
                    "modelArtifacts": model_summaries,
                    "downloads": {"backtestCsv": f"/logs/experiments/{item.experiment_id}/backtest", "confusionCsv": f"/logs/experiments/{item.experiment_id}/confusion", "consoleCsv": f"/logs/experiments/{item.experiment_id}/console", "splitMetadataCsv": f"/logs/experiments/{item.experiment_id}/split-metadata", "modelMetricsCsv": f"/logs/experiments/{item.experiment_id}/model-metrics", "experimentConfigJson": f"/logs/experiments/{item.experiment_id}/experiment-config"},
                }
            }
        }
    )


@blueprint.get("/blueprint-options")
def list_experiment_blueprint_options():
    access_control = build_access_control()
    actor = access_control.get_authenticated_context(request)
    with UnitOfWork() as uow:
        approved = uow.blueprints.list_by_approval_state("Approved")
        owned = uow.blueprints.list_by_user(actor.user_id) if actor is not None and hasattr(
            uow.blueprints, "list_by_user") else []
        items = list({bp.blueprint_id: bp for bp in [*approved, *owned] if str(
            bp.approval_state).lower() not in {"disapproved", "rejected", "deleted"}}.values())

    return ok_response(
        {
            "data": {
                "items": [
                    {
                        "id": bp.blueprint_id,
                        "name": bp.name,
                        "version": bp.version,
                        "ownerId": bp.user_id,
                        "updatedAt": bp.updated_at.isoformat(),
                    }
                    for bp in items
                ]
            }
        }
    )


@blueprint.post("/<int:experiment_id>/cancel")
def cancel_experiment(experiment_id: int):
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor

    queue_service = _build_queue_service()
    metadata_service = _build_job_metadata_service()

    with UnitOfWork() as uow:
        experiment = uow.experiments.get_by_id(experiment_id)
        if experiment is None or experiment.user_id != actor.user_id:
            return access_control.forbidden_response("Experiment is not accessible")

    queue_job = _find_experiment_queue_job(
        queue_service=queue_service,
        metadata_service=metadata_service,
        experiment_id=experiment_id,
    )
    if queue_job is not None:
        state = str(queue_job.get("state") or "").lower()
        job_id = str(queue_job.get("job_id") or "")
        if state == "queued" and job_id and queue_service.remove_job_from_queue(job_id):
            with UnitOfWork() as uow:
                if uow.experiments is not None:
                    uow.experiments.mark_cancelled(experiment_id, completed_at=datetime.now(
                        timezone.utc), current_stage="Cancelled")
            return ok_response({"data": {"experiment": {"id": experiment_id, "cancelled": True, "jobId": job_id, "reason": "cancelled"}}})
        if state in {"running", "unknown", ""} and job_id and queue_service.cancel_running_job(job_id):
            with UnitOfWork() as uow:
                if uow.experiments is not None:
                    uow.experiments.mark_cancelled(experiment_id, completed_at=datetime.now(
                        timezone.utc), current_stage="Cancelled: running job cancellation requested")
            return ok_response({"data": {"experiment": {"id": experiment_id, "cancelled": True, "jobId": job_id, "reason": "cancelled_running"}}})

    if str(experiment.status or "").lower() in {"queued", "running"}:
        with UnitOfWork() as uow:
            if uow.experiments is not None:
                uow.experiments.mark_cancelled(
                    experiment_id,
                    completed_at=datetime.now(timezone.utc),
                    current_stage="Cancelled: no active queue job found",
                )
        return ok_response({"data": {"experiment": {"id": experiment_id, "cancelled": True, "jobId": None, "reason": "cancelled_stale"}}})

    return ok_response({"data": {"experiment": {"id": experiment_id, "cancelled": False, "reason": "no_active_job"}}})


@blueprint.post("/<int:experiment_id>/retry")
def retry_experiment(experiment_id: int):
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor

    queue_service = _build_queue_service()
    with UnitOfWork() as uow:
        experiment = uow.experiments.get_by_id(experiment_id)
        if experiment is None or experiment.user_id != actor.user_id:
            return access_control.forbidden_response("Experiment is not accessible")
        if str(experiment.status or "").lower() not in {"failed", "cancelled"}:
            return error_response("Only failed or cancelled experiments can be retried.", 409, code="EXPERIMENT_NOT_RETRYABLE")

        job_spec = JobSpecification(
            job_type="EXPERIMENT_EXECUTION",
            payload={"experiment_id": experiment_id},
            requested_by_user_id=actor.user_id,
        )
        queue_position = queue_service.enqueue_job(job_spec)
        row = uow.session.get(ExperimentORM, experiment_id)
        if row is not None:
            uow.session.query(ExperimentLogORM).filter(
                ExperimentLogORM.ExperimentID == experiment_id
            ).delete(synchronize_session=False)
            row.Status = "Queued"
            row.Progress = Decimal("0")
            row.CurrentStage = "Queued for retry"
            row.EtaSeconds = queue_position.eta_seconds
            row.Success = None
            row.CompletedAt = None
            row.JobID = queue_position.job_id
            uow.session.flush()

    return ok_response({"data": {"experiment": {"id": experiment_id, "status": "Queued", "progress": 0, "jobId": queue_position.job_id}, "queue": {"position": queue_position.position, "queueName": queue_position.queue_name, "etaSeconds": queue_position.eta_seconds}}})


@blueprint.delete("/<int:experiment_id>")
def delete_experiment(experiment_id: int):
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor

    with UnitOfWork() as uow:
        experiment = uow.experiments.get_by_id(experiment_id)
        if experiment is None or experiment.user_id != actor.user_id:
            return access_control.forbidden_response("Experiment is not accessible")
        model_ids = [row.ModelID for row in uow.session.query(
            ModelORM).filter(ModelORM.ExperimentID == experiment_id).all()]
        uow.session.query(ExperimentLogORM).filter(
            ExperimentLogORM.ExperimentID == experiment_id).delete(synchronize_session=False)
        if model_ids:
            uow.session.query(ModelORM).filter(ModelORM.ModelID.in_(
                model_ids)).delete(synchronize_session=False)
        row = uow.session.get(ExperimentORM, experiment_id)
        if row is not None:
            uow.session.delete(row)

    return ok_response({"data": {"deleted": True, "experimentId": experiment_id}})
