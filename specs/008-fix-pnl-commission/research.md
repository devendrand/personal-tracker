# Research: PnL Commission Fix & Additional Metrics

**Branch**: `008-fix-pnl-commission` | **Phase**: 0

---

## Commission Sign Convention

**Decision**: Commission values are stored as **negative numbers** in the database (e.g., `-0.65` = $0.65 paid to broker). This convention is sourced directly from E*TRADE CSV exports.

**Rationale**: The spec assumption is confirmed by inspecting `api/app/models/trade.py` — the `commission` field is `Decimal | None` with no sign normalization during import. The E*TRADE CSV column is labeled "Commission" and contains negative values for charges.

**Impact on PnL formula**: `realized_pnl = amount + commission`
- Example: `amount=150.00`, `commission=-0.65` → `realized_pnl = 149.35` ✓
- The formula naturally reduces profit (adds a negative number).

**Impact on display**: All commission fields in API responses must be returned as `abs(commission)` so the UI displays a positive "cost" value without sign inversion logic.

**Alternatives considered**: Storing commission as positive (cost) then subtracting — rejected because it would require a migration and deviates from raw E*TRADE data format.

---

## Schema Migration Requirement

**Decision**: **No Alembic migration required.**

**Rationale**: The `commission` column already exists on the `transaction` table (`Numeric(18, 6), nullable=True`). It has been populated during CSV import since the initial schema. No new columns or tables are added by this feature.

**Confirmed by**: `api/app/models/trade.py` line: `commission: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)`

---

## Existing PnL Formula Bug Scope

**Decision**: The bug is isolated to `pnl_service.py` in one place — the `LegPnL` construction inside `calculate_pnl()`.

**Current (buggy) code**:
```python
realized_pnl=amount,  # Wrong: ignores commission
```

**Corrected code**:
```python
commission_raw = Decimal(str(txn.commission)) if txn.commission is not None else Decimal("0")
realized_pnl = amount + commission_raw        # amount + negative = amount - cost
commission_abs = abs(commission_raw)          # for display as positive cost
```

**Cascade**: All group totals, ticker totals, and the grand total are computed as sums of `leg.realized_pnl`, so fixing the leaf automatically corrects all aggregate levels — no additional changes needed in the aggregation logic.

---

## Transaction Count Aggregation Strategy

**Decision**: Compute `transaction_count` as `len(legs)` at the group level, then sum upward to ticker and grand total.

**Rationale**: The simplest correct approach. Each leg is exactly one tagged transaction. Counting group legs gives the group count; summing group counts gives ticker count; summing ticker counts gives grand total.

**No database-level COUNT queries needed**: All transactions are already loaded into memory for PnL computation. Adding `len()` calls has zero extra I/O cost.

---

## Total Commission Aggregation Strategy

**Decision**: Compute `total_commission` at the group level as `sum(abs(txn.commission) for txn in legs, treating null as 0)`, then sum upward.

**Rationale**: Absolute values are summed so the result represents "total dollars paid in commission" — a positive cost metric regardless of how many legs there are or what their signs are.

**Alternative rejected**: Summing raw (negative) commission values then displaying `abs(total)` — rejected because intermediate values would be confusing if inspected and could cause sign errors if mixed with positive commission values (rare but possible).

---

## Existing Test Impact

**Decision**: All existing PnL tests use `commission=0.00` in their sample CSV data. No existing test assertion changes are required for PnL amounts. New assertions for `transaction_count` and `total_commission` must be added to verify the new fields are present in responses.

**Confirmed by**: Inspecting `api/tests/test_pnl.py` — all 7 test CSV fixtures have `0.00` in the commission column.

**New test cases needed**:
1. Commission deducted from PnL (non-zero commission)
2. Null commission treated as zero
3. Group-level `transaction_count` and `total_commission` verified
4. Ticker-level rollup verified
5. Grand-total rollup verified
6. Commission returned as positive (absolute) value

---

## Frontend Display Strategy

**Decision**: Add two new columns to the existing PnL table:
- **"# Trades"** — shown on group rows, ticker rows, and grand-total footer. Not shown on leg rows.
- **"Commission"** — shown on all row types (leg rows show individual commission; group/ticker/total rows show summed commission).

**Rationale**: Matches spec FR-012 and FR-013 exactly. No new page or navigation entry is required.

**Commission value handling**: Backend returns all commission values as positive `Decimal` strings. Frontend displays them as-is using Angular's `CurrencyPipe` — no sign inversion logic needed in the component.

**Alternatives considered**: Tooltip display, collapsible side panel — rejected as over-engineering; new columns are the simplest approach that satisfies the requirements.
