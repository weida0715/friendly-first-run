from datetime import datetime
from typing import get_args

from app.domain.models.user import User, UserRole, UserStatus


def test_user_entity_roundtrip_fields() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0)
    user = User(
        user_id=1,
        username="alice",
        email="alice@example.com",
        password_hash="x" * 60,
        name="Alice",
        role="User",
        status="Enabled",
        created_at=now,
        updated_at=now,
    )

    assert user.UserID == 1
    assert user.Username == "alice"
    assert user.Role == "User"
    assert user.Status == "Enabled"


def test_user_role_and_status_literal_values_match_erd() -> None:
    assert set(get_args(UserRole)) == {"User", "Moderator", "Admin"}
    assert set(get_args(UserStatus)) == {"Enabled", "Disabled", "Pending"}
