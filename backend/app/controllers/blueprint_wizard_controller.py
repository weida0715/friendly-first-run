"""BlueprintWizardController scaffolding for RFC-005 wizard flow.

This module currently documents the request/response contract for the upcoming
Blueprint wizard submission endpoint so frontend and backend can align before
persistence/validation logic is fully implemented.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

WizardMode = Literal["create", "edit"]


@dataclass(slots=True)
class BlueprintWizardSubmitPayload:
    """Contract for blueprint wizard draft submission.

    Expected JSON payload shape:

    {
      "mode": "create" | "edit",
      "source_blueprint_id": int | null,
      "metadata": {
        "name": str,
        "description": str | null,
        "objective": str | null
      },
      "indicators": {
        "selected": list[str],
        "config": dict[str, dict[str, Any]]
      },
      "architecture": {
        "reference": str,
        "safety_profile": str,
        "settings": dict[str, Any]
      },
      "parameter_ranges": {
        "learning_rate": {"min": float | str, "max": float | str},
        "window_size": {"min": int | str, "max": int | str},
        "extra": dict[str, dict[str, Any]]
      }
    }
    """

    mode: WizardMode
    source_blueprint_id: int | None
    metadata: dict[str, Any]
    indicators: dict[str, Any]
    architecture: dict[str, Any]
    parameter_ranges: dict[str, Any]


class BlueprintWizardController:
    """Coordinates Blueprint creation wizard use cases."""

    @staticmethod
    def payload_contract() -> dict[str, Any]:
        """Return a machine-readable payload contract reference.

        This helper is temporary and intended for internal contract alignment
        until full request parsing + validator integration are implemented.
        """

        return {
            "mode": "create|edit",
            "source_blueprint_id": "int|null",
            "metadata": {
                "name": "str(required)",
                "description": "str|null",
                "objective": "str|null",
            },
            "indicators": {
                "selected": "list[str]",
                "config": "dict[str, dict[str, Any]]",
            },
            "architecture": {
                "reference": "str(required)",
                "safety_profile": "str(required)",
                "settings": "dict[str, Any]",
            },
            "parameter_ranges": {
                "learning_rate": "{min,max}",
                "window_size": "{min,max}",
                "extra": "dict[str, {min,max}]",
            },
        }
