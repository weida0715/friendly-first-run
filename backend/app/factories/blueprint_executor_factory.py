"""Compile stored Blueprint JSON into executable strategy objects."""

from __future__ import annotations

from app.factories.architecture_factory import ArchitectureFactory
from app.factories.indicator_factory import IndicatorFactory


class BlueprintExecutorFactory:
    @classmethod
    def create(cls, blueprint: dict):
        architecture_cfg = blueprint.get("architecture") or {}
        indicators_cfg = blueprint.get("indicators") or {}
        return {
            "architecture": ArchitectureFactory.create(architecture_cfg.get("name")),
            "indicators": [IndicatorFactory.create(name) for name in indicators_cfg.get("selected", []) if name.islower()],
        }
