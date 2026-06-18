"""Logistic regression architecture adapter."""

from __future__ import annotations

from typing import Any

import polars as pl
import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score

from app.strategies.architecture_strategy import ArchitectureStrategy


class LogisticRegressorArchitecture(ArchitectureStrategy):
    name = "logistic_regressor_arc"
    display_name = "Logistic Regressor"
    supports_probabilities = True
    hyperparameter_constraints = {
        "C": {"type": "number", "default": 1.0, "required": False, "min": 0.0001, "max": 1000.0},
        "max_iter": {"type": "integer", "default": 200, "required": False, "min": 50, "max": 5000},
        "penalty": {"type": "string", "default": "l2", "required": False, "allowed_values": ["l2", None]},
        "solver": {"type": "string", "default": "lbfgs", "required": False, "allowed_values": ["lbfgs", "liblinear", "newton-cg", "sag", "saga"]},
        "class_weight": {"type": "string", "default": None, "required": False, "allowed_values": [None, "balanced"]},
        "fit_intercept": {"type": "boolean", "default": True, "required": False},
        "tol": {"type": "number", "default": 0.0001, "required": False, "min": 0.0},
    }
    default_values = {"C": 1.0, "max_iter": 200, "penalty": "l2", "solver": "lbfgs", "class_weight": None, "fit_intercept": True, "tol": 0.0001}
    prediction_output_shape = {"_preds": "list[int]", "_probs": "list[float]"}

    def __init__(self) -> None:
        self.model: LogisticRegression | DummyClassifier | None = None
        self.feature_columns: list[str] = []

    def train(self, data: pl.LazyFrame, **hyperparameters: Any) -> Any:
        x, y, columns = _to_xy(data)
        self.feature_columns = columns
        params = {**self.default_values, **hyperparameters}
        if len(set(y.tolist())) < 2:
            self.model = DummyClassifier(strategy="most_frequent")
        else:
            self.model = LogisticRegression(C=float(params["C"]), max_iter=int(params["max_iter"]), penalty=params.get("penalty") or "l2", solver=str(params.get("solver") or "lbfgs"), class_weight=params.get("class_weight"), fit_intercept=_as_bool(params.get("fit_intercept", True)), tol=float(params.get("tol", 0.0001)), random_state=42)
        self.model.fit(x, y)
        return self.model

    def predict(self, data: pl.LazyFrame) -> dict[str, Any]:
        if self.model is None:
            raise RuntimeError("Architecture must be trained before predict().")
        x = _to_x(data, self.feature_columns)
        result: dict[str, Any] = {"_preds": self.model.predict(x).astype(int).tolist()}
        if hasattr(self.model, "predict_proba"):
            result["_probs"] = self.model.predict_proba(x)[:, 1].tolist()
        return result

    def evaluate(self, test_data: pl.LazyFrame) -> dict[str, Any]:
        if self.model is None:
            raise RuntimeError("Architecture must be trained before evaluate().")
        x, y, _ = _to_xy(test_data, self.feature_columns)
        preds = self.model.predict(x).astype(int)
        return {"accuracy": float(accuracy_score(y, preds)), "precision": float(precision_score(y, preds, zero_division=0)), "recall": float(recall_score(y, preds, zero_division=0)), "rows": int(len(y))}


def _feature_columns(frame: pl.DataFrame) -> list[str]:
    return [c for c, dtype in zip(frame.columns, frame.dtypes, strict=True) if c not in {"timestamp", "target", "_row_id"} and dtype.is_numeric()]


def _to_xy(data: pl.LazyFrame, columns: list[str] | None = None):
    frame = data.collect()
    feature_cols = columns or _feature_columns(frame)
    selected = _clean_model_frame(frame.select([*feature_cols, "target"]))
    return selected.select(feature_cols).to_numpy(), selected["target"].to_numpy(), feature_cols


def _to_x(data: pl.LazyFrame, columns: list[str]):
    values = data.collect().select(columns).fill_null(0).to_numpy()
    return np.nan_to_num(values, nan=0.0, posinf=0.0, neginf=0.0)


def _clean_model_frame(frame: pl.DataFrame) -> pl.DataFrame:
    cleaned = frame.drop_nulls()
    float_columns = [
        column
        for column, dtype in zip(cleaned.columns, cleaned.dtypes, strict=True)
        if dtype in {pl.Float32, pl.Float64}
    ]
    if float_columns:
        cleaned = cleaned.filter(pl.all_horizontal([pl.col(column).is_finite() for column in float_columns]))
    return cleaned


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).lower() in {"1", "true", "yes", "on"}
