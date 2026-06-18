"""Compatibility exports and factory for data split strategies."""

from __future__ import annotations

from app.strategies.splits.base import DataSplitStrategy
from app.strategies.splits.random_split_strategy import RandomSplitStrategy
from app.strategies.splits.split_result import SplitResult
from app.strategies.splits.time_based_sequential_split_strategy import TimeBasedSequentialSplitStrategy


class DataSplitStrategyFactory:
    """Resolves data split strategies by config name."""

    _STRATEGIES = {
        "time_based_sequential": TimeBasedSequentialSplitStrategy,
        "sequential": TimeBasedSequentialSplitStrategy,
        "random": RandomSplitStrategy,
    }

    @classmethod
    def create(cls, name: str | None) -> DataSplitStrategy:
        strategy_name = name or "time_based_sequential"
        try:
            return cls._STRATEGIES[strategy_name]()
        except KeyError as exc:
            raise ValueError(f"Unsupported split strategy: {strategy_name}") from exc
