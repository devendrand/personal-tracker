# API Contract: Round-Trip Groups

**Base path**: `/api/round-trips`
**Auth**: Bearer JWT required on all endpoints

---

## Overview

Round-trip groups associate two or more transactions into a logical grouping for tracking opening/closing trades. Groups are inert metadata — they have no impact on PnL calculations or leg types.

---

## Endpoints

### POST /api/round-trips/link

Create a new round-trip group from selected transactions.

**Request Body**:
```json
{
  "transaction_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Validation**:
- Minimum 2 transaction IDs required
- All transactions must belong to the current user
- All transactions must have the same `symbol`
- All transactions must be currently unlinked (not in another group)
- All transactions must have a non-null `symbol`

**Response** `201 Created`: `RoundTripGroupResponse`

```json
{
  "id": "uuid",
  "display_order": 1,
  "member_count": 3,
  "created_at": "2026-02-27T10:00:00Z"
}
```

**Errors**:
- `400` — Less than 2 transactions, symbol mismatch, or transactions already linked
- `401` — Missing/invalid JWT
- `404` — One or more transactions not found
- `409` — Conflict (see Conflict Response below)

---

### POST /api/round-trips/{group_id}/add

Add unlinked transactions to an existing group.

**Path Param**: `group_id` — UUID of the target group

**Request Body**:
```json
{
  "transaction_ids": ["uuid-4", "uuid-5"]
}
```

**Validation**:
- At least 1 transaction ID required
- All transactions must belong to the current user
- All transactions must be currently unlinked
- Target group's symbol must match transactions' symbol

**Response** `200 OK`: `RoundTripGroupResponse` (updated)

**Errors**:
- `400` — Symbol mismatch or transactions already linked
- `401` — Missing/invalid JWT
- `404` — Group not found or transactions not found

---

### POST /api/round-trips/{group_id}/remove

Remove transactions from a group.

**Path Param**: `group_id` — UUID of the group

**Request Body**:
```json
{
  "transaction_ids": ["uuid-1"]
}
```

**Validation**:
- At least 1 transaction ID required
- All specified transactions must belong to the group
- All transactions must belong to the current user

**Response** `200 OK`: `RoundTripGroupResponse` (updated, or group disbanded)

**Behavior**:
- If removing leaves 2+ members: group persists with remaining members
- If removing leaves 1 member: group is disbanded, remaining member unlinked
- If removing all members: group is deleted

**Errors**:
- `401` — Missing/invalid JWT
- `404` — Group not found or transaction not in group

---

### DELETE /api/round-trips/{group_id}

Disband an entire group (remove all members).

**Path Param**: `group_id` — UUID of the group to delete

**Response** `204 No Content`

**Errors**:
- `401` — Missing/invalid JWT
- `404` — Group not found

---

### GET /api/round-trips

List all round-trip groups for the current user.

**Query Parameters**:

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `skip` | int | No | Default 0 |
| `limit` | int | No | Default 100, max 500 |

**Response** `200 OK`: `list[RoundTripGroupResponse]`

```json
[
  {
    "id": "uuid",
    "display_order": 1,
    "member_count": 2,
    "created_at": "2026-02-27T10:00:00Z"
  }
]
```

**Errors**:
- `401` — Missing/invalid JWT

---

### GET /api/round-trips/{group_id}

Get a specific group with its members.

**Path Param**: `group_id` — UUID

**Response** `200 OK`: `RoundTripGroupDetailResponse`

```json
{
  "id": "uuid",
  "display_order": 1,
  "member_count": 2,
  "created_at": "2026-02-27T10:00:00Z",
  "members": [
    {
      "id": "tx-uuid-1",
      "activity_date": "2026-01-15",
      "activity_type": "Sold Short",
      "description": "PUT AAPL 02/27/26 180.000",
      "symbol": "AAPL",
      "quantity": -1,
      "price": 1.50,
      "amount": 150.00,
      "leg_type": "CSP",
      "strategy_group_id": null,
      "round_trip_group_id": "uuid",
      "created_at": "2026-01-15T00:00:00Z"
    }
  ]
}
```

**Errors**:
- `401` — Missing/invalid JWT
- `404` — Group not found

---

## Conflict Response

When a link or add request would place an already-grouped transaction into a different group:

**Response** `409 Conflict`:

```json
{
  "detail": "Cannot link transactions: the following are already in another group",
  "conflicting_transactions": [
    {
      "id": "tx-uuid-1",
      "current_group_id": "existing-group-uuid"
    }
  ]
}
```

---

## Updated Endpoints

### GET /api/transactions

The existing transactions list endpoint is updated to include `round_trip_group_id` in the response:

**Response** `200 OK`: `list[TransactionResponse]`

```json
[
  {
    "id": "uuid",
    "activity_date": "2026-01-15",
    "activity_type": "Sold Short",
    "description": "PUT AAPL 02/27/26 180.000",
    "symbol": "AAPL",
    "quantity": -1,
    "price": 1.50,
    "amount": 150.00,
    "leg_type": "CSP",
    "strategy_group_id": null,
    "round_trip_group_id": "group-uuid",
    "created_at": "2026-01-15T00:00:00Z"
  }
]
```

**Note**: The `round_trip_group_id` field is added to the existing `TransactionResponse` schema.