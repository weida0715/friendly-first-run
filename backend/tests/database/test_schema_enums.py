"""Enum tests for RFC-002 strict ERD migration."""

from __future__ import annotations

import importlib.util
from pathlib import Path
from types import SimpleNamespace

import sqlalchemy as sa

MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "20260503_0001_rfc002_strict_erd.py"
)


def _load_tables() -> dict[str, sa.Table]:
    metadata = sa.MetaData()

    def create_table(name: str, *items: object, **kwargs: object) -> sa.Table:
        table_items = [item for item in items if isinstance(
            item, (sa.Column, sa.Constraint))]
        return sa.Table(name, metadata, *table_items, **kwargs)

    fake_op = SimpleNamespace(
        create_table=create_table, drop_table=lambda *_a, **_k: None)
    spec = importlib.util.spec_from_file_location(
        "rfc002_migration_enums", MIGRATION_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    module.op = fake_op
    spec.loader.exec_module(module)
    module.op = fake_op
    module.upgrade()
    return metadata.tables


def test_enum_names_and_values_match_erd() -> None:
    tables = _load_tables()

    role = tables["User"].c["Role"].type
    status = tables["User"].c["Status"].type
    approval = tables["Blueprint"].c["ApprovalState"].type
    interval = tables["Experiment"].c["Interval"].type
    exp_status = tables["Experiment"].c["Status"].type

    assert isinstance(role, sa.Enum)
    assert isinstance(status, sa.Enum)
    assert isinstance(approval, sa.Enum)
    assert isinstance(interval, sa.Enum)
    assert isinstance(exp_status, sa.Enum)

    assert role.name == "RoleEnum"
    assert tuple(role.enums) == ("User", "Moderator", "Admin")

    assert status.name == "UserStatusEnum"
    assert tuple(status.enums) == ("Enabled", "Disabled", "Pending")

    assert approval.name == "ApprovalStateEnum"
    assert tuple(approval.enums) == (
        "Draft", "Pending", "Approved", "Rejected")

    assert interval.name == "ExperimentIntervalEnum"
    assert tuple(interval.enums) == ("1m", "5m", "15m", "1h", "4h", "1d")

    assert exp_status.name == "ExperimentStatusEnum"
    assert tuple(exp_status.enums) == (
        "Queued", "Running", "Completed", "Failed", "Cancelled")
