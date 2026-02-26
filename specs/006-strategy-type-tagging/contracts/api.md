# API Contract: Strategy Type Tagging

Date: 2026-02-26

Base URL prefix: `/api`

## Strategy Types

### List supported strategy types

`GET /transactions/strategy-types`

Response `200`:
```json
[
  {
    "value": "WHEEL",
    "label": "Wheel Strategy",
    "description": "Sell cash-secured put → accept assignment → sell covered call. Tagged across the full chain of related transactions."
  }
]
```

## Transactions

### List transactions

`GET /transactions`

Query params:
- `skip` (int, default 0)
- `limit` (int, default 100)
- `tagged` (bool, optional)
  - `true` => only tagged (`strategy_type` set)
  - `false` => only untagged (`strategy_type` null)
- `strategy_type` (string enum, optional)

Response `200`:
```json
[
  {
    "id": "...",
    "activity_date": "2026-02-18",
    "activity_type": "Sold Short",
    "description": "PUT IWM ...",
    "symbol": "IWM",
    "quantity": -1.0,
    "price": 2.13,
    "amount": 212.49,
    "strategy_type": "WHEEL",
    "created_at": "2026-02-18T00:00:00Z"
  }
]
```

### Upload transactions CSV

`POST /transactions/upload`

Multipart form:
- `file`: CSV file

Response `200`:
```json
{
  "imported": 2,
  "skipped": 0,
  "failed": 0,
  "duplicates": 0,
  "unassigned": 2
}
```

### Set or clear strategy type for a transaction

`PATCH /transactions/{transaction_id}/strategy-type`

Request body:
```json
{ "strategy_type": "COVERED_CALL" }
```

To clear:
```json
{ "strategy_type": null }
```

Response `200`: returns updated `TransactionResponse`.

Errors:
- `401` invalid auth
- `404` transaction not found
- `422` invalid `strategy_type` value
