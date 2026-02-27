# API Contract: PnL

**Base path**: `/api/pnl`
**Auth**: Bearer JWT required

---

## Endpoints

### GET /api/pnl

Get the full realized PnL summary for the current user.

Returns all-time realized PnL, aggregated as Ticker → StrategyGroup → Legs.

**Scope**:
- Only transactions with `leg_type IS NOT NULL` are included
- Only transactions with `symbol IS NOT NULL` are included (symbol-less legs excluded)
- All data scoped to the authenticated user

**Response** `200 OK`: `PnLSummaryResponse`

```json
{
  "total_realized_pnl": "350.00",
  "tickers": [
    {
      "symbol": "AAPL",
      "total_realized_pnl": "350.00",
      "groups": [
        {
          "strategy_group_id": "uuid",
          "name": "AAPL Wheel Q1 2025",
          "total_realized_pnl": "350.00",
          "legs": [
            {
              "transaction_id": "uuid",
              "activity_date": "2025-01-15",
              "activity_type": "Sold Short",
              "description": "AAPL 01/17/2025 180.00 P",
              "leg_type": "CSP",
              "amount": "150.00",
              "realized_pnl": "150.00"
            },
            {
              "transaction_id": "uuid",
              "activity_date": "2025-01-17",
              "activity_type": "Option Expired",
              "description": "AAPL 01/17/2025 180.00 P",
              "leg_type": "CSP",
              "amount": "0.00",
              "realized_pnl": "0.00"
            },
            {
              "transaction_id": "uuid",
              "activity_date": "2025-01-22",
              "activity_type": "Sold Short",
              "description": "AAPL 02/21/2025 185.00 C",
              "leg_type": "CC",
              "amount": "200.00",
              "realized_pnl": "200.00"
            }
          ]
        },
        {
          "strategy_group_id": null,
          "name": "Ungrouped",
          "total_realized_pnl": "0.00",
          "legs": []
        }
      ]
    }
  ]
}
```

**Notes**:
- `amount` and `realized_pnl` are decimal strings (not floats) for precision
- `total_realized_pnl` is positive for gains, negative for losses
- Tickers ordered alphabetically by symbol
- Within a ticker, named groups appear first, "Ungrouped" last
- Within a group, legs ordered by `activity_date` ascending
- If no tagged transactions exist: `{ "total_realized_pnl": "0.00", "tickers": [] }`

**Error**: `401` — Missing/invalid JWT
