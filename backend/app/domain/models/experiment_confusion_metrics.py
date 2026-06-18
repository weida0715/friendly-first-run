"""ExperimentConfusionMetrics entity placeholder."""

from dataclasses import dataclass


@dataclass(slots=True)
class ExperimentConfusionMetrics:
    """Represents confusion-matrix-derived experiment metrics."""

    true_positive: int = 0
    true_negative: int = 0
    false_positive: int = 0
    false_negative: int = 0
