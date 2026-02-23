# Quickstart: E*TRADE CSV Transaction Import

This quickstart describes the end-to-end flow for importing an E*TRADE “Account Activity” CSV and then tagging transactions later.

## Prerequisites

- Backend dependencies installed: `cd api && uv sync --dev`
- Start the API (dev): `cd api && uv run fastapi dev app/main.py`
- A valid JWT token (dev token works): `GET /api/auth/dev-token`

## Import Transactions (Upload CSV)

1. Call `POST /api/transactions/upload` with multipart form-data:
   - field name: `file`
   - file: your E*TRADE CSV export
2. The API returns an import summary:
   - `imported`, `skipped`, `failed`, `duplicates`, `unassigned`
3. Fetch imported transactions via `GET /api/transactions`.

Example (curl):

```bash
TOKEN=$(curl -s http://localhost:8000/api/auth/dev-token | python -c 'import sys, json; print(json.load(sys.stdin)["access_token"])')

curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@samples/DownloadTxnHistory-2.csv" \
  http://localhost:8000/api/transactions/upload
```

## Unassigned Workflow

- All imported transactions are **unassigned** by default.
- Use `GET /api/transactions?assigned=false` to view unassigned transactions.

## Tagging Later (v1)

1. Create a strategy portfolio: `POST /api/portfolios`
2. Assign a transaction to a portfolio:
   - `POST /api/transactions/{transaction_id}/tag` with JSON `{ "portfolio_id": "..." }`

## Sample File

- The sample used during development is located at `samples/DownloadTxnHistory-2.csv`.
