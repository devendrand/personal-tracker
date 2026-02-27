# Data Model: PnL Commission Fix & Additional Metrics

**Branch**: `008-fix-pnl-commission` | **Phase**: 1

---

## Database Changes

**None.** The `commission` column already exists on the `transaction` table as `Numeric(18, 6), nullable=True`. No Alembic migration is required.

---

## Updated API Schema Shapes

All changes are to Pydantic schemas in `api/app/schemas/pnl.py` and computation logic in `api/app/services/pnl_service.py`.

### LegPnL (updated)

Represents one tagged transaction's contribution to PnL.

| Field | Type | Description |
|-------|------|-------------|
| `transaction_id` | `str` | UUID of the transaction |
| `activity_date` | `date` | Date of the transaction |
| `activity_type` | `str` | E*TRADE activity type (e.g., "Sold Short") |
| `description` | `str` | Transaction description |
| `leg_type` | `LegType` | CSP, CC, BUY, or SELL |
| `amount` | `Decimal` | Gross cash received/paid (from E*TRADE) |
| `realized_pnl` | `Decimal` | **FIXED**: `amount + commission_raw` (commission null → 0) |
| `commission` | `Decimal` | **NEW**: Absolute commission cost for this leg (always ≥ 0) |

**Computation**:
```python
commission_raw = Decimal(str(txn.commission)) if txn.commission is not None else Decimal("0")
realized_pnl = amount + commission_raw   # commission_raw is negative → net reduction
commission = abs(commission_raw)         # positive for display
```

**Validation rules**:
- `commission` is always ≥ 0 (absolute value enforced at service layer)
- `realized_pnl` may be negative (e.g., BTC leg that cost more than the credit received)

---

### StrategyGroupPnL (updated)

Represents one strategy group's aggregated PnL.

| Field | Type | Description |
|-------|------|-------------|
| `strategy_group_id` | `str \| None` | UUID or None for "Ungrouped" |
| `name` | `str` | Group name or "Ungrouped" |
| `total_realized_pnl` | `Decimal` | Sum of `leg.realized_pnl` for all legs |
| `legs` | `list[LegPnL]` | Individual leg contributions |
| `transaction_count` | `int` | **NEW**: `len(legs)` |
| `total_commission` | `Decimal` | **NEW**: Sum of `leg.commission` (all ≥ 0) |

**Computation**:
```python
transaction_count = len(leg_pnls)
total_commission = sum((leg.commission for leg in leg_pnls), Decimal("0"))
```

---

### TickerPnL (updated)

Represents one symbol's aggregated PnL across all its strategy groups.

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | `str` | Ticker symbol (e.g., "AAPL") |
| `total_realized_pnl` | `Decimal` | Sum of `group.total_realized_pnl` |
| `groups` | `list[StrategyGroupPnL]` | Groups for this ticker |
| `transaction_count` | `int` | **NEW**: Sum of `group.transaction_count` |
| `total_commission` | `Decimal` | **NEW**: Sum of `group.total_commission` |

**Computation**:
```python
transaction_count = sum(g.transaction_count for g in group_results)
total_commission = sum((g.total_commission for g in group_results), Decimal("0"))
```

---

### PnLSummaryResponse (updated)

Top-level response for `GET /api/pnl`.

| Field | Type | Description |
|-------|------|-------------|
| `total_realized_pnl` | `Decimal` | Grand total across all tickers |
| `tickers` | `list[TickerPnL]` | Per-symbol breakdown |
| `total_transaction_count` | `int` | **NEW**: Sum of `ticker.transaction_count` |
| `total_commission` | `Decimal` | **NEW**: Sum of `ticker.total_commission` |

**Computation**:
```python
total_transaction_count = sum(t.transaction_count for t in ticker_results)
total_commission = sum((t.total_commission for t in ticker_results), Decimal("0"))
```

---

## Updated TypeScript Interfaces

In `web/src/app/features/pnl/models/pnl.models.ts`:

### LegPnL

```typescript
export interface LegPnL {
  transaction_id: string;
  activity_date: string;
  activity_type: string;
  description: string;
  leg_type: string;
  amount: string;
  realized_pnl: string;
  commission: string;   // NEW — absolute value, always ≥ 0, display as-is
}
```

### StrategyGroupPnL

```typescript
export interface StrategyGroupPnL {
  strategy_group_id: string | null;
  name: string;
  total_realized_pnl: string;
  legs: LegPnL[];
  transaction_count: number;   // NEW
  total_commission: string;    // NEW — Decimal as string
}
```

### TickerPnL

```typescript
export interface TickerPnL {
  symbol: string;
  total_realized_pnl: string;
  groups: StrategyGroupPnL[];
  transaction_count: number;   // NEW
  total_commission: string;    // NEW — Decimal as string
}
```

### PnLSummaryResponse

```typescript
export interface PnLSummaryResponse {
  total_realized_pnl: string;
  tickers: TickerPnL[];
  total_transaction_count: number;   // NEW
  total_commission: string;          // NEW — Decimal as string
}
```

---

## State Transitions

No state transitions. PnL is a read-only computed view; no mutations occur.

---

## Sign/Display Convention Summary

| Layer | Commission Value | How stored | How returned | How displayed |
|-------|-----------------|------------|--------------|---------------|
| DB (`transaction.commission`) | Raw from CSV | Negative (e.g., `-0.65`) | — | — |
| API (`LegPnL.commission`) | Absolute | — | Positive (`0.65`) | `$0.65` |
| API (`StrategyGroupPnL.total_commission`) | Summed absolute | — | Positive | `$1.30` |
| API (`TickerPnL.total_commission`) | Summed absolute | — | Positive | `$2.60` |
| API (`PnLSummaryResponse.total_commission`) | Summed absolute | — | Positive | `$5.20` |
| Frontend | — | — | Displays as-is | `CurrencyPipe` |
