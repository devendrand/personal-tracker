from __future__ import annotations

from app.core.security import create_access_token

DEV_TOKEN = create_access_token({"sub": "dev_user", "dev": True})


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


SAMPLE_CSV = """Activity/Trade Date,Transaction Date,Settlement Date,Activity Type,Description,Symbol,Cusip,Quantity #,Price $,Amount $,Commission,Category,Note
02/18/26,02/18/26,02/19/26,Sold Short,PUT  IWM    02/27/26   260.000,IWM,--,-1.0,2.13,212.49,0.51,--,--
"""


async def test_post_portfolios_returns_405(client):
    post = await client.post(
        "/api/portfolios",
        headers=_auth_headers(DEV_TOKEN),
        json={"name": "Strategy A"},
    )
    assert post.status_code == 405


async def test_list_portfolios_scoped_to_user(client, create_portfolio):
    mine_portfolio = await create_portfolio("dev_user", name="Strategy A")
    await create_portfolio("other_user", name="Other Strategy")

    mine = await client.get("/api/portfolios", headers=_auth_headers(DEV_TOKEN))
    assert mine.status_code == 200
    mine_ids = {p["id"] for p in mine.json()}
    assert mine_portfolio.id in mine_ids

    other_token = create_access_token({"sub": "other_user"})
    other = await client.get("/api/portfolios", headers=_auth_headers(other_token))
    assert other.status_code == 200
    assert all(p["id"] != mine_portfolio.id for p in other.json())
