from __future__ import annotations

from app.core.security import create_access_token

DEV_TOKEN = create_access_token({"sub": "dev_user", "dev": True})


def _auth_headers(token: str = DEV_TOKEN) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


SAMPLE_CSV = """Activity/Trade Date,Transaction Date,Settlement Date,Activity Type,Description,Symbol,Cusip,Quantity #,Price $,Amount $,Commission,Category,Note
02/18/26,02/18/26,02/19/26,Sold Short,PUT  IWM    02/27/26   260.000,IWM,--,-1.0,2.13,212.49,0.51,--,--
"""


async def _import_one(client) -> str:
    upload = await client.post(
        "/api/transactions/upload",
        headers=_auth_headers(),
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )
    assert upload.status_code == 200

    txns = await client.get("/api/transactions", headers=_auth_headers())
    assert txns.status_code == 200
    return txns.json()[0]["id"]


async def test_list_strategy_types_options(client):
    resp = await client.get(
        "/api/transactions/strategy-types",
        headers=_auth_headers(),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)

    values = {opt["value"] for opt in body}
    assert {"WHEEL", "COVERED_CALL", "COLLAR", "CSP", "LONG_HOLD", "SIP"}.issubset(values)


async def test_strategy_type_set_change_clear_and_filters(client):
    txn_id = await _import_one(client)

    # Set strategy type
    patch = await client.patch(
        f"/api/transactions/{txn_id}/strategy-type",
        headers=_auth_headers(),
        json={"strategy_type": "WHEEL"},
    )
    assert patch.status_code == 200
    assert patch.json()["strategy_type"] == "WHEEL"
    assert "portfolio_id" not in patch.json()

    # Change strategy type
    change = await client.patch(
        f"/api/transactions/{txn_id}/strategy-type",
        headers=_auth_headers(),
        json={"strategy_type": "COVERED_CALL"},
    )
    assert change.status_code == 200
    assert change.json()["strategy_type"] == "COVERED_CALL"

    # Filters
    untagged = await client.get(
        "/api/transactions?tagged=false",
        headers=_auth_headers(),
    )
    assert untagged.status_code == 200
    assert untagged.json() == []

    tagged = await client.get(
        "/api/transactions?tagged=true",
        headers=_auth_headers(),
    )
    assert tagged.status_code == 200
    assert len(tagged.json()) == 1
    assert tagged.json()[0]["strategy_type"] == "COVERED_CALL"

    by_type = await client.get(
        "/api/transactions?strategy_type=COVERED_CALL",
        headers=_auth_headers(),
    )
    assert by_type.status_code == 200
    assert len(by_type.json()) == 1

    invalid_combo = await client.get(
        "/api/transactions?tagged=false&strategy_type=WHEEL",
        headers=_auth_headers(),
    )
    assert invalid_combo.status_code == 422

    # Clear strategy type
    clear = await client.patch(
        f"/api/transactions/{txn_id}/strategy-type",
        headers=_auth_headers(),
        json={"strategy_type": None},
    )
    assert clear.status_code == 200
    assert clear.json()["strategy_type"] is None
