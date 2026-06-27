"""Experiment payload validator for RFC-007 wizard flow."""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation
from typing import Any

from app.domain.value_objects.validation_result import ValidationResult


class ExperimentValidator:
    """Validates experiment payloads and access constraints."""

    SPLIT_TOLERANCE = Decimal("0.0001")
    MIN_VAL_SPLIT = Decimal("10")
    MIN_TEST_SPLIT = Decimal("10")
    SUPPORTED_INTERVALS = {"1m", "5m", "15m", "30m", "1h", "2h", "4h", "1d"}

    @classmethod
    def validate(
        cls,
        payload: dict[str, Any],
        actor: Any,
        blueprint_repo: Any,
        market_data_repo: Any = None,
    ) -> ValidationResult:
        errors: dict[str, list[str]] = defaultdict(list)

        name = payload.get("name")
        if not isinstance(name, str) or not name.strip():
            errors["name"].append("Experiment name is required.")

        symbol = payload.get("symbol")
        if symbol != "BTCUSDT":
            errors["symbol"].append("Only BTCUSDT is supported.")

        interval = payload.get("interval") or "1m"
        if interval not in cls.SUPPORTED_INTERVALS:
            errors["interval"].append("Unsupported experiment interval.")
        priority = payload.get("job_priority", payload.get("jobPriority", "normal"))
        if priority not in {"low", "normal", "high"}:
            errors["jobPriority"].append("Job priority must be low, normal, or high.")

        start_date_raw = payload.get(
            "start_datetime", payload.get("start_date"))
        end_date_raw = payload.get("end_datetime", payload.get("end_date"))
        candlestick_amount_raw = payload.get("candlestick_amount")
        uses_candlestick_mode = candlestick_amount_raw not in (None, "")
        start_date = cls._parse_datetime(start_date_raw)
        end_date = cls._parse_datetime(end_date_raw)
        candlestick_amount = cls._parse_decimal(candlestick_amount_raw)

        if start_date_raw is not None and start_date is None:
            errors["startDate"].append("Start date must be a valid datetime.")
        if end_date_raw is not None and end_date is None:
            errors["endDate"].append("End date must be a valid datetime.")
        if not uses_candlestick_mode and start_date is not None and end_date is not None and start_date >= end_date:
            errors["dateRange"].append("Start date must be before end date.")
        if start_date is not None and not cls._is_minute_aligned(start_date):
            errors["startDate"].append(
                "Start datetime must be minute-aligned.")
        if end_date is not None and not cls._is_minute_aligned(end_date):
            errors["endDate"].append("End datetime must be minute-aligned.")

        if uses_candlestick_mode:
            if candlestick_amount is None or candlestick_amount <= 0 or candlestick_amount != candlestick_amount.to_integral_value():
                errors["candlestickAmount"].append(
                    "Candlestick amount must be a positive integer.")
            if end_date_raw is None or (isinstance(end_date_raw, str) and not end_date_raw.strip()):
                errors["endDate"].append(
                    "End date is required for candlestick mode.")

        if market_data_repo:
            latest_available = getattr(
                market_data_repo, "get_latest_timestamp", lambda: None)()
            if latest_available is not None and end_date is not None:
                latest_available = cls._ensure_utc(latest_available)
                if cls._ensure_utc(end_date) > latest_available:
                    errors["endDate"].append(
                        "End datetime is newer than available BTCUSDT data.")

        train_split = cls._parse_decimal(payload.get("train_split"))
        val_split = cls._parse_decimal(payload.get("val_split"))
        test_split = cls._parse_decimal(payload.get("test_split"))

        if train_split is None:
            errors["trainSplit"].append("Train split must be numeric.")
        if val_split is None:
            errors["valSplit"].append("Validation split must be numeric.")
        if test_split is None:
            errors["testSplit"].append("Test split must be numeric.")

        if val_split is not None and val_split < cls.MIN_VAL_SPLIT:
            errors["valSplit"].append("Validation split must be at least 10%.")
        if test_split is not None and test_split < cls.MIN_TEST_SPLIT:
            errors["testSplit"].append("Test split must be at least 10%.")

        if train_split is not None and val_split is not None and test_split is not None:
            total = train_split + val_split + test_split
            if abs(total - Decimal("100")) > cls.SPLIT_TOLERANCE:
                errors["splitTotal"].append(
                    "Train + Validation + Test must total 100%.")

        blueprint_id_raw = payload.get("blueprint_id")
        try:
            blueprint_id = int(blueprint_id_raw)
        except (TypeError, ValueError):
            blueprint_id = None
            errors["blueprintId"].append("Blueprint selection is required.")

        if blueprint_id is not None:
            blueprint = blueprint_repo.get_by_id(blueprint_id)
            if blueprint is None:
                errors["blueprintId"].append("Blueprint is not accessible.")
            else:
                actor_id = cls._resolve_id(actor, ("user_id", "id", "UserID"))
                blueprint_owner_id = cls._resolve_id(blueprint, ("user_id", "UserID"))
                blueprint_state = str(
                    cls._resolve_id(blueprint, ("approval_state", "ApprovalState")) or ""
                ).lower()
                actor_role = str(cls._resolve_id(actor, ("role", "Role")) or "").lower()
                is_staff = actor_role in {"moderator", "admin"}
                is_owner = actor_id is not None and blueprint_owner_id is not None and int(actor_id) == int(blueprint_owner_id)
                is_public = blueprint_state == "approved"
                if not (is_owner or is_staff or is_public):
                    errors["blueprintId"].append(
                        "Blueprint is not accessible.")

        overrides = payload.get("parameter_overrides")
        if not isinstance(overrides, dict):
            errors["parameterOverrides"].append(
                "Parameter overrides must be an object.")
        else:
            threshold = overrides.get("signal_threshold", overrides.get("signalThreshold"))
            if threshold is not None:
                try:
                    parsed_threshold = float(threshold)
                except (TypeError, ValueError):
                    errors["parameterOverrides.signal_threshold"].append(
                        "Signal threshold must be numeric.")
                else:
                    if parsed_threshold < 0 or parsed_threshold > 1:
                        errors["parameterOverrides.signal_threshold"].append(
                            "Signal threshold must be between 0 and 1.")
            cls._validate_override_value(
                "parameterOverrides", overrides, errors)

        if errors:
            return ValidationResult(ok=False, errors=dict(errors))
        return ValidationResult.success()

    @staticmethod
    def _parse_decimal(value: Any) -> Decimal | None:
        try:
            if value is None:
                return None
            return Decimal(str(value))
        except (InvalidOperation, ValueError, TypeError):
            return None

    @staticmethod
    def _parse_datetime(value: Any) -> datetime | None:
        if value is None:
            return None
        if not isinstance(value, str) or not value.strip():
            return None
        candidate = value.strip().replace("Z", "+00:00")
        try:
            return ExperimentValidator._ensure_utc(datetime.fromisoformat(candidate))
        except ValueError:
            return None

    @staticmethod
    def _ensure_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)

    @staticmethod
    def _is_minute_aligned(value: datetime) -> bool:
        return value.second == 0 and value.microsecond == 0

    @staticmethod
    def _resolve_id(obj: Any, candidates: tuple[str, ...]) -> Any | None:
        for candidate in candidates:
            value = getattr(obj, candidate, None)
            if value is not None:
                return value
        return None

    @classmethod
    def _validate_override_value(
        cls,
        field_path: str,
        value: Any,
        errors: dict[str, list[str]],
    ) -> None:
        if isinstance(value, dict):
            for key, nested in value.items():
                if not isinstance(key, str):
                    errors[field_path].append("Override keys must be strings.")
                    continue
                cls._validate_override_value(
                    f"{field_path}.{key}", nested, errors)
            return

        if isinstance(value, list):
            for index, nested in enumerate(value):
                cls._validate_override_value(
                    f"{field_path}[{index}]", nested, errors)
            return

        if isinstance(value, (str, int, float, bool)) or value is None:
            return

        errors[field_path].append(
            "Override value must be a scalar, object, or list.")
