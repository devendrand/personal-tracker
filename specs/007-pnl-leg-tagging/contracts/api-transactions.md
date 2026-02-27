# API Contract: Transactions (Updated)

**Base path**: `/api/transactions`
**Auth**: Bearer JWT required on all endpoints

---

## Updated Endpoints

### GET /api/transactions

List transactions for the current user.

**Changes from previous**: `strategy_type` query param replaced by `leg_type`.

**Query Parameters**:

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `skip` | int | No | Default 0, min 0 |
| `limit` | int | No | Default 100, min 1, max 500 |
| `tagged` | bool | No | `true` = only tagged (leg_type IS NOT NULL); `false` = only untagged |
| `leg_type` | string | No | Filter by leg type: `CSP`, `CC`, `BUY`, or `SELL`. Requires `tagged` is not `false`. |

**Response** `200 OK`: `list[TransactionResponse]`

```json
[
  {
    "id": "uuid",
    "activity_date": "2025-01-15",
    "activity_type": "Sold Short",
    "description": "AAPL 01/17/2025 180.00 P",
    "symbol": "AAPL",
    "quantity": -1.0,
    "price": 1.50,
    "amount": 150.00,
    "leg_type": "CSP",
    "strategy_group_id": "uuid-or-null",
    "created_at": "2025-01-15T10:00:00"
  }
]
```

**Error**:
- `401` — Missing or invalid JWT
- `422` — `leg_type` filter used with `tagged=false`

---

### GET /api/transactions/leg-types

List available leg type options for dropdowns.

**Response** `200 OK`: `list[LegTypeOption]`

```json
[
  { "value": "CSP", "label": "Cash-Secured Put", "description": "Sell puts backed by cash..." },
  { "value": "CC",  "label": "Covered Call",      "description": "Sell calls against shares..." },
  { "value": "BUY", "label": "Buy",               "description": "Equity purchase." },
  { "value": "SELL","label": "Sell",               "description": "Equity sale." }
]
```

---

### PATCH /api/transactions/{transaction_id}/leg-type

Set or clear the leg type on a transaction.

**Path Param**: `transaction_id` — UUID

**Request Body**:
```json
{ "leg_type": "CSP" }     // set
{ "leg_type": null }       // clear (untagged)
```

**Response** `200 OK`: `TransactionResponse` (updated)

**Errors**:
- `401` — Missing/invalid JWT
- `404` — Transaction not found or not owned by current user
- `422` — Invalid leg_type value

---

### PATCH /api/transactions/{transaction_id}/strategy-group

Assign or unassign a leg from a strategy group.

**Path Param**: `transaction_id` — UUID

**Request Body**:
```json
{ "strategy_group_id": "uuid" }    // assign
{ "strategy_group_id": null }      // unassign
```

**Response** `200 OK`: `TransactionResponse` (updated)

**Errors**:
- `400` — Group symbol does not match transaction symbol, or transaction has no symbol
- `401` — Missing/invalid JWT
- `404` — Transaction or group not found, or not owned by current user

---

## Removed Endpoints

- `GET /api/transactions/strategy-types` — removed (replaced by `leg-types`)
- `PATCH /api/transactions/{id}/strategy-type` — removed (replaced by `leg-type`)
