# Data Model: PnL Leg Tagging & Strategy Groups

**Feature**: 007-pnl-leg-tagging
**Date**: 2026-02-26

---

## Entities

### LegType (Enum)

Replaces `StrategyType`. Tags a single transaction with its trading activity type.

| Value | Meaning |
|-------|---------|
| `CSP` | Cash-Secured Put — any activity in the CSP lifecycle (open, BTC, expire, assign) |
| `CC` | Covered Call — any activity in the CC lifecycle (open, BTC, expire, assign) |
| `BUY` | Equity purchase |
| `SELL` | Equity sale |

```python
class LegType(StrEnum):
    CSP = "CSP"
    CC = "CC"
    BUY = "BUY"
    SELL = "SELL"
```

---

### StrategyGroup (New Table: `strategy_group`)

A user-defined named grouping of transaction legs belonging to the same ticker symbol.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `String(36)` | PK, default UUID | |
| `user_sub` | `String(255)` | NOT NULL, indexed | Scopes all data to authenticated user |
| `name` | `String(255)` | NOT NULL | User-defined, e.g. "AAPL Wheel Q1 2025" |
| `symbol` | `String(50)` | NOT NULL | Ticker symbol, e.g. "AAPL" |
| `created_at` | `DateTime` | NOT NULL, default utcnow | |
| `updated_at` | `DateTime` | NOT NULL, default+onupdate utcnow | |

**Relationships**:
- Has many `Transaction` (via `transaction.strategy_group_id` FK)
- Deleting a group sets `transaction.strategy_group_id = NULL` on all linked legs (via `ondelete="SET NULL"`)

```python
class StrategyGroup(Base):
    __tablename__ = "strategy_group"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    user_sub: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    symbol: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    legs: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="strategy_group", passive_deletes=True
    )
```

---

### Transaction (Updated: `transaction`)

Changes from existing model:

| Change | Old | New |
|--------|-----|-----|
| Removed column | `strategy_type: String(50), nullable` | — |
| Added column | — | `leg_type: String(10), nullable` |
| Added column | — | `strategy_group_id: String(36), FK→strategy_group.id, nullable, ondelete=SET NULL` |
| Added relationship | — | `strategy_group: Mapped[StrategyGroup \| None]` |

```python
# New columns on Transaction:
leg_type: Mapped[str | None] = mapped_column(String(10), nullable=True)
strategy_group_id: Mapped[str | None] = mapped_column(
    String(36), ForeignKey("strategy_group.id", ondelete="SET NULL"), nullable=True, index=True
)
strategy_group: Mapped["StrategyGroup | None"] = relationship(
    "StrategyGroup", back_populates="legs"
)
```

**Unchanged**: All other fields (`id`, `user_sub`, `import_batch_id`, `activity_date`, `activity_type`, `description`, `symbol`, `quantity`, `price`, `amount`, `commission`, `dedupe_key`, `raw`, `created_at`, `updated_at`).

---

## PnL Response Schemas

### LegPnL

Represents a single transaction leg's contribution to PnL.

| Field | Type | Notes |
|-------|------|-------|
| `transaction_id` | `str` | UUID |
| `activity_date` | `date` | |
| `activity_type` | `str` | Raw from E*TRADE |
| `description` | `str` | Raw from E*TRADE |
| `leg_type` | `LegType` | CSP / CC / BUY / SELL |
| `amount` | `Decimal` | Net cash in/out |
| `realized_pnl` | `Decimal` | = `amount` |

### StrategyGroupPnL

| Field | Type | Notes |
|-------|------|-------|
| `strategy_group_id` | `str \| None` | None = "Ungrouped" bucket |
| `name` | `str` | Group name, or "Ungrouped" |
| `total_realized_pnl` | `Decimal` | Sum of leg `realized_pnl` |
| `legs` | `list[LegPnL]` | Ordered by `activity_date` asc |

### TickerPnL

| Field | Type | Notes |
|-------|------|-------|
| `symbol` | `str` | Ticker symbol |
| `total_realized_pnl` | `Decimal` | Sum of group `total_realized_pnl` |
| `groups` | `list[StrategyGroupPnL]` | Named groups first, "Ungrouped" last |

### PnLSummaryResponse

| Field | Type | Notes |
|-------|------|-------|
| `total_realized_pnl` | `Decimal` | Grand total |
| `tickers` | `list[TickerPnL]` | Ordered by symbol asc |

---

## State Transitions

### Transaction Tagging

```
Untagged (leg_type=NULL)
    → [user selects leg type] → Tagged (leg_type=CSP|CC|BUY|SELL)
    → [user clears leg type] → Untagged

Tagged, Ungrouped (strategy_group_id=NULL)
    → [user assigns to group] → Tagged, Grouped
    → [group deleted] → Tagged, Ungrouped (automatic via SET NULL)

Tagged, Grouped (strategy_group_id=<id>)
    → [user unassigns] → Tagged, Ungrouped
    → [user reassigns to other group] → Tagged, Grouped (other group)
```

### Validation Rules

- A leg can only be assigned to a group whose `symbol` matches the leg's `transaction.symbol`.
- A leg with `symbol=NULL` cannot be assigned to any group.
- A user can only assign their own legs to their own groups (`user_sub` must match).
