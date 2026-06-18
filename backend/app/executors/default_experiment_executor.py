"""Default experiment executor implementation for the template pipeline."""

from __future__ import annotations

from datetime import UTC, datetime, time, timezone
from decimal import Decimal
from time import perf_counter
from typing import Any, Callable

import polars as pl

from app.domain.models.btcusdt_kline import BTCUSDTKline
from app.domain.models.experiment_log import ExperimentLog
from app.executors.experiment_executor import ExperimentExecutor
from app.factories.architecture_factory import ArchitectureFactory
from app.infrastructure.database.orm.model_orm import ModelORM
from app.repositories.unit_of_work import UnitOfWork
from app.services.market_data_service import MarketDataService
from app.strategies.data_split_strategy import DataSplitStrategyFactory, SplitResult
from app.strategies.indicator_strategy import IndicatorPipelineStrategy, drop_warmup_nulls
from app.strategies.logs.confusion_metrics_log_strategy import CONFUSION_FIELDS, ConfusionMetricsLogStrategy
from app.strategies.scaling_strategy import StandardScalerStrategy
from app.strategies.target_strategy import TargetStrategyFactory
from app.strategies.trading.long_only_single_position_strategy import BACKTEST_FIELDS, LongOnlySinglePositionStrategy
from app.strategies.trading_strategy import BacktestResult
from app.services.system_settings_service import get_runtime_settings

DEFAULT_MIN_REQUIRED_CANDLES = 1
SUPPORTED_INTERVAL_DURATIONS = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "2h": "2h",
    "4h": "4h",
    "1d": "1d",
}


class ExperimentExecutionError(RuntimeError):
    """Raised when an experiment cannot load sufficient market data."""


class DefaultExperimentExecutor(ExperimentExecutor):
    """Refreshes BTCUSDT cache and loads experiment candles from local storage."""

    def __init__(
        self,
        *,
        market_data_service: MarketDataService | None = None,
        unit_of_work_factory: Callable[[], UnitOfWork] = UnitOfWork,
        min_required_candles: int = DEFAULT_MIN_REQUIRED_CANDLES,
    ) -> None:
        self._market_data_service = market_data_service or MarketDataService(
            unit_of_work_factory=unit_of_work_factory
        )
        self._unit_of_work_factory = unit_of_work_factory
        self._min_required_candles = min_required_candles
        self._progress_callback: Callable[[
            float, str, int | None], None] | None = None

    def run(self, experiment_or_id, progress_callback: Callable[[float, str, int | None], None] | None = None) -> dict[str, Any]:
        """Run an experiment while preserving the worker's progress callback API."""
        self._progress_callback = progress_callback
        experiment_id = int(
            getattr(experiment_or_id, "ExperimentID", experiment_or_id))
        try:
            return self.execute(experiment_id)
        finally:
            self._progress_callback = None

    def emit_progress(
        self,
        ctx: ExperimentExecutor.ExecutionContext,
        stage: str,
        message: str,
        progress: float,
        *,
        details: Any | None = None,
        current: int | None = None,
        total: int | None = None,
    ) -> None:
        ctx.progress = max(0.0, min(100.0, float(progress)))
        stage_text = message if current is None or total is None else f"{message} ({current}/{total})"
        if self._progress_callback is not None:
            self._progress_callback(ctx.progress, stage_text, None)

        with self._unit_of_work_factory() as uow:
            if uow.experiments is not None:
                uow.experiments.update_progress(
                    ctx.experiment_id,
                    progress=Decimal(str(ctx.progress)),
                    current_stage=stage_text,
                    eta_seconds=None,
                )

    def load_config(self, ctx: ExperimentExecutor.ExecutionContext) -> dict[str, Any]:
        with self._unit_of_work_factory() as uow:
            if uow.experiments is None:
                raise ExperimentExecutionError(
                    "Experiment repository is unavailable")
            experiment = uow.experiments.get_by_id(ctx.experiment_id)
            if experiment is None:
                raise ExperimentExecutionError(
                    f"Experiment not found: {ctx.experiment_id}")

        overrides = getattr(experiment, "ParameterOverrides", None) or {}
        compiled = getattr(
            experiment, "compiled_experiment_snapshot", None) or {}
        effective = compiled.get("effective_parameters") or {}
        indicators = effective.get(
            "indicators") or overrides.get("indicators", [])
        target_params = effective.get(
            "target") or overrides.get("target_params", {})
        split_params = effective.get("split") or {}
        return {
            "experiment": experiment,
            "interval": compiled.get("interval") or getattr(experiment, "Interval", "1m"),
            "seed": int(overrides.get("seed", 42)),
            "train_split": float(split_params.get("train", getattr(experiment, "TrainSplit", 0.8) * 100)),
            "val_split": float(split_params.get("validation", getattr(experiment, "ValSplit", 0.1) * 100)),
            "test_split": float(split_params.get("test", getattr(experiment, "TestSplit", 0.1) * 100)),
            "split_strategy": split_params.get("strategy") or compiled.get("split_strategy") or overrides.get("split_strategy", "time_based_sequential"),
            "indicators": indicators,
            "target_strategy": compiled.get("target_strategy") or overrides.get("target_strategy", "forward_return"),
            "target_params": target_params,
            "feature_columns": overrides.get("feature_columns"),
            "max_round_log_rows": int(overrides.get("max_round_log_rows", get_runtime_settings()["max_round_log_rows"])),
        }

    def load_data(self, experiment) -> pl.LazyFrame:
        """Load persisted BTCUSDT candles for the selected interval without ingestion."""
        start = experiment.StartDateTime
        end = experiment.EndDateTime
        interval = (getattr(experiment, "compiled_experiment_snapshot", None) or {}).get(
            "interval") or getattr(experiment, "Interval", "1m")
        if start.tzinfo is None:
            start = start.replace(tzinfo=UTC)
        if end.tzinfo is None:
            end = end.replace(tzinfo=UTC)

        with self._unit_of_work_factory() as uow:
            if uow.market_data is None:
                raise ExperimentExecutionError(
                    "Market data repository is unavailable during experiment load"
                )
            if hasattr(uow.market_data, "list_range_projection"):
                rows = uow.market_data.list_range_projection(
                    start, end, interval=interval)
                row_count = len(rows)
                candles = projection_rows_to_lazyframe(rows)
            else:
                raw_candles = uow.market_data.list_range(
                    start, end, interval="1m")
                row_count = len(raw_candles)
                candles = candles_to_lazyframe(raw_candles)

        if row_count < self._min_required_candles:
            raise ExperimentExecutionError(
                "Insufficient persisted BTCUSDT candles for experiment; run market data ingestion first")

        return candles

    def load_klines(self, ctx: ExperimentExecutor.ExecutionContext) -> pl.LazyFrame:
        self.emit_progress(ctx, "load_klines_query_start",
                           "Querying persisted BTCUSDT 1m candles", 9.0)
        started = perf_counter()
        candles = self.load_data(ctx.config["experiment"])
        row_count = int(candles.select(pl.len()).collect().item())
        self.emit_progress(
            ctx,
            "load_klines_query_complete",
            f"Loaded {row_count} persisted BTCUSDT 1m candle(s)",
            12.0,
            details={"row_count": row_count, "elapsed_seconds": round(
                perf_counter() - started, 3)},
        )
        return candles

    def aggregate_interval(self, raw_klines, ctx: ExperimentExecutor.ExecutionContext):
        interval = (ctx.config or {}).get("interval", "1m")
        self.emit_progress(
            ctx,
            "materialize_interval_start",
            "Materializing interval candles from persisted BTCUSDT data",
            16.0,
            details={"interval": interval},
        )
        started = perf_counter()
        # PostgreSQL repositories return pre-aggregated interval bars. SQLite/test
        # fallbacks still return 1m bars, so aggregating here remains harmless.
        materialized = aggregate_ohlcv_interval(raw_klines, interval).collect()
        elapsed_seconds = round(perf_counter() - started, 3)
        row_count = materialized.height
        timestamp_summary = {}
        if row_count:
            timestamp_summary = {
                "first_timestamp": str(materialized["timestamp"].min()),
                "last_timestamp": str(materialized["timestamp"].max()),
            }
        self.emit_progress(
            ctx,
            "materialize_interval_complete",
            f"Materialized {row_count} interval candle(s)",
            20.0,
            details={"interval": interval, "row_count": row_count,
                     "elapsed_seconds": elapsed_seconds, **timestamp_summary},
        )
        return materialized.lazy()

    def validate_range(self, interval_data, ctx: ExperimentExecutor.ExecutionContext) -> None:
        self.emit_progress(ctx, "validate_range_start",
                           "Validating materialized interval candle range", 20.5)
        row_count = int(interval_data.select(pl.len()).collect().item())
        if row_count < self._min_required_candles:
            raise ExperimentExecutionError(
                "Insufficient candles after interval aggregation")
        self.emit_progress(ctx, "validate_range_complete",
                           f"Validated {row_count} interval candle(s)", 21.0, details={"row_count": row_count})

    def split_data(self, interval_data, ctx: ExperimentExecutor.ExecutionContext) -> SplitResult:
        cfg = ctx.config or {}
        strategy = DataSplitStrategyFactory.create(cfg.get("split_strategy"))
        result = strategy.split(interval_data, cfg)
        self.emit_progress(ctx, "split_data_complete", "Created train/validation/test splits", 24.0, details={"row_counts": result.row_counts, "boundaries": {
                           "train": str(result.train_boundary), "validation": str(result.validation_boundary), "test": str(result.test_boundary)}})
        return result

    def compute_indicators_per_split(
        self, splits: SplitResult, ctx: ExperimentExecutor.ExecutionContext
    ) -> SplitResult:
        cfg = ctx.config or {}
        # Indicator parameters are permutation-scoped. The initial RFC pipeline
        # stage records split-local metadata; concrete features are rebuilt per
        # permutation from base_splits before training.
        if any(_contains_list(value) for value in (cfg.get("indicators") or {}).values()) if isinstance(cfg.get("indicators"), dict) else False:
            return SplitResult(
                train_df=splits.train_df,
                validation_df=splits.validation_df,
                test_df=splits.test_df,
                train_boundary=splits.train_boundary,
                validation_boundary=splits.validation_boundary,
                test_boundary=splits.test_boundary,
                row_counts=splits.row_counts,
                split_strategy_params=splits.split_strategy_params,
                metadata={**(splits.metadata or {}),
                          "indicators_deferred_to_permutation": True},
            )
        strategy = IndicatorPipelineStrategy()
        metadata = {**(splits.metadata or {}),
                    "indicators": cfg.get("indicators", [])}
        return SplitResult(
            train_df=drop_warmup_nulls(strategy.apply(splits.train_df, cfg)),
            validation_df=drop_warmup_nulls(
                strategy.apply(splits.validation_df, cfg)),
            test_df=drop_warmup_nulls(strategy.apply(splits.test_df, cfg)),
            train_boundary=splits.train_boundary,
            validation_boundary=splits.validation_boundary,
            test_boundary=splits.test_boundary,
            row_counts=splits.row_counts,
            split_strategy_params=splits.split_strategy_params,
            metadata=metadata,
        )

    def generate_targets_per_split(
        self, splits: SplitResult, ctx: ExperimentExecutor.ExecutionContext
    ) -> SplitResult:
        cfg = ctx.config or {}
        target_params = cfg.get("target_params") or {}
        strategy = TargetStrategyFactory.create(
            cfg.get("target_strategy"), target_params)
        metadata = {**(splits.metadata or {}), "target_strategy": cfg.get(
            "target_strategy", "forward_return"), "target_params": target_params}
        return SplitResult(
            train_df=strategy.generate(splits.train_df),
            validation_df=strategy.generate(splits.validation_df),
            test_df=strategy.generate(splits.test_df),
            train_boundary=splits.train_boundary,
            validation_boundary=splits.validation_boundary,
            test_boundary=splits.test_boundary,
            row_counts=splits.row_counts,
            split_strategy_params=splits.split_strategy_params,
            metadata=metadata,
        )

    def scale_features(self, splits: SplitResult, ctx: ExperimentExecutor.ExecutionContext) -> SplitResult:
        result = StandardScalerStrategy().scale(splits, ctx.config or {})
        return result.splits

    def prepare_permutation_splits(
        self,
        splits: SplitResult,
        params: dict[str, Any],
        ctx: ExperimentExecutor.ExecutionContext,
    ) -> SplitResult:
        """Rebuild permutation-specific features without crossing split boundaries."""
        cfg = {**(ctx.config or {})}
        if isinstance(params.get("indicators"), dict):
            cfg["indicators"] = [
                {"name": name, "params": indicator_params or {}}
                for name, indicator_params in params["indicators"].items()
            ]
        if isinstance(params.get("target"), dict):
            cfg["target_params"] = params["target"]
        strategy = IndicatorPipelineStrategy()
        target = TargetStrategyFactory.create(
            cfg.get("target_strategy"), cfg.get("target_params") or {})
        rebuilt = SplitResult(
            train_df=target.generate(drop_warmup_nulls(
                strategy.apply(splits.train_df, cfg))),
            validation_df=target.generate(drop_warmup_nulls(
                strategy.apply(splits.validation_df, cfg))),
            test_df=target.generate(drop_warmup_nulls(
                strategy.apply(splits.test_df, cfg))),
            train_boundary=splits.train_boundary,
            validation_boundary=splits.validation_boundary,
            test_boundary=splits.test_boundary,
            row_counts=splits.row_counts,
            split_strategy_params=splits.split_strategy_params,
            metadata={**(splits.metadata or {}),
                      "permutation_indicators": cfg.get("indicators", [])},
        )
        return StandardScalerStrategy().scale(rebuilt, cfg).splits

    def compile_blueprint(self, ctx: ExperimentExecutor.ExecutionContext) -> dict[str, Any]:
        experiment = (ctx.config or {}).get("experiment")
        return getattr(experiment, "compiled_blueprint_snapshot", None) or {}

    def generate_parameter_permutations(
        self, compiled_blueprint: dict[str, Any], ctx: ExperimentExecutor.ExecutionContext
    ) -> list[dict[str, Any]]:
        experiment = (ctx.config or {}).get("experiment")
        experiment_id = int(getattr(experiment, "ExperimentID", getattr(
            experiment, "experiment_id", 0)) or 0)
        with self._unit_of_work_factory() as uow:
            models = uow.models.list_by_experiment(
                experiment_id) if uow.models is not None else []
        permutations = [dict(model.Parameters or {}) for model in models]
        if permutations:
            return permutations
        snapshot = getattr(
            experiment, "compiled_experiment_snapshot", None) or {}
        hashes = snapshot.get("selected_parameter_hashes") or []
        if hashes:
            return [{"parameter_hash": item} for item in hashes]
        return [{}]

    def create_architecture(
        self,
        compiled_blueprint: dict[str, Any],
        params: dict[str, Any],
        ctx: ExperimentExecutor.ExecutionContext,
    ):
        architecture_name = (compiled_blueprint.get(
            "architecture") or {}).get("name")
        return ArchitectureFactory.create(architecture_name)

    def run_backtest(
        self, predictions: dict[str, Any], test_data, ctx: ExperimentExecutor.ExecutionContext
    ) -> BacktestResult:
        return LongOnlySinglePositionStrategy().run(test_data, predictions, ctx.config or {})

    def persist_model_artifact(
        self,
        ctx: ExperimentExecutor.ExecutionContext,
        params: dict[str, Any],
        trained_model,
        evaluation: dict[str, Any],
        backtest: BacktestResult,
    ) -> None:
        parameter_hash = params.get("parameter_hash")
        if not parameter_hash:
            return None
        with self._unit_of_work_factory() as uow:
            row = uow.session.query(ModelORM).filter(
                ModelORM.ExperimentID == ctx.experiment_id,
                ModelORM.ParameterHash == parameter_hash,
            ).one_or_none()
            if row is None:
                return None
            row.Sharpe = _decimal_or_none(
                (backtest.metrics or {}).get("sharpe_per_bar"))
            row.Accuracy = _ratio_decimal(evaluation.get("accuracy"))
            row.Precision = _ratio_decimal(evaluation.get("precision"))
            row.Recall = _ratio_decimal(evaluation.get("recall"))
            uow.session.flush()
        return None

    def persist_logs(
        self,
        ctx: ExperimentExecutor.ExecutionContext,
        evaluation: dict[str, Any],
        backtest: BacktestResult,
    ) -> None:
        params = ((ctx.config or {}).get("_current_params") or {})
        parameter_hash = params.get("parameter_hash")
        now = datetime.now(timezone.utc)
        with self._unit_of_work_factory() as uow:
            if uow.experiment_logs is None or uow.models is None:
                return None
            model = None
            if parameter_hash and hasattr(uow.models, "get_by_experiment_and_parameter_hash"):
                model = uow.models.get_by_experiment_and_parameter_hash(
                    ctx.experiment_id, parameter_hash)
            if model is None:
                models = uow.models.list_by_experiment(ctx.experiment_id)
                model = next((m for m in models if m.ParameterHash ==
                             parameter_hash), models[0] if models else None)
            if model is None or model.ModelID is None:
                return None
            backtest_metrics = {field: (backtest.metrics or {}).get(
                field) for field in BACKTEST_FIELDS}
            backtest_metrics.update(
                {"type": "backtest", "model_id": int(model.ModelID), "parameter_hash": parameter_hash})
            uow.experiment_logs.add(ExperimentLog(None, ctx.experiment_id, int(
                model.ModelID), now, 0, Decimal("0"), backtest_metrics, now))

            confusion_metrics = _build_confusion_metrics(ctx, params)
            confusion_metrics.update(
                {"type": "confusion", "model_id": int(model.ModelID), "parameter_hash": parameter_hash})
            uow.experiment_logs.add(ExperimentLog(None, ctx.experiment_id, int(
                model.ModelID), now, 0, Decimal("0"), confusion_metrics, now))

            max_round_log_rows = int(
                ((ctx.config or {}).get("max_round_log_rows") or 0))
            for round_row in _build_round_log_rows(ctx, model.ModelID, parameter_hash, max_rows=max_round_log_rows):
                uow.experiment_logs.add(ExperimentLog(
                    None,
                    ctx.experiment_id,
                    int(model.ModelID),
                    round_row["timestamp"],
                    round_row["signal"],
                    round_row["prediction"],
                    {
                        "type": "round",
                        "model_id": int(model.ModelID),
                        "parameter_hash": parameter_hash,
                        "predicted": round_row["predicted"],
                        "actual": round_row["actual"],
                        "outcome": round_row["outcome"],
                        "round_index": round_row["round_index"],
                    },
                    now,
                ))
        return None

    def update_progress(self, ctx: ExperimentExecutor.ExecutionContext) -> None:
        ctx.progress = min(100.0, ctx.progress)

    def mark_running(self, ctx: ExperimentExecutor.ExecutionContext) -> None:
        ctx.progress = 1.0

    def mark_completed(self, ctx: ExperimentExecutor.ExecutionContext) -> None:
        ctx.progress = 100.0
        ctx.completed_at = datetime.now(tz=UTC)

    def build_execution_result(self, ctx: ExperimentExecutor.ExecutionContext) -> dict[str, Any]:
        return {
            "ok": True,
            "experiment_id": ctx.experiment_id,
            "progress": ctx.progress,
            "completed_at": ctx.completed_at,
        }


def candles_to_lazyframe(candles: list[BTCUSDTKline]) -> pl.LazyFrame:
    if not candles:
        return _empty_klines_lazyframe()
    rows = [
        {
            "timestamp": candle.Timestamp,
            "open": candle.Open,
            "high": candle.High,
            "low": candle.Low,
            "close": candle.Close,
            "volume": candle.Volume,
        }
        for candle in candles
    ]

    return pl.DataFrame(rows).lazy().select(
        pl.col("timestamp"),
        pl.col("open").cast(pl.Decimal(precision=20, scale=8)),
        pl.col("high").cast(pl.Decimal(precision=20, scale=8)),
        pl.col("low").cast(pl.Decimal(precision=20, scale=8)),
        pl.col("close").cast(pl.Decimal(precision=20, scale=8)),
        pl.col("volume").cast(pl.Decimal(precision=20, scale=8)),
    )


def projection_rows_to_lazyframe(rows: list[tuple[Any, Any, Any, Any, Any, Any]]) -> pl.LazyFrame:
    if not rows:
        return _empty_klines_lazyframe()
    return pl.DataFrame(
        [
            {
                "timestamp": row[0],
                "open": row[1],
                "high": row[2],
                "low": row[3],
                "close": row[4],
                "volume": row[5],
            }
            for row in rows
        ]
    ).lazy().select(
        pl.col("timestamp"),
        pl.col("open").cast(pl.Decimal(precision=20, scale=8)),
        pl.col("high").cast(pl.Decimal(precision=20, scale=8)),
        pl.col("low").cast(pl.Decimal(precision=20, scale=8)),
        pl.col("close").cast(pl.Decimal(precision=20, scale=8)),
        pl.col("volume").cast(pl.Decimal(precision=20, scale=8)),
    )


def _empty_klines_lazyframe() -> pl.LazyFrame:
    return pl.DataFrame(
        schema={
            "timestamp": pl.Datetime,
            "open": pl.Decimal(precision=20, scale=8),
            "high": pl.Decimal(precision=20, scale=8),
            "low": pl.Decimal(precision=20, scale=8),
            "close": pl.Decimal(precision=20, scale=8),
            "volume": pl.Decimal(precision=20, scale=8),
        }
    ).lazy()


def aggregate_ohlcv_interval(frame: pl.LazyFrame, interval: str) -> pl.LazyFrame:
    """Aggregate persisted BTCUSDT 1m candles into a supported interval."""
    if interval not in SUPPORTED_INTERVAL_DURATIONS:
        raise ExperimentExecutionError(
            f"Unsupported experiment interval: {interval}")

    sorted_frame = frame.sort("timestamp")
    if interval == "1m":
        return sorted_frame

    every = SUPPORTED_INTERVAL_DURATIONS[interval]
    return (
        sorted_frame
        .group_by_dynamic(
            index_column="timestamp",
            every=every,
            period=every,
            closed="left",
            label="left",
        )
        .agg(
            pl.col("open").first().alias("open"),
            pl.col("high").max().alias("high"),
            pl.col("low").min().alias("low"),
            pl.col("close").last().alias("close"),
            pl.col("volume").sum().alias("volume"),
            pl.len().alias("_source_candles"),
        )
        .filter(pl.col("_source_candles") > 0)
        .drop("_source_candles")
    )


def _contains_list(value: Any) -> bool:
    if isinstance(value, list):
        return True
    if isinstance(value, dict):
        return any(_contains_list(item) for item in value.values())
    return False


def _decimal_or_none(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value)).quantize(Decimal("0.0001"))
    except Exception:
        return None


def _ratio_decimal(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        number = Decimal(str(value))
        if number > 1:
            number = number / Decimal("100")
        return number.quantize(Decimal("0.0001"))
    except Exception:
        return None


def _build_confusion_metrics(ctx: ExperimentExecutor.ExecutionContext, params: dict[str, Any]) -> dict[str, Any]:
    test_frame = (ctx.config or {}).get("_latest_test_data")
    predictions = (ctx.config or {}).get("_latest_predictions") or {}
    if test_frame is None:
        return {field: None for field in CONFUSION_FIELDS}
    try:
        rows = test_frame.select([
            pl.col("target").fill_null(0).cast(pl.Int8).alias("target"),
            pl.col("open").cast(pl.Float64).alias("open"),
            pl.col("close").cast(pl.Float64).alias("close"),
            (pl.col("close").cast(pl.Float64) -
             pl.col("open").cast(pl.Float64)).alias("price_change"),
            ((pl.col("close").cast(pl.Float64) - pl.col("open").cast(pl.Float64)
              ) / pl.col("open").cast(pl.Float64) * 100.0).alias("return_pct"),
        ]).collect().to_dicts()
        y_true = [int(row["target"] or 0) for row in rows]
        y_pred = [int(value) for value in list(
            predictions.get("_preds") or [])[:len(rows)]]
        if len(y_pred) < len(y_true):
            y_pred.extend([0] * (len(y_true) - len(y_pred)))
        x = [float(row["return_pct"] or 0.0) for row in rows]
        built = ConfusionMetricsLogStrategy().build({
            "y_true": y_true,
            "y_pred": y_pred,
            "x": x,
            "x_name": "return_pct",
            "open": [float(row.get("open") or 0.0) for row in rows],
            "price_change": [float(row.get("price_change") or 0.0) for row in rows],
            "execution_lag_bars": int(((ctx.config or {}).get("execution_lag_bars") or 1)),
        })
        return {field: built.get(field) for field in CONFUSION_FIELDS}
    except Exception:
        return {field: None for field in CONFUSION_FIELDS}


def _build_round_log_rows(
    ctx: ExperimentExecutor.ExecutionContext,
    model_id: int,
    parameter_hash: str | None,
    *,
    max_rows: int = 0,
) -> list[dict[str, Any]]:
    if max_rows <= 0:
        return []
    test_frame = (ctx.config or {}).get("_latest_test_data")
    predictions = (ctx.config or {}).get("_latest_predictions") or {}
    if test_frame is None:
        return []
    try:
        rows = test_frame.select([
            pl.col("timestamp"),
            pl.col("target").fill_null(0).cast(pl.Int8).alias("actual"),
        ]).collect().to_dicts()
        pred_values = list(predictions.get("_preds") or [])[: len(rows)]
        result: list[dict[str, Any]] = []
        for index, row in enumerate(rows[:max_rows]):
            predicted = int(pred_values[index]
                            if index < len(pred_values) else 0)
            actual = int(row.get("actual") or 0)
            if predicted == 1 and actual == 1:
                outcome = "win"
            elif predicted == 1 and actual == 0:
                outcome = "lose"
            else:
                outcome = "none"
            result.append({
                "round_index": index,
                "timestamp": row.get("timestamp"),
                "predicted": predicted,
                "actual": actual,
                "outcome": outcome,
                "signal": predicted,
                "prediction": Decimal(str(predicted)),
                "model_id": model_id,
                "parameter_hash": parameter_hash,
            })
        return result
    except Exception:
        return []
