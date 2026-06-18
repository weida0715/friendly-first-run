"""Concrete queue job strategies."""
from __future__ import annotations
from typing import Any
from app.strategies.job_strategy import JobStrategy

class ExperimentJobStrategy(JobStrategy):
    def __init__(self, handler=None): self._handler = handler
    def execute(self, job_ctx: dict[str, Any]) -> Any:
        if self._handler is None: raise RuntimeError("Experiment handler is not configured.")
        return self._handler(job_ctx.get("payload") or {})
    def cancel(self, job_id: str) -> bool: return bool(job_id)

class DataIngestionJobStrategy(JobStrategy):
    def execute(self, job_ctx: dict[str, Any]) -> Any: return {"ok": True, "type": "DATA_INGESTION", "payload": job_ctx.get("payload")}
    def cancel(self, job_id: str) -> bool: return bool(job_id)

class LogExportJobStrategy(JobStrategy):
    def execute(self, job_ctx: dict[str, Any]) -> Any: return {"ok": True, "type": "LOG_EXPORT", "payload": job_ctx.get("payload")}
    def cancel(self, job_id: str) -> bool: return bool(job_id)
