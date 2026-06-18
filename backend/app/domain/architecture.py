"""Architecture metadata and contracts for model adapters."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True)
class ArchitectureMetadata:
    name: str
    display_name: str
    hyperparameters: dict[str, dict[str, Any]]
    default_values: dict[str, Any]
    prediction_output_shape: dict[str, Any]
    supports_probabilities: bool

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
