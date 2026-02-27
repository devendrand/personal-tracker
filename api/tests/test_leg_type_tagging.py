"""Tests for leg-type tagging — US1 (P1).

Covers:
- GET /api/transactions/leg-types → 4 options
- PATCH /api/transactions/{id}/leg-type → set, change, clear
- GET /api/transactions filters: tagged, leg_type
- Auth enforcement
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token

DEV_TOKEN = create_access_token({"sub": "dev_user", "dev": True})
OTHER_TOKEN = create_access_token({"sub": "other_user", "dev": True})

SAMPLE_CSV = """Activity/Trade Date,Transaction Date,Settlement Date,Activity Type,Description,Symbol,Cusip,Quantity #,Price $,Amount $,Commission,Category,Note
02/18/26,02/18/26,02/19/26,Sold Short,PUT  IWM    02/27/26   260.000,IWM,--,-1.0,2.13,212.49,0.51,--,--
01/15/26,01/15/26,01/16/26,Buy,AAPL COMMON STOCK,AAPL,--,10.0,150.00,-1500.00,0.00,--,--
"""


def _auth(token: str = DEV_TOKEN) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _import_txns(client: AsyncClient) -> list[str]:
    upload = await client.post(
        "/api/transactions/upload",
        headers=_auth(),
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )
    assert upload.status_code == 200
    txns = await client.get("/api/transactions", headers=_auth())
    assert txns.status_code == 200
    return [t["id"] for t in txns.json()]


@pytest.mark.anyio
async def test_list_leg_types_returns_four_options(client: AsyncClient) -> None:
    resp = await client.get("/api/transactions/leg-types", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    values = {opt["value"] for opt in body}
    assert values == {"CSP", "CC", "BUY", "SELL"}
    # Each option has value, label, description
    for opt in body:
        assert "value" in opt
        assert "label" in opt
        assert "description" in opt


@pytest.mark.anyio
async def test_list_leg_types_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/transactions/leg-types")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_patch_leg_type_set(client: AsyncClient) -> None:
    txn_ids = await _import_txns(client)
    txn_id = txn_ids[0]

    resp = await client.patch(
        f"/api/transactions/{txn_id}/leg-type",
        headers=_auth(),
        json={"leg_type": "CSP"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["leg_type"] == "CSP"
    assert body["id"] == txn_id


@pytest.mark.anyio
async def test_patch_leg_type_change(client: AsyncClient) -> None:
    txn_ids = await _import_txns(client)
    txn_id = txn_ids[0]

    await client.patch(
        f"/api/transactions/{txn_id}/leg-type",
        headers=_auth(),
        json={"leg_type": "CSP"},
    )
    resp = await client.patch(
        f"/api/transactions/{txn_id}/leg-type",
        headers=_auth(),
        json={"leg_type": "CC"},
    )
    assert resp.status_code == 200
    assert resp.json()["leg_type"] == "CC"


@pytest.mark.anyio
async def test_patch_leg_type_clear(client: AsyncClient) -> None:
    txn_ids = await _import_txns(client)
    txn_id = txn_ids[0]

    await client.patch(
        f"/api/transactions/{txn_id}/leg-type",
        headers=_auth(),
        json={"leg_type": "BUY"},
    )
    resp = await client.patch(
        f"/api/transactions/{txn_id}/leg-type",
        headers=_auth(),
        json={"leg_type": None},
    )
    assert resp.status_code == 200
    assert resp.json()["leg_type"] is None


@pytest.mark.anyio
async def test_patch_leg_type_not_found(client: AsyncClient) -> None:
    resp = await client.patch(
        "/api/transactions/nonexistent-id/leg-type",
        headers=_auth(),
        json={"leg_type": "BUY"},
    )
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_patch_leg_type_requires_auth(client: AsyncClient) -> None:
    resp = await client.patch(
        "/api/transactions/some-id/leg-type",
        json={"leg_type": "BUY"},
    )
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_filter_tagged_true(client: AsyncClient) -> None:
    txn_ids = await _import_txns(client)
    await client.patch(
        f"/api/transactions/{txn_ids[0]}/leg-type",
        headers=_auth(),
        json={"leg_type": "CSP"},
    )

    resp = await client.get("/api/transactions?tagged=true", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["leg_type"] == "CSP"


@pytest.mark.anyio
async def test_filter_tagged_false(client: AsyncClient) -> None:
    txn_ids = await _import_txns(client)
    await client.patch(
        f"/api/transactions/{txn_ids[0]}/leg-type",
        headers=_auth(),
        json={"leg_type": "CSP"},
    )

    resp = await client.get("/api/transactions?tagged=false", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()
    # One tagged (CSP) and one untagged → tagged=false returns 1
    assert all(t["leg_type"] is None for t in body)


@pytest.mark.anyio
async def test_filter_by_leg_type(client: AsyncClient) -> None:
    txn_ids = await _import_txns(client)
    await client.patch(
        f"/api/transactions/{txn_ids[0]}/leg-type",
        headers=_auth(),
        json={"leg_type": "CSP"},
    )
    await client.patch(
        f"/api/transactions/{txn_ids[1]}/leg-type",
        headers=_auth(),
        json={"leg_type": "BUY"},
    )

    resp = await client.get("/api/transactions?leg_type=CSP", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["leg_type"] == "CSP"


@pytest.mark.anyio
async def test_filter_leg_type_with_tagged_false_is_invalid(client: AsyncClient) -> None:
    resp = await client.get(
        "/api/transactions?tagged=false&leg_type=CSP",
        headers=_auth(),
    )
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_transaction_response_has_leg_type_and_strategy_group_id(
    client: AsyncClient,
) -> None:
    await _import_txns(client)
    resp = await client.get("/api/transactions", headers=_auth())
    assert resp.status_code == 200
    for txn in resp.json():
        assert "leg_type" in txn
        assert "strategy_group_id" in txn
        assert txn["leg_type"] is None
        assert txn["strategy_group_id"] is None
