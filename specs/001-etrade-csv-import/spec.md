# Feature Specification: E*TRADE CSV Transaction Import

**Feature Branch**: `feature/etrade-csv-import`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Attached is a sample trade transaction csv file that i get from etrade, when i upload this i want the system to parse each transaction and add them to the store, while storing the transaction if possible i want the system to tag the portfolio automaticly if possible, if not have a filter or some mechanisium to tag the transaction post upload. or when the user comes o thte system next time."

## Sample Input

- Sample file for this feature: `samples/DownloadTxnHistory-2.csv`

## Summary

- Users upload an E*TRADE transaction CSV.
- The system imports rows as-is (including transfers/cash movements).
- All imported transactions start as unassigned to any portfolio.
- Users tag transactions to a portfolio later via an “Unassigned” view.

## Clarifications

### Session 2026-02-23

- Q: When portfolio auto-tagging is not possible, how should the user tag transactions? → A: Import as unassigned and tag later via an “Unassigned” filter/view (no immediate post-upload step).
- Q: Which activity types should be imported? → A: Import all activity types as transactions (including transfers/cash movements).
- Q: Should portfolio tagging be derived from brokerage account id? → A: No; portfolios represent strategies. For this iteration, treat all uploads as a single pseudo account with a generated/summary account identifier.
- Q: Should any transactions be auto-tagged to a portfolio during import? → A: No; always import as unassigned (even if there is only one portfolio).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import transactions from E*TRADE CSV (Priority: P1)

As an authenticated user, I can upload an E*TRADE transaction CSV export and the system imports each activity row (including transfers/cash movements) into my transaction store.

**Why this priority**: This is the core workflow that turns brokerage exports into usable portfolio/trade history.

**Independent Test**: Upload a known-good CSV and verify the expected number of transactions are created with correct key fields (dates, symbol, quantity, amount) and an import summary is produced.

**Acceptance Scenarios**:

1. **Given** I am signed in and have a valid E*TRADE transactions CSV, **When** I upload the file, **Then** the system imports each row that represents a transaction and shows an import summary (imported count, skipped count, error count).
2. **Given** the CSV contains some invalid/unsupported rows, **When** I upload the file, **Then** valid rows are imported and invalid rows are skipped with a human-readable reason per skipped row.
3. **Given** I upload a file that is not a valid E*TRADE transaction CSV, **When** the system validates the upload, **Then** the import is rejected with a clear message explaining what is wrong (e.g., missing required columns).
4. **Given** I have already imported a set of transactions, **When** I re-upload a CSV containing the same transactions, **Then** duplicates are skipped and counted in the import summary.

---

### User Story 2 - Imports do not auto-tag portfolios (Priority: P2)

As a user, I want imports to succeed even if the system cannot determine my strategy portfolio, so imported transactions start as unassigned and I can tag them later.

**Why this priority**: This keeps imports simple and reliable for the initial iteration where portfolios represent strategies and cannot be inferred from brokerage data.

**Independent Test**: Upload a valid CSV and verify that imported transactions are created and each one is marked unassigned.

**Acceptance Scenarios**:

1. **Given** I upload a file, **When** the import completes, **Then** all imported transactions are marked as “unassigned” and are clearly marked as needing portfolio tagging.

---

### User Story 3 - Tag unassigned transactions later (Priority: P3)

As a user, I can find imported transactions that are unassigned to a portfolio and tag them later via an “Unassigned” filter/view, including on a later visit.

**Why this priority**: Some files may not contain enough information to infer portfolio; users still need a path to complete tagging.

**Independent Test**: Import transactions without a portfolio match, then use a post-upload mechanism to assign those transactions to a portfolio and verify they appear correctly under that portfolio.

**Acceptance Scenarios**:

1. **Given** I have unassigned imported transactions, **When** I filter/view the “unassigned” set and choose a portfolio to tag them, **Then** those transactions become associated with the selected portfolio.
2. **Given** I leave unassigned transactions after an import, **When** I return to the system later, **Then** I can easily identify that there are unassigned transactions and complete tagging.

---

### Edge Cases

- CSV contains extra header/footer lines (e.g., totals, disclaimers) before/after the tabular data.
- CSV uses placeholders like `--` or blank values for fields like symbol, cusip, quantity, price, or category.
- Numeric fields contain commas, currency symbols, or negative values.
- Dates are present but inconsistent across columns (activity date vs transaction date vs settlement date).
- Duplicate transactions are present within the same file or across multiple uploads of overlapping date ranges.
- Rows represent non-trade activity (e.g., transfers) and may not have symbol/quantity.
- File is empty, truncated, or encoded in a way that prevents parsing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an authenticated user to upload a transaction history CSV export.
- **FR-002**: System MUST detect whether an uploaded file matches the expected E*TRADE transaction CSV structure by validating required columns.
- **FR-003**: System MUST ignore non-transaction lines outside the tabular CSV data (e.g., report headers, totals, and disclaimer text).
- **FR-004**: System MUST parse each transaction row into a normalized transaction record with, at minimum: activity/trade date, activity type, description, amount, and any available security identifiers (e.g., symbol).
- **FR-005**: System MUST preserve the original row content (or equivalent raw fields) for traceability and troubleshooting.
- **FR-006**: System MUST support importing rows even when optional fields are missing (e.g., blank quantity/price for transfers), as long as the row can still be represented as a transaction.
- **FR-006a**: System MUST import non-trade activity types (e.g., Transfer, Online Transfer) as transactions rather than skipping them.
- **FR-007**: System MUST prevent accidental duplicate creation across uploads by treating a row as a duplicate when the user, activity/trade date, activity type, description, symbol (or blank), quantity (or blank), and amount match an existing imported transaction.
- **FR-008**: System MUST provide an import result summary including counts (imported, skipped, failed) and reasons for failures/skips.
- **FR-009**: System MUST associate each import batch with a brokerage account identifier; for this iteration, the system MAY generate a stable “pseudo account” identifier used for all uploads.
- **FR-010**: System MUST mark all imported transactions as “unassigned” for this iteration and make them discoverable via an “unassigned” filter/view.
- **FR-010a**: System MUST NOT require portfolio tagging as part of the upload flow; tagging unassigned transactions happens later via the “unassigned” view.
- **FR-010b**: System MUST import all transactions as “unassigned” for this iteration (no automatic portfolio tagging during import).
- **FR-011**: Users MUST be able to tag one or more unassigned transactions to one of their portfolios after upload.
- **FR-012**: System MUST ensure users can only import, view, and tag their own transactions and portfolios.

### Key Entities *(include if feature involves data)*

- **Imported Transaction**: A single activity entry from the CSV (dates, activity type, description, symbol/security identifiers when present, quantity/price when present, amount, commission when present).
- **Portfolio**: A user-owned collection/account to which transactions are tagged for tracking and analytics.
- **Import Batch**: A single upload event (who uploaded it, when, the source file name, import summary, and any parsing errors).
- **Brokerage Account (Pseudo Account)**: A user-owned identifier representing the source account for an import; for this iteration it can be a single generated/summary account used for all uploads.
- **Portfolio Tagging Status**: A marker indicating whether a transaction is assigned to a portfolio or still unassigned.

## Assumptions

- The uploaded CSV is an E*TRADE “Account Activity” export containing a column header row and one row per activity.
- The export may include an account identifier in a header line rather than a dedicated CSV column, but portfolio tagging is not derived from this value.
- A user may have multiple portfolios; this iteration does not attempt automatic portfolio tagging and imports all transactions as unassigned.
- The system stores transfers and other non-trade activity as transactions (even if they lack symbol/quantity), rather than dropping them.

## Out of Scope

- Real-time brokerage syncing or connecting directly to E*TRADE.
- Automated correction of historical records beyond duplicate prevention (e.g., reconciling edits to previously imported rows).
- Portfolio performance analytics beyond ensuring transactions are stored and tagged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully import a typical 7-day E*TRADE export file in under 1 minute end-to-end.
- **SC-002**: At least 95% of valid transaction rows in a correctly formatted file are imported without manual intervention.
- **SC-003**: Users can find and tag all unassigned transactions in under 5 minutes for a typical import.
