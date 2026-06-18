"""SQLAlchemy declarative base for RFC-002 strict ERD mappings.

Naming policy (strict):
- Physical table names MUST remain singular PascalCase exactly as ERD-defined.
- Physical column names MUST remain PascalCase exactly as ERD-defined.
- ORM mappings must explicitly bind names (no inferred snake_case physical names).
"""

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM mappings."""

    metadata = MetaData()
