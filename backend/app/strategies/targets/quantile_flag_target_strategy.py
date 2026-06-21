"""Quantile-flag binary target strategy."""

from __future__ import annotations

import polars as pl

from app.strategies.targets.base import TargetStrategy


def compute_quantile_cutoff(data: pl.DataFrame, col: str, q: float) -> float | None:
    """Compute the cutoff used to binarize the ROC column."""
    try:
        return data.select(pl.col(col).quantile(1.0 - q)).item()
    except Exception:
        return None


def quantile_flag(data: pl.DataFrame, col: str, cutoff: float) -> pl.DataFrame:
    """Apply the fitted quantile cutoff to a ROC column."""
    return data.with_columns(
        (pl.col(col) > cutoff).cast(pl.Int8).alias("quantile_flag")
    )


def shift_column(data: pl.DataFrame, shift: int, column: str) -> pl.DataFrame:
    """Shift the target column; negative shift moves it forward."""
    return data.with_columns(pl.col(column).shift(shift).alias(column))


class QuantileFlagTargetStrategy(TargetStrategy):
    """Generate target=1 when ROC clears a fitted quantile cutoff."""

    target_name = "quantile_flag"
    parameter_schema = {"roc_period": "integer", "q": "number", "lookahead_period": "integer"}
    parameter_constraints = {
        "roc_period": {"min": 1, "max": 1440},
        "q": {"min": 0.0, "max": 1.0},
        "lookahead_period": {"min": 1, "max": 1440},
    }
    default_values = {"roc_period": 4, "q": 0.5, "lookahead_period": 1}
    binary_label_rule = "1 when ROC over roc_period exceeds the fitted (1-q) quantile cutoff, shifted by lookahead_period bars, otherwise 0"

    def __init__(
        self,
        roc_period: int = 4,
        q: float = 0.5,
        lookahead_period: int = 1,
        cutoff: float | None = None,
    ) -> None:
        if roc_period < 1:
            raise ValueError("roc_period must be >= 1")
        if not 0.0 < q < 1.0:
            raise ValueError("q must be between 0 and 1")
        if lookahead_period < 1:
            raise ValueError("lookahead_period must be >= 1")
        self.roc_period = roc_period
        self.q = q
        self.lookahead_period = lookahead_period
        self.cutoff = cutoff

    def fit(self, df: pl.DataFrame | pl.LazyFrame) -> "QuantileFlagTargetStrategy":
        """Fit the quantile cutoff on the provided training window."""
        roc_df = self._roc_frame(df).collect()
        cutoff = compute_quantile_cutoff(roc_df, f"roc_{self.roc_period}", self.q)
        if cutoff is None:
            raise ValueError("unable to compute quantile cutoff from the provided data")
        return QuantileFlagTargetStrategy(
            roc_period=self.roc_period,
            q=self.q,
            lookahead_period=self.lookahead_period,
            cutoff=cutoff,
        )

    def _roc_frame(self, df: pl.DataFrame | pl.LazyFrame) -> pl.LazyFrame:
        roc_column = f"roc_{self.roc_period}"
        lazy = df.lazy() if isinstance(df, pl.DataFrame) else df
        return lazy.with_columns(
            (
                pl.col("close").cast(pl.Float64) /
                pl.col("close").cast(pl.Float64).shift(self.roc_period)
                - 1.0
            ).alias(roc_column)
        )

    def generate(self, df: pl.LazyFrame) -> pl.LazyFrame:
        roc_column = f"roc_{self.roc_period}"
        roc_frame = self._roc_frame(df)

        cutoff = self.cutoff
        if cutoff is None:
            roc_df = roc_frame.collect()
            cutoff = compute_quantile_cutoff(roc_df, roc_column, self.q)
            if cutoff is None:
                return roc_df.lazy().with_columns(
                    pl.lit(None, dtype=pl.Int8).alias(self.output_column)
                )
            roc_frame = roc_df.lazy()

        return roc_frame.with_columns(
            (pl.col(roc_column) > cutoff).cast(pl.Int8).alias("quantile_flag")
        ).with_columns(
            pl.col("quantile_flag").shift(-self.lookahead_period).alias("quantile_flag")
        ).rename({"quantile_flag": self.output_column})
