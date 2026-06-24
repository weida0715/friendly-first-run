"""Metrics strategy contracts."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class MetricsStrategy(ABC):
    """Defines metric computation for experiment outputs."""

    @abstractmethod
    def compute(self, payload: dict[str, Any]) -> dict[str, Any]:
        ...
