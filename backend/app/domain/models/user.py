"""Strict ERD-aligned User domain entity."""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

UserRole = Literal["User", "Moderator", "Admin"]
UserStatus = Literal["Enabled", "Disabled", "Pending"]


@dataclass(slots=True)
class User:
    """Represents the ERD-defined User entity."""

    user_id: int | None
    username: str
    email: str
    password_hash: str
    name: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime

    # Backward-compatible aliases during migration to snake_case.
    @property
    def UserID(self) -> int | None: return self.user_id
    @property
    def Username(self) -> str: return self.username
    @property
    def Email(self) -> str: return self.email
    @property
    def PasswordHash(self) -> str: return self.password_hash
    @property
    def Name(self) -> str: return self.name
    @property
    def Role(self) -> UserRole: return self.role
    @property
    def Status(self) -> UserStatus: return self.status
    @property
    def CreatedAt(self) -> datetime: return self.created_at
    @property
    def UpdatedAt(self) -> datetime: return self.updated_at
