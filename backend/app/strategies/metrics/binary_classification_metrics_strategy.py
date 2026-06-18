from __future__ import annotations
from typing import Any
from app.strategies.metrics_strategy import MetricsStrategy

class BinaryClassificationMetricsStrategy(MetricsStrategy):
    def compute(self, payload: dict[str, Any]) -> dict[str, Any]:
        y_true = [int(x) for x in payload.get("y_true", [])]
        y_pred = [int(x) for x in payload.get("y_pred", [])]
        n = min(len(y_true), len(y_pred)); y_true = y_true[:n]; y_pred = y_pred[:n]
        tp=sum(1 for a,p in zip(y_true,y_pred) if a==1 and p==1); fp=sum(1 for a,p in zip(y_true,y_pred) if a==0 and p==1)
        tn=sum(1 for a,p in zip(y_true,y_pred) if a==0 and p==0); fn=sum(1 for a,p in zip(y_true,y_pred) if a==1 and p==0)
        precision=tp/(tp+fp) if tp+fp else 0.0; recall=tp/(tp+fn) if tp+fn else 0.0
        f1=2*precision*recall/(precision+recall) if precision+recall else 0.0
        return {"accuracy": (tp+tn)/n if n else 0.0, "precision": precision, "recall": recall, "f1_score": f1, "tp": tp, "fp": fp, "tn": tn, "fn": fn}
