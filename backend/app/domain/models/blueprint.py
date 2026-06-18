"""Strict ERD-aligned Blueprint domain entity."""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Literal

ApprovalState = Literal["Draft", "Pending",
                        "Approved", "Rejected", "Disapproved"]


@dataclass(slots=True)
class Blueprint:
    """Represents the ERD-defined Blueprint entity."""

    blueprint_id: int | None
    user_id: int
    name: str
    description: str | None
    indicators: dict[str, Any]
    features: dict[str, Any]
    architecture: dict[str, Any]
    approval_state: ApprovalState
    submitted_at: datetime | None
    version: int
    parent_id: int | None
    created_at: datetime
    updated_at: datetime

    @property
    def BlueprintID(self) -> int | None: return self.blueprint_id
    @property
    def UserID(self) -> int: return self.user_id
    @property
    def Name(self) -> str: return self.name
    @property
    def Description(self) -> str | None: return self.description
    @property
    def Indicators(self) -> dict[str, Any]: return self.indicators
    @property
    def Features(self) -> dict[str, Any]: return self.features
    @property
    def Architecture(self) -> dict[str, Any]: return self.architecture
    @property
    def ApprovalState(self) -> ApprovalState: return self.approval_state
    @property
    def SubmittedAt(self) -> datetime | None: return self.submitted_at
    @property
    def Version(self) -> int: return self.version
    @property
    def ParentID(self) -> int | None: return self.parent_id
    @property
    def CreatedAt(self) -> datetime: return self.created_at
    @property
    def UpdatedAt(self) -> datetime: return self.updated_at
