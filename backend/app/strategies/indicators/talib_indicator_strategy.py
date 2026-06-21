"""TA-Lib indicator adapter for split-local feature generation."""

from __future__ import annotations

from typing import Any

import polars as pl

try:  # pragma: no cover - availability depends on system wheels
    import talib  # type: ignore
    from talib import abstract as talib_abstract  # type: ignore
except Exception:  # pragma: no cover
    talib = None
    talib_abstract = None


TA_LIB_AVAILABLE = talib is not None
TALIB_INPUT_COLUMNS = ("open", "high", "low", "close", "volume")
TALIB_INPUTS_BY_NAME = {
    "AD": ["high", "low", "close", "volume"],
    "ADX": ["high", "low", "close"],
    "ATR": ["high", "low", "close"],
    "AROON": ["high", "low"],
    "BBANDS": ["close"],
    "CCI": ["high", "low", "close"],
    "CDLDOJI": ["open", "high", "low", "close"],
    "DEMA": ["close"],
    "EMA": ["close"],
    "MACD": ["close"],
    "MFI": ["high", "low", "close", "volume"],
    "NATR": ["high", "low", "close"],
    "OBV": ["close", "volume"],
    "RSI": ["close"],
    "TRANGE": ["high", "low", "close"],
    "WILLR": ["high", "low", "close"],
}
TALIB_OUTPUTS_BY_NAME = {
    "AROON": ["aroon_down", "aroon_up"],
    "BBANDS": ["upper", "middle", "lower"],
    "MACD": ["macd", "signal", "hist"],
}


class TalibIndicatorStrategy:
    """Apply available TA-Lib functions and append their numeric output columns."""

    indicator_name = "talib"
    warmup_behavior = "TA-Lib warm-up null/NaN rows are removed by the per-split warm-up policy."

    def apply(self, df: pl.LazyFrame, name: str, params: dict[str, Any], output_prefix: str | None = None) -> pl.LazyFrame:
        if not TA_LIB_AVAILABLE or talib is None:
            raise RuntimeError(
                "TA-Lib is required for non-custom indicators but is not installed")
        if not hasattr(talib, name):
            raise ValueError(f"Unsupported TA-Lib indicator: {name}")

        schema = dict(df.collect_schema())
        for output_name in self._output_names(name, params, output_prefix):
            schema[output_name] = pl.Float64

        def _talib_map(batch: pl.DataFrame) -> pl.DataFrame:
            function = getattr(talib, name)
            inputs = self._build_inputs(batch, name, params)
            talib_params = _sanitize_talib_params({k: v for k, v in params.items(
            ) if k not in TALIB_INPUT_COLUMNS and k not in {"inputs", "output", "outputs"}})
            result = function(*inputs, **talib_params)
            return batch.with_columns(self._result_columns(name, result, params, output_prefix)).select(list(schema.keys()))

        return df.map_batches(_talib_map, schema=schema)

    def _input_columns(self, name: str, params: dict[str, Any]) -> list[str]:
        if params.get("inputs"):
            return list(params["inputs"])
        abstract_inputs = _abstract_input_columns(name)
        if abstract_inputs:
            return abstract_inputs
        return list(TALIB_INPUTS_BY_NAME.get(name, ["close"]))

    def _build_inputs(self, frame: pl.DataFrame, name: str, params: dict[str, Any]) -> list[Any]:
        requested = self._input_columns(name, params)
        inputs = []
        for col in requested:
            if col not in frame.columns:
                raise ValueError(f"TA-Lib input column is missing: {col}")
            inputs.append(frame[col].cast(pl.Float64).to_numpy())
        return inputs

    def _result_columns(self, name: str, result: Any, params: dict[str, Any], output_prefix: str | None) -> list[pl.Series]:
        if isinstance(result, tuple):
            output_names = self._output_names(name, params, output_prefix)
            return [pl.Series(str(output_names[index]), values).cast(pl.Float64) for index, values in enumerate(result)]
        output_name = self._output_names(name, params, output_prefix)[0]
        return [pl.Series(output_name, result).cast(pl.Float64)]

    def _output_names(self, name: str, params: dict[str, Any], output_prefix: str | None) -> list[str]:
        outputs = params.get("outputs")
        if outputs:
            return [str(output) for output in outputs]
        prefix = output_prefix or params.get("output") or name.lower()
        suffixes = TALIB_OUTPUTS_BY_NAME.get(name)
        if suffixes:
            return [f"{prefix}_{suffix}" for suffix in suffixes]
        return [str(prefix)]


def _sanitize_talib_params(params: dict[str, Any]) -> dict[str, Any]:
    sanitized: dict[str, Any] = {}
    for key, value in params.items():
        if isinstance(value, list):
            raise ValueError(
                f"TA-Lib parameter {key} must be scalar after permutation expansion, got {value!r}")
        if isinstance(value, str):
            stripped = value.strip()
            try:
                sanitized[key] = int(stripped)
                continue
            except ValueError:
                try:
                    sanitized[key] = float(stripped)
                    continue
                except ValueError as exc:
                    raise ValueError(
                        f"TA-Lib parameter {key} must be numeric, got {value!r}") from exc
        else:
            sanitized[key] = value
    return sanitized


def _abstract_input_columns(name: str) -> list[str]:
    if talib_abstract is None:
        return []
    try:
        input_names = talib_abstract.Function(name).input_names
    except Exception:
        return []
    columns: list[str] = []
    for value in input_names.values():
        if isinstance(value, str):
            candidates = [value]
        else:
            candidates = list(value)
        for candidate in candidates:
            if candidate in TALIB_INPUT_COLUMNS and candidate not in columns:
                columns.append(candidate)
    return columns
