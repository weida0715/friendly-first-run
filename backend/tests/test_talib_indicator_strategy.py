from __future__ import annotations

import pytest
import polars as pl

from app.strategies.indicators.talib_indicator_strategy import TA_LIB_AVAILABLE, TalibIndicatorStrategy


def _ohlcv_frame(rows: int = 80) -> pl.LazyFrame:
    close = [100.0 + (i * 0.5) + ((i % 5) * 0.1) for i in range(rows)]
    return pl.DataFrame({
        "open": [value - 0.2 for value in close],
        "high": [value + 1.0 for value in close],
        "low": [value - 1.0 for value in close],
        "close": close,
        "volume": [1000.0 + i for i in range(rows)],
    }).lazy()


@pytest.mark.skipif(not TA_LIB_AVAILABLE, reason="TA-Lib is not installed")
def test_talib_ad_uses_high_low_close_volume_signature():
    result = TalibIndicatorStrategy().apply(_ohlcv_frame(), "AD", {}).collect()

    assert "ad" in result.columns
    assert result.height == 80


@pytest.mark.skipif(not TA_LIB_AVAILABLE, reason="TA-Lib is not installed")
@pytest.mark.parametrize(
    ("name", "params", "expected_columns"),
    [
        ("ADX", {"timeperiod": 14}, ["adx"]),
        ("AROON", {"timeperiod": 14}, ["aroon_aroon_down", "aroon_aroon_up"]),
        ("ATR", {"timeperiod": 14}, ["atr"]),
        ("BBANDS", {"timeperiod": 5, "nbdevup": 2, "nbdevdn": 2, "matype": 0}, ["bbands_upper", "bbands_middle", "bbands_lower"]),
        ("CCI", {"timeperiod": 14}, ["cci"]),
        ("CDLDOJI", {}, ["cdldoji"]),
        ("DEMA", {"timeperiod": 14}, ["dema"]),
        ("EMA", {"timeperiod": 15}, ["ema"]),
        ("MACD", {"fastperiod": 12, "slowperiod": 26, "signalperiod": 9}, ["macd_macd", "macd_signal", "macd_hist"]),
        ("MFI", {"timeperiod": 14}, ["mfi"]),
        ("NATR", {"timeperiod": 14}, ["natr"]),
        ("OBV", {}, ["obv"]),
        ("RSI", {"timeperiod": 14}, ["rsi"]),
        ("TRANGE", {}, ["trange"]),
        ("WILLR", {"timeperiod": 14}, ["willr"]),
    ],
)
def test_talib_selected_experiment_indicators_use_correct_signatures(name, params, expected_columns):
    result = TalibIndicatorStrategy().apply(_ohlcv_frame(), name, params).collect()

    for column in expected_columns:
        assert column in result.columns


@pytest.mark.skipif(not TA_LIB_AVAILABLE, reason="TA-Lib is not installed")
def test_talib_rejects_malformed_numeric_params_cleanly():
    with pytest.raises(ValueError, match="must be numeric"):
        TalibIndicatorStrategy().apply(_ohlcv_frame(), "EMA", {"timeperiod": "45`"}).collect()


@pytest.mark.skipif(not TA_LIB_AVAILABLE, reason="TA-Lib is not installed")
def test_talib_rejects_unexpanded_list_params_cleanly():
    with pytest.raises(ValueError, match="must be scalar"):
        TalibIndicatorStrategy().apply(_ohlcv_frame(), "EMA", {"timeperiod": [15, 30]}).collect()


@pytest.mark.skipif(not TA_LIB_AVAILABLE, reason="TA-Lib is not installed")
def test_talib_warmup_nan_rows_can_be_cleaned_before_training():
    from app.architectures.logistic_regressor_architecture import LogisticRegressorArchitecture
    from app.strategies.indicator_strategy import drop_warmup_nulls

    with_indicators = TalibIndicatorStrategy().apply(_ohlcv_frame(), "ADX", {"timeperiod": 14})
    cleaned = drop_warmup_nulls(with_indicators).with_columns(
        (pl.col("close").shift(-1) > pl.col("close")).fill_null(False).cast(pl.Int8).alias("target")
    )

    architecture = LogisticRegressorArchitecture()
    architecture.train(cleaned)
    predictions = architecture.predict(cleaned)

    assert len(predictions["_preds"]) == cleaned.collect().height


def test_drop_warmup_nulls_ignores_decimal_columns_for_is_finite():
    from decimal import Decimal

    from app.strategies.indicator_strategy import drop_warmup_nulls

    frame = pl.DataFrame(
        {
            "open": [Decimal("1.0"), Decimal("2.0"), Decimal("3.0")],
            "close": [Decimal("1.5"), Decimal("2.5"), Decimal("3.5")],
            "adx": [float("nan"), 10.0, 11.0],
        },
        schema={
            "open": pl.Decimal(precision=20, scale=8),
            "close": pl.Decimal(precision=20, scale=8),
            "adx": pl.Float64,
        },
    )

    cleaned = drop_warmup_nulls(frame.lazy()).collect()

    assert cleaned.height == 2
    assert cleaned["adx"].to_list() == [10.0, 11.0]