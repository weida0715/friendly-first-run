from __future__ import annotations

from types import SimpleNamespace

from app.factories.target_strategy_factory import TargetStrategyFactory
from app.strategies.target_strategy import TargetStrategyFactory as RuntimeTargetStrategyFactory
from app.strategies.targets.base import TargetStrategy


def test_target_strategy_factory_discovers_new_target_modules(monkeypatch) -> None:
    TargetStrategyFactory._discovered_strategies.cache_clear()
    RuntimeTargetStrategyFactory._strategies.cache_clear()

    class DummyDiscoveredTarget(TargetStrategy):
        target_name = "dummy_discovered"
        parameter_schema = {}
        parameter_constraints = {}
        default_values = {}
        binary_label_rule = "dummy"

        def generate(self, df):  # pragma: no cover - discovery only
            return df

    monkeypatch.setattr(
        "app.factories.target_strategy_factory.pkgutil.iter_modules",
        lambda _path: [SimpleNamespace(name="dummy_discovered_target")],
    )
    monkeypatch.setattr(
        "app.factories.target_strategy_factory.importlib.import_module",
        lambda _module: None,
    )
    monkeypatch.setattr(
        "app.strategies.target_strategy.pkgutil.iter_modules",
        lambda _path: [SimpleNamespace(name="dummy_discovered_target")],
    )
    monkeypatch.setattr(
        "app.strategies.target_strategy.importlib.import_module",
        lambda _module: None,
    )

    TargetStrategyFactory._discovered_strategies.cache_clear()
    RuntimeTargetStrategyFactory._strategies.cache_clear()

    metadata_names = [item["name"] for item in TargetStrategyFactory.list_metadata()]
    assert "dummy_discovered" in metadata_names
    assert RuntimeTargetStrategyFactory.create("dummy_discovered").target_name == "dummy_discovered"
