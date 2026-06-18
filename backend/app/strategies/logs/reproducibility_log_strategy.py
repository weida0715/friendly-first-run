"""Reproducibility log builder."""

from __future__ import annotations

from typing import Any

from app.strategies.experiment_log_strategy import ExperimentLogStrategy


class ReproducibilityLogStrategy(ExperimentLogStrategy):
    """Return the payload as-is for deterministic comparisons."""

    def build(self, payload: dict[str, Any]) -> dict[str, Any]:
        return dict(payload)

