"""Tests for strategy groups — US2 (P2).

Covers:
- GET /api/strategy-groups
- POST /api/strategy-groups
- DELETE /api/strategy-groups/{id}
- PATCH /api/transactions/{id}/strategy-group (assign/unassign)
- Symbol validation
- User scoping
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token

DEV_TOKEN = create_access_token({"sub": "dev_user", "dev": True})
OTHER_TOKEN = create_access_token({"sub": "other_user", "dev": True})

SAMPLE_CSV = """Activity/Trade Date,Transaction Date,Settlement Date,Activity Type,Description,Symbol,Cusip,Quantity #,Price $,Amount $,Commission,Category,Note
02/18/26,02/18/26,02/19/26,Sold Short,PUT  AAPL   02/27/26   180.000,AAPL,--,-1.0,1.50,150.00,0.00,--,--
01/15/26,01/15/26,01/16/26,Sold Short,PUT  MSFT   01/17/26   400.000,MSFT,--,-1.0,2.00,200.00,0.00,--,--
"""


def _auth(token: str = DEV_TOKEN) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _import_txns(client: AsyncClient) -> list[dict]:
    upload = await client.post(
        "/api/transactions/upload",
        headers=_auth(),
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )
    assert upload.status_code == 200
    txns = await client.get("/api/transactions", headers=_auth())
    assert txns.status_code == 200
    return txns.json()


async def _create_group(
    client: AsyncClient, name: str = "AAPL Wheel Q1", symbol: str = "AAPL"
) -> dict:
    resp = await client.post(
        "/api/strategy-groups",
        headers=_auth(),
        json={"name": name, "symbol": symbol},
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.anyio
async def test_list_groups_empty(client: AsyncClient) -> None:
    resp = await client.get("/api/strategy-groups", headers=_auth())
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.anyio
async def test_list_groups_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/strategy-groups")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_create_group(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/strategy-groups",
        headers=_auth(),
        json={"name": "AAPL Wheel Q1 2025", "symbol": "AAPL"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "AAPL Wheel Q1 2025"
    assert body["symbol"] == "AAPL"
    assert "id" in body
    assert "created_at" in body


@pytest.mark.anyio
async def test_create_group_requires_auth(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/strategy-groups",
        json={"name": "AAPL Wheel", "symbol": "AAPL"},
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_create_group_normalizes_symbol_to_uppercase(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/strategy-groups",
        headers=_auth(),
        json={"name": "lowercase test", "symbol": "aapl"},
    )
    assert resp.status_code == 201
    assert resp.json()["symbol"] == "AAPL"


@pytest.mark.anyio
async def test_list_groups_shows_created_group(client: AsyncClient) -> None:
    await _create_group(client)
    resp = await client.get("/api/strategy-groups", headers=_auth())
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["name"] == "AAPL Wheel Q1"


@pytest.mark.anyio
async def test_delete_group(client: AsyncClient) -> None:
    group = await _create_group(client)
    resp = await client.delete(f"/api/strategy-groups/{group['id']}", headers=_auth())
    assert resp.status_code == 204

    list_resp = await client.get("/api/strategy-groups", headers=_auth())
    assert list_resp.json() == []


@pytest.mark.anyio
async def test_delete_group_requires_auth(client: AsyncClient) -> None:
    group = await _create_group(client)
    resp = await client.delete(f"/api/strategy-groups/{group['id']}")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_delete_group_not_found(client: AsyncClient) -> None:
    resp = await client.delete("/api/strategy-groups/nonexistent-id", headers=_auth())
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_delete_group_unassigns_legs(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_txn = next(t for t in txns if t["symbol"] == "AAPL")
    group = await _create_group(client)

    # Assign leg
    assign = await client.patch(
        f"/api/transactions/{aapl_txn['id']}/strategy-group",
        headers=_auth(),
        json={"strategy_group_id": group["id"]},
    )
    assert assign.status_code == 200
    assert assign.json()["strategy_group_id"] == group["id"]

    # Delete group
    await client.delete(f"/api/strategy-groups/{group['id']}", headers=_auth())

    # Leg should be unassigned
    txns_after = await client.get("/api/transactions", headers=_auth())
    aapl_after = next(t for t in txns_after.json() if t["id"] == aapl_txn["id"])
    assert aapl_after["strategy_group_id"] is None


@pytest.mark.anyio
async def test_user_cannot_see_other_users_groups(client: AsyncClient) -> None:
    await _create_group(client)

    resp = await client.get("/api/strategy-groups", headers=_auth(OTHER_TOKEN))
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.anyio
async def test_assign_leg_to_group(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_txn = next(t for t in txns if t["symbol"] == "AAPL")
    group = await _create_group(client, symbol="AAPL")

    resp = await client.patch(
        f"/api/transactions/{aapl_txn['id']}/strategy-group",
        headers=_auth(),
        json={"strategy_group_id": group["id"]},
    )
    assert resp.status_code == 200
    assert resp.json()["strategy_group_id"] == group["id"]


@pytest.mark.anyio
async def test_assign_leg_requires_auth(client: AsyncClient) -> None:
    resp = await client.patch(
        "/api/transactions/some-id/strategy-group",
        json={"strategy_group_id": "some-group"},
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_assign_leg_symbol_mismatch_rejected(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_txn = next(t for t in txns if t["symbol"] == "AAPL")
    msft_group = await _create_group(client, name="MSFT group", symbol="MSFT")

    resp = await client.patch(
        f"/api/transactions/{aapl_txn['id']}/strategy-group",
        headers=_auth(),
        json={"strategy_group_id": msft_group["id"]},
    )
    assert resp.status_code == 400


@pytest.mark.anyio
async def test_unassign_leg_from_group(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_txn = next(t for t in txns if t["symbol"] == "AAPL")
    group = await _create_group(client, symbol="AAPL")

    await client.patch(
        f"/api/transactions/{aapl_txn['id']}/strategy-group",
        headers=_auth(),
        json={"strategy_group_id": group["id"]},
    )

    resp = await client.patch(
        f"/api/transactions/{aapl_txn['id']}/strategy-group",
        headers=_auth(),
        json={"strategy_group_id": None},
    )
    assert resp.status_code == 200
    assert resp.json()["strategy_group_id"] is None


@pytest.mark.anyio
async def test_assign_leg_to_other_users_group_rejected(client: AsyncClient) -> None:
    txns = await _import_txns(client)
    aapl_txn = next(t for t in txns if t["symbol"] == "AAPL")
    # Create a group as other_user
    other_group = await client.post(
        "/api/strategy-groups",
        headers=_auth(OTHER_TOKEN),
        json={"name": "other group", "symbol": "AAPL"},
    )
    assert other_group.status_code == 201

    resp = await client.patch(
        f"/api/transactions/{aapl_txn['id']}/strategy-group",
        headers=_auth(),
        json={"strategy_group_id": other_group.json()["id"]},
    )
    assert resp.status_code == 404
