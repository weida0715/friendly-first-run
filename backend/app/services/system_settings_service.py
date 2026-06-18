"""Runtime system setting helpers with database and environment fallbacks."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from sqlalchemy.exc import ProgrammingError, OperationalError

from app.repositories.unit_of_work import UnitOfWork


@dataclass(frozen=True)
class SettingSpec:
    key: str
    default: int
    minimum: int
    maximum: int
    label: str
    description: str


SYSTEM_SETTING_SPECS: dict[str, SettingSpec] = {
    "queue_job_timeout_seconds": SettingSpec(
        "queue_job_timeout_seconds", 21600, 60, 86400, "Queue job timeout seconds", "Maximum runtime before RQ terminates a job."
    ),
    "max_requested_permutations": SettingSpec(
        "max_requested_permutations", 500, 1, 100000, "Max requested permutations", "Upper bound for experiment model permutations."
    ),
    "max_round_log_rows": SettingSpec(
        "max_round_log_rows", 0, 0, 1000000, "Max round log rows", "Per-model round rows to persist; 0 disables heavy per-candle logs."
    ),
}

ENV_NAMES = {
    "queue_job_timeout_seconds": "QUEUE_JOB_TIMEOUT_SECONDS",
    "max_requested_permutations": "MAX_REQUESTED_PERMUTATIONS",
    "max_round_log_rows": "MAX_ROUND_LOG_ROWS",
}


def _coerce_int(key: str, value: Any) -> int:
    spec = SYSTEM_SETTING_SPECS[key]
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = spec.default
    return max(spec.minimum, min(spec.maximum, parsed))


class SystemSettingsService:
    def __init__(self, unit_of_work_factory=UnitOfWork) -> None:
        self._unit_of_work_factory = unit_of_work_factory

    def defaults(self) -> dict[str, int]:
        result: dict[str, int] = {}
        for key, spec in SYSTEM_SETTING_SPECS.items():
            result[key] = _coerce_int(key, os.getenv(ENV_NAMES[key], spec.default))
        return result

    def get_settings(self) -> dict[str, int]:
        settings = self.defaults()
        try:
            with self._unit_of_work_factory() as uow:
                if getattr(uow, "system_settings", None) is None:
                    return settings
                for key, value in uow.system_settings.list_all().items():
                    if key in SYSTEM_SETTING_SPECS:
                        settings[key] = _coerce_int(key, value)
        except (ProgrammingError, OperationalError):
            return settings
        except Exception:
            return settings
        return settings

    def update_settings(self, payload: dict[str, Any]) -> tuple[dict[str, int] | None, dict[str, list[str]]]:
        errors: dict[str, list[str]] = {}
        updates: dict[str, str] = {}
        for key, value in payload.items():
            if key not in SYSTEM_SETTING_SPECS:
                continue
            spec = SYSTEM_SETTING_SPECS[key]
            try:
                parsed = int(value)
            except (TypeError, ValueError):
                errors.setdefault(key, []).append("Value must be an integer.")
                continue
            if parsed < spec.minimum or parsed > spec.maximum:
                errors.setdefault(key, []).append(f"Value must be between {spec.minimum} and {spec.maximum}.")
                continue
            updates[key] = str(parsed)
        if errors:
            return None, errors
        try:
            with self._unit_of_work_factory() as uow:
                if getattr(uow, "system_settings", None) is not None:
                    uow.system_settings.set_many(updates)
        except (ProgrammingError, OperationalError):
            # Allow deployments to keep running until the new table migration is applied.
            return self.defaults(), {}
        return self.get_settings(), {}

    def metadata(self) -> list[dict[str, Any]]:
        return [{"key": s.key, "default": s.default, "min": s.minimum, "max": s.maximum, "label": s.label, "description": s.description} for s in SYSTEM_SETTING_SPECS.values()]


def get_runtime_settings() -> dict[str, int]:
    return SystemSettingsService().get_settings()