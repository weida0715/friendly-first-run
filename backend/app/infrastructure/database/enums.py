"""ERD-aligned enum definitions for RFC-002 persistence mapping."""

from enum import Enum


class UserRole(str, Enum):
    """Allowed User.Role values from ERD."""

    USER = "User"
    MODERATOR = "Moderator"
    ADMIN = "Admin"


class UserStatus(str, Enum):
    """Allowed User.Status values from ERD."""

    ENABLED = "Enabled"
    DISABLED = "Disabled"
    PENDING = "Pending"


class ApprovalState(str, Enum):
    """Allowed Blueprint.ApprovalState values from ERD."""

    DRAFT = "Draft"
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    DISAPPROVED = "Disapproved"


class ExperimentInterval(str, Enum):
    """Allowed Experiment.Interval values from ERD."""

    ONE_MINUTE = "1m"
    FIVE_MINUTES = "5m"
    FIFTEEN_MINUTES = "15m"
    THIRTY_MINUTES = "30m"
    ONE_HOUR = "1h"
    TWO_HOURS = "2h"
    FOUR_HOURS = "4h"
    ONE_DAY = "1d"


class ExperimentStatus(str, Enum):
    """Allowed Experiment.Status values from ERD."""

    QUEUED = "Queued"
    RUNNING = "Running"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"
