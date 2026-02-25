# PRD Addendum — Module A: Strategy Type Tagging

**Addendum Version:** 1.0 | **Date:** February 2026 | **Status:** Draft
**Parent Document:** `PersonalTracker_PRD_v2.0.md`
**Amends:** Section 4.2 (Trade Tagging & Portfolio Management), Section 6.1 (Data Model — Module A), Section 7.1 (API Design — Module A)

> This addendum refines the trade tagging model defined in FR-04 and FR-05 of the parent PRD. It clarifies that strategy types are a hardcoded system enum (not user-defined), defines the full list of supported values, and enforces a one-tag-per-transaction rule.

---

## 1. Decision Summary

| Design Question | Decision | Rationale |
|----------------|----------|-----------|
| How are strategy types managed? | Hardcoded constant list (enum) | No UI or DB table needed; simpler to build and maintain; prevents user-created inconsistencies |
| Can a transaction have multiple strategy tags? | No — exactly one strategy type per transaction | Keeps reporting clean; a transaction belongs to one strategy; avoids double-counting P&L |
| Is a strategy tag mandatory on every transaction? | No — optional; untagged transactions are valid | Some imported transactions (e.g., dividends, fees) may not belong to any active strategy |

---

## 2. Supported Strategy Types

The following six values constitute the complete, hardcoded list of strategy types. They shall be defined as an enum in the backend codebase and surfaced as a fixed dropdown in the UI. No create, edit, or delete capability is needed.

| Enum Value | Display Label | Description |
|------------|--------------|-------------|
| `WHEEL` | Wheel Strategy | A combined strategy of selling cash-secured puts, accepting assignment, and selling covered calls against the resulting stock position. Typically tagged across the full chain of related transactions. |
| `COVERED_CALL` | Covered Call | Selling a call option against an existing long stock position. Used when running covered calls independently of the Wheel Strategy. |
| `COLLAR` | Collar | Holding a long stock position, selling a covered call, and simultaneously buying a protective put to cap downside risk. |
| `CSP` | Cash Secured Put | Selling a put option while holding enough cash to cover potential assignment. Used independently of the Wheel Strategy. |
| `LONG_HOLD` | Long Hold | Buying and holding a stock or ETF for the long term with no active options overlay. |
| `SIP` | SIP | Systematic Investment Plan — recurring, scheduled purchases of a stock or ETF regardless of market conditions. |

---

## 3. Amendments to Section 4.2 — Trade Tagging

### Replaces / extends FR-04 and FR-05:

#### FR-04 (Amended): Strategy Type as System Enum
Strategy types shall be defined as a hardcoded enum in the backend. There is no UI for managing strategy types — no create, edit, rename, or delete. The six values defined in Section 2 above are the only valid options. New strategy types may only be added via a code change and redeployment.

#### FR-05 (Amended): One Strategy Tag Per Transaction
Each transaction may be tagged with **at most one** strategy type. The tag is optional — transactions with no strategy tag are valid and shall appear in an "Untagged" filter view. Once tagged, a strategy type may be changed by the user at any time, but a transaction cannot hold two strategy types simultaneously.

#### FR-05a (New): Strategy Tag UI
The strategy type selector shall be presented as a single-select dropdown in the transaction detail view and the bulk-tag panel. The dropdown options shall always reflect the fixed enum list in the same display order as defined in Section 2. An "Untagged / None" option shall be present to allow removing a tag.

#### FR-05b (New): Untagged Transaction View
The transaction log shall include an "Untagged" filter option that surfaces all transactions with no strategy type assigned. This serves as a prompt for the user to tag recently imported transactions.

---

## 4. Amendments to Section 6.1 — Data Model

### Change to `Transaction` entity

Add one new nullable column:

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `strategy_type` | `ENUM` | Nullable; one of the six defined values | Null = untagged; no foreign key needed since it is a native DB enum |

The `Portfolio` entity and `TransactionTag` join table defined in the parent PRD remain unchanged — portfolios are a separate grouping concept (e.g., "my GOOGL trades") and are orthogonal to strategy type (e.g., "Wheel Strategy"). A transaction can belong to a portfolio **and** have a strategy type; they are independent attributes.

### Enum definition (PostgreSQL)

```sql
CREATE TYPE strategy_type_enum AS ENUM (
  'WHEEL',
  'COVERED_CALL',
  'COLLAR',
  'CSP',
  'LONG_HOLD',
  'SIP'
);

ALTER TABLE transaction
  ADD COLUMN strategy_type strategy_type_enum NULL;
```

---

## 5. Amendments to Section 7.1 — API Design

### Updated endpoints

| Method | Endpoint | Change |
|--------|----------|--------|
| GET | `/api/strategy-types` | **New.** Returns the hardcoded list of strategy types (enum value + display label + description). Used to populate dropdowns in the UI without hardcoding labels on the frontend. |
| PATCH | `/api/transactions/{id}/strategy` | **New.** Sets or clears the strategy type on a single transaction. Body: `{ "strategy_type": "WHEEL" \| null }`. |
| POST | `/api/tags/bulk` | **Updated.** Bulk tag endpoint shall now accept an optional `strategy_type` field in addition to `portfolio_id`, allowing both to be set in a single bulk operation. |
| GET | `/api/transactions` | **Updated.** Add `?strategy_type=` as a filter parameter. Supports a value of `UNTAGGED` to return transactions with `strategy_type IS NULL`. |
| GET | `/api/reports/portfolio/{id}` | **Updated.** Report shall break down positions and P&L by strategy type within the portfolio where applicable. |

---

## 6. Open Questions

- **Strategy chain and strategy type alignment:** The parent PRD defines Strategy Chains (FR-06) as a way to group multi-leg trades (e.g., Wheel legs). Should the strategy type on each leg transaction be auto-set to `WHEEL` when a chain of type Wheel is created, or should leg-level tagging remain manual?
- **Reporting by strategy type:** Should there be a dedicated strategy-type-level report (e.g., "show me all my Wheel trades and their combined P&L") in addition to the existing portfolio-level report? This feels like a natural v1.1 addition.
- **Future extensibility:** If a new strategy type is needed (e.g., `IRON_CONDOR`, `STRANGLE`), the process is a DB migration + code change. This is acceptable given the hardcoded decision, but worth documenting as a known constraint.

---

*Module A — Strategy Type Tagging Addendum v1.0 | February 2026 | Confidential*
