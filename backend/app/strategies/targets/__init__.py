"""Target strategy exports."""

from app.strategies.targets.forward_return_target_strategy import ForwardReturnTargetStrategy
from app.strategies.targets.roc_lookahead_target_strategy import RocLookaheadTargetStrategy

__all__ = ["ForwardReturnTargetStrategy", "RocLookaheadTargetStrategy"]
