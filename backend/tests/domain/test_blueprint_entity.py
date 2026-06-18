from datetime import datetime
from typing import get_args

from app.domain.models.blueprint import ApprovalState, Blueprint


def test_blueprint_entity_roundtrip_fields() -> None:
    now = datetime(2026, 1, 1, 12, 0, 0)
    bp = Blueprint(
        blueprint_id=10,
        user_id=1,
        name="Base",
        description="desc",
        indicators={"rsi": 14},
        features={"close": True},
        architecture={"layers": []},
        approval_state="Draft",
        submitted_at=None,
        version=1,
        parent_id=None,
        created_at=now,
        updated_at=now,
    )
    assert bp.BlueprintID == 10
    assert bp.ApprovalState == "Draft"


def test_blueprint_approval_state_literal_values_match_erd() -> None:
    assert set(get_args(ApprovalState)) == {
        "Draft", "Pending", "Approved", "Rejected", "Disapproved"}
