from datetime import datetime

from app.domain.models.favorite_blueprint import FavoriteBlueprint
from app.domain.models.favorite_model import FavoriteModel


def test_favorite_model_entity_roundtrip_fields() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0)
    fav = FavoriteModel(user_id=1, model_id=30, created_at=now)
    assert fav.UserID == 1
    assert fav.ModelID == 30


def test_favorite_blueprint_entity_roundtrip_fields() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0)
    fav = FavoriteBlueprint(user_id=1, blueprint_id=10, created_at=now)
    assert fav.UserID == 1
    assert fav.BlueprintID == 10
