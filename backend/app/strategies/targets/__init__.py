"""Target strategy exports."""

from app.strategies.targets.forward_return_target_strategy import ForwardReturnTargetStrategy
from app.strategies.targets.candle_direction_target_strategy import CandleDirectionTargetStrategy
from app.strategies.targets.quantile_flag_target_strategy import QuantileFlagTargetStrategy
from app.strategies.targets.trade_quality_target_strategies import (
    CostAdjustedForwardReturnTargetStrategy,
    MfeMaeTradeQualityTargetStrategy,
    TripleBarrierTargetStrategy,
    VolatilityAdjustedForwardReturnTargetStrategy,
)

__all__ = [
    "ForwardReturnTargetStrategy",
    "CandleDirectionTargetStrategy",
    "QuantileFlagTargetStrategy",
    "CostAdjustedForwardReturnTargetStrategy",
    "TripleBarrierTargetStrategy",
    "VolatilityAdjustedForwardReturnTargetStrategy",
    "MfeMaeTradeQualityTargetStrategy",
]
