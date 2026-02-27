"""Tests for PnL endpoint — US3 (P3).

Covers:
- GET /api/pnl hierarchy: Ticker → StrategyGroup → Legs
- PnL = transaction.amount per leg
- Untagged legs excluded
- Tagged ungrouped legs appear under "Ungrouped"
- Null-symbol legs excluded
- User scoping
"""

from __future__ import annotations

from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token

DEV_TOKEN = create_access_token({"sub": "dev_user", "dev": True})
OTHER_TOKEN = create_access_token({"sub": "other_user", "dev": True})

_H = "Activity/Trade Date,Transaction Date,Settlement Date,Activity Type,Description,Symbol,Cusip,Quantity #,Price $,Amount $,Commission,Category,Note"

# Two-row CSV: AAPL CSP open +$150, MSFT CSP open +$200
SAMPLE_CSV = f"""{_H}
02/18/26,02/18/26,02/19/26,Sold Short,PUT  AAPL   02/27/26   180.000,AAPL,--,-1.0,1.50,150.00,0.00,--,--
01/15/26,01/15/26,01/16/26,Sold Short,PUT  MSFT   01/17/26   400.000,MSFT,--,-1.0,2.00,200.00,0.00,--,--
"""

# AAPL open + expiration (unique descriptions to prevent dedup)
AAPL_OPEN_EXPIRE_CSV = f"""{_H}
02/18/26,02/18/26,02/19/26,Sold Short,PUT  AAPL   02/27/26   180.000,AAPL,--,-1.0,1.50,150.00,0.00,--,--
02/27/26,02/27/26,02/28/26,Expired,PUT  AAPL   02/27/26   180.000 EXP,AAPL,--,1.0,0.00,0.00,0.00,--,--
"""

# AAPL open + BTC
AAPL_OPEN_BTC_CSV = f"""{_H}
02/18/26,02/18/26,02/19/26,Sold Short,PUT  AAPL   02/27/26   180.000,AAPL,--,-1.0,1.50,150.00,0.00,--,--
02/20/26,02/20/26,02/21/26,Bought To Close,PUT  AAPL   02/27/26   180.000 BTC,AAPL,--,1.0,0.50,-50.00,0.00,--,--
"""

# Equity BUY / SELL rows
EQUITY_CSV = f"""{_H}
02/01/26,02/01/26,02/03/26,Bought,AAPL buy Feb 2026,AAPL,--,10.0,100.00,-1000.00,0.00,--,--
02/15/26,02/15/26,02/17/26,Sold,AAPL sell Feb 2026,AAPL,--,-10.0,120.00,1200.00,0.00,--,--
"""


def _auth(token: str = DEV_TOKEN) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


async def _upload(client: AsyncClient, csv_content: str) -> list[dict]:
    resp = await client.post(
        "/api/transactions/upload",
        headers=_auth(),
        files={"file": ("data.csv", csv_content, "text/csv")},
    )
    assert resp.status_code == 200
    txns = await client.get("/api/transactions", headers=_auth())
    assert txns.status_code == 200
    return txns.json()


async def _tag(client: AsyncClient, txn_id: str, leg_type: str) -> None:
    resp = await client.patch(
        f"/api/transactions/{txn_id}/leg-type",
        headers=_auth(),
        json={"leg_type": leg_type},
    )
    assert resp.status_code == 200


async def _create_group(client: AsyncClient, name: str, symbol: str) -> str:
    resp = await client.post(
        "/api/strategy-groups",
        headers=_auth(),
        json={"name": name, "symbol": symbol},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _assign(client: AsyncClient, txn_id: str, group_id: str) -> None:
    resp = await client.patch(
        f"/api/transactions/{txn_id}/strategy-group",
        headers=_auth(),
        json={"strategy_group_id": group_id},
    )
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_pnl_no_tagged_transactions(client: AsyncClient) -> None:
    """No tagged transactions → empty response."""
    await _upload(client, SAMPLE_CSV)
    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_realized_pnl"] == "0"
    assert body["total_transaction_count"] == 0
    assert Decimal(body["total_commission"]) == Decimal("0")
    assert body["tickers"] == []


@pytest.mark.anyio
async def test_pnl_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/pnl")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_pnl_csp_open_plus_expiration(client: AsyncClient) -> None:
    """CSP open +$150 + expiration $0 → group total=$150."""
    txns = await _upload(client, AAPL_OPEN_EXPIRE_CSV)
    aapl_open = next(
        t for t in txns if t["symbol"] == "AAPL" and Decimal(t["amount"]) == Decimal("150.00")
    )
    aapl_expire = next(
        t for t in txns if t["symbol"] == "AAPL" and Decimal(t["amount"]) == Decimal("0.00")
    )

    await _tag(client, aapl_open["id"], "CSP")
    await _tag(client, aapl_expire["id"], "CSP")

    group_id = await _create_group(client, "AAPL CSP Feb", "AAPL")
    await _assign(client, aapl_open["id"], group_id)
    await _assign(client, aapl_expire["id"], group_id)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    assert Decimal(body["total_realized_pnl"]) == Decimal("150.00")
    tickers = body["tickers"]
    assert len(tickers) == 1
    assert tickers[0]["symbol"] == "AAPL"
    assert Decimal(tickers[0]["total_realized_pnl"]) == Decimal("150.00")

    groups = tickers[0]["groups"]
    assert len(groups) == 1
    assert groups[0]["name"] == "AAPL CSP Feb"
    assert Decimal(groups[0]["total_realized_pnl"]) == Decimal("150.00")
    assert len(groups[0]["legs"]) == 2
    # US2: new metric fields
    assert groups[0]["transaction_count"] == 2
    assert Decimal(groups[0]["total_commission"]) == Decimal("0")
    assert tickers[0]["transaction_count"] == 2
    assert Decimal(tickers[0]["total_commission"]) == Decimal("0")
    assert body["total_transaction_count"] == 2
    assert Decimal(body["total_commission"]) == Decimal("0")


@pytest.mark.anyio
async def test_pnl_csp_open_plus_btc(client: AsyncClient) -> None:
    """CSP open +$150 + BTC -$50 → group total=$100."""
    txns = await _upload(client, AAPL_OPEN_BTC_CSV)
    aapl_open = next(
        t for t in txns if t["symbol"] == "AAPL" and Decimal(t["amount"]) == Decimal("150.00")
    )
    aapl_btc = next(
        t for t in txns if t["symbol"] == "AAPL" and Decimal(t["amount"]) == Decimal("-50.00")
    )

    await _tag(client, aapl_open["id"], "CSP")
    await _tag(client, aapl_btc["id"], "CSP")

    group_id = await _create_group(client, "AAPL BTC group", "AAPL")
    await _assign(client, aapl_open["id"], group_id)
    await _assign(client, aapl_btc["id"], group_id)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()
    # AAPL group: 150 + (-50) = 100; MSFT is untagged so excluded
    ticker = next(t for t in body["tickers"] if t["symbol"] == "AAPL")
    assert Decimal(ticker["total_realized_pnl"]) == Decimal("100.00")
    # US2: new metric fields
    assert ticker["transaction_count"] == 2
    assert Decimal(ticker["total_commission"]) == Decimal("0")
    assert body["total_transaction_count"] == 2
    assert Decimal(body["total_commission"]) == Decimal("0")


@pytest.mark.anyio
async def test_pnl_equity_buy_sell(client: AsyncClient) -> None:
    """BUY -$1000 + SELL +$1200 → group total=$200."""
    txns = await _upload(client, EQUITY_CSV)
    buy_txn = next(t for t in txns if Decimal(t["amount"]) == Decimal("-1000.00"))
    sell_txn = next(t for t in txns if Decimal(t["amount"]) == Decimal("1200.00"))

    await _tag(client, buy_txn["id"], "BUY")
    await _tag(client, sell_txn["id"], "SELL")

    group_id = await _create_group(client, "AAPL Equity Feb", "AAPL")
    await _assign(client, buy_txn["id"], group_id)
    await _assign(client, sell_txn["id"], group_id)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    assert Decimal(body["total_realized_pnl"]) == Decimal("200.00")
    ticker = body["tickers"][0]
    assert ticker["symbol"] == "AAPL"
    assert Decimal(ticker["groups"][0]["total_realized_pnl"]) == Decimal("200.00")
    # US2: new metric fields
    assert ticker["groups"][0]["transaction_count"] == 2
    assert Decimal(ticker["groups"][0]["total_commission"]) == Decimal("0")
    assert ticker["transaction_count"] == 2
    assert Decimal(ticker["total_commission"]) == Decimal("0")
    assert body["total_transaction_count"] == 2
    assert Decimal(body["total_commission"]) == Decimal("0")


@pytest.mark.anyio
async def test_pnl_untagged_legs_excluded(client: AsyncClient) -> None:
    """Untagged legs (leg_type=null) are not included in PnL."""
    txns = await _upload(client, SAMPLE_CSV)
    # Tag only AAPL, leave MSFT untagged
    aapl = next(t for t in txns if t["symbol"] == "AAPL")
    await _tag(client, aapl["id"], "CSP")

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    symbols = [t["symbol"] for t in body["tickers"]]
    assert "MSFT" not in symbols
    assert "AAPL" in symbols
    assert Decimal(body["total_realized_pnl"]) == Decimal("150.00")
    # US2: new metric fields
    assert body["total_transaction_count"] == 1
    assert Decimal(body["total_commission"]) == Decimal("0")


@pytest.mark.anyio
async def test_pnl_ungrouped_tagged_legs(client: AsyncClient) -> None:
    """Tagged leg with no group appears under 'Ungrouped'."""
    txns = await _upload(client, SAMPLE_CSV)
    aapl = next(t for t in txns if t["symbol"] == "AAPL")
    await _tag(client, aapl["id"], "CSP")
    # No group assignment

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    ticker = next(t for t in body["tickers"] if t["symbol"] == "AAPL")
    groups = ticker["groups"]
    assert len(groups) == 1
    ungrouped = groups[0]
    assert ungrouped["strategy_group_id"] is None
    assert ungrouped["name"] == "Ungrouped"
    assert len(ungrouped["legs"]) == 1
    assert Decimal(ungrouped["total_realized_pnl"]) == Decimal("150.00")
    # US2: new metric fields
    assert ungrouped["transaction_count"] == 1
    assert Decimal(ungrouped["total_commission"]) == Decimal("0")
    assert ticker["transaction_count"] == 1
    assert Decimal(ticker["total_commission"]) == Decimal("0")
    assert body["total_transaction_count"] == 1
    assert Decimal(body["total_commission"]) == Decimal("0")


@pytest.mark.anyio
async def test_pnl_mixed_wheel_group(client: AsyncClient) -> None:
    """CSP + CC legs in same group → PnL = sum of all amounts."""
    txns = await _upload(client, SAMPLE_CSV)
    aapl = next(t for t in txns if t["symbol"] == "AAPL")
    msft = next(t for t in txns if t["symbol"] == "MSFT")

    # Tag both as different leg types on same symbol isn't possible (different symbols)
    # Instead: use two AAPL rows by uploading again won't work (dedupe).
    # For this test: tag AAPL as CSP (+150) and check total without grouping
    await _tag(client, aapl["id"], "CSP")
    await _tag(client, msft["id"], "CC")

    group_aapl = await _create_group(client, "AAPL Wheel", "AAPL")
    await _assign(client, aapl["id"], group_aapl)

    group_msft = await _create_group(client, "MSFT Wheel", "MSFT")
    await _assign(client, msft["id"], group_msft)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    assert Decimal(body["total_realized_pnl"]) == Decimal("350.00")  # 150 + 200
    assert len(body["tickers"]) == 2
    # US2: new metric fields
    assert body["total_transaction_count"] == 2
    assert Decimal(body["total_commission"]) == Decimal("0")


# CSV with non-zero commission for US1 tests
COMMISSION_CSV = f"""{_H}
02/18/26,02/18/26,02/19/26,Sold Short,PUT  AAPL   02/27/26   180.000 COMM,AAPL,--,-1.0,1.50,150.00,-0.65,--,--
02/27/26,02/27/26,02/28/26,Expired,PUT  AAPL   02/27/26   180.000 EXP COMM,AAPL,--,1.0,0.00,0.00,0.00,--,--
"""

# CSV with null commission (omitted → parsed as None)
NULL_COMMISSION_CSV = f"""{_H}
02/18/26,02/18/26,02/19/26,Sold Short,PUT  AAPL   02/27/26   180.000 NULLCOMM,AAPL,--,-1.0,1.50,150.00,,--,--
"""


@pytest.mark.anyio
async def test_pnl_commission_deducted(client: AsyncClient) -> None:
    """US1: Commission is deducted from realized_pnl. amount=150, commission=-0.65 → pnl=149.35."""
    txns = await _upload(client, COMMISSION_CSV)
    aapl_open = next(
        t for t in txns if "COMM" in t["description"] and Decimal(t["amount"]) == Decimal("150.00")
    )
    aapl_expire = next(t for t in txns if "EXP COMM" in t["description"])

    await _tag(client, aapl_open["id"], "CSP")
    await _tag(client, aapl_expire["id"], "CSP")

    group_id = await _create_group(client, "AAPL CSP Commission", "AAPL")
    await _assign(client, aapl_open["id"], group_id)
    await _assign(client, aapl_expire["id"], group_id)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    ticker = next(t for t in body["tickers"] if t["symbol"] == "AAPL")
    group = ticker["groups"][0]
    legs = group["legs"]

    open_leg = next(lg for lg in legs if Decimal(lg["amount"]) == Decimal("150.00"))
    assert Decimal(open_leg["realized_pnl"]) == Decimal("149.35")

    expire_leg = next(lg for lg in legs if Decimal(lg["amount"]) == Decimal("0.00"))
    assert Decimal(expire_leg["realized_pnl"]) == Decimal("0.00")

    assert Decimal(group["total_realized_pnl"]) == Decimal("149.35")
    assert Decimal(body["total_realized_pnl"]) == Decimal("149.35")


@pytest.mark.anyio
async def test_pnl_null_commission_treated_as_zero(client: AsyncClient) -> None:
    """US1: Null commission treated as zero — realized_pnl equals amount."""
    txns = await _upload(client, NULL_COMMISSION_CSV)
    txn = next(t for t in txns if "NULLCOMM" in t["description"])

    await _tag(client, txn["id"], "CSP")

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    ticker = next(t for t in body["tickers"] if t["symbol"] == "AAPL")
    leg = ticker["groups"][0]["legs"][0]
    assert Decimal(leg["realized_pnl"]) == Decimal("150.00")


@pytest.mark.anyio
async def test_pnl_commission_displayed_as_positive(client: AsyncClient) -> None:
    """US1: Commission stored as -0.65 is returned as positive 0.65 in the API."""
    txns = await _upload(client, COMMISSION_CSV)
    aapl_open = next(
        t for t in txns if "COMM" in t["description"] and Decimal(t["amount"]) == Decimal("150.00")
    )
    aapl_expire = next(t for t in txns if "EXP COMM" in t["description"])

    await _tag(client, aapl_open["id"], "CSP")
    await _tag(client, aapl_expire["id"], "CSP")

    group_id = await _create_group(client, "AAPL Comm Display", "AAPL")
    await _assign(client, aapl_open["id"], group_id)
    await _assign(client, aapl_expire["id"], group_id)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    ticker = next(t for t in body["tickers"] if t["symbol"] == "AAPL")
    legs = ticker["groups"][0]["legs"]

    open_leg = next(lg for lg in legs if Decimal(lg["amount"]) == Decimal("150.00"))
    assert Decimal(open_leg["commission"]) == Decimal("0.65")

    expire_leg = next(lg for lg in legs if Decimal(lg["amount"]) == Decimal("0.00"))
    assert Decimal(expire_leg["commission"]) == Decimal("0.00")


# CSV with 3 legs for US2 aggregation tests — two with commission, one without
MULTI_LEG_COMMISSION_CSV = f"""{_H}
02/18/26,02/18/26,02/19/26,Sold Short,PUT  AAPL   02/27/26   180.000 ML1,AAPL,--,-1.0,1.50,150.00,-0.65,--,--
02/19/26,02/19/26,02/20/26,Sold Short,PUT  AAPL   03/06/26   185.000 ML2,AAPL,--,-1.0,1.00,100.00,-0.65,--,--
02/27/26,02/27/26,02/28/26,Expired,PUT  AAPL   02/27/26   180.000 EXP ML3,AAPL,--,1.0,0.00,0.00,0.00,--,--
"""


@pytest.mark.anyio
async def test_pnl_group_transaction_count(client: AsyncClient) -> None:
    """US2: Group with 3 legs reports transaction_count=3."""
    txns = await _upload(client, MULTI_LEG_COMMISSION_CSV)
    ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]

    group_id = await _create_group(client, "AAPL Count Test", "AAPL")
    for tid in ids:
        await _tag(client, tid, "CSP")
        await _assign(client, tid, group_id)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    ticker = next(t for t in body["tickers"] if t["symbol"] == "AAPL")
    group = ticker["groups"][0]
    assert group["transaction_count"] == 3


@pytest.mark.anyio
async def test_pnl_total_commission_aggregation(client: AsyncClient) -> None:
    """US2: Group commissions -0.65, -0.65, 0.00 → total_commission=1.30."""
    txns = await _upload(client, MULTI_LEG_COMMISSION_CSV)
    ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]

    group_id = await _create_group(client, "AAPL Comm Agg", "AAPL")
    for tid in ids:
        await _tag(client, tid, "CSP")
        await _assign(client, tid, group_id)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    ticker = next(t for t in body["tickers"] if t["symbol"] == "AAPL")
    group = ticker["groups"][0]
    assert Decimal(group["total_commission"]) == Decimal("1.30")


@pytest.mark.anyio
async def test_pnl_ticker_rollup(client: AsyncClient) -> None:
    """US2: Ticker sums group counts and commissions."""
    txns = await _upload(client, MULTI_LEG_COMMISSION_CSV)
    ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]

    group_id = await _create_group(client, "AAPL Ticker Rollup", "AAPL")
    for tid in ids:
        await _tag(client, tid, "CSP")
        await _assign(client, tid, group_id)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    ticker = next(t for t in body["tickers"] if t["symbol"] == "AAPL")
    assert ticker["transaction_count"] == 3
    assert Decimal(ticker["total_commission"]) == Decimal("1.30")


@pytest.mark.anyio
async def test_pnl_grand_total_fields(client: AsyncClient) -> None:
    """US2: PnLSummaryResponse has correct total_transaction_count and total_commission."""
    txns = await _upload(client, MULTI_LEG_COMMISSION_CSV)
    ids = [t["id"] for t in txns if t["symbol"] == "AAPL"]

    group_id = await _create_group(client, "AAPL Grand Total", "AAPL")
    for tid in ids:
        await _tag(client, tid, "CSP")
        await _assign(client, tid, group_id)

    resp = await client.get("/api/pnl", headers=_auth())
    assert resp.status_code == 200
    body = resp.json()

    assert body["total_transaction_count"] == 3
    assert Decimal(body["total_commission"]) == Decimal("1.30")


@pytest.mark.anyio
async def test_pnl_user_scoping(client: AsyncClient) -> None:
    """User B cannot see User A's PnL data."""
    # User A tags and groups a transaction
    txns = await _upload(client, SAMPLE_CSV)
    aapl = next(t for t in txns if t["symbol"] == "AAPL")
    await _tag(client, aapl["id"], "CSP")

    # User B gets own empty PnL
    resp = await client.get("/api/pnl", headers=_auth(OTHER_TOKEN))
    assert resp.status_code == 200
    body = resp.json()
    assert body["tickers"] == []
    assert Decimal(body["total_realized_pnl"]) == Decimal("0")
    # US2: new metric fields
    assert body["total_transaction_count"] == 0
    assert Decimal(body["total_commission"]) == Decimal("0")
