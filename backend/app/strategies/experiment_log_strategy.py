"""Experiment log strategy contracts."""

from __future__ import annotations

from typing import Any


class ExperimentLogStrategy:
    """Defines log artifact generation behavior."""

    def build(self, payload: dict[str, Any]) -> list[dict[str, Any]] | str:
        raise NotImplementedError
