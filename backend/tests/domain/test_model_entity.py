from datetime import datetime
from decimal import Decimal

from app.domain.models.model import Model


def test_model_entity_roundtrip_fields() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0)
    model = Model(
        model_id=30,
        experiment_id=20,
        parameters={"c": 1.0},
        sharpe=Decimal("1.2345"),
        accuracy=Decimal("0.8123"),
        precision=Decimal("0.7000"),
        recall=Decimal("0.6000"),
        created_at=now,
    )
    assert model.ModelID == 30
    assert model.Parameters["c"] == 1.0
