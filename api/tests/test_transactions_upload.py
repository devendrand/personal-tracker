from __future__ import annotations

from app.core.security import create_access_token

DEV_TOKEN = create_access_token({"sub": "dev_user", "dev": True})


def _auth_headers(subject: str = "dev_user") -> dict[str, str]:
    token = DEV_TOKEN if subject == "dev_user" else create_access_token({"sub": subject})
    return {"Authorization": f"Bearer {token}"}


SAMPLE_CSV = """All Transactions Activity Types

Account Activity for Stocks -0067 from LAST 7 Days

Total:,727.17

Activity/Trade Date,Transaction Date,Settlement Date,Activity Type,Description,Symbol,Cusip,Quantity #,Price $,Amount $,Commission,Category,Note
02/19/26,02/19/26,02/19/26,Transfer,TRNSFR MARGIN TO CASH,--,--,,,-212.49,0.0,--,--
02/18/26,02/18/26,02/19/26,Sold Short,PUT  IWM    02/27/26   260.000,IWM,--,-1.0,2.13,212.49,0.51,--,--

\"Footer disclaimer text\"
"""


async def test_upload_requires_auth(client):
    resp = await client.post(
        "/api/transactions/upload",
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )
    assert resp.status_code == 401


async def test_upload_rejects_missing_required_columns(client):
    bad_csv = "Activity/Trade Date,Description\n02/19/26,Missing cols\n"

    resp = await client.post(
        "/api/transactions/upload",
        headers=_auth_headers(),
        files={"file": ("bad.csv", bad_csv, "text/csv")},
    )

    assert resp.status_code == 400
    body = resp.json()
    assert "detail" in body


async def test_upload_imports_rows_and_marks_unassigned(client):
    resp = await client.post(
        "/api/transactions/upload",
        headers=_auth_headers(),
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )

    assert resp.status_code == 200
    body = resp.json()

    # Import summary is expected to be stable and explicit.
    assert body["imported"] == 2
    assert body["skipped"] == 0
    assert body["failed"] == 0
    assert body["duplicates"] == 0

    # Verify listing returns imported rows and each is unassigned.
    list_resp = await client.get("/api/transactions", headers=_auth_headers())
    assert list_resp.status_code == 200
    rows = list_resp.json()
    assert len(rows) == 2
    assert all("portfolio_id" not in row for row in rows)
    assert all(row.get("strategy_type") is None for row in rows)


async def test_reupload_counts_duplicates(client):
    first = await client.post(
        "/api/transactions/upload",
        headers=_auth_headers(),
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )
    assert first.status_code == 200
    assert first.json()["imported"] == 2

    second = await client.post(
        "/api/transactions/upload",
        headers=_auth_headers(),
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )
    assert second.status_code == 200
    summary = second.json()
    assert summary["imported"] == 0
    assert summary["duplicates"] == 2


async def test_list_is_scoped_to_current_user(client):
    # Import as dev_user
    resp = await client.post(
        "/api/transactions/upload",
        headers=_auth_headers(),
        files={"file": ("sample.csv", SAMPLE_CSV, "text/csv")},
    )
    assert resp.status_code == 200

    # List as a different user should not return dev_user's transactions
    other_token = create_access_token({"sub": "other_user"})
    other_headers = {"Authorization": f"Bearer {other_token}"}
    other_list = await client.get("/api/transactions", headers=other_headers)
    assert other_list.status_code == 200
    assert other_list.json() == []
