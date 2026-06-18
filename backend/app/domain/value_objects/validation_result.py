"""Validation result value object."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ValidationResult:
    """Immutable validation outcome container."""

    ok: bool
    errors: dict[str, list[str]]

    @staticmethod
    def success() -> "ValidationResult":
        """Create a successful validation result."""
        return ValidationResult(ok=True, errors={})

    @staticmethod
    def failure(field: str, message: str) -> "ValidationResult":
        """Create a failed validation result for a single field/message pair."""
        return ValidationResult(ok=False, errors={field: [message]})
