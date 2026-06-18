from datetime import datetime
from decimal import Decimal

from app.domain.models.btcusdt_kline import BTCUSDTKline


def test_btcusdt_kline_entity_roundtrip_fields() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0)
    kline = BTCUSDTKline(
        timestamp=now,
        open=Decimal("50000.00000000"),
        high=Decimal("51000.00000000"),
        low=Decimal("49000.00000000"),
        close=Decimal("50500.00000000"),
        volume=Decimal("123.12345678"),
        created_at=now,
    )
    assert kline.Close == Decimal("50500.00000000")
