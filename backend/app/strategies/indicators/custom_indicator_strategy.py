"""Custom indicator dispatcher."""

from __future__ import annotations

from app.strategies.indicators import IchimokuCloudIndicator, QuantileFlagIndicator, VWAPIndicator

CUSTOM_INDICATORS = {"vwap", "ichimoku_cloud", "quantile_flag"}


class CustomIndicatorFactory:
    _INDICATORS = {
        "vwap": VWAPIndicator,
        "ichimoku_cloud": IchimokuCloudIndicator,
        "quantile_flag": QuantileFlagIndicator,
    }

    @classmethod
    def create(cls, name: str):
        try:
            return cls._INDICATORS[name]()
        except KeyError as exc:
            raise ValueError(f"Unsupported custom indicator: {name}") from exc
