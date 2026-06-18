"""Compatibility exports and factory for target strategies."""

from __future__ import annotations

from app.strategies.targets.base import TargetStrategy
from app.strategies.targets.forward_return_target_strategy import ForwardReturnTargetStrategy
from app.strategies.targets.roc_lookahead_target_strategy import RocLookaheadTargetStrategy


class TargetStrategyFactory:
    _STRATEGIES = {
        "forward_return": ForwardReturnTargetStrategy,
        "roc_lookahead": RocLookaheadTargetStrategy,
    }

    @classmethod
    def create(cls, name: str | None, params: dict | None = None) -> TargetStrategy:
        strategy_name = name or "forward_return"
        try:
            return cls._STRATEGIES[strategy_name](**(params or {}))
        except KeyError as exc:
            raise ValueError(f"Unsupported target strategy: {strategy_name}") from exc
