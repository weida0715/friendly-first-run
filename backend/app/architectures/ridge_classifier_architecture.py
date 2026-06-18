"""Ridge classifier architecture adapter with calibrated probabilities."""

from __future__ import annotations

from typing import Any

import polars as pl
from sklearn.calibration import CalibratedClassifierCV
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import RidgeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score

from app.architectures.logistic_regressor_architecture import _to_x, _to_xy
from app.strategies.architecture_strategy import ArchitectureStrategy


class RidgeClassifierArchitecture(ArchitectureStrategy):
    name = "ridge_classifier_arc"
    display_name = "Ridge Classifier"
    supports_probabilities = True
    hyperparameter_constraints = {
        "alpha": {"type": "number", "default": 1.0, "required": False, "min": 0.0001, "max": 1000.0},
        "fit_intercept": {"type": "boolean", "default": True, "required": False},
        "class_weight": {"type": "string", "default": None, "required": False, "allowed_values": [None, "balanced"]},
        "tol": {"type": "number", "default": 0.0001, "required": False, "min": 0.0},
        "calibrator_method": {"type": "string", "default": "sigmoid", "required": False, "allowed_values": ["sigmoid", "isotonic"]},
        "calibrator_cv": {"type": "integer", "default": 0, "required": False, "min": 0, "max": 10},
    }
    default_values = {"alpha": 1.0, "fit_intercept": True, "class_weight": None,
                      "tol": 0.0001, "calibrator_method": "sigmoid", "calibrator_cv": 0}
    prediction_output_shape = {
        "_preds": "list[int]", "_probs": "list[float] when calibration succeeds"}

    def __init__(self) -> None:
        self.model: RidgeClassifier | DummyClassifier | None = None
        self.calibrated_model: CalibratedClassifierCV | None = None
        self.feature_columns: list[str] = []

    def train(self, data: pl.LazyFrame, **hyperparameters: Any) -> Any:
        x, y, columns = _to_xy(data)
        self.feature_columns = columns
        params = {**self.default_values, **hyperparameters}
        if len(set(y.tolist())) < 2:
            self.model = DummyClassifier(strategy="most_frequent")
        else:
            self.model = RidgeClassifier(alpha=float(params["alpha"]), fit_intercept=_as_bool(params.get(
                "fit_intercept", True)), class_weight=params.get("class_weight"), tol=float(params.get("tol", 0.0001)))
        self.model.fit(x, y)
        self.calibrated_model = None
        cv = int(params.get("calibrator_cv", 3))
        if cv >= 2 and len(set(y.tolist())) > 1 and len(y) >= cv * 2:
            try:
                self.calibrated_model = CalibratedClassifierCV(
                    self.model, cv=cv, method=str(params.get("calibrator_method", "sigmoid")))
                self.calibrated_model.fit(x, y)
            except ValueError:
                self.calibrated_model = None
        return self.model

    def predict(self, data: pl.LazyFrame) -> dict[str, Any]:
        if self.model is None:
            raise RuntimeError(
                "Architecture must be trained before predict().")
        x = _to_x(data, self.feature_columns)
        result: dict[str, Any] = {
            "_preds": self.model.predict(x).astype(int).tolist()}
        if self.calibrated_model is not None:
            result["_probs"] = self.calibrated_model.predict_proba(x)[
                :, 1].tolist()
        return result

    def evaluate(self, test_data: pl.LazyFrame) -> dict[str, Any]:
        if self.model is None:
            raise RuntimeError(
                "Architecture must be trained before evaluate().")
        x, y, _ = _to_xy(test_data, self.feature_columns)
        preds = self.model.predict(x).astype(int)
        return {"accuracy": float(accuracy_score(y, preds)), "precision": float(precision_score(y, preds, zero_division=0)), "recall": float(recall_score(y, preds, zero_division=0)), "rows": int(len(y))}


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).lower() in {"1", "true", "yes", "on"}
