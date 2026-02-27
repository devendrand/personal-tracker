# Data Model: Round-Trip Linking

## Entities

### RoundTripGroup

A grouping entity that associates two or more transactions as a logical round-trip.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (String 36) | Primary Key | System-generated unique identifier |
| `user_sub` | String (255) | NOT NULL, Indexed | Foreign key to user (JWT sub claim) |
| `display_order` | Integer | NOT NULL, Default 0 | Sequential number for friendly badge display |
| `created_at` | DateTime | NOT NULL, Default now | Timestamp of group creation |
| `updated_at` | DateTime | NOT NULL, Auto-update | Timestamp of last modification |

**Relationships**:
- One `RoundTripGroup` → Many `Transaction` (one-to-many via FK on Transaction)

---

### Transaction (Modified)

The existing `Transaction` model gains a new optional foreign key.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `round_trip_group_id` | UUID (String 36) | Nullable, FK → `round_trip_group.id`, Indexed | Reference to round-trip group (NEW) |

**Note**: The existing `strategy_group_id` field is separate and unrelated. Round-trip groups are inert metadata per FR-015.

---

## Validation Rules

1. **Group symbol consistency**: All transactions in a group MUST have the same `symbol` value (per clarification)
2. **Minimum group size**: A group must always have at least 2 members
3. **Exclusive membership**: A transaction can belong to at most one round-trip group at any time
4. **Ownership**: All transactions in a group must belong to the same user (enforced by `user_sub`)

---

## State Transitions

| State | Transition | Result |
|-------|------------|--------|
| Unlinked → Linked | Create group with 2+ transactions | Transactions gain `round_trip_group_id` |
| Linked → Linked (add) | Add unlinked transaction to existing group | Transaction gains existing `round_trip_group_id` |
| Linked → Unlinked | Remove transaction from group | Transaction's `round_trip_group_id` set to NULL |
| 2-member group → 1 member | Remove one from 2-member group | Group disbanded, remaining transaction unlinked |

---

## Database Schema (SQL)

```sql
CREATE TABLE round_trip_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_sub VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_round_trip_group_user_sub ON round_trip_group(user_sub);

ALTER TABLE transaction
ADD COLUMN round_trip_group_id UUID REFERENCES round_trip_group(id) ON DELETE SET NULL;

CREATE INDEX ix_transaction_round_trip_group_id ON transaction(round_trip_group_id);
```

---

## API Data Transfer Objects

### RoundTripGroupResponse

```typescript
interface RoundTripGroupResponse {
  id: string;           // UUID
  display_order: number; // Friendly sequential number
  member_count: number; // Number of transactions in group
  created_at: string;   // ISO datetime
}
```

### TransactionWithGroupResponse (extends TransactionResponse)

```typescript
interface TransactionWithGroupResponse extends TransactionResponse {
  round_trip_group_id: string | null;
  round_trip_group?: RoundTripGroupResponse; // Populated when expanded
}
```

### LinkTransactionsRequest

```typescript
interface LinkTransactionsRequest {
  transaction_ids: string[]; // 2+ transaction UUIDs
}
```

### AddToGroupRequest

```typescript
interface AddToGroupRequest {
  transaction_ids: string[]; // 1+ unlinked transaction UUIDs
}
```

### ConflictResponse

```typescript
interface ConflictResponse {
  detail: string;
  conflicting_transactions: {
    id: string;
    current_group_id: string;
  }[];
}
```