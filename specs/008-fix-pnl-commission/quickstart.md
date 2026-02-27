# Quickstart: PnL Commission Fix & Additional Metrics

**Branch**: `008-fix-pnl-commission`

This guide summarizes the implementation steps for a developer picking up this feature.

---

## What Changes

1. **PnL formula fix**: `realized_pnl` per leg changes from `amount` to `amount + commission` (commission is negative in storage, so this reduces gross profit by the commission cost).
2. **New metrics**: `transaction_count` and `total_commission` added at group, ticker, and grand-total levels.
3. **Commission in API**: All commission fields are returned as positive (absolute) values.
4. **Frontend columns**: Two new columns added to the PnL table — "# Trades" and "Commission".

---

## No Migration Required

The `commission` column already exists on the `transaction` table. Do **not** run or create any Alembic migration for this feature.

---

## Files to Modify

### Backend

| File | Change |
|------|--------|
| `api/app/schemas/pnl.py` | Add `commission` to `LegPnL`; add `transaction_count` + `total_commission` to `StrategyGroupPnL`, `TickerPnL`, `PnLSummaryResponse` |
| `api/app/services/pnl_service.py` | Fix `realized_pnl` formula; compute `commission`, `transaction_count`, `total_commission` at each level |
| `api/tests/test_pnl.py` | Add new commission-bearing test fixtures and test cases; add assertions for new fields in existing tests |

### Frontend

| File | Change |
|------|--------|
| `web/src/app/features/pnl/models/pnl.models.ts` | Add `commission` to `LegPnL`; add `transaction_count` + `total_commission` to `StrategyGroupPnL`, `TickerPnL`, `PnLSummaryResponse` |
| `web/src/app/features/pnl/pnl.component.ts` | Add "# Trades" and "Commission" columns at group/ticker/total rows; add "Commission" column to leg rows |

---

## Key Implementation Details

### Backend Service Fix (`pnl_service.py`)

Replace the leg construction block:

```python
# BEFORE (buggy)
amount = Decimal(str(txn.amount)) if txn.amount is not None else Decimal("0")
leg_pnls.append(LegPnL(
    ...
    amount=amount,
    realized_pnl=amount,  # BUG: ignores commission
))

# AFTER (correct)
amount = Decimal(str(txn.amount)) if txn.amount is not None else Decimal("0")
commission_raw = Decimal(str(txn.commission)) if txn.commission is not None else Decimal("0")
commission_abs = abs(commission_raw)
realized_pnl = amount + commission_raw  # commission_raw is negative → net reduction

leg_pnls.append(LegPnL(
    ...
    amount=amount,
    realized_pnl=realized_pnl,
    commission=commission_abs,
))
```

After building `leg_pnls`, compute group metrics:

```python
group_total = sum((leg.realized_pnl for leg in leg_pnls), Decimal("0"))
transaction_count = len(leg_pnls)
total_commission = sum((leg.commission for leg in leg_pnls), Decimal("0"))

group_results.append(StrategyGroupPnL(
    ...
    total_realized_pnl=group_total,
    transaction_count=transaction_count,
    total_commission=total_commission,
    legs=leg_pnls,
))
```

After building `group_results`, compute ticker metrics:

```python
ticker_total = sum((g.total_realized_pnl for g in group_results), Decimal("0"))
ticker_count = sum(g.transaction_count for g in group_results)
ticker_commission = sum((g.total_commission for g in group_results), Decimal("0"))

ticker_results.append(TickerPnL(
    ...
    total_realized_pnl=ticker_total,
    transaction_count=ticker_count,
    total_commission=ticker_commission,
    groups=group_results,
))
```

Grand totals:

```python
grand_total = sum((t.total_realized_pnl for t in ticker_results), Decimal("0"))
grand_count = sum(t.transaction_count for t in ticker_results)
grand_commission = sum((t.total_commission for t in ticker_results), Decimal("0"))

return PnLSummaryResponse(
    total_realized_pnl=grand_total,
    total_transaction_count=grand_count,
    total_commission=grand_commission,
    tickers=ticker_results,
)
```

---

### Test CSV with Commission

Add a test fixture with non-zero commission values:

```python
COMMISSION_CSV = f"""{_H}
02/18/26,02/18/26,02/19/26,Sold Short,PUT  AAPL   02/27/26   180.000 COMM,AAPL,--,-1.0,1.50,150.00,-0.65,--,--
02/27/26,02/27/26,02/28/26,Expired,PUT  AAPL   02/27/26   180.000 EXP COMM,AAPL,--,1.0,0.00,0.00,0.00,--,--
"""
```

Expected PnL for this fixture:
- Open leg: `realized_pnl = 150.00 + (-0.65) = 149.35`, `commission = 0.65`
- Expiration leg: `realized_pnl = 0.00`, `commission = 0.00`
- Group total: `149.35`, `transaction_count = 2`, `total_commission = 0.65`

---

### Frontend Column Layout

Add two new columns to the legs table `<thead>`:
```html
<th>Date</th>
<th>Description</th>
<th>Leg Type</th>
<th class="amount-col">Commission</th>  <!-- NEW -->
<th class="amount-col">PnL</th>
```

Add "Commission" data cell to leg rows (no "# Trades" on leg rows per FR-013).

Add "# Trades" and "Commission" to:
- Group header rows
- Ticker header rows
- Grand-total summary card

---

## Running Tests

```bash
cd api
uv run pytest tests/test_pnl.py -v
```

All tests (including existing ones) must pass before pushing.

---

## CI Check

```bash
./scripts/ci_local.sh
```
