# Research: PnL Leg Tagging & Strategy Groups

**Feature**: 007-pnl-leg-tagging
**Date**: 2026-02-26

---

## Decision 1: PnL Calculation Method

**Decision**: Use `transaction.amount` directly as `realized_pnl` per leg. No FIFO matching, no commission adjustment.

**Rationale**: E*TRADE's `amount` column is already the net cash impact of each activity (positive = money received, negative = money paid out, including commissions). This makes per-leg PnL trivially correct: sum the amounts and you have realized PnL. Confirmed directly with the user during planning session.

**Alternatives considered**:
- FIFO lot matching for equity (rejected — unnecessary complexity; amount field already captures the correct cash flow)
- Gross amount minus commission field (rejected — amount is already net)
- Unrealized PnL tracking (rejected — out of scope; user explicitly removed this)

---

## Decision 2: Strategy Grouping Mechanism

**Decision**: User manually creates named strategy groups and assigns legs to them via the UI.

**Rationale**: Automated grouping (matching open/close option transactions, or time-window clustering) requires parsing E*TRADE `activity_type` strings and option description parsing — high implementation complexity with marginal value for a personal tracker. Manual grouping gives the user full control over what constitutes a "Wheel cycle" on AAPL.

**Alternatives considered**:
- Auto-group by (symbol, leg_type) — too coarse; merges distinct strategy cycles
- Auto-match open+close option pairs by activity_type — requires E*TRADE activity_type reverse-engineering; brittle
- Time-window proximity grouping — arbitrary threshold; prone to misclassification

---

## Decision 3: Leg Type Enum Values

**Decision**: `LegType` enum with 4 values: `CSP`, `CC`, `BUY`, `SELL`.

**Rationale**: These four values cover all relevant trading activities in the user's E*TRADE workflow:
- `CSP`: Any Cash-Secured Put activity (open, BTC, expire, assign) — single tag covers the full option lifecycle
- `CC`: Any Covered Call activity (open, BTC, expire, assign)
- `BUY`: Equity purchase
- `SELL`: Equity sale

This replaces the previous 6-value `StrategyType` enum (WHEEL, COVERED_CALL, COLLAR, CSP, LONG_HOLD, SIP) which mixed leg-level and strategy-level concepts.

**Alternatives considered**:
- Keeping StrategyType alongside LegType (rejected — two overlapping tags, confusing UX)
- Finer-grained option tags (sell-to-open, buy-to-close, expire, assign) — adds UI complexity without PnL benefit since amount already captures the direction

---

## Decision 4: Migration of Existing `strategy_type` Data

**Decision**: Drop `strategy_type` column (data wiped); users re-tag with new `leg_type`.

**Rationale**: The old tags had different semantics (strategy-level, not leg-level). Mapping LONG_HOLD→BUY, CSP→CSP, COVERED_CALL→CC is lossy (WHEEL, COLLAR, SIP have no direct equivalent). Since this is a personal tracker with a single user, re-tagging is a minor one-time effort and gives the user a clean slate.

**Alternatives considered**:
- Best-effort migration (CSP→CSP, COVERED_CALL→CC, LONG_HOLD→BUY, rest→NULL) — partial data; potentially misleading PnL for incorrectly migrated rows
- Keep both columns — two overlapping tags, increased complexity with no user value

---

## Decision 5: Assignment Handling (CSP Gets Assigned)

**Decision**: Assignment is a terminal event for the CSP leg. No equity lot is created. `realized_pnl` = `amount` of the assignment leg as-is.

**Rationale**: The user confirmed they do not want assignment to spin off an equity lot into LONG_HOLD. The assignment amount (stock purchase price) is already captured in the `amount` field. If the user later sells the assigned stock, they will tag those transactions as BUY/SELL manually.

**Alternatives considered**:
- Create LONG_HOLD lot from assigned stock (rejected by user)
- Separate assignment leg type (rejected — unnecessary complexity; CSP tag covers the full lifecycle)

---

## Decision 6: Untagged Legs in PnL View

**Decision**: Tagged legs with no strategy group appear under an "Ungrouped" bucket per ticker. Untagged legs (leg_type = NULL) are completely excluded from PnL.

**Rationale**: Allows partial tagging — the user can see PnL on tagged legs without having to build out full strategy groups first.

**Alternatives considered**:
- Show untagged legs at ticker level with $0 PnL — misleading (shouldn't show $0, just absent)
- Require group assignment before showing in PnL — too strict; blocks partial workflows

---

## Technical Findings

### SQLAlchemy Relationship (StrategyGroup → Transaction)

Use `relationship("Transaction", back_populates="strategy_group", foreign_keys=[Transaction.strategy_group_id])` with `passive_deletes=False` so that deleting a StrategyGroup nullifies `strategy_group_id` on linked transactions (via `ondelete="SET NULL"` in FK definition).

### Alembic Migration Order

1. Create `strategy_group` table first (no FK deps)
2. Add `transaction.leg_type` column
3. Add `transaction.strategy_group_id` FK column referencing `strategy_group.id`
4. Drop `transaction.strategy_type` column

### Angular PnL Component

Use `signal<PnLSummaryResponse | null>(null)` for state. Call `getPnL()` in `ngOnInit` via `inject(ApiClientService)`. Use `@for` for tickers/groups/legs. Collapsible state per ticker/group stored in a `Set<string>` signal.
