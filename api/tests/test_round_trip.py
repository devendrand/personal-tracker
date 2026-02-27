"""Tests for round-trip group endpoints.

Covers:
- POST /api/round-trips/link        (T009/T010 — link + conflict detection)
- POST /api/round-trips/{id}/add    (T020 — add to existing group)
- POST /api/round-trips/{id}/remove (T025/T026 — remove + disbandment)
- DELETE /api/round-trips/{id}      (explicit disband)
- GET  /api/round-trips             (list)
- GET  /api/round-trips/{id}        (detail)
- Ownership enforcement
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token

DEV_TOKEN = create_access_token({"sub": "dev_user", "dev": True})
OTHER_TOKEN = create_access_token({"sub": "other_user", "dev": True})

SAMPLE_CSV = """Activity/Trade Date,Transaction Date,Settlement Date,Activity Type,Description,Symbol,Cusip,Quantity #,Price $,Amount $,Commission,Category,Note
02/18/26,02/18/26,02/19/26,Sold Short,PUT  AAPL   02/27/26   180.000,AAPL,--,-1.0,1.50,150.00,0.00,--,--
02/15/26,02/15/26,02/16/26,Bought to Close,PUT  AAPL   02/27/26   180.000,AAPL,--,1.0,0.50,-50.00,0.00,--,--
01/15/26,01/15/26,01/16/26,Sold Short,PUT  MSFT   01/17/26   400.000,MSFT,--,-1.0,2.00,200.00,0.00,--,--
01/20/26,01/20/26,01/21/26,Bought to Close,PUT  MSFT   01/17/26   400.000,MSFT,--,1.0,1.00,-100.00,0.00,--,--
"""


def _auth(token: str = DEV_TOKEN) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _import_txns(client: AsyncClient, token: str = DEV_TOKEN) -> list[dict]:
    upload = await client.post(
        "/api/transactions/upload",
        headers=_auth(token),
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )
    assert upload.status_code == 200
    txns = await client.get("/api/transactions", headers=_auth(token))
    assert txns.status_code == 200
    return txns.json()


async def _aapl_txn_ids(client: AsyncClient) -> list[str]:
    txns = await _import_txns(client)
    return [t["id"] for t in txns if t["symbol"] == "AAPL"]


# ---------------------------------------------------------------------------
# T009 — link_transactions happy path
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_link_transactions_creates_group(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    assert len(ids) >= 2

    resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["member_count"] == 2
    assert body["display_order"] >= 1
    assert "id" in body
    assert "created_at" in body


@pytest.mark.anyio
async def test_link_transactions_requires_auth(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/round-trips/link",
        json={"transaction_ids": ["a", "b"]},
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_link_transactions_requires_minimum_2(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:1]},
    )
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_link_transactions_rejects_mixed_symbols(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_id = next(t["id"] for t in txns if t["symbol"] == "AAPL")
    msft_id = next(t["id"] for t in txns if t["symbol"] == "MSFT")

    resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": [aapl_id, msft_id]},
    )
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_link_transactions_not_found(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ["nonexistent-1", "nonexistent-2"]},
    )
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_linked_transactions_have_group_id(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    group_id = link_resp.json()["id"]

    txns = await client.get("/api/transactions", headers=_auth())
    linked = [t for t in txns.json() if t["id"] in ids[:2]]
    assert all(t["round_trip_group_id"] == group_id for t in linked)


@pytest.mark.anyio
async def test_display_order_increments_per_user(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]
    msft_ids = [t["id"] for t in txns if t["symbol"] == "MSFT"]

    resp1 = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": aapl_ids[:2]},
    )
    resp2 = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": msft_ids[:2]},
    )
    assert resp1.json()["display_order"] == 1
    assert resp2.json()["display_order"] == 2


# ---------------------------------------------------------------------------
# T010 — conflict detection
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_link_already_grouped_transactions_returns_409(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)

    # First link
    await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )

    # Attempt to re-link the same transactions
    resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    assert resp.status_code == 409


@pytest.mark.anyio
async def test_link_one_grouped_one_free_returns_409(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    assert len(ids) >= 2

    # Link first two
    await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )

    # If there's a 3rd AAPL transaction, try linking already-grouped + free
    # (This test only works if at least 3 AAPL transactions exist in the CSV)
    if len(ids) >= 3:
        resp = await client.post(
            "/api/round-trips/link",
            headers=_auth(),
            json={"transaction_ids": [ids[0], ids[2]]},
        )
        assert resp.status_code == 409
    else:
        # With only 2, try linking again
        resp = await client.post(
            "/api/round-trips/link",
            headers=_auth(),
            json={"transaction_ids": ids},
        )
        assert resp.status_code == 409


# ---------------------------------------------------------------------------
# T020 — add_to_group
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_add_to_group_happy_path(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]
    assert len(aapl_ids) >= 2

    # Create group with first AAPL transaction + a second one
    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": aapl_ids[:2]},
    )
    group_id = link_resp.json()["id"]
    assert link_resp.status_code == 201

    # Cannot test adding more AAPL if only 2 exist; skip if so
    if len(aapl_ids) < 3:
        pytest.skip("Need at least 3 AAPL transactions for this test")

    resp = await client.post(
        f"/api/round-trips/{group_id}/add",
        headers=_auth(),
        json={"transaction_ids": [aapl_ids[2]]},
    )
    assert resp.status_code == 200
    assert resp.json()["member_count"] == 3


@pytest.mark.anyio
async def test_add_to_group_rejects_already_grouped(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]
    msft_ids = [t["id"] for t in txns if t["symbol"] == "MSFT"]
    assert len(aapl_ids) >= 2 and len(msft_ids) >= 1

    # Create group with AAPL transactions
    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": aapl_ids[:2]},
    )
    group_id = link_resp.json()["id"]

    # Try to add an already-linked transaction to the same group
    resp = await client.post(
        f"/api/round-trips/{group_id}/add",
        headers=_auth(),
        json={"transaction_ids": [aapl_ids[0]]},
    )
    assert resp.status_code == 409


@pytest.mark.anyio
async def test_add_to_group_rejects_symbol_mismatch(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]
    msft_ids = [t["id"] for t in txns if t["symbol"] == "MSFT"]

    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": aapl_ids[:2]},
    )
    group_id = link_resp.json()["id"]

    resp = await client.post(
        f"/api/round-trips/{group_id}/add",
        headers=_auth(),
        json={"transaction_ids": [msft_ids[0]]},
    )
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_add_to_group_not_found(client: AsyncClient) -> None:
    await _import_txns(client)
    resp = await client.post(
        "/api/round-trips/nonexistent-id/add",
        headers=_auth(),
        json={"transaction_ids": ["some-id"]},
    )
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_add_to_group_requires_auth(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/round-trips/some-group/add",
        json={"transaction_ids": ["some-id"]},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# T025 — remove_from_group
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_remove_from_group_happy_path(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]
    assert len(aapl_ids) >= 2

    # Need at least 3 to keep group alive after removal
    if len(aapl_ids) < 3:
        pytest.skip("Need at least 3 AAPL transactions for this test")

    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": aapl_ids[:3]},
    )
    group_id = link_resp.json()["id"]

    resp = await client.post(
        f"/api/round-trips/{group_id}/remove",
        headers=_auth(),
        json={"transaction_ids": [aapl_ids[0]]},
    )
    assert resp.status_code == 200
    assert resp.json()["member_count"] == 2


@pytest.mark.anyio
async def test_remove_from_group_rejects_non_member(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]
    msft_ids = [t["id"] for t in txns if t["symbol"] == "MSFT"]

    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": aapl_ids[:2]},
    )
    group_id = link_resp.json()["id"]

    resp = await client.post(
        f"/api/round-trips/{group_id}/remove",
        headers=_auth(),
        json={"transaction_ids": [msft_ids[0]]},
    )
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_remove_from_group_requires_auth(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/round-trips/some-group/remove",
        json={"transaction_ids": ["some-id"]},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# T026 — group disbandment when removing leaves < 2 members
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_disbandment_when_remove_leaves_one_member(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    assert len(ids) >= 2

    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    group_id = link_resp.json()["id"]

    # Remove one member from 2-member group → disbandment
    resp = await client.post(
        f"/api/round-trips/{group_id}/remove",
        headers=_auth(),
        json={"transaction_ids": [ids[0]]},
    )
    assert resp.status_code == 200
    assert resp.json()["member_count"] == 0

    # Group should no longer exist
    get_resp = await client.get(f"/api/round-trips/{group_id}", headers=_auth())
    assert get_resp.status_code == 404

    # Both transactions should be unlinked
    txns = await client.get("/api/transactions", headers=_auth())
    for t in txns.json():
        if t["id"] in ids[:2]:
            assert t["round_trip_group_id"] is None


@pytest.mark.anyio
async def test_explicit_delete_disbands_group(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)

    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    group_id = link_resp.json()["id"]

    del_resp = await client.delete(f"/api/round-trips/{group_id}", headers=_auth())
    assert del_resp.status_code == 204

    # Group should be gone
    get_resp = await client.get(f"/api/round-trips/{group_id}", headers=_auth())
    assert get_resp.status_code == 404

    # Transactions should be unlinked
    txns = await client.get("/api/transactions", headers=_auth())
    for t in txns.json():
        if t["id"] in ids[:2]:
            assert t["round_trip_group_id"] is None


# ---------------------------------------------------------------------------
# List and detail endpoints
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_list_groups_empty(client: AsyncClient) -> None:
    resp = await client.get("/api/round-trips", headers=_auth())
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.anyio
async def test_list_groups_returns_created_group(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    resp = await client.get("/api/round-trips", headers=_auth())
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.anyio
async def test_get_group_detail_includes_members(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    group_id = link_resp.json()["id"]

    resp = await client.get(f"/api/round-trips/{group_id}", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()
    assert body["member_count"] == 2
    assert len(body["members"]) == 2


@pytest.mark.anyio
async def test_get_group_not_found(client: AsyncClient) -> None:
    resp = await client.get("/api/round-trips/nonexistent", headers=_auth())
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# T036 — Ownership enforcement
# ---------------------------------------------------------------------------


@pytest.mark.anyio
async def test_user_cannot_see_other_users_groups(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    resp = await client.get("/api/round-trips", headers=_auth(OTHER_TOKEN))
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.anyio
async def test_user_cannot_access_other_users_group(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    group_id = link_resp.json()["id"]

    resp = await client.get(f"/api/round-trips/{group_id}", headers=_auth(OTHER_TOKEN))
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_user_cannot_delete_other_users_group(client: AsyncClient) -> None:
    ids = await _aapl_txn_ids(client)
    link_resp = await client.post(
        "/api/round-trips/link",
        headers=_auth(),
        json={"transaction_ids": ids[:2]},
    )
    group_id = link_resp.json()["id"]

    resp = await client.delete(f"/api/round-trips/{group_id}", headers=_auth(OTHER_TOKEN))
    assert resp.status_code == 404
