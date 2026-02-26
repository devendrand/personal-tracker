# Data Model: Strategy Type Tagging

Date: 2026-02-26

## Entities

### Transaction

Represents an imported E*TRADE transaction. Transactions are created via CSV upload and are not edited except for user-controlled metadata (strategy tag).

Key fields (existing):
- `id`: UUID string
- `user_sub`: user subject (JWT `sub`)
- `import_batch_id`: FK to import batch
- `brokerage_account_id`: string
- `activity_date`: date
- `activity_type`: string
- `description`: string
- `symbol`: string | null
- `quantity`: decimal | null
- `price`: decimal | null
- `amount`: decimal | null
- `raw`: JSON payload of source row
- `dedupe_key`: string
- `created_at`, `updated_at`: timestamps

New field:
- `strategy_type`: StrategyType | null
  - Null means “Untagged”.
  - Non-null must be one of the supported StrategyType values.

Removed field:
- `portfolio_id`: removed from `transaction` as part of this feature.

### StrategyType (system enum)

Fixed system list (PRD):
- `WHEEL`
- `COVERED_CALL`
- `COLLAR`
- `CSP`
- `LONG_HOLD`
- `SIP`

## Validation Rules

- A transaction may have at most one strategy type (single-select).
- Strategy type is optional.
- Invalid strategy type values are rejected.

## State Transitions

- Untagged → Tagged (set to a specific StrategyType)
- Tagged → Tagged (change from one StrategyType to another)
- Tagged → Untagged (clear the tag)

## Query/Filter Semantics

- `tagged=true` means `strategy_type IS NOT NULL`.
- `tagged=false` means `strategy_type IS NULL`.
- `strategy_type=<value>` filters to transactions with that specific value.
