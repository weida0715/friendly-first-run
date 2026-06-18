"""Metrics strategy contracts."""

from __future__ import annotations

from typing import Any


class MetricsStrategy:
    """Defines metric computation for experiment outputs."""

    def compute(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError
