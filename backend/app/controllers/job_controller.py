"""Job detail routes with ownership checks."""

from __future__ import annotations

from flask import Blueprint, request

from app.controllers._access import build_access_control
from app.controllers._services import build_job_metadata_service, build_queue_service
from app.repositories.unit_of_work import UnitOfWork
from app.strategies.job_cancellation import JobCancellationHandlerRegistry
from app.responses import error_response
from app.responses import ok_response
from app.services.access_control_service import AccessControlService
from app.services.queue_service import (
    QueueJobNotFoundError,
    QueueService,
    QueueUnavailableError,
)

blueprint = Blueprint("jobs", __name__)


class JobController:
    """Coordinates job detail, queue, and cancellation use cases."""

    pass


# Backward-compatible factory names used by tests/monkeypatches.
def _build_job_metadata_service():
    return build_job_metadata_service()


def _build_queue_service() -> QueueService:
    return build_queue_service()


@blueprint.get("/")
def index():
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor

    metadata_service = _build_job_metadata_service()
    queue_service = _build_queue_service()
    active_jobs = queue_service.get_active_jobs()

    items = []
    with UnitOfWork() as uow:
        queue_metadata_rows: list[dict] = []
        for active in active_jobs:
            job_id = str(active.get("job_id") or "")
            if not job_id:
                continue
            try:
                queue_job = metadata_service.get_job_detail(job_id)
            except QueueJobNotFoundError:
                continue

            queue_metadata_rows.append(queue_job)

        experiment_ids = {
            int(row.get("payload_experiment_id") or 0)
            for row in queue_metadata_rows
            if row.get("payload_experiment_id") not in (None, "")
        }
        experiments = uow.experiments.list_by_ids(
            list(experiment_ids)) if uow.experiments else []
        experiments_by_id = {int(exp.experiment_id or 0): exp for exp in experiments}

        for queue_job in queue_metadata_rows:
            queue_job_id = str(queue_job.get("job_id") or "")
            if not queue_job_id:
                continue
            experiment_id = int(queue_job.get("payload_experiment_id") or 0)
            experiment = experiments_by_id.get(experiment_id)
            if experiment is None:
                continue

            can_view = AccessControlService.is_owner(
                actor, experiment.user_id) or AccessControlService.is_staff(actor)
            if not can_view:
                continue

            items.append(
                {
                    "id": queue_job_id,
                    "state": queue_job.get("state"),
                    "type": queue_job.get("job_type") or "EXPERIMENT_EXECUTION",
                    "ownerId": experiment.user_id,
                    "queue": {
                        "name": queue_job.get("queue_name"),
                        "position": queue_job.get("queue_position"),
                    },
                    "experiment": {
                        "id": experiment.experiment_id,
                        "name": experiment.name,
                        "status": experiment.status,
                        "progress": float(experiment.progress or 0),
                    },
                    "detailPath": f"/jobs/{queue_job_id}",
                }
            )

    return ok_response({"data": {"items": items}})


@blueprint.get("/<string:job_id>")
def get_job_detail(job_id: str):
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor

    service = _build_job_metadata_service()
    try:
        queue_job = service.get_job_detail(job_id)
    except QueueJobNotFoundError:
        return error_response("Job not found", 404, code="JOB_NOT_FOUND")
    except QueueUnavailableError:
        return error_response("Queue service unavailable", 503, code="QUEUE_UNAVAILABLE")

    experiment_id = queue_job.get("payload_experiment_id")
    if experiment_id is None:
        return error_response("Job payload is missing experiment mapping", 422, code="JOB_MAPPING_INVALID")

    with UnitOfWork() as uow:
        if uow.experiments is None:
            return error_response("Experiment repository unavailable", 503, code="REPOSITORY_UNAVAILABLE")
        experiment = uow.experiments.get_by_id(int(experiment_id))

    if experiment is None:
        return error_response("Mapped experiment not found", 404, code="EXPERIMENT_NOT_FOUND")

    can_view = AccessControlService.is_owner(
        actor, experiment.user_id) or AccessControlService.is_staff(actor)
    if not can_view:
        return access_control.forbidden_response("Job is not accessible")

    return ok_response(
        {
            "data": {
                "job": {
                    "id": queue_job.get("job_id"),
                    "state": queue_job.get("state"),
                    "type": queue_job.get("job_type") or "EXPERIMENT_EXECUTION",
                    "ownerId": experiment.user_id,
                    "queue": {
                        "name": queue_job.get("queue_name"),
                        "position": queue_job.get("queue_position"),
                    },
                    "worker": {
                        "name": queue_job.get("worker_name"),
                    },
                    "timestamps": {
                        "enqueuedAt": queue_job.get("enqueued_at"),
                        "startedAt": queue_job.get("started_at"),
                        "endedAt": queue_job.get("ended_at"),
                    },
                    "error": {
                        "snippet": queue_job.get("error_snippet"),
                    },
                    "experiment": {
                        "id": experiment.experiment_id,
                        "name": experiment.name,
                        "status": experiment.status,
                        "progress": float(experiment.progress or 0),
                    },
                }
            }
        }
    )


@blueprint.post("/<string:job_id>/cancel")
def cancel_job(job_id: str):
    access_control = build_access_control()
    actor = access_control.require_authenticated(request)
    if not hasattr(actor, "user_id"):
        return actor

    metadata_service = _build_job_metadata_service()
    queue_service = _build_queue_service()

    try:
        queue_job = metadata_service.get_job_detail(job_id)
    except QueueJobNotFoundError:
        return error_response("Job not found", 404, code="JOB_NOT_FOUND")
    except QueueUnavailableError:
        return error_response("Queue service unavailable", 503, code="QUEUE_UNAVAILABLE")

    experiment_id = queue_job.get("payload_experiment_id")
    if experiment_id is None:
        return error_response("Job payload is missing experiment mapping", 422, code="JOB_MAPPING_INVALID")

    with UnitOfWork() as uow:
        if uow.experiments is None:
            return error_response("Experiment repository unavailable", 503, code="REPOSITORY_UNAVAILABLE")
        experiment = uow.experiments.get_by_id(int(experiment_id))

    if experiment is None:
        return error_response("Mapped experiment not found", 404, code="EXPERIMENT_NOT_FOUND")

    can_manage = AccessControlService.is_owner(
        actor, experiment.user_id) or AccessControlService.is_staff(actor)
    if not can_manage:
        return access_control.forbidden_response("Job is not accessible")

    state = str(queue_job.get("state") or "").lower()
    if state == "queued":
        cancelled = queue_service.remove_job_from_queue(job_id)
    elif state == "running":
        cancelled = queue_service.cancel_running_job(job_id)
    else:
        return error_response(
            f"Job cannot be canceled from state: {state or 'unknown'}",
            409,
            code="JOB_NOT_CANCELLABLE",
        )

    if not cancelled:
        return error_response("Failed to cancel job", 409, code="JOB_CANCEL_FAILED")

    return ok_response(
        {
            "data": {
                "job": {
                    "id": job_id,
                    "state": "canceled",
                    "cancelled": True,
                }
            }
        }
    )
