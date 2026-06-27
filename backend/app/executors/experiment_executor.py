"""Experiment executor template-method pipeline contracts."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime
from random import Random
from typing import Any, Callable

from app.strategies.data_split_strategy import SplitResult
from app.strategies.trading_strategy import BacktestResult


class ExperimentExecutor(ABC):
    """Template-method base class for running experiment pipelines."""

    @dataclass
    class ExecutionContext:
        experiment_id: int
        config: dict[str, Any] | None = None
        seed: int = 42
        rng: Random = field(default_factory=lambda: Random(42))
        started_at: datetime = field(
            default_factory=lambda: datetime.now(tz=UTC))
        completed_at: datetime | None = None
        progress: float = 0.0
        artifact_paths: dict[str, str] = field(default_factory=dict)

    def execute(self, experiment_id: int) -> dict[str, Any]:
        """Run the fixed pipeline order for an experiment id."""
        ctx = self.ExecutionContext(experiment_id=experiment_id)
        self._emit(ctx, "setup", "Starting experiment execution",
                   1.0, current=0, total=1)
        ctx.config = self.load_config(ctx)
        self._emit(ctx, "load_config",
                   "Loaded experiment configuration", 5.0, details=ctx.config)
        self.check_cancelled(ctx)
        self.mark_running(ctx)

        self._emit(ctx, "load_klines",
                   "Loading persisted BTCUSDT 1m klines", 8.0)
        raw_klines = self.load_klines(ctx)
        self.check_cancelled(ctx)
        self._emit(ctx, "aggregate_interval", "Aggregating selected interval",
                   15.0, details={"interval": (ctx.config or {}).get("interval")})
        interval_data = self.aggregate_interval(raw_klines, ctx)
        self.validate_range(interval_data, ctx)
        self.check_cancelled(ctx)

        self._emit(ctx, "split_data",
                   "Splitting data before features, targets, scaling, and training", 22.0)
        splits = self.split_data(interval_data, ctx)
        self.check_cancelled(ctx)
        base_splits = splits
        self._emit(ctx, "compute_indicators", "Computing indicators separately per split",
                   30.0, details=getattr(splits, "metadata", None))
        splits = self.compute_indicators_per_split(splits, ctx)
        self.check_cancelled(ctx)
        self._emit(ctx, "generate_targets", "Generating binary targets separately per split",
                   36.0, details=getattr(splits, "metadata", None))
        splits = self.generate_targets_per_split(splits, ctx)
        self.check_cancelled(ctx)
        self._emit(ctx, "scale_features",
                   "Fitting scaler on train split and applying to validation/test", 42.0)
        splits = self.scale_features(splits, ctx)
        self.check_cancelled(ctx)

        self._emit(ctx, "compile_blueprint",
                   "Compiling immutable Blueprint snapshot", 48.0)
        compiled_blueprint = self.compile_blueprint(ctx)
        self._emit(ctx, "generate_permutations",
                   "Generating parameter permutations", 52.0)
        permutations = self.generate_parameter_permutations(
            compiled_blueprint, ctx)
        total = max(1, len(permutations))
        self._emit(ctx, "permutations_ready",
                   f"Prepared {total} parameter permutation(s)", 55.0, current=0, total=total)

        for index, params in enumerate(permutations, start=1):
            self.check_cancelled(ctx)
            if ctx.config is not None:
                ctx.config["_current_params"] = params
            active_splits = splits
            prepare = getattr(self, "prepare_permutation_splits", None)
            if callable(prepare):
                active_splits = prepare(base_splits, params, ctx)
            base_progress = 55.0 + ((index - 1) / total) * 40.0
            self._emit(ctx, "permutation_start", f"Permutation {index}/{total} started", base_progress, details={
                       "permutation_index": index, "permutation_total": total, "parameters": params, "parameter_hash": params.get("parameter_hash")}, current=index - 1, total=total)
            architecture = self.create_architecture(
                compiled_blueprint, params, ctx)
            train_params = params.get("architecture", params)
            self._emit(ctx, "train", f"Permutation {index}/{total}: training architecture",
                       base_progress + 8.0 / total, details={"parameters": params}, current=index, total=total)
            trained_model = architecture.train(
                active_splits.train, **train_params)
            self._emit(ctx, "predict", f"Permutation {index}/{total}: generating predictions",
                       base_progress + 16.0 / total, current=index, total=total)
            predictions = architecture.predict(active_splits.test)
            predictions = self.prepare_predictions(predictions, ctx)
            if ctx.config is not None:
                ctx.config["_latest_test_data"] = active_splits.test
                ctx.config["_latest_predictions"] = predictions
            self._emit(ctx, "evaluate", f"Permutation {index}/{total}: evaluating model",
                       base_progress + 24.0 / total, current=index, total=total)
            evaluation = architecture.evaluate(active_splits.test)
            evaluation = self.adjust_evaluation(evaluation, predictions, active_splits.test, ctx)
            self._emit(ctx, "backtest", f"Permutation {index}/{total}: running backtest", base_progress +
                       32.0 / total, details={"evaluation": evaluation}, current=index, total=total)
            backtest = self.run_backtest(predictions, active_splits.test, ctx)
            self.persist_model_artifact(
                ctx, params, trained_model, evaluation, backtest)
            self.persist_logs(ctx, evaluation, backtest)
            self._emit(ctx, "permutation_complete", f"Permutation {index}/{total} completed", 55.0 + (index / total) * 40.0, details={
                       "evaluation": evaluation, "backtest": getattr(backtest, "metrics", {})}, current=index, total=total)
            self.update_progress(ctx)

        self.mark_completed(ctx)
        self._emit(ctx, "completed", "Experiment execution completed",
                   100.0, current=total, total=total)
        return self.build_execution_result(ctx)

    def check_cancelled(self, ctx: ExecutionContext) -> None:
        return None

    def prepare_predictions(self, predictions: dict[str, Any], ctx: ExecutionContext) -> dict[str, Any]:
        return predictions

    def adjust_evaluation(self, evaluation: dict[str, Any], predictions: dict[str, Any], test_data, ctx: ExecutionContext) -> dict[str, Any]:
        return evaluation

    def _emit(self, ctx: ExecutionContext, stage: str, message: str, progress: float, *, details: Any | None = None, current: int | None = None, total: int | None = None) -> None:
        hook = getattr(self, "emit_progress", None)
        if callable(hook):
            hook(ctx, stage, message, progress,
                 details=details, current=current, total=total)

    def run(self, experiment_id: int) -> dict[str, Any]:
        """Compatibility wrapper while worker migrates to execute()."""
        return self.execute(experiment_id)

    @abstractmethod
    def load_config(self, ctx: ExecutionContext) -> dict[str, Any]: ...

    @abstractmethod
    def load_klines(self, ctx: ExecutionContext): ...

    @abstractmethod
    def aggregate_interval(self, raw_klines, ctx: ExecutionContext): ...

    @abstractmethod
    def validate_range(self, interval_data, ctx: ExecutionContext) -> None: ...

    @abstractmethod
    def split_data(self, interval_data,
                   ctx: ExecutionContext) -> SplitResult: ...

    @abstractmethod
    def compute_indicators_per_split(
        self, splits: SplitResult, ctx: ExecutionContext
    ) -> SplitResult: ...

    @abstractmethod
    def generate_targets_per_split(
        self, splits: SplitResult, ctx: ExecutionContext
    ) -> SplitResult: ...

    @abstractmethod
    def scale_features(self, splits: SplitResult,
                       ctx: ExecutionContext) -> SplitResult: ...

    @abstractmethod
    def compile_blueprint(self, ctx: ExecutionContext) -> dict[str, Any]: ...

    @abstractmethod
    def generate_parameter_permutations(
        self, compiled_blueprint: dict[str, Any], ctx: ExecutionContext) -> list[dict[str, Any]]: ...

    @abstractmethod
    def create_architecture(
        self, compiled_blueprint: dict[str, Any], params: dict[str, Any], ctx: ExecutionContext): ...

    @abstractmethod
    def run_backtest(
        self, predictions: dict[str, Any], test_data, ctx: ExecutionContext) -> BacktestResult: ...

    @abstractmethod
    def persist_model_artifact(self, ctx: ExecutionContext,
                               params: dict[str, Any], trained_model, evaluation: dict[str, Any], backtest: BacktestResult) -> None: ...

    @abstractmethod
    def persist_logs(self, ctx: ExecutionContext,
                     evaluation: dict[str, Any], backtest: BacktestResult) -> None: ...

    @abstractmethod
    def update_progress(self, ctx: ExecutionContext) -> None: ...

    @abstractmethod
    def mark_running(self, ctx: ExecutionContext) -> None: ...

    @abstractmethod
    def mark_completed(self, ctx: ExecutionContext) -> None: ...

    @abstractmethod
    def build_execution_result(
        self, ctx: ExecutionContext) -> dict[str, Any]: ...
