"""Base contract for Polars custom indicators."""

from __future__ import annotations

import polars as pl


class CustomIndicator:
    """Base class for custom indicators that append columns to a LazyFrame."""

    name: str
    output_columns: tuple[str, ...]
