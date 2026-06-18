"""Backtest log builder."""

from __future__ import annotations

from typing import Any

from app.strategies.experiment_log_strategy import ExperimentLogStrategy


class BacktestLogStrategy(ExperimentLogStrategy):
    """Return the already-computed backtest metrics unchanged."""

    def build(self, payload: dict[str, Any]) -> dict[str, Any]:
        return dict(payload.get("metrics") or {})

