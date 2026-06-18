from __future__ import annotations

from app.services.access_control_service import AccessControlService, AuthContext


class _TargetUser:
    def __init__(self, role: str) -> None:
        self.Role = role


def _actor(role: str, user_id: int = 1) -> AuthContext:
    return AuthContext(
        user_id=user_id,
        username="actor",
        email="actor@example.com",
        name="Actor",
        role=role,
        status="Enabled",
        session_id="sess",
    )


def test_role_checks() -> None:
    user = _actor("User")
    mod = _actor("Moderator")
    admin = _actor("Admin")

    assert AccessControlService.is_staff(user) is False
    assert AccessControlService.is_staff(mod) is True
    assert AccessControlService.is_staff(admin) is True

    assert AccessControlService.is_moderator(mod) is True
    assert AccessControlService.is_moderator(admin) is False

    assert AccessControlService.is_admin(admin) is True
    assert AccessControlService.is_admin(mod) is False


def test_ownership_and_profile_access() -> None:
    user = _actor("User", user_id=10)
    mod = _actor("Moderator", user_id=20)

    assert AccessControlService.is_owner(user, 10) is True
    assert AccessControlService.is_owner(user, 11) is False

    assert AccessControlService.can_access_profile(user, 10) is True
    assert AccessControlService.can_access_profile(user, 11) is False
    assert AccessControlService.can_access_profile(mod, 11) is True


def test_can_manage_user_role_matrix() -> None:
    user_actor = _actor("User")
    mod_actor = _actor("Moderator")
    admin_actor = _actor("Admin")

    target_user = _TargetUser("User")
    target_mod = _TargetUser("Moderator")
    target_admin = _TargetUser("Admin")

    assert AccessControlService.can_manage_user(
        user_actor, target_user) is False

    assert AccessControlService.can_manage_user(mod_actor, target_user) is True
    assert AccessControlService.can_manage_user(mod_actor, target_mod) is False
    assert AccessControlService.can_manage_user(
        mod_actor, target_admin) is False

    assert AccessControlService.can_manage_user(
        admin_actor, target_user) is True
    assert AccessControlService.can_manage_user(
        admin_actor, target_mod) is True
    assert AccessControlService.can_manage_user(
        admin_actor, target_admin) is True


def test_can_assign_role_matrix() -> None:
    user_actor = _actor("User")
    mod_actor = _actor("Moderator")
    admin_actor = _actor("Admin")

    assert AccessControlService.can_assign_role(user_actor, "User") is False
    assert AccessControlService.can_assign_role(
        user_actor, "Moderator") is False
    assert AccessControlService.can_assign_role(user_actor, "Admin") is False

    assert AccessControlService.can_assign_role(mod_actor, "User") is True
    assert AccessControlService.can_assign_role(
        mod_actor, "Moderator") is False
    assert AccessControlService.can_assign_role(mod_actor, "Admin") is False

    assert AccessControlService.can_assign_role(admin_actor, "User") is True
    assert AccessControlService.can_assign_role(
        admin_actor, "Moderator") is True
    assert AccessControlService.can_assign_role(admin_actor, "Admin") is True
