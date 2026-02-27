# API Contract: PnL Endpoint

**Endpoint**: `GET /api/pnl`
**Auth**: Bearer JWT required
**Feature**: `008-fix-pnl-commission`

---

## Response Schema (updated)

All `Decimal` fields are serialized as **strings** to preserve precision.
All `commission` fields are **positive (absolute) values** — backend normalizes sign before returning.

```json
{
  "total_realized_pnl": "string (Decimal)",
  "total_transaction_count": "integer",
  "total_commission": "string (Decimal, ≥ 0)",
  "tickers": [
    {
      "symbol": "string",
      "total_realized_pnl": "string (Decimal)",
      "transaction_count": "integer",
      "total_commission": "string (Decimal, ≥ 0)",
      "groups": [
        {
          "strategy_group_id": "string | null",
          "name": "string",
          "total_realized_pnl": "string (Decimal)",
          "transaction_count": "integer",
          "total_commission": "string (Decimal, ≥ 0)",
          "legs": [
            {
              "transaction_id": "string (UUID)",
              "activity_date": "string (ISO 8601 date, YYYY-MM-DD)",
              "activity_type": "string",
              "description": "string",
              "leg_type": "CSP | CC | BUY | SELL",
              "amount": "string (Decimal)",
              "realized_pnl": "string (Decimal)",
              "commission": "string (Decimal, ≥ 0)"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Example Response

**Scenario**: Two AAPL legs in a CSP group — open leg ($150 gross, $0.65 commission) and expiration ($0).

```json
{
  "total_realized_pnl": "149.35",
  "total_transaction_count": 2,
  "total_commission": "0.65",
  "tickers": [
    {
      "symbol": "AAPL",
      "total_realized_pnl": "149.35",
      "transaction_count": 2,
      "total_commission": "0.65",
      "groups": [
        {
          "strategy_group_id": "a1b2c3d4-...",
          "name": "AAPL CSP Feb",
          "total_realized_pnl": "149.35",
          "transaction_count": 2,
          "total_commission": "0.65",
          "legs": [
            {
              "transaction_id": "uuid-1",
              "activity_date": "2026-02-18",
              "activity_type": "Sold Short",
              "description": "PUT  AAPL   02/27/26   180.000",
              "leg_type": "CSP",
              "amount": "150.00",
              "realized_pnl": "149.35",
              "commission": "0.65"
            },
            {
              "transaction_id": "uuid-2",
              "activity_date": "2026-02-27",
              "activity_type": "Expired",
              "description": "PUT  AAPL   02/27/26   180.000 EXP",
              "leg_type": "CSP",
              "amount": "0.00",
              "realized_pnl": "0.00",
              "commission": "0.00"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Empty State Response

When no tagged transactions exist:

```json
{
  "total_realized_pnl": "0",
  "total_transaction_count": 0,
  "total_commission": "0",
  "tickers": []
}
```

---

## Changed Fields vs. Prior Version

| Location | Field | Change |
|----------|-------|--------|
| `LegPnL` | `realized_pnl` | **FIXED**: now `amount + commission_raw` instead of `amount` |
| `LegPnL` | `commission` | **NEW**: absolute commission for this leg |
| `StrategyGroupPnL` | `transaction_count` | **NEW**: count of legs in group |
| `StrategyGroupPnL` | `total_commission` | **NEW**: sum of absolute leg commissions |
| `TickerPnL` | `transaction_count` | **NEW**: sum of group transaction counts |
| `TickerPnL` | `total_commission` | **NEW**: sum of group commissions |
| `PnLSummaryResponse` | `total_transaction_count` | **NEW**: grand total count |
| `PnLSummaryResponse` | `total_commission` | **NEW**: grand total commission |

---

## Backward Compatibility

**Not fully backward compatible.** `realized_pnl` values change (now commission-adjusted). Clients consuming this endpoint must update if they assumed `realized_pnl == amount`.

The new fields (`commission`, `transaction_count`, `total_commission`, `total_transaction_count`) are additive — clients that ignore unknown fields are unaffected by these additions.
