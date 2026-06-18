"""Schema naming tests for RFC-002 strict ERD migration."""

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


def _load_tables_from_upgrade() -> dict[str, sa.Table]:
    metadata = sa.MetaData()

    def create_table(name: str, *items: object, **kwargs: object) -> sa.Table:
        table_items = [item for item in items if isinstance(
            item, (sa.Column, sa.Constraint))]
        return sa.Table(name, metadata, *table_items, **kwargs)

    fake_op = SimpleNamespace(
        create_table=create_table, drop_table=lambda *_a, **_k: None)

    spec = importlib.util.spec_from_file_location(
        "rfc002_migration", MIGRATION_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    module.op = fake_op
    spec.loader.exec_module(module)
    module.op = fake_op
    module.upgrade()
    return metadata.tables


def test_exact_rfc002_table_set_and_no_extras() -> None:
    tables = _load_tables_from_upgrade()
    assert set(tables.keys()) == {
        "User",
        "Blueprint",
        "Experiment",
        "Model",
        "ExperimentLog",
        "FavoriteModel",
        "FavoriteBlueprint",
        "BTCUSDTKline",
    }


def test_exact_pascalcase_column_names() -> None:
    tables = _load_tables_from_upgrade()
    assert set(tables["User"].c.keys()) == {
        "UserID", "Username", "Email", "PasswordHash", "Name", "Role", "Status", "CreatedAt", "UpdatedAt"
    }
    assert set(tables["Blueprint"].c.keys()) == {
        "BlueprintID", "UserID", "Name", "Description", "Indicators", "Features", "Architecture",
        "ApprovalState", "SubmittedAt", "Version", "ParentID", "CreatedAt", "UpdatedAt"
    }
    assert set(tables["Experiment"].c.keys()) == {
        "ExperimentID", "UserID", "BlueprintID", "Name", "Description", "Interval", "StartDate", "EndDate",
        "TrainSplit", "ValSplit", "TestSplit", "ParameterOverrides", "Status", "Progress", "CurrentStage",
        "EtaSeconds", "Success", "CreatedAt", "CompletedAt"
    }
    assert set(tables["Model"].c.keys()) == {
        "ModelID", "ExperimentID", "Parameters", "Sharpe", "Accuracy", "Precision", "Recall", "CreatedAt"
    }
    assert set(tables["ExperimentLog"].c.keys()) == {
        "ExperimentLogID", "ExperimentID", "ModelID", "Timestamp", "Signal", "Prediction", "Metrics", "CreatedAt"
    }
    assert set(tables["FavoriteModel"].c.keys()) == {
        "UserID", "ModelID", "CreatedAt"}
    assert set(tables["FavoriteBlueprint"].c.keys()) == {
        "UserID", "BlueprintID", "CreatedAt"}
    assert set(tables["BTCUSDTKline"].c.keys()) == {
        "Timestamp", "Open", "High", "Low", "Close", "Volume", "CreatedAt"
    }


def test_no_snake_case_table_names_exist() -> None:
    tables = _load_tables_from_upgrade()
    snake_case_names = {
        "user",
        "blueprint",
        "experiment",
        "model",
        "experiment_log",
        "favorite_model",
        "favorite_blueprint",
        "btcusdt_kline",
    }
    assert set(tables.keys()).isdisjoint(snake_case_names)
