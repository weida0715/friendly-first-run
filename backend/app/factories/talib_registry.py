"""TA-Lib registry for auto-mapping persisted OHLCV columns."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

SQL_TO_TALIB_INPUTS = {"open": "Open", "high": "High",
                       "low": "Low", "close": "Close", "volume": "Volume"}


@dataclass(frozen=True)
class TalibSpec:
    category: str
    talib_inputs: tuple[str, ...]
    parameters: dict[str, Any]

    @property
    def sql_inputs(self) -> list[str]:
        return [SQL_TO_TALIB_INPUTS[name] for name in self.talib_inputs]


def _p(**params: Any) -> dict[str, Any]:
    return params


def _s(category: str, inputs: tuple[str, ...], params: dict[str, Any] | None = None) -> TalibSpec:
    return TalibSpec(category, inputs, params or {})


TALIB_INDICATOR_REGISTRY: dict[str, TalibSpec] = {
    "BBANDS": _s("Overlap Studies", ("close",), _p(timeperiod=5, nbdevup=2, nbdevdn=2, matype=0)),
    "DEMA": _s("Overlap Studies", ("close",), _p(timeperiod=30)),
    "EMA": _s("Overlap Studies", ("close",), _p(timeperiod=30)),
    "HT_TRENDLINE": _s("Overlap Studies", ("close",)),
    "KAMA": _s("Overlap Studies", ("close",), _p(timeperiod=30)),
    "MA": _s("Overlap Studies", ("close",), _p(timeperiod=30, matype=0)),
    "MAMA": _s("Overlap Studies", ("close",), _p(fastlimit=0, slowlimit=0)),
    "MIDPOINT": _s("Overlap Studies", ("close",), _p(timeperiod=14)),
    "MIDPRICE": _s("Overlap Studies", ("high", "low"), _p(timeperiod=14)),
    "SAR": _s("Overlap Studies", ("high", "low"), _p(acceleration=0, maximum=0)),
    "SMA": _s("Overlap Studies", ("close",), _p(timeperiod=30)),
    "T3": _s("Overlap Studies", ("close",), _p(timeperiod=5, vfactor=0)),
    "TEMA": _s("Overlap Studies", ("close",), _p(timeperiod=30)),
    "TRIMA": _s("Overlap Studies", ("close",), _p(timeperiod=30)),
    "WMA": _s("Overlap Studies", ("close",), _p(timeperiod=30)),
    "ADX": _s("Momentum Indicators", ("high", "low", "close"), _p(timeperiod=14)),
    "ADXR": _s("Momentum Indicators", ("high", "low", "close"), _p(timeperiod=14)),
    "APO": _s("Momentum Indicators", ("close",), _p(fastperiod=12, slowperiod=26, matype=0)),
    "AROON": _s("Momentum Indicators", ("high", "low"), _p(timeperiod=14)),
    "AROONOSC": _s("Momentum Indicators", ("high", "low"), _p(timeperiod=14)),
    "BOP": _s("Momentum Indicators", ("open", "high", "low", "close")),
    "CCI": _s("Momentum Indicators", ("high", "low", "close"), _p(timeperiod=14)),
    "CMO": _s("Momentum Indicators", ("close",), _p(timeperiod=14)),
    "DX": _s("Momentum Indicators", ("high", "low", "close"), _p(timeperiod=14)),
    "IMI": _s("Momentum Indicators", ("open", "close"), _p(timeperiod=14)),
    "MACD": _s("Momentum Indicators", ("close",), _p(fastperiod=12, slowperiod=26, signalperiod=9)),
    "MACDEXT": _s("Momentum Indicators", ("close",), _p(fastperiod=12, fastmatype=0, slowperiod=26, slowmatype=0, signalperiod=9, signalmatype=0)),
    "MACDFIX": _s("Momentum Indicators", ("close",), _p(signalperiod=9)),
    "MFI": _s("Momentum Indicators", ("high", "low", "close", "volume"), _p(timeperiod=14)),
    "MINUS_DI": _s("Momentum Indicators", ("high", "low", "close"), _p(timeperiod=14)),
    "MINUS_DM": _s("Momentum Indicators", ("high", "low"), _p(timeperiod=14)),
    "MOM": _s("Momentum Indicators", ("close",), _p(timeperiod=10)),
    "PLUS_DI": _s("Momentum Indicators", ("high", "low", "close"), _p(timeperiod=14)),
    "PLUS_DM": _s("Momentum Indicators", ("high", "low"), _p(timeperiod=14)),
    "PPO": _s("Momentum Indicators", ("close",), _p(fastperiod=12, slowperiod=26, matype=0)),
    "ROC": _s("Momentum Indicators", ("close",), _p(timeperiod=10)),
    "RSI": _s("Momentum Indicators", ("close",), _p(timeperiod=14)),
    "STOCH": _s("Momentum Indicators", ("high", "low", "close"), _p(fastk_period=5, slowk_period=3, slowk_matype=0, slowd_period=3, slowd_matype=0)),
    "STOCHF": _s("Momentum Indicators", ("high", "low", "close"), _p(fastk_period=5, fastd_period=3, fastd_matype=0)),
    "STOCHRSI": _s("Momentum Indicators", ("close",), _p(timeperiod=14, fastk_period=5, fastd_period=3, fastd_matype=0)),
    "TRIX": _s("Momentum Indicators", ("close",), _p(timeperiod=30)),
    "ULTOSC": _s("Momentum Indicators", ("high", "low", "close"), _p(timeperiod1=7, timeperiod2=14, timeperiod3=28)),
    "WILLR": _s("Momentum Indicators", ("high", "low", "close"), _p(timeperiod=14)),
    "AD": _s("Volume Indicators", ("high", "low", "close", "volume")),
    "ADOSC": _s("Volume Indicators", ("high", "low", "close", "volume"), _p(fastperiod=3, slowperiod=10)),
    "OBV": _s("Volume Indicators", ("close", "volume")),
    "ATR": _s("Volatility Indicators", ("high", "low", "close"), _p(timeperiod=14)),
    "NATR": _s("Volatility Indicators", ("high", "low", "close"), _p(timeperiod=14)),
    "TRANGE": _s("Volatility Indicators", ("high", "low", "close")),
    "AVGPRICE": _s("Price Transform", ("open", "high", "low", "close")),
    "MEDPRICE": _s("Price Transform", ("high", "low")),
    "TYPPRICE": _s("Price Transform", ("high", "low", "close")),
    "WCLPRICE": _s("Price Transform", ("high", "low", "close")),
    "HT_DCPERIOD": _s("Cycle Indicators", ("close",)),
    "HT_DCPHASE": _s("Cycle Indicators", ("close",)),
    "HT_PHASOR": _s("Cycle Indicators", ("close",)),
    "HT_SINE": _s("Cycle Indicators", ("close",)),
    "HT_TRENDMODE": _s("Cycle Indicators", ("close",)),
    "BETA": _s("Statistic Functions", ("high", "low"), _p(timeperiod=5)),
    "CORREL": _s("Statistic Functions", ("high", "low"), _p(timeperiod=30)),
    "LINEARREG": _s("Statistic Functions", ("close",), _p(timeperiod=14)),
    "STDDEV": _s("Statistic Functions", ("close",), _p(timeperiod=5, nbdev=1)),
    "TSF": _s("Statistic Functions", ("close",), _p(timeperiod=14)),
    "VAR": _s("Statistic Functions", ("close",), _p(timeperiod=5, nbdev=1)),
}

for _name in ["CDLDOJI", "CDLHAMMER", "CDLENGULFING", "CDLMORNINGSTAR", "CDLEVENINGSTAR", "CDLSHOOTINGSTAR", "CDLHANGINGMAN"]:
    TALIB_INDICATOR_REGISTRY[_name] = _s("Pattern Recognition", ("open", "high", "low", "close"), _p(
        penetration=0) if _name in {"CDLMORNINGSTAR", "CDLEVENINGSTAR"} else {})


def parameter_constraints(parameters: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {name: {"type": "integer" if isinstance(default, int) else "number", "default": default, "required": False, "min": 0} for name, default in parameters.items()}
