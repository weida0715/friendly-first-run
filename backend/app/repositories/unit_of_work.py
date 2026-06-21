"""Unit of Work boundary for RFC-002 ERD repositories."""

from __future__ import annotations

from types import TracebackType

from sqlalchemy.orm import Session

from app.infrastructure.database.session import SessionLocal, get_engine
from app.repositories.blueprint_repository import BlueprintRepository
from app.repositories.experiment_log_repository import ExperimentLogRepository
from app.repositories.experiment_repository import ExperimentRepository
from app.repositories.favorite_blueprint_repository import FavoriteBlueprintRepository
from app.repositories.favorite_model_repository import FavoriteModelRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.repositories.model_repository import ModelRepository
from app.repositories.system_event_repository import SystemEventRepository
from app.repositories.system_setting_repository import SystemSettingRepository
from app.repositories.user_repository import UserRepository


class UnitOfWork:
    """Context-managed transaction boundary for ERD-approved repositories."""

    def __init__(self) -> None:
        self.session: Session | None = None
        self.users: UserRepository | None = None
        self.blueprints: BlueprintRepository | None = None
        self.experiments: ExperimentRepository | None = None
        self.models: ModelRepository | None = None
        self.experiment_logs: ExperimentLogRepository | None = None
        self.favorite_models: FavoriteModelRepository | None = None
        self.favorite_blueprints: FavoriteBlueprintRepository | None = None
        self.system_events: SystemEventRepository | None = None
        self.market_data: MarketDataRepository | None = None
        self.system_settings: SystemSettingRepository | None = None

    def __enter__(self) -> "UnitOfWork":
        get_engine()
        self.session = SessionLocal()

        self.users = UserRepository(self.session)
        self.blueprints = BlueprintRepository(self.session)
        self.experiments = ExperimentRepository(self.session)
        self.models = ModelRepository(self.session)
        self.experiment_logs = ExperimentLogRepository(self.session)
        self.favorite_models = FavoriteModelRepository(self.session)
        self.favorite_blueprints = FavoriteBlueprintRepository(self.session)
        self.system_events = SystemEventRepository(self.session)
        self.market_data = MarketDataRepository(self.session)
        self.system_settings = SystemSettingRepository(self.session)

        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        if self.session is None:
            return

        try:
            if exc_type is None:
                try:
                    self.session.commit()
                except Exception:
                    self.session.rollback()
                    raise
            else:
                self.session.rollback()
        finally:
            self.session.close()

    def commit(self) -> None:
        """Commit the active transaction."""

        if self.session is None:
            raise RuntimeError("UnitOfWork has no active session")
        self.session.commit()

    def rollback(self) -> None:
        """Rollback the active transaction."""

        if self.session is None:
            raise RuntimeError("UnitOfWork has no active session")
        self.session.rollback()
