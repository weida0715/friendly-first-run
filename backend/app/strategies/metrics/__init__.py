from .binary_classification_metrics_strategy import BinaryClassificationMetricsStrategy
from .continuous_metrics_strategy import ContinuousMetricsStrategy
class MetricsStrategyFactory:
    @staticmethod
    def create(name: str):
        return ContinuousMetricsStrategy() if name in {"continuous", "backtest"} else BinaryClassificationMetricsStrategy()
