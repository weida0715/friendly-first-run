"""Compatibility wrapper for train-only feature scaling."""

from __future__ import annotations

from typing import Any

from app.execution.feature_scaler import FeatureScaler, ScalingResult
from app.strategies.splits.split_result import SplitResult


class StandardScalerStrategy:
    def scale(self, splits: SplitResult, cfg: dict[str, Any]) -> ScalingResult:
        return FeatureScaler().scale(splits, cfg.get("feature_columns"))
