"""SQLAlchemy-backed repository for User aggregate."""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.domain.models.user import User
from app.infrastructure.database.enums import UserRole, UserStatus
from app.infrastructure.database.orm.user_orm import UserORM


class UserRepository:
    """User persistence operations using RFC-002 ORM mappings."""

    DEFAULT_SEARCH_LIMIT = 20
    MIN_SEARCH_LIMIT = 1
    MAX_SEARCH_LIMIT = 100
    MIN_OFFSET = 0

    def __init__(self, session: Session) -> None:
        self._session = session

    @staticmethod
    def _to_domain(row: UserORM) -> User:
        role = row.Role.value if hasattr(row.Role, "value") else row.Role
        status = row.Status.value if hasattr(
            row.Status, "value") else row.Status
        return User(
            user_id=row.UserID,
            username=row.Username,
            email=row.Email,
            password_hash=row.PasswordHash,
            name=row.Name,
            role=role,
            status=status,
            created_at=row.CreatedAt,
            updated_at=row.UpdatedAt,
        )

    def add(self, user: User) -> User:
        role = user.Role if isinstance(
            user.Role, UserRole) else UserRole(user.Role)
        status = user.Status if isinstance(
            user.Status, UserStatus) else UserStatus(user.Status)
        row = UserORM(
            Username=user.Username,
            Email=user.Email,
            PasswordHash=user.PasswordHash,
            Name=user.Name,
            Role=role,
            Status=status,
            CreatedAt=user.CreatedAt,
            UpdatedAt=user.UpdatedAt,
        )
        self._session.add(row)
        self._session.flush()
        return self._to_domain(row)

    def get_by_id(self, user_id: int) -> User | None:
        row = self._session.get(UserORM, user_id)
        return self._to_domain(row) if row else None

    def get_by_username(self, username: str) -> User | None:
        row = self._session.scalar(
            select(UserORM).where(UserORM.Username == username))
        return self._to_domain(row) if row else None

    def get_by_email(self, email: str) -> User | None:
        row = self._session.scalar(
            select(UserORM).where(UserORM.Email == email))
        return self._to_domain(row) if row else None

    def list_all(self) -> list[User]:
        rows = self._session.scalars(
            select(UserORM).order_by(UserORM.UserID)).all()
        return [self._to_domain(row) for row in rows]

    def search_users(
        self,
        query: str | None = None,
        role: str | None = None,
        status: str | None = None,
        limit: int = DEFAULT_SEARCH_LIMIT,
        offset: int = 0,
    ) -> list[User]:
        statement = select(UserORM)

        if query:
            normalized = f"%{query.strip().lower()}%"
            statement = statement.where(
                or_(
                    func.lower(UserORM.Username).like(normalized),
                    func.lower(UserORM.Email).like(normalized),
                    func.lower(UserORM.Name).like(normalized),
                )
            )

        if role:
            statement = statement.where(UserORM.Role == role)

        if status:
            statement = statement.where(UserORM.Status == status)

        safe_limit = max(self.MIN_SEARCH_LIMIT, min(
            limit, self.MAX_SEARCH_LIMIT))
        safe_offset = max(self.MIN_OFFSET, offset)

        rows = self._session.scalars(
            statement.order_by(UserORM.UserID).limit(
                safe_limit).offset(safe_offset)
        ).all()
        return [self._to_domain(row) for row in rows]

    def count_users(
        self,
        query: str | None = None,
        role: str | None = None,
        status: str | None = None,
    ) -> int:
        statement = select(func.count(UserORM.UserID))

        if query:
            normalized = f"%{query.strip().lower()}%"
            statement = statement.where(
                or_(
                    func.lower(UserORM.Username).like(normalized),
                    func.lower(UserORM.Email).like(normalized),
                    func.lower(UserORM.Name).like(normalized),
                )
            )

        if role:
            statement = statement.where(UserORM.Role == role)

        if status:
            statement = statement.where(UserORM.Status == status)

        return int(self._session.scalar(statement) or 0)

    def update_status(self, user_id: int, status: str) -> User | None:
        row = self._session.get(UserORM, user_id)
        if row is None:
            return None
        row.Status = UserStatus(status)
        self._session.flush()
        return self._to_domain(row)

    def update_role(self, user_id: int, role: str) -> User | None:
        row = self._session.get(UserORM, user_id)
        if row is None:
            return None
        row.Role = UserRole(role)
        self._session.flush()
        return self._to_domain(row)

    def update_password_hash(self, user_id: int, password_hash: str) -> User | None:
        row = self._session.get(UserORM, user_id)
        if row is None:
            return None
        row.PasswordHash = password_hash
        self._session.flush()
        return self._to_domain(row)

    def delete_by_id(self, user_id: int) -> bool:
        row = self._session.get(UserORM, user_id)
        if row is None:
            return False
        self._session.delete(row)
        self._session.flush()
        return True
