"""Execution result value object."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class ExecutionResult:
    """Immutable execution outcome payload."""

    success: bool
    details: dict[str, Any]
    error_message: str | None = None

    @staticmethod
    def success_result(details: dict[str, Any] | None = None) -> "ExecutionResult":
        """Create a successful execution result."""
        return ExecutionResult(success=True, details=details or {}, error_message=None)

    @staticmethod
    def failure_result(message: str, details: dict[str, Any] | None = None) -> "ExecutionResult":
        """Create a failed execution result."""
        return ExecutionResult(success=False, details=details or {}, error_message=message)
