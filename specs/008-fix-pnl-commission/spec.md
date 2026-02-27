# Feature Specification: PnL Commission Fix & Additional Metrics

**Feature Branch**: `008-fix-pnl-commission`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "in the last specification I incorrectly said, PnL per leg = amount field directly. But there is a commission attribute that has to be taken out when calculating. Lets Fix this. Also in addition Lets add few more additional metrics to the pnl page. 1) number of transactions that makes up this pnl, total commission I have paid to make this pnl."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Correct PnL Reflects Commission Deduction (Priority: P1)

A user views their PnL page and wants to see their true realized profit — not just the gross transaction amount, but the actual net gain after brokerage commissions are deducted. Currently the PnL shows the gross `amount` field, which overstates profit by not accounting for commissions. This story fixes that.

**Why this priority**: This is a data correctness bug. All other PnL metrics (group totals, ticker totals, grand total) flow from the per-leg calculation, so fixing this is foundational to everything else. Users making financial decisions based on this data need it to be accurate.

**Independent Test**: Can be fully tested by setting up a tagged leg with a known amount and commission, then viewing the PnL page and verifying the per-leg realized PnL equals amount minus commission (not the raw amount).

**Acceptance Scenarios**:

1. **Given** a tagged transaction with `amount = $150.00` and `commission = -$0.65`, **When** the user views the PnL page, **Then** the leg's realized PnL shows `$149.35` (not `$150.00`).
2. **Given** a tagged transaction with `amount = $0.00` (expiration) and `commission = $0.00`, **When** viewing PnL, **Then** the leg's realized PnL shows `$0.00`.
3. **Given** a tagged transaction with a `null` commission (no commission recorded), **When** viewing PnL, **Then** the leg's realized PnL equals the amount as-is (commission treated as $0).
4. **Given** strategy group with two legs (`amount=$100, commission=-$0.65` and `amount=$80, commission=-$0.65`), **When** viewing PnL, **Then** the group total shows `$178.70` (sum of net leg PnLs).
5. **Given** multiple tickers each with commission-bearing legs, **When** viewing PnL, **Then** all ticker totals and the grand total correctly reflect commission-adjusted sums.

---

### User Story 2 — View Transaction Count and Commission Summary on PnL Page (Priority: P2)

A user wants to understand the composition of their PnL at a glance: how many transactions contributed to a given total, and how much total commission they paid to generate it. This gives context — a group with 10 legs and $5 commission is different from a group with 1 leg and $5 commission.

**Why this priority**: These are additive display metrics that build on the corrected PnL values from P1. They require no new data model but significantly improve the usefulness of the PnL page for performance analysis and cost awareness.

**Independent Test**: Can be tested independently by seeding tagged transactions, navigating to the PnL page, and verifying that transaction counts and commission totals are shown and match the underlying data at each grouping level.

**Acceptance Scenarios**:

1. **Given** a strategy group with 3 tagged legs, **When** viewing the PnL page, **Then** the group row shows "3 transactions".
2. **Given** a ticker with two strategy groups (2 legs and 3 legs respectively), **When** viewing the ticker row, **Then** it shows "5 transactions" (sum across all groups for that ticker).
3. **Given** the overall PnL summary, **When** viewing the top-level totals, **Then** a grand total transaction count is shown that matches the total number of tagged legs included in PnL.
4. **Given** strategy group legs with commissions `-$0.65`, `-$0.65`, `-$0.00`, **When** viewing the group, **Then** the group shows total commission of `$1.30` (displayed as a cost, shown as a positive or absolute value).
5. **Given** a ticker with commission-bearing groups, **When** viewing the ticker row, **Then** it shows the sum of all commission values across its groups.
6. **Given** a leg with `null` commission, **When** counting or summing commission at any level, **Then** the null is treated as `$0.00`.
7. **Given** a tagged leg that belongs to the "Ungrouped" bucket, **When** viewing PnL, **Then** the ungrouped bucket also shows its own transaction count and total commission.

---

### Edge Cases

- What if a leg has commission = null? — It is treated as $0.00 for all commission metrics.
- What if all commissions are zero for a group? — The commission display shows $0.00 (not hidden).
- What if a group has 1 transaction? — Transaction count shows "1" (singular display is acceptable).
- What if the PnL page has no tagged transactions? — Transaction count shows 0, total commission shows $0.00, and the PnL page shows an empty state.
- What if commission is stored as a negative number (typical brokerage format)? — The system normalizes it to a positive display value for "total commission paid" metrics so users see a cost, not a negative amount.

---

## Requirements *(mandatory)*

### Functional Requirements

**PnL Calculation Fix:**

- **FR-001**: Realized PnL per leg MUST equal the transaction's `amount` plus its `commission` value (i.e., `realized_pnl = amount + commission`), where `commission` is treated as zero if null.
- **FR-002**: The system MUST recompute group, ticker, and grand total PnL values using the corrected per-leg formula (cascading correction at all aggregation levels).
- **FR-003**: The prior behavior of `realized_pnl = amount` MUST be removed.

**Transaction Count Metric:**

- **FR-004**: Each strategy group (including "Ungrouped") MUST expose a transaction count equal to the number of tagged legs within it.
- **FR-005**: Each ticker MUST expose a transaction count equal to the sum of transaction counts across all its groups.
- **FR-006**: The PnL summary MUST expose a grand total transaction count equal to the sum of all ticker transaction counts.

**Total Commission Metric:**

- **FR-007**: Each leg MUST expose its individual commission amount (null-safe, defaulting to $0.00) as a **positive (absolute) value** in the API response — the backend normalizes the stored negative value before returning it.
- **FR-008**: Each strategy group (including "Ungrouped") MUST expose the total commission paid, computed as the sum of absolute commission values across all legs in the group.
- **FR-009**: Each ticker MUST expose the total commission paid, computed as the sum of group-level commissions.
- **FR-010**: The PnL summary MUST expose the grand total commission paid across all tickers.
- **FR-011**: Commission values MUST be displayed as positive (cost) values in the UI, regardless of how they are stored internally.
- **FR-012**: Transaction count and total commission MUST be displayed as **new columns** in the existing PnL table alongside the realized PnL column, at every applicable row level: strategy group rows, ticker rows, and the grand-total footer row. No expand/collapse interaction is required.
- **FR-013**: Individual leg rows MUST display the leg's own commission value in the "Commission" column. The "# Trades" column MUST NOT appear on leg rows (a leg is always exactly one transaction; the count is implicit).

### Key Entities

- **LegPnL** (updated): Represents one tagged transaction's contribution to PnL. Gains a `commission` attribute showing that leg's individual commission cost, **returned as a positive (absolute) value** in the API response (e.g., stored `-0.65` → returned `0.65`). The frontend displays this value as-is with no sign inversion required. The leg row shows the "Commission" column but does NOT show a "# Trades" column.
- **StrategyGroupPnL** (updated): Gains `transaction_count` (number of legs) and `total_commission` (sum of leg commissions) attributes.
- **TickerPnL** (updated): Gains `transaction_count` (total legs under this ticker) and `total_commission` (sum across groups) attributes.
- **PnLSummaryResponse** (updated): Gains `total_transaction_count` and `total_commission` at the grand-total level.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every PnL value displayed on the PnL page accurately reflects the net cash received minus commissions paid — verified for at least 5 representative test transactions with non-zero commissions.
- **SC-002**: A user can see, without leaving the PnL page, exactly how many transactions contributed to any strategy group, ticker, or grand total PnL figure.
- **SC-003**: A user can see the total brokerage cost (commission) incurred for any strategy group, ticker, or the entire tracked period without performing any manual calculation.
- **SC-004**: All previously passing PnL tests continue to pass after the commission fix, with updated expected values reflecting the corrected calculation.
- **SC-005**: The PnL page loads without errors for users who have transactions with null commission values.

---

## Assumptions

- Commission in the E*TRADE CSV is stored as a negative value (e.g., `-0.65` means $0.65 was paid). The formula `amount + commission` therefore correctly reduces the gross amount. If commission is null, it defaults to zero.
- The `commission` field already exists on the Transaction model and is populated during CSV import — no schema migration is required.
- "Total commission paid" is displayed as a positive value in the UI (cost framing), regardless of the sign of the stored value.
- **Commission API convention**: All commission fields in API responses (`LegPnL.commission`, `StrategyGroupPnL.total_commission`, `TickerPnL.total_commission`, `PnLSummaryResponse.total_commission`) are returned as **positive (absolute) values**. The backend is solely responsible for normalization; the frontend displays commission values as-is without sign inversion.
- Transaction counts and commission totals are computed server-side and returned in the existing PnL API response (extended with new fields), not computed in the browser.
- Display of the new fields (transaction count and commission) is achieved by adding two new columns to the existing PnL table — one for "# Trades" and one for "Commission" — visible at group, ticker, and grand-total rows. No new page or navigation entry is needed.

---

## Clarifications

### Session 2026-02-27

- Q: Should the `LegPnL` API response return the `commission` field as the raw stored value (negative) or as a positive/absolute value? → A: Positive/absolute value — the backend normalizes all commission fields before returning; the frontend displays as-is with no sign inversion.
- Q: Where should transaction count and total commission be displayed on the existing PnL page? → A: New columns in the existing PnL table ("# Trades" and "Commission") shown at group, ticker, and grand-total row levels.
- Q: Should the new columns also appear on individual leg rows? → A: Commission column yes (showing leg's own commission); "# Trades" column no (a leg is always one transaction, count is implicit).
