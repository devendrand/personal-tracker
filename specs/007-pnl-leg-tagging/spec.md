# Feature Specification: PnL Leg Tagging & Strategy Groups

**Feature Branch**: `007-pnl-leg-tagging`
**Created**: 2026-02-26
**Status**: Draft
**Input**: M5 PnL Feature — Replace strategy_type with leg_type (CSP/CC/BUY/SELL), add StrategyGroup model, build PnL view. PnL per leg = amount field directly. Hierarchy: Ticker → StrategyGroup → Legs.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Tag a Transaction with a Leg Type (Priority: P1)

After importing E*TRADE CSV transactions, a user wants to classify each activity by what it represents in their trading strategy: a Cash-Secured Put, Covered Call, stock purchase, or stock sale.

**Why this priority**: Leg tagging is the entry point for all PnL data. Without it, no PnL can be computed. It replaces the existing strategy_type tagging and is the foundational workflow.

**Independent Test**: Can be fully tested by uploading a CSV, tagging individual transactions with CSP/CC/BUY/SELL, and verifying the tags are saved and reflected in the transaction list.

**Acceptance Scenarios**:

1. **Given** an imported transaction with no leg type, **When** the user selects "CSP" from the leg type dropdown, **Then** the transaction is saved with leg_type = CSP and the UI reflects the change immediately.
2. **Given** a transaction tagged as "BUY", **When** the user changes it to "SELL", **Then** the tag updates and the old tag no longer appears.
3. **Given** a transaction tagged as "CSP", **When** the user clears the tag, **Then** the transaction returns to untagged (excluded from PnL).
4. **Given** a transaction with no symbol, **When** the user attempts to tag it, **Then** the tag is still saved (symbol is optional for tagging, but excluded from PnL grouping if missing).

---

### User Story 2 — Create a Named Strategy Group and Assign Legs (Priority: P2)

A user wants to group related transaction legs into a named strategy — for example, grouping a CSP open, expiration, and a CC open on AAPL together as "AAPL Wheel Q1 2025" to track the combined PnL of that strategy cycle.

**Why this priority**: Strategy groups enable meaningful PnL attribution beyond individual legs. Without grouping, the PnL view can only show ticker-level totals, not strategy-level insight.

**Independent Test**: Can be tested by creating a group named "AAPL Wheel Q1 2025" for symbol AAPL, assigning two tagged legs to it, and verifying both legs appear under that group in the transaction list.

**Acceptance Scenarios**:

1. **Given** no strategy groups exist, **When** the user creates a group with name "AAPL Wheel Q1 2025" and symbol "AAPL", **Then** the group is created and available for leg assignment.
2. **Given** a strategy group for AAPL exists, **When** the user assigns a tagged AAPL transaction to that group, **Then** the transaction is linked to the group.
3. **Given** a leg assigned to Group A, **When** the user reassigns it to Group B, **Then** the leg belongs to Group B and no longer appears under Group A.
4. **Given** a strategy group is deleted, **When** the user views transactions, **Then** previously grouped legs are now unassigned (ungrouped) but retain their leg type.
5. **Given** a strategy group for AAPL, **When** the user tries to assign a MSFT transaction to it, **Then** the system rejects the assignment with a clear error.

---

### User Story 3 — View Hierarchical PnL (Priority: P3)

A user wants to see a top-down view of their realized profit and loss: total PnL, broken down by ticker, then by strategy group, then by individual legs — to understand where gains and losses are coming from.

**Why this priority**: This is the consumer of the tagging and grouping work. It is the primary output the user cares about, but requires P1 and P2 to have value.

**Independent Test**: Can be tested independently by seeding tagged transactions (with and without groups) and navigating to the PnL page to verify totals, hierarchy, and per-leg details.

**Acceptance Scenarios**:

1. **Given** tagged transactions across AAPL and MSFT, **When** the user opens the PnL page, **Then** they see two ticker rows with correct total realized PnL for each.
2. **Given** a strategy group "AAPL Wheel Q1" with 3 legs (amounts: +$150, $0, +$80), **When** viewing PnL, **Then** the group shows total = $230 and all 3 legs are listed under it.
3. **Given** a tagged leg with no group assignment, **When** viewing PnL, **Then** it appears under an "Ungrouped" bucket within its ticker.
4. **Given** an untagged transaction (leg_type = null), **When** viewing PnL, **Then** it does not appear anywhere in the PnL view.
5. **Given** a CSP leg with amount = $0 (expiration), **When** viewing PnL, **Then** it is shown as a $0 leg (visible, not hidden) within its group.
6. **Given** the user expands a ticker row, **When** viewing strategy groups, **Then** each group shows its name and total PnL; expanding a group shows individual legs with date, description, leg type, and amount.

---

### Edge Cases

- What happens when a transaction has no symbol? — It is excluded from PnL grouping (cannot be attributed to a ticker). It can still be tagged with a leg type.
- What happens when all transactions are untagged? — PnL page shows total = $0 and an empty ticker list (or a prompt to start tagging).
- What happens when a user assigns the same leg to two groups simultaneously? — Not allowed; a leg belongs to at most one group at a time.
- What if a strategy group has no legs? — It is created and listed but contributes $0 to PnL. It can still be deleted.
- What if the user deletes a group that has legs? — Legs are unassigned (become ungrouped) but are not deleted. Their leg types are preserved.

---

## Requirements *(mandatory)*

### Functional Requirements

**Leg Tagging:**

- **FR-001**: The system MUST replace the existing strategy_type field with a new leg_type field on each transaction, supporting four values: CSP, CC, BUY, SELL.
- **FR-002**: Users MUST be able to set or clear a leg type on any transaction via the transactions UI.
- **FR-003**: Existing strategy_type tags MUST be cleared during migration; users re-tag with the new leg types.
- **FR-004**: Transactions with no leg type (untagged) MUST be excluded from PnL calculations.

**Strategy Groups:**

- **FR-005**: Users MUST be able to create a named strategy group associated with a specific ticker symbol.
- **FR-006**: Users MUST be able to assign a tagged transaction leg to a strategy group of matching symbol.
- **FR-007**: A leg MUST belong to at most one strategy group at a time.
- **FR-008**: Users MUST be able to unassign a leg from its group (leg becomes ungrouped).
- **FR-009**: Users MUST be able to delete a strategy group; all legs in that group become ungrouped but retain their leg type.
- **FR-010**: The system MUST reject assignment of a leg to a strategy group with a different symbol.

**PnL Calculation:**

- **FR-011**: Realized PnL per leg MUST equal the transaction's net amount (already includes commissions; no further adjustment needed).
- **FR-012**: Strategy group PnL MUST equal the sum of all leg amounts within the group.
- **FR-013**: Ticker PnL MUST equal the sum of all strategy group PnLs (including the "Ungrouped" bucket) for that ticker.
- **FR-014**: Total PnL MUST equal the sum of all ticker PnLs.
- **FR-015**: Tagged legs with a symbol but no group MUST appear under an "Ungrouped" bucket within their ticker.

**PnL View:**

- **FR-016**: The system MUST provide a dedicated PnL page accessible from the main navigation.
- **FR-017**: The PnL page MUST display a collapsible Ticker → Strategy Group → Legs hierarchy.
- **FR-018**: Each level (total, ticker, group, leg) MUST show its realized PnL value, visually distinguished as positive (gain) or negative (loss).
- **FR-019**: Each leg row MUST display: date, description, leg type, and net amount.

### Key Entities

- **LegType**: An enumeration of four values (CSP, CC, BUY, SELL) representing the trading activity type of a single transaction leg.
- **Transaction (updated)**: A single imported brokerage activity row. Now carries a `leg_type` (nullable) and a reference to a `StrategyGroup` (nullable).
- **StrategyGroup**: A user-defined named grouping of transaction legs belonging to the same ticker symbol. Has a name, a symbol, and an ordered set of legs.
- **PnL Hierarchy**: A computed view derived from tagged transactions — organized as Total → Tickers → Strategy Groups → Legs.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can tag a transaction with a leg type in a single interaction (one dropdown selection), with the change reflected immediately without a page reload.
- **SC-002**: A user can create a strategy group and assign at least one leg to it within 3 interactions (create group, open transaction, assign to group).
- **SC-003**: The PnL page correctly displays total, ticker, group, and leg PnL values matching the sum of transaction amounts for all tagged legs.
- **SC-004**: Untagged transactions never appear in the PnL view (0% leakage of untagged data into PnL).
- **SC-005**: Deleting a strategy group never deletes its associated transaction legs (data integrity preserved).
- **SC-006**: The PnL page loads with full hierarchy visible within standard web response time expectations.

---

## Assumptions

- The `amount` field from E*TRADE CSV is already net of commissions. No separate commission deduction is applied.
- Option expirations (amount = $0) are included as visible $0 legs in the PnL view.
- Option assignments are terminal events for the option leg; no equity lot is created from an assignment.
- A user is identified by their JWT subject claim (`user_sub`); all data is scoped to the authenticated user.
- The PnL view covers all-time realized PnL (no date range filter in this milestone).
- The migration drops the existing `strategy_type` column. Any previously tagged transactions lose their tags and must be re-tagged.
