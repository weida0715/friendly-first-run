"""Experiment log strategy contracts."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ExperimentLogStrategy(ABC):
    """Defines log artifact generation behavior."""

    @abstractmethod
    def build(self, payload: dict[str, Any]) -> list[dict[str, Any]] | str:
        ...
