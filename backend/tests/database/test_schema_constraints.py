"""Constraint tests for RFC-002 strict ERD migration."""

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
        "rfc002_migration_constraints", MIGRATION_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    module.op = fake_op
    spec.loader.exec_module(module)
    module.op = fake_op
    module.upgrade()
    return metadata.tables


def test_primary_keys_present() -> None:
    tables = _load_tables()
    assert [c.name for c in tables["User"].primary_key.columns] == ["UserID"]
    assert [c.name for c in tables["Blueprint"].primary_key.columns] == [
        "BlueprintID"]
    assert [c.name for c in tables["Experiment"].primary_key.columns] == [
        "ExperimentID"]
    assert [c.name for c in tables["Model"].primary_key.columns] == ["ModelID"]
    assert [c.name for c in tables["ExperimentLog"].primary_key.columns] == [
        "ExperimentLogID"]
    assert set(c.name for c in tables["FavoriteModel"].primary_key.columns) == {
        "UserID", "ModelID"}
    assert set(c.name for c in tables["FavoriteBlueprint"].primary_key.columns) == {
        "UserID", "BlueprintID"}
    assert [c.name for c in tables["BTCUSDTKline"].primary_key.columns] == [
        "Timestamp"]


def test_foreign_keys_present_with_exact_targets() -> None:
    tables = _load_tables()

    def targets(table: sa.Table) -> set[str]:
        result: set[str] = set()
        for fk in table.foreign_key_constraints:
            for elem in fk.elements:
                result.add(f"{elem.parent.name}->{elem.target_fullname}")
        return result

    assert targets(tables["Blueprint"]) == {
        "UserID->User.UserID", "ParentID->Blueprint.BlueprintID"}
    assert targets(tables["Experiment"]) == {
        "UserID->User.UserID", "BlueprintID->Blueprint.BlueprintID"}
    assert targets(tables["Model"]) == {
        "ExperimentID->Experiment.ExperimentID"}
    assert targets(tables["ExperimentLog"]) == {
        "ExperimentID->Experiment.ExperimentID",
        "ModelID->Model.ModelID",
    }
    assert targets(tables["FavoriteModel"]) == {
        "UserID->User.UserID", "ModelID->Model.ModelID"}
    assert targets(tables["FavoriteBlueprint"]) == {
        "UserID->User.UserID",
        "BlueprintID->Blueprint.BlueprintID",
    }


def test_unique_and_check_constraints_present() -> None:
    tables = _load_tables()

    user_unique_cols = {
        tuple(sorted(c.name for c in uc.columns))
        for uc in tables["User"].constraints
        if isinstance(uc, sa.UniqueConstraint)
    }
    assert user_unique_cols == {("Email",), ("Username",)}

    blueprint_uniques = {
        uc.name: tuple(c.name for c in uc.columns)
        for uc in tables["Blueprint"].constraints
        if isinstance(uc, sa.UniqueConstraint)
    }
    assert blueprint_uniques["uq_Blueprint_UserID_Name_Version"] == (
        "UserID", "Name", "Version")

    checks = {
        cc.name: str(cc.sqltext)
        for table in tables.values()
        for cc in table.constraints
        if isinstance(cc, sa.CheckConstraint)
    }
    assert checks["ck_Blueprint_ParentID_not_self"] == "ParentID IS NULL OR ParentID <> BlueprintID"
    assert checks["ck_Experiment_SplitSum"] == "TrainSplit + ValSplit + TestSplit = 1.00"
    assert checks["ck_Experiment_MinValTestSplit"] == "ValSplit >= 0.10 AND TestSplit >= 0.10"
