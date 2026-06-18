from __future__ import annotations
from statistics import mean, median, pstdev
from typing import Any
from app.strategies.metrics_strategy import MetricsStrategy

class ContinuousMetricsStrategy(MetricsStrategy):
    def compute(self, payload: dict[str, Any]) -> dict[str, Any]:
        xs=[float(x) for x in payload.get("returns", [])]
        if not xs: return {"mean_return": 0.0, "median_return": 0.0, "sharpe_ratio": None, "max_drawdown": 0.0, "return_std": 0.0}
        std=pstdev(xs) if len(xs)>1 else 0.0
        equity=0.0; peak=0.0; dd=0.0
        for x in xs: equity += x; peak=max(peak,equity); dd=min(dd,equity-peak)
        return {"mean_return": mean(xs), "median_return": median(xs), "sharpe_ratio": mean(xs)/std if std else None, "max_drawdown": abs(dd), "return_std": std}
