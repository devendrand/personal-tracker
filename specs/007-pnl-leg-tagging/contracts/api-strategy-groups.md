# API Contract: Strategy Groups

**Base path**: `/api/strategy-groups`
**Auth**: Bearer JWT required on all endpoints

---

## Endpoints

### GET /api/strategy-groups

List all strategy groups for the current user.

**Response** `200 OK`: `list[StrategyGroupResponse]`

```json
[
  {
    "id": "uuid",
    "name": "AAPL Wheel Q1 2025",
    "symbol": "AAPL",
    "created_at": "2025-01-01T10:00:00"
  }
]
```

**Error**: `401` — Missing/invalid JWT

---

### POST /api/strategy-groups

Create a new strategy group.

**Request Body**:
```json
{
  "name": "AAPL Wheel Q1 2025",
  "symbol": "AAPL"
}
```

**Validation**:
- `name`: required, non-empty string
- `symbol`: required, non-empty string (normalized to uppercase)

**Response** `201 Created`: `StrategyGroupResponse`

```json
{
  "id": "uuid",
  "name": "AAPL Wheel Q1 2025",
  "symbol": "AAPL",
  "created_at": "2025-01-01T10:00:00"
}
```

**Errors**:
- `401` — Missing/invalid JWT
- `422` — Missing required fields or invalid values

---

### DELETE /api/strategy-groups/{group_id}

Delete a strategy group. All legs assigned to this group become unassigned (`strategy_group_id = null`). Legs are NOT deleted.

**Path Param**: `group_id` — UUID

**Response** `204 No Content`

**Errors**:
- `401` — Missing/invalid JWT
- `404` — Group not found or not owned by current user
