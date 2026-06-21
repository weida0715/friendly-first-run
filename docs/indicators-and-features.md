---
title: Indicators and Features
category: Blueprints
order: 6
---

# Indicators and Features

Indicators turn OHLCV candles into numeric model features. BEE applies indicators per split, then drops warm-up/null/NaN/infinite rows before training to reduce leakage.

## Indicator pipeline

Configured indicators are read from `indicators`. Each item may be a string name or `{ name, params }` object. Custom indicators are resolved first; other names are treated as TA-Lib indicators.

Generated columns are appended to the split frame. If indicator parameters are part of a permutation, features are rebuilt for that permutation from the base split.

## Output column scaling

Indicators can also carry `output_scalers`, keyed by indicator name and output column name. Supported values are `none`, `normalization`, `standardization`, and `log_transform`.

- `none` leaves the generated column unchanged.
- `normalization` rescales to a 0-1 range.
- `standardization` applies mean/std scaling.
- `log_transform` applies a log1p-style transform.

Blueprints store the default scaler choice per output column. Experiments inherit those defaults and can override them per experiment.

## Input columns

Base market columns are `timestamp`, `open`, `high`, `low`, `close`, and `volume`. TA-Lib metadata maps SQL-style names to TA-Lib input names: `open -> Open`, `high -> High`, `low -> Low`, `close -> Close`, `volume -> Volume`.

## Output naming

- Custom indicators define fixed or parameter-derived output names.
- Most TA-Lib indicators output `name.lower()`.
- Multi-output TA-Lib indicators use suffixes:
  - `AROON`: `<prefix>_aroon_down`, `<prefix>_aroon_up`
  - `BBANDS`: `<prefix>_upper`, `<prefix>_middle`, `<prefix>_lower`
  - `MACD`: `<prefix>_macd`, `<prefix>_signal`, `<prefix>_hist`
- TA-Lib `params.output` or `output_prefix` can override the prefix.
- TA-Lib `params.outputs` can explicitly set all output column names.

## Warm-up behavior

Rolling indicators naturally produce null rows at the beginning of a split. BEE removes rows containing nulls and non-finite floating values after feature generation. This means longer windows reduce usable rows.

## Custom indicators

| Indicator | Inputs | Parameters | Outputs | Meaning |
| --- | --- | --- | --- | --- |
| `vwap` | `high`, `low`, `close`, `volume` | `output` string, default `vwap` | configured output name | Cumulative volume-weighted average price: cumulative typical price times volume divided by cumulative volume. |
| `ichimoku_cloud` | `high`, `low` | `conversion_period` default 9 min 1; `base_period` default 26 min 1; `span_b_period` default 52 min 1; `displacement` default 26 min 0 | `ichimoku_conversion`, `ichimoku_base`, `ichimoku_span_a`, `ichimoku_span_b` | Ichimoku conversion/base lines and displaced leading spans. Warm-up period is 52. |
| `quantile_flag` | configurable numeric `column`, default `close` | `column` required default `close`; `window` default 20 min 1; `quantile` default 0.8 range 0.0-1.0; `output` optional | default `<column>_quantile_flag` | Binary Int8 flag set to 1 when the column is greater than or equal to its rolling quantile threshold. |
| `rolling_volatility` | configurable numeric `column`, default `close` | `column` default `close`; `window` default 12 min 1 | default `<column>_volatility_<window>` | Rolling standard deviation of the selected column. |
| `wilder_rsi` | `close` | `period` default 14 min 1 | `wilder_rsi_<period>` | Wilder-style RSI using exponential smoothing of gains and losses. |
| `price_range_position` | `high`, `low`, `close` | `period` default 24 min 1 | `price_range_position` | Close location inside the rolling high-low range. |
| `trend_strength` | `close` | `fast_period` default 20 min 1; `slow_period` default 50 min 1 | `trend_strength` | Relative gap between fast and slow rolling means. |
| `time_features` | `timestamp` | none | `hour`, `minute`, `weekday` | Calendar features derived from the timestamp column. |
| `sma_crossover` | `close` | `short_window` default 10 min 1; `long_window` default 30 min 1; `crossover_bull` default 2; `crossover_bear` default -2 | `crossover`, `signal` | Detects SMA relation flips and emits crossover signals. |

## TA-Lib parameter rules

Registered TA-Lib parameters are optional unless specified by the UI. Integer defaults become integer constraints; float defaults become number constraints. The generated constraint includes default value and `min: 0`.

String numeric parameters are sanitized to int/float before TA-Lib execution. List values must already be expanded by permutation compilation; passing a list at execution time is invalid.

## Registered TA-Lib indicators

| Indicator | Category | Inputs | Default parameters |
| --- | --- | --- | --- |
| `BBANDS` | Overlap Studies | `close` | `timeperiod=5`, `nbdevup=2`, `nbdevdn=2`, `matype=0` |
| `DEMA` | Overlap Studies | `close` | `timeperiod=30` |
| `EMA` | Overlap Studies | `close` | `timeperiod=30` |
| `HT_TRENDLINE` | Overlap Studies | `close` | none |
| `KAMA` | Overlap Studies | `close` | `timeperiod=30` |
| `MA` | Overlap Studies | `close` | `timeperiod=30`, `matype=0` |
| `MAMA` | Overlap Studies | `close` | `fastlimit=0`, `slowlimit=0` |
| `MIDPOINT` | Overlap Studies | `close` | `timeperiod=14` |
| `MIDPRICE` | Overlap Studies | `high`, `low` | `timeperiod=14` |
| `SAR` | Overlap Studies | `high`, `low` | `acceleration=0`, `maximum=0` |
| `SMA` | Overlap Studies | `close` | `timeperiod=30` |
| `T3` | Overlap Studies | `close` | `timeperiod=5`, `vfactor=0` |
| `TEMA` | Overlap Studies | `close` | `timeperiod=30` |
| `TRIMA` | Overlap Studies | `close` | `timeperiod=30` |
| `WMA` | Overlap Studies | `close` | `timeperiod=30` |
| `ADX` | Momentum Indicators | `high`, `low`, `close` | `timeperiod=14` |
| `ADXR` | Momentum Indicators | `high`, `low`, `close` | `timeperiod=14` |
| `APO` | Momentum Indicators | `close` | `fastperiod=12`, `slowperiod=26`, `matype=0` |
| `AROON` | Momentum Indicators | `high`, `low` | `timeperiod=14` |
| `AROONOSC` | Momentum Indicators | `high`, `low` | `timeperiod=14` |
| `BOP` | Momentum Indicators | `open`, `high`, `low`, `close` | none |
| `CCI` | Momentum Indicators | `high`, `low`, `close` | `timeperiod=14` |
| `CMO` | Momentum Indicators | `close` | `timeperiod=14` |
| `DX` | Momentum Indicators | `high`, `low`, `close` | `timeperiod=14` |
| `IMI` | Momentum Indicators | `open`, `close` | `timeperiod=14` |
| `MACD` | Momentum Indicators | `close` | `fastperiod=12`, `slowperiod=26`, `signalperiod=9` |
| `MACDEXT` | Momentum Indicators | `close` | fast/slow/signal periods and matypes defaulting to 12/26/9 and 0 |
| `MACDFIX` | Momentum Indicators | `close` | `signalperiod=9` |
| `MFI` | Momentum Indicators | `high`, `low`, `close`, `volume` | `timeperiod=14` |
| `MINUS_DI`, `DX`, `PLUS_DI` | Momentum Indicators | `high`, `low`, `close` | `timeperiod=14` |
| `MINUS_DM`, `PLUS_DM` | Momentum Indicators | `high`, `low` | `timeperiod=14` |
| `MOM`, `ROC` | Momentum Indicators | `close` | `timeperiod=10` |
| `PPO` | Momentum Indicators | `close` | `fastperiod=12`, `slowperiod=26`, `matype=0` |
| `RSI` | Momentum Indicators | `close` | `timeperiod=14` |
| `STOCH` | Momentum Indicators | `high`, `low`, `close` | `fastk_period=5`, `slowk_period=3`, `slowk_matype=0`, `slowd_period=3`, `slowd_matype=0` |
| `STOCHF` | Momentum Indicators | `high`, `low`, `close` | `fastk_period=5`, `fastd_period=3`, `fastd_matype=0` |
| `STOCHRSI` | Momentum Indicators | `close` | `timeperiod=14`, `fastk_period=5`, `fastd_period=3`, `fastd_matype=0` |
| `TRIX` | Momentum Indicators | `close` | `timeperiod=30` |
| `ULTOSC` | Momentum Indicators | `high`, `low`, `close` | `timeperiod1=7`, `timeperiod2=14`, `timeperiod3=28` |
| `WILLR` | Momentum Indicators | `high`, `low`, `close` | `timeperiod=14` |
| `AD`, `ADOSC`, `OBV` | Volume Indicators | varies | `ADOSC` has `fastperiod=3`, `slowperiod=10`; others none |
| `ATR`, `NATR`, `TRANGE` | Volatility Indicators | `high`, `low`, `close` | `ATR`/`NATR` use `timeperiod=14`; `TRANGE` none |
| `AVGPRICE`, `MEDPRICE`, `TYPPRICE`, `WCLPRICE` | Price Transform | OHLC or HLC/HL | none |
| `HT_DCPERIOD`, `HT_DCPHASE`, `HT_PHASOR`, `HT_SINE`, `HT_TRENDMODE` | Cycle Indicators | `close` | none |
| `BETA`, `CORREL` | Statistic Functions | `high`, `low` | `BETA timeperiod=5`; `CORREL timeperiod=30` |
| `LINEARREG`, `TSF` | Statistic Functions | `close` | `timeperiod=14` |
| `STDDEV`, `VAR` | Statistic Functions | `close` | `timeperiod=5`, `nbdev=1` |
| `CDLDOJI`, `CDLHAMMER`, `CDLENGULFING`, `CDLMORNINGSTAR`, `CDLEVENINGSTAR`, `CDLSHOOTINGSTAR`, `CDLHANGINGMAN` | Pattern Recognition | `open`, `high`, `low`, `close` | Morning/evening star use `penetration=0`; others none |
