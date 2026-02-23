from __future__ import annotations

from app.core.security import DEV_TOKEN, create_access_token


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


SAMPLE_CSV = """Activity/Trade Date,Transaction Date,Settlement Date,Activity Type,Description,Symbol,Cusip,Quantity #,Price $,Amount $,Commission,Category,Note
02/18/26,02/18/26,02/19/26,Sold Short,PUT  IWM    02/27/26   260.000,IWM,--,-1.0,2.13,212.49,0.51,--,--
"""


async def test_create_and_list_portfolios_scoped_to_user(client):
    create = await client.post(
        "/api/portfolios",
        headers=_auth_headers(DEV_TOKEN),
        json={"name": "Strategy A"},
    )
    assert create.status_code == 201
    created = create.json()
    assert created["name"] == "Strategy A"

    # Same user sees it
    mine = await client.get("/api/portfolios", headers=_auth_headers(DEV_TOKEN))
    assert mine.status_code == 200
    assert any(p["id"] == created["id"] for p in mine.json())

    # Other user does not
    other_token = create_access_token({"sub": "other_user"})
    other = await client.get("/api/portfolios", headers=_auth_headers(other_token))
    assert other.status_code == 200
    assert other.json() == []


async def test_tag_transaction_to_portfolio(client):
    # Create a portfolio
    create_portfolio = await client.post(
        "/api/portfolios",
        headers=_auth_headers(DEV_TOKEN),
        json={"name": "Strategy A"},
    )
    assert create_portfolio.status_code == 201
    portfolio_id = create_portfolio.json()["id"]

    # Import one transaction
    upload = await client.post(
        "/api/transactions/upload",
        headers=_auth_headers(DEV_TOKEN),
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )
    assert upload.status_code == 200

    txns = await client.get("/api/transactions", headers=_auth_headers(DEV_TOKEN))
    assert txns.status_code == 200
    txn_id = txns.json()[0]["id"]

    # Tag it
    tag = await client.post(
        f"/api/transactions/{txn_id}/tag",
        headers=_auth_headers(DEV_TOKEN),
        json={"portfolio_id": portfolio_id},
    )
    assert tag.status_code == 200

    # It should no longer be unassigned
    unassigned = await client.get(
        "/api/transactions?assigned=false",
        headers=_auth_headers(DEV_TOKEN),
    )
    assert unassigned.status_code == 200
    assert unassigned.json() == []

    assigned = await client.get(
        "/api/transactions?assigned=true",
        headers=_auth_headers(DEV_TOKEN),
    )
    assert assigned.status_code == 200
    assert assigned.json()[0]["portfolio_id"] == portfolio_id
