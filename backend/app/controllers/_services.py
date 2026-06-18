"""Shared controller-level service builders."""

from __future__ import annotations

from flask import current_app

from app.infrastructure.redis.job_queue import RedisJobQueue
from app.services.job_metadata_service import JobMetadataService
from app.services.queue_service import QueueService
from app.services.system_settings_service import get_runtime_settings


def build_queue_service() -> QueueService:
    redis_url = current_app.config.get("REDIS_URL", "redis://localhost:6379/0")
    queue_name = current_app.config.get("QUEUE_NAME", "experiments")
    settings = get_runtime_settings()
    return QueueService(RedisJobQueue(redis_url=redis_url, queue_name=queue_name, job_timeout_seconds=settings["queue_job_timeout_seconds"]))


def build_job_metadata_service() -> JobMetadataService:
    redis_url = current_app.config.get("REDIS_URL", "redis://localhost:6379/0")
    queue_name = current_app.config.get("QUEUE_NAME", "experiments")
    settings = get_runtime_settings()
    queue = RedisJobQueue(redis_url=redis_url, queue_name=queue_name, job_timeout_seconds=settings["queue_job_timeout_seconds"])
    return JobMetadataService(queue)
