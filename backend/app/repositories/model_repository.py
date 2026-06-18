"""SQLAlchemy-backed repository for Model aggregate."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any

from sqlalchemy import and_, asc, cast, desc, Float, func, or_, select, String
from sqlalchemy.orm import Session

from app.domain.models.model import Model
from app.infrastructure.database.orm.blueprint_orm import BlueprintORM
from app.infrastructure.database.orm.experiment_orm import ExperimentORM
from app.infrastructure.database.orm.experiment_log_orm import ExperimentLogORM
from app.infrastructure.database.orm.favorite_model_orm import FavoriteModelORM
from app.infrastructure.database.orm.model_orm import ModelORM
from app.infrastructure.database.orm.user_orm import UserORM


class ModelRepository:
    """Model persistence operations using RFC-002 ORM mappings."""

    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _to_domain(row: ModelORM) -> Model:
        return Model(
            model_id=row.ModelID,
            experiment_id=row.ExperimentID,
            parameters=row.Parameters,
            sharpe=row.Sharpe,
            accuracy=row.Accuracy,
            precision=row.Precision,
            recall=row.Recall,
            created_at=row.CreatedAt,
            parameter_hash=getattr(row, "ParameterHash", None),
        )

    def add(self, model: Model) -> Model:
        row = ModelORM(
            ExperimentID=model.ExperimentID,
            Parameters=model.Parameters,
            Sharpe=model.Sharpe,
            Accuracy=model.Accuracy,
            Precision=model.Precision,
            Recall=model.Recall,
            CreatedAt=model.CreatedAt,
            ParameterHash=model.ParameterHash,
        )
        self._session.add(row)
        self._session.flush()
        return self._to_domain(row)

    def get_by_id(self, model_id: int) -> Model | None:
        row = self._session.get(ModelORM, model_id)
        return self._to_domain(row) if row else None

    def exists(self, model_id: int) -> bool:
        return self._session.get(ModelORM, model_id) is not None

    def get_detail_row(self, model_id: int):
        return self._session.execute(
            select(ModelORM, ExperimentORM, BlueprintORM, UserORM)
            .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
            .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
            .where(ModelORM.ModelID == model_id)
            .limit(1)
        ).first()

    def list_accessible(
        self,
        user_id: int,
        *,
        is_staff: bool = False,
        experiment_id: int | None = None,
        blueprint_id: int | None = None,
        include_favorited_for_user_id: int | None = None,
    ) -> list[tuple[ModelORM, ExperimentORM, BlueprintORM, UserORM, bool]]:
        if include_favorited_for_user_id is None:
            include_favorited_for_user_id = user_id

        query = (
            select(ModelORM, ExperimentORM, BlueprintORM, UserORM, FavoriteModelORM.ModelID)
            .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
            .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
            .outerjoin(
                FavoriteModelORM,
                and_(
                    FavoriteModelORM.ModelID == ModelORM.ModelID,
                    FavoriteModelORM.UserID == include_favorited_for_user_id,
                ),
            )
        )
        if not is_staff:
            query = query.where((ExperimentORM.UserID == user_id) | (BlueprintORM.ApprovalState == "Approved"))
        if experiment_id is not None:
            query = query.where(ModelORM.ExperimentID == experiment_id)
        if blueprint_id is not None:
            query = query.where(ExperimentORM.BlueprintID == blueprint_id)

        rows = self._session.execute(query.order_by(ModelORM.ModelID.desc())).all()
        return [(model, experiment, blueprint, owner, favorite_model_id is not None) for model, experiment, blueprint, owner, favorite_model_id in rows]

    def list_accessible_page(
        self,
        user_id: int,
        *,
        is_staff: bool = False,
        experiment_id: int | None = None,
        blueprint_id: int | None = None,
        include_favorited_for_user_id: int | None = None,
        sort: str = "sharpe",
        order: str = "desc",
        page: int = 1,
        page_size: int = 20,
        q: str | None = None,
        filters: list[dict[str, Any]] | None = None,
        include_incomplete: bool = False,
    ) -> tuple[list[tuple[ModelORM, ExperimentORM, BlueprintORM, UserORM, bool]], int]:
        if include_favorited_for_user_id is None:
            include_favorited_for_user_id = user_id

        conditions = []
        if not is_staff:
            conditions.append((ExperimentORM.UserID == user_id) | (BlueprintORM.ApprovalState == "Approved"))
        if experiment_id is not None:
            conditions.append(ModelORM.ExperimentID == experiment_id)
        if blueprint_id is not None:
            conditions.append(ExperimentORM.BlueprintID == blueprint_id)
        if not include_incomplete:
            conditions.append(or_(
                ModelORM.Sharpe != 0,
                ModelORM.Accuracy != 0,
                ModelORM.Precision != 0,
                ModelORM.Recall != 0,
            ))
        search = (q or "").strip()
        if search:
            search_like = f"%{search}%"
            search_conditions = [
                cast(ModelORM.ModelID, String).ilike(search_like),
                ModelORM.ParameterHash.ilike(search_like),
                ExperimentORM.Name.ilike(search_like),
                BlueprintORM.Name.ilike(search_like),
                UserORM.Username.ilike(search_like),
                UserORM.Name.ilike(search_like),
            ]
            conditions.append(or_(*search_conditions))
        filter_rules = filters or []
        log_metric_columns = {"total_return_net_pct", "trade_win_rate_pct"}
        needs_log_metrics = sort in log_metric_columns or any(str(rule.get("column") or "") in log_metric_columns for rule in filter_rules)

        count_query = (
            select(func.count(ModelORM.ModelID))
            .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
            .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
        )
        query = (
            select(ModelORM, ExperimentORM, BlueprintORM, UserORM, FavoriteModelORM.ModelID)
            .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
            .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
            .outerjoin(
                FavoriteModelORM,
                and_(
                    FavoriteModelORM.ModelID == ModelORM.ModelID,
                    FavoriteModelORM.UserID == include_favorited_for_user_id,
                ),
            )
        )
        sort_log_metric = sort in log_metric_columns
        metric_subquery = None
        metric_columns = {}
        if needs_log_metrics:
            total_return_value = cast(ExperimentLogORM.Metrics["total_return_net_pct"].as_string(), Float)
            win_rate_value = cast(ExperimentLogORM.Metrics["trade_win_rate_pct"].as_string(), Float)
            metric_subquery = (
                select(
                    ExperimentLogORM.ModelID.label("model_id"),
                    func.max(total_return_value).label("total_return_net_pct"),
                    func.max(win_rate_value).label("trade_win_rate_pct"),
                )
                .where(ExperimentLogORM.Metrics["type"].as_string() == "backtest")
                .group_by(ExperimentLogORM.ModelID)
                .subquery()
            )
            metric_columns = {
                "total_return_net_pct": metric_subquery.c.total_return_net_pct,
                "trade_win_rate_pct": metric_subquery.c.trade_win_rate_pct,
            }
            count_query = count_query.outerjoin(metric_subquery, metric_subquery.c.model_id == ModelORM.ModelID)
            query = query.outerjoin(metric_subquery, metric_subquery.c.model_id == ModelORM.ModelID)
        conditions.extend(self._ranking_filter_conditions(filter_rules, metric_columns))
        for condition in conditions:
            count_query = count_query.where(condition)
            query = query.where(condition)

        sort_columns = {
            "model_id": ModelORM.ModelID,
            "sharpe": ModelORM.Sharpe,
            "accuracy": ModelORM.Accuracy,
            "precision": ModelORM.Precision,
            "recall": ModelORM.Recall,
            "experiment_name": ExperimentORM.Name,
            "blueprint_name": BlueprintORM.Name,
            "owner": UserORM.Username,
            "created_at": ModelORM.CreatedAt,
            "createdAt": ModelORM.CreatedAt,
        }
        sort_column = metric_columns[sort] if sort in metric_columns else sort_columns.get(sort, ModelORM.Sharpe)
        direction = asc if order == "asc" else desc
        metric_sort = sort in {"sharpe", "accuracy", "precision", "recall"} or sort_log_metric
        page_size = max(1, min(page_size, 100))
        offset = max(0, page - 1) * page_size
        order_by = [sort_column.is_(None)] if metric_sort else []
        order_by.extend([direction(sort_column), ModelORM.ModelID.desc()])

        rows = self._session.execute(
            query.order_by(*order_by).limit(page_size).offset(offset)
        ).all()
        total = int(self._session.scalar(count_query) or 0)
        return [(model, experiment, blueprint, owner, favorite_model_id is not None) for model, experiment, blueprint, owner, favorite_model_id in rows], total

    def list_top_accessible_by_metric(
        self,
        user_id: int,
        metric: str,
        *,
        is_staff: bool = False,
        include_favorited_for_user_id: int | None = None,
        limit: int = 3,
    ) -> list[tuple[ModelORM, ExperimentORM, BlueprintORM, UserORM, bool]]:
        if include_favorited_for_user_id is None:
            include_favorited_for_user_id = user_id
        metric_column = {
            "sharpe": ModelORM.Sharpe,
            "accuracy": ModelORM.Accuracy,
        }.get(metric)
        if metric_column is None:
            return []

        query = (
            select(ModelORM, ExperimentORM, BlueprintORM, UserORM, FavoriteModelORM.ModelID)
            .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
            .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
            .outerjoin(
                FavoriteModelORM,
                and_(FavoriteModelORM.ModelID == ModelORM.ModelID, FavoriteModelORM.UserID == include_favorited_for_user_id),
            )
        )
        if not is_staff:
            query = query.where((ExperimentORM.UserID == user_id) | (BlueprintORM.ApprovalState == "Approved"))
        rows = self._session.execute(
            query
            .where(metric_column.is_not(None), metric_column != 0)
            .order_by(desc(metric_column), ModelORM.ModelID.desc())
            .limit(max(1, limit))
        ).all()
        return [(model, experiment, blueprint, owner, favorite_model_id is not None) for model, experiment, blueprint, owner, favorite_model_id in rows]

    def list_top_accessible_by_log_metric(
        self,
        user_id: int,
        metric: str,
        *,
        is_staff: bool = False,
        include_favorited_for_user_id: int | None = None,
        limit: int = 3,
    ) -> list[tuple[ModelORM, ExperimentORM, BlueprintORM, UserORM, bool, float]]:
        if include_favorited_for_user_id is None:
            include_favorited_for_user_id = user_id
        if metric not in {"total_return_net_pct", "trade_win_rate_pct"}:
            return []

        metric_value = cast(ExperimentLogORM.Metrics[metric].as_string(), Float)
        metric_subquery = (
            select(ExperimentLogORM.ModelID.label("model_id"), func.max(metric_value).label("metric_value"))
            .where(
                ExperimentLogORM.Metrics["type"].as_string() == "backtest",
                metric_value.is_not(None),
                metric_value != 0,
            )
            .group_by(ExperimentLogORM.ModelID)
            .subquery()
        )
        query = (
            select(ModelORM, ExperimentORM, BlueprintORM, UserORM, FavoriteModelORM.ModelID, metric_subquery.c.metric_value)
            .join(metric_subquery, metric_subquery.c.model_id == ModelORM.ModelID)
            .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
            .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
            .outerjoin(
                FavoriteModelORM,
                and_(FavoriteModelORM.ModelID == ModelORM.ModelID, FavoriteModelORM.UserID == include_favorited_for_user_id),
            )
        )
        if not is_staff:
            query = query.where((ExperimentORM.UserID == user_id) | (BlueprintORM.ApprovalState == "Approved"))
        rows = self._session.execute(
            query.order_by(desc(metric_subquery.c.metric_value), ModelORM.ModelID.desc()).limit(max(1, limit))
        ).all()
        return [(model, experiment, blueprint, owner, favorite_model_id is not None, metric_value) for model, experiment, blueprint, owner, favorite_model_id, metric_value in rows]

    def backtest_metrics_for_models(self, model_ids: list[int]) -> dict[int, dict[str, Any]]:
        if not model_ids:
            return {}
        rows = self._session.execute(
            select(ExperimentLogORM.ModelID, ExperimentLogORM.Metrics)
            .where(
                ExperimentLogORM.ModelID.in_(model_ids),
                ExperimentLogORM.Metrics["type"].as_string() == "backtest",
            )
            .order_by(ExperimentLogORM.CreatedAt.desc())
        ).all()
        metrics_by_model: dict[int, dict[str, Any]] = {}
        for model_id, metrics in rows:
            metrics_by_model.setdefault(int(model_id), dict(metrics or {}))
        return metrics_by_model

    @staticmethod
    def _ranking_filter_conditions(rules: list[dict[str, Any]], extra_columns: dict[str, Any] | None = None) -> list:
        columns = {
            "model_id": ModelORM.ModelID,
            "experiment_id": ExperimentORM.ExperimentID,
            "experiment_name": ExperimentORM.Name,
            "blueprint_id": BlueprintORM.BlueprintID,
            "blueprint_name": BlueprintORM.Name,
            "owner": UserORM.Username,
            "sharpe": ModelORM.Sharpe,
            "accuracy": ModelORM.Accuracy,
            "precision": ModelORM.Precision,
            "recall": ModelORM.Recall,
            "created_at": ModelORM.CreatedAt,
        }
        columns.update(extra_columns or {})
        text_columns = {"experiment_name", "blueprint_name", "owner"}
        number_columns = {"model_id", "experiment_id", "blueprint_id", "sharpe", "accuracy", "precision", "recall", "total_return_net_pct", "trade_win_rate_pct"}
        date_columns = {"created_at"}
        conditions = []

        def decimal_value(value):
            if value in (None, ""):
                return None
            try:
                return Decimal(str(value))
            except (InvalidOperation, ValueError):
                return None

        def date_value(value):
            if value in (None, ""):
                return None
            try:
                return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            except ValueError:
                return None

        for rule in rules:
            column_name = str(rule.get("column") or "")
            op = str(rule.get("op") or "")
            column = columns.get(column_name)
            if column is None:
                continue
            if column_name in text_columns:
                value = str(rule.get("value") or "").strip()
                if not value:
                    continue
                if column_name == "owner":
                    owner_match = or_(UserORM.Username.ilike(f"%{value}%"), UserORM.Name.ilike(f"%{value}%"))
                    conditions.append(or_(UserORM.Username == value, UserORM.Name == value) if op == "equals" else owner_match)
                    continue
                if op == "equals":
                    conditions.append(column == value)
                else:
                    conditions.append(column.ilike(f"%{value}%"))
            elif column_name in number_columns:
                if op == "between":
                    low = decimal_value(rule.get("min"))
                    high = decimal_value(rule.get("max"))
                    if low is not None:
                        conditions.append(column >= low)
                    if high is not None:
                        conditions.append(column <= high)
                elif op == "max":
                    value = decimal_value(rule.get("value") or rule.get("max"))
                    if value is not None:
                        conditions.append(column <= value)
                elif op == "equals":
                    value = decimal_value(rule.get("value"))
                    if value is not None:
                        conditions.append(column == value)
                else:
                    value = decimal_value(rule.get("value") or rule.get("min"))
                    if value is not None:
                        conditions.append(column >= value)
            elif column_name in date_columns:
                if op == "between":
                    low = date_value(rule.get("min"))
                    high = date_value(rule.get("max"))
                    if low is not None:
                        conditions.append(column >= low)
                    if high is not None:
                        conditions.append(column <= high)
                elif op == "max":
                    value = date_value(rule.get("value") or rule.get("max"))
                    if value is not None:
                        conditions.append(column <= value)
                elif op == "equals":
                    value = date_value(rule.get("value"))
                    if value is not None:
                        conditions.append(func.date(column) == value.date())
                else:
                    value = date_value(rule.get("value") or rule.get("min"))
                    if value is not None:
                        conditions.append(column >= value)
        return conditions

    def list_owned(
        self,
        user_id: int,
        *,
        experiment_id: int | None = None,
        blueprint_id: int | None = None,
    ) -> list[tuple[ModelORM, ExperimentORM, BlueprintORM, UserORM, bool]]:
        query = (
            select(ModelORM, ExperimentORM, BlueprintORM, UserORM, FavoriteModelORM.ModelID)
            .join(ExperimentORM, ExperimentORM.ExperimentID == ModelORM.ExperimentID)
            .join(BlueprintORM, BlueprintORM.BlueprintID == ExperimentORM.BlueprintID)
            .join(UserORM, UserORM.UserID == ExperimentORM.UserID)
            .outerjoin(
                FavoriteModelORM,
                and_(FavoriteModelORM.ModelID == ModelORM.ModelID, FavoriteModelORM.UserID == user_id),
            )
            .where(ExperimentORM.UserID == user_id)
        )
        if experiment_id is not None:
            query = query.where(ModelORM.ExperimentID == experiment_id)
        if blueprint_id is not None:
            query = query.where(ExperimentORM.BlueprintID == blueprint_id)

        rows = self._session.execute(query.order_by(ModelORM.ModelID.desc())).all()
        return [(model, experiment, blueprint, owner, favorite_model_id is not None) for model, experiment, blueprint, owner, favorite_model_id in rows]

    def exists_parameter_hash(self, experiment_id: int, parameter_hash: str) -> bool:
        return self._session.scalar(select(ModelORM).where(ModelORM.ExperimentID == experiment_id, ModelORM.ParameterHash == parameter_hash).limit(1)) is not None

    def get_by_experiment_and_parameter_hash(self, experiment_id: int, parameter_hash: str) -> Model | None:
        row = self._session.scalar(
            select(ModelORM)
            .where(ModelORM.ExperimentID == experiment_id)
            .where(ModelORM.ParameterHash == parameter_hash)
            .limit(1)
        )
        return self._to_domain(row) if row else None

    def list_by_experiment(self, experiment_id: int) -> list[Model]:
        rows = self._session.scalars(
            select(ModelORM)
            .where(ModelORM.ExperimentID == experiment_id)
            .order_by(ModelORM.ModelID)
        ).all()
        return [self._to_domain(row) for row in rows]
