"""Compile immutable experiment run plans from Blueprints and overrides."""

from __future__ import annotations

import copy
import hashlib
import itertools
import json
import random
from dataclasses import dataclass
from typing import Any


class ExperimentCompilationError(ValueError):
    def __init__(self, errors: dict[str, list[str]]) -> None:
        self.errors = errors
        super().__init__("Experiment configuration compilation failed")


@dataclass(frozen=True)
class CompiledExperimentPlan:
    compiled_blueprint_snapshot: dict[str, Any]
    compiled_experiment_snapshot: dict[str, Any]
    permutations: list[dict[str, Any]]
    max_permutation_count: int
    requested_permutation_count: int


def stable_parameter_hash(parameters: dict[str, Any]) -> str:
    payload = json.dumps(parameters, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


class ExperimentCompiler:
    @classmethod
    def compile(
        cls,
        *,
        blueprint: Any,
        experiment_payload: dict[str, Any],
    ) -> CompiledExperimentPlan:
        errors: dict[str, list[str]] = {}
        bp_snapshot = {
            "id": getattr(blueprint, "blueprint_id", None),
            "name": getattr(blueprint, "name", None),
            "version": getattr(blueprint, "version", None),
            "architecture": copy.deepcopy(getattr(blueprint, "architecture", {}) or {}),
            "indicators": copy.deepcopy(getattr(blueprint, "indicators", {}) or {}),
            "features": copy.deepcopy(getattr(blueprint, "features", {}) or {}),
            "approval_state": getattr(blueprint, "approval_state", None),
        }
        overrides = copy.deepcopy(experiment_payload.get("parameter_overrides") or {})
        deterministic = bool(experiment_payload.get("deterministic", True))
        seed = int(experiment_payload.get("seed", 42) or 42)

        architecture = cls._compile_section(
            "architecture",
            bp_snapshot["architecture"].get("parameters") or {},
            bp_snapshot["architecture"].get("parameter_constraints") or {},
            overrides.get("architecture") or {},
            errors,
        )
        indicators = {}
        indicator_params = bp_snapshot["indicators"].get("parameters") or {}
        indicator_constraints = bp_snapshot["indicators"].get("parameter_constraints") or {}
        for name, params in indicator_params.items():
            indicators[name] = cls._compile_section(
                f"indicators.{name}",
                params or {},
                indicator_constraints.get(name) or {},
                (overrides.get("indicators") or {}).get(name) or {},
                errors,
            )
        target_base = copy.deepcopy(overrides.get("target_params") or overrides.get("target") or {})
        target_strategy = experiment_payload.get("target_strategy") or target_base.get("strategy") or "forward_return"
        target = cls._compile_section("target", target_base, {}, overrides.get("target") or {}, errors)
        split = cls._compile_section(
            "split",
            {
                "strategy": experiment_payload.get("split_strategy", "time_based_sequential"),
                "train": experiment_payload.get("train_split"),
                "validation": experiment_payload.get("val_split"),
                "test": experiment_payload.get("test_split"),
            },
            {},
            overrides.get("split") or {},
            errors,
        )
        if errors:
            raise ExperimentCompilationError(errors)

        spaces = {"architecture": architecture, "target": target, "split": split}
        for name, params in indicators.items():
            spaces[f"indicators.{name}"] = params
        permutations = cls._cartesian(spaces)
        for item in permutations:
            item["parameter_hash"] = stable_parameter_hash(item)
        # Dedupe before deterministic sampling.
        deduped = list({item["parameter_hash"]: item for item in permutations}.values())
        max_count = len(deduped)
        requested = int(experiment_payload.get("requested_permutation_count") or max_count or 1)
        if requested < 1:
            errors.setdefault("requestedPermutationCount", []).append("Requested permutations must be at least 1.")
        if requested > max_count:
            requested = max_count
        if errors:
            raise ExperimentCompilationError(errors)
        selected = deduped
        if requested < max_count:
            rng = random.Random(seed if deterministic else None)
            selected = rng.sample(deduped, requested)

        compiled_experiment = {
            "symbol": experiment_payload.get("symbol", "BTCUSDT"),
            "interval": experiment_payload.get("interval", "1m"),
            "start_datetime": experiment_payload.get("start_datetime"),
            "end_datetime": experiment_payload.get("end_datetime"),
            "target_strategy": target_strategy,
            "deterministic": deterministic,
            "seed": seed,
            "max_permutation_count": max_count,
            "requested_permutation_count": requested,
            "effective_parameters": {"architecture": architecture, "indicators": indicators, "target": target, "split": split},
            "selected_parameter_hashes": [item["parameter_hash"] for item in selected],
        }
        return CompiledExperimentPlan(bp_snapshot, compiled_experiment, selected, max_count, requested)

    @classmethod
    def _compile_section(cls, path: str, base: dict[str, Any], constraints: dict[str, Any], overrides: dict[str, Any], errors: dict[str, list[str]]) -> dict[str, Any]:
        # Blueprint-stored params can come from forms as strings like
        # "26,48,96". Normalize base values too so the Cartesian product sees
        # real option lists, not one scalar string.
        result = {key: cls._coerce_parameter_value(value) for key, value in copy.deepcopy(base).items()}
        for key, override in (overrides or {}).items():
            if key not in result and constraints and key not in constraints:
                errors.setdefault(path, []).append(f"Unknown override parameter: {key}")
                continue
            if isinstance(override, dict) and "min" in override and "max" in override:
                lo, hi = override["min"], override["max"]
                rule = constraints.get(key, {})
                if "min" in rule and float(lo) < float(rule["min"]):
                    errors.setdefault(f"{path}.{key}", []).append("Narrowed range is below allowed minimum.")
                if "max" in rule and float(hi) > float(rule["max"]):
                    errors.setdefault(f"{path}.{key}", []).append("Narrowed range is above allowed maximum.")
                result[key] = [lo, hi] if lo != hi else lo
            elif isinstance(override, dict) and "allowed_values" in override:
                allowed = override["allowed_values"]
                rule_allowed = constraints.get(key, {}).get("allowed_values")
                if rule_allowed is not None and any(item not in rule_allowed for item in allowed):
                    errors.setdefault(f"{path}.{key}", []).append("Allowed-value subset contains disallowed values.")
                result[key] = list(allowed)
            else:
                cls._validate_fixed(path, key, override, constraints.get(key, {}), errors)
                result[key] = cls._coerce_parameter_value(override)
        return result

    @staticmethod
    def _coerce_parameter_value(value: Any) -> Any:
        if not isinstance(value, str):
            return value
        text = value.strip()
        if not text:
            return value
        if text.startswith('['):
            try:
                return json.loads(text)
            except ValueError:
                pass
        if ',' in text:
            return [ExperimentCompiler._coerce_parameter_value(part.strip()) for part in text.split(',') if part.strip()]
        if text.lower() == 'true':
            return True
        if text.lower() == 'false':
            return False
        try:
            number = float(text)
        except ValueError:
            return value
        return int(number) if number.is_integer() else number

    @staticmethod
    def _validate_fixed(path: str, key: str, value: Any, rule: dict[str, Any], errors: dict[str, list[str]]) -> None:
        if not rule or value in (None, ""):
            return
        values = value if isinstance(value, list) else [value]
        for candidate in values:
            if "allowed_values" in rule and candidate not in rule["allowed_values"]:
                errors.setdefault(f"{path}.{key}", []).append("Value is not allowed.")
            if rule.get("type") in {"number", "integer"}:
                try:
                    number = float(candidate)
                except (TypeError, ValueError):
                    errors.setdefault(f"{path}.{key}", []).append("Value must be numeric.")
                    continue
                if rule.get("type") == "integer" and not number.is_integer():
                    errors.setdefault(f"{path}.{key}", []).append("Value must be an integer.")
                if "min" in rule and number < float(rule["min"]):
                    errors.setdefault(f"{path}.{key}", []).append("Value is below minimum.")
                if "max" in rule and number > float(rule["max"]):
                    errors.setdefault(f"{path}.{key}", []).append("Value is above maximum.")

    @staticmethod
    def _cartesian(spaces: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
        keys: list[tuple[str, str]] = []
        value_lists: list[list[Any]] = []
        for section, params in spaces.items():
            for key, value in params.items():
                keys.append((section, key))
                value_lists.append(value if isinstance(value, list) else [value])
        results = []
        for combo in itertools.product(*value_lists):
            item: dict[str, Any] = {}
            for (section, key), value in zip(keys, combo, strict=True):
                target = item
                parts = section.split(".")
                for part in parts:
                    target = target.setdefault(part, {})
                target[key] = value
            results.append(item)
        return results or [{}]
