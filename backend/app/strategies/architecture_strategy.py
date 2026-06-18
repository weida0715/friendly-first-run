"""Architecture strategy contracts for experiment model execution."""

from __future__ import annotations

from typing import Any

import polars as pl


class ArchitectureStrategy:
    """Defines the train/predict/evaluate contract for architectures."""

    def train(self, data: pl.LazyFrame, **hyperparameters: Any) -> Any:
        raise NotImplementedError

    def predict(self, data: pl.LazyFrame) -> dict[str, Any]:
        raise NotImplementedError

    def evaluate(self, test_data: pl.LazyFrame) -> dict[str, Any]:
        raise NotImplementedError

    def experiment(
        self,
        train_data: pl.LazyFrame,
        test_data: pl.LazyFrame,
        **hyperparameters: Any,
    ) -> dict[str, Any]:
        self.train(train_data, **hyperparameters)
        predictions = self.predict(test_data)
        metrics = self.evaluate(test_data)
        return {"predictions": predictions, "metrics": metrics}
