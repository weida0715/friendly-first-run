"""Custom indicator dispatcher."""

from __future__ import annotations

from app.strategies.indicators import (
    IchimokuCloudIndicator,
    PriceRangePositionIndicator,
    QuantileFlagIndicator,
    RollingVolatilityIndicator,
    SMACrossoverIndicator,
    WilderRSIIndicator,
    TimeFeaturesIndicator,
    TrendStrengthIndicator,
    VWAPIndicator,
)

CUSTOM_INDICATORS = {
    "vwap",
    "ichimoku_cloud",
    "quantile_flag",
    "rolling_volatility",
    "wilder_rsi",
    "price_range_position",
    "trend_strength",
    "time_features",
    "sma_crossover",
}


class CustomIndicatorFactory:
    _INDICATORS = {
        "vwap": VWAPIndicator,
        "ichimoku_cloud": IchimokuCloudIndicator,
        "quantile_flag": QuantileFlagIndicator,
        "rolling_volatility": RollingVolatilityIndicator,
        "wilder_rsi": WilderRSIIndicator,
        "price_range_position": PriceRangePositionIndicator,
        "trend_strength": TrendStrengthIndicator,
        "time_features": TimeFeaturesIndicator,
        "sma_crossover": SMACrossoverIndicator,
    }

    @classmethod
    def create(cls, name: str):
        try:
            return cls._INDICATORS[name]()
        except KeyError as exc:
            raise ValueError(f"Unsupported custom indicator: {name}") from exc
