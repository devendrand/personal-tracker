# PRD Addendum — Module C: Net Worth Tracker

**Addendum Version:** 1.0 | **Date:** February 2026 | **Status:** Draft
**Parent Document:** `PersonalTracker_PRD_v2.0.md`
**Adds to Section:** 4 (Functional Requirements), 6 (Data Model), 7 (API Design), 8 (User Stories), 9 (Milestones), 10 (Open Questions)

> This addendum defines only the incremental requirements for Module C. All platform-level decisions (tech stack, auth, NFRs, deployment) are inherited from the parent PRD and are not repeated here. FR numbering, user story IDs, and milestone numbering continue from the parent document and Module B addendum.

---

## 1. Module Summary

The Net Worth Tracker allows the user to manually record weekly snapshots of all financial account balances and track total net worth over time. There is no live bank connection — entry is intentional and manual, roughly once a week. The module provides a weekly change summary, a trend chart over time, and an account-level breakdown per snapshot.

**Key capabilities added by this module:**
- Account setup with asset vs. liability classification
- Weekly snapshot entry with smart pre-population from the previous week
- Weekly reminder badge if no snapshot has been logged in 8+ days
- Net worth trend chart (total, assets, liabilities) with time range selection
- Snapshot breakdown by account and category
- Category-level trend drill-down (e.g., just retirement accounts over time)

---

## 2. Additions to Section 4 — Functional Requirements

### 4.10 Account Setup

#### FR-27: Account Management
Users shall be able to create and manage a list of financial accounts. Each account shall have:

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | e.g., "Chase Checking", "Fidelity 401k" |
| Institution | No | e.g., "Chase", "Fidelity" |
| Account Type | Yes | See supported types below |
| Category | Auto | Derived from account type (Asset or Liability) |
| Currency | Yes | Defaults to USD |
| Notes | No | Free text |

**Supported account types and their auto-assigned category:**

| Account Type | Category |
|-------------|----------|
| Checking | Asset |
| Savings | Asset |
| Brokerage / Investment | Asset |
| Retirement (401k / IRA / Roth) | Asset |
| Real Estate | Asset |
| Crypto | Asset |
| Other Asset | Asset |
| Credit Card | Liability |
| Auto Loan | Liability |
| Student Loan | Liability |
| Mortgage | Liability |
| Other Liability | Liability |

#### FR-28: Account Archiving
Users shall be able to archive accounts that are no longer active (e.g., a closed credit card). Archived accounts shall be hidden from the weekly entry form but their historical balance data shall be fully preserved and visible in past snapshots and reports.

---

### 4.11 Weekly Snapshot Entry

#### FR-29: Weekly Balance Entry
Users shall record a weekly snapshot by entering the current balance for each active account. The entry form shall:

- Default the snapshot date to today
- Show all active accounts grouped by type (Assets first, then Liabilities)
- Pre-populate each account's balance from the most recent previous snapshot as a convenience starting point
- Allow the user to update only the accounts that have changed
- Show a running total of assets, liabilities, and net worth as balances are entered (live calculation)
- Require at least one balance to be entered before submission

#### FR-30: Snapshot History
All submitted snapshots shall be stored with their date and individual account balances. Users shall be able to view, edit, or delete any past snapshot from a history list. Editing a past snapshot shall not cascade changes to other snapshots.

#### FR-31: Weekly Reminder Badge
The dashboard shall display a non-intrusive badge or prompt if no snapshot has been submitted in the past 8 days, reminding the user to log their weekly update. The badge shall disappear once a new snapshot is submitted.

---

### 4.12 Net Worth Reporting

#### FR-32: Weekly Change Summary Card
The dashboard shall display a summary card showing:
- Current total net worth (from the most recent snapshot)
- Change since the previous snapshot: amount ($) and percentage (%)
- Highest net worth ever recorded, with the date it was achieved
- Date of the most recent snapshot

#### FR-33: Net Worth Trend Chart
The system shall display a line chart of total net worth across all weekly snapshots. The chart shall support:

- **Time range selector:** 1 month, 3 months, 6 months, 1 year, all time
- **Toggleable series:** Total net worth (always shown), total assets, total liabilities — assets and liabilities toggled on/off independently
- **Hover tooltip:** Shows snapshot date, total net worth, assets, and liabilities for any data point
- The y-axis shall use dollar formatting (e.g., $125,000)

#### FR-34: Snapshot Breakdown View
For any selected snapshot date, the system shall display a breakdown showing:
- Each active account's balance at that snapshot
- Accounts grouped by type
- Each account's percentage of total assets or total liabilities
- Change in each account's balance versus the previous snapshot ($ delta)
- Total assets, total liabilities, and net worth at the bottom

#### FR-35: Category Trend Drill-Down
Users shall be able to select any account type category (e.g., Retirement, Brokerage, Mortgage) and view a line chart showing the combined total of all accounts in that category across all weekly snapshots over time. This allows tracking, for example, how retirement savings are growing independently of other assets.

---

## 3. Additions to Section 6 — Data Model

New tables to be added to the shared PostgreSQL schema:

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| `nw_account` | id, name, institution, account_type, category, currency, is_archived, notes, created_at | User-defined financial accounts |
| `nw_snapshot` | id, snapshot_date, notes, created_at | One record per weekly entry session |
| `nw_snapshot_balance` | id, snapshot_id, account_id, balance | One row per account per snapshot; balance stored as NUMERIC(15,2) |

**Derived values** (net worth, total assets, total liabilities) shall be calculated at query time from `nw_snapshot_balance` joined to `nw_account` — they are not stored as columns to avoid sync issues when accounts are archived or edited.

---

## 4. Additions to Section 7 — API Design

New routes to be added under the `/api/networth/` prefix:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/networth/accounts` | List all accounts (filter: `?include_archived=true`) |
| POST | `/api/networth/accounts` | Create a new account |
| PUT | `/api/networth/accounts/{id}` | Update account details or archive it |
| DELETE | `/api/networth/accounts/{id}` | Delete account (only if no snapshot balances reference it) |
| GET | `/api/networth/snapshots` | List all snapshots in reverse chronological order |
| GET | `/api/networth/snapshots/latest` | Get the most recent snapshot with all balances (used to pre-populate entry form) |
| POST | `/api/networth/snapshots` | Submit a new weekly snapshot with balances |
| PUT | `/api/networth/snapshots/{id}` | Edit a past snapshot's balances |
| DELETE | `/api/networth/snapshots/{id}` | Delete a snapshot |
| GET | `/api/networth/reports/summary` | Current net worth, weekly change, all-time high (dashboard card data) |
| GET | `/api/networth/reports/trend` | Net worth trend data (supports `?range=1m|3m|6m|1y|all`) |
| GET | `/api/networth/reports/breakdown/{snapshot_id}` | Full account breakdown for a specific snapshot |
| GET | `/api/networth/reports/category/{account_type}` | Trend for a specific account type category over time |

---

## 5. Additions to Section 8 — User Stories

| ID | As a user, I want to... | Acceptance Criteria |
|----|------------------------|---------------------|
| US-13 | Set up my accounts once so I can quickly update balances each week. | Account list created; active accounts appear in weekly entry form grouped by type. |
| US-14 | Enter my weekly balances quickly without re-typing unchanged values. | Entry form pre-populates last snapshot's balances; running net worth total updates live as I type. |
| US-15 | See a chart of my total net worth over the past year. | Trend chart shows all weekly snapshots with selectable time ranges and toggleable asset/liability series. |
| US-16 | See how my net worth breaks down by account for any given week. | Breakdown view shows each account's balance, % of total, and change vs. previous snapshot. |
| US-17 | Be reminded if I forget to log my weekly update. | Dashboard badge appears if no snapshot has been submitted in the past 8 days; disappears after entry. |

---

## 6. Additions to Section 9 — Milestones

| Milestone | Target | Deliverables |
|-----------|--------|-------------|
| M6 – Net Worth Tracker | Sprint 10–11 | Account setup (types, archiving), weekly snapshot entry form with pre-population and live net worth calculation, snapshot history with edit/delete, weekly reminder badge, dashboard summary card, net worth trend chart with range selector and toggleable series, snapshot breakdown view, category trend drill-down |

---

## 7. Additions to Section 10 — Open Questions

- **Currency handling:** If accounts are held in multiple currencies, should the system convert to a base currency (e.g., USD) for net worth totals, or display them separately? (Recommended: single base currency in v1 with a currency field reserved for future use.)
- **Investment account valuation:** For brokerage and retirement accounts, should the user enter current market value or cost basis? Market value is recommended for an accurate net worth picture, but it requires the user to look up current values each week.
- **Net worth goal:** Should users be able to set a target net worth and visualize progress toward it on the trend chart?
- **Historical import:** Should the system support a one-time CSV import of historical weekly balances to backfill the trend chart before the app was in use?
- **Real estate valuation:** Real estate values change slowly — should the system treat real estate accounts differently (e.g., prompt for a quarterly update rather than weekly)?

---

*Module C Addendum v1.0 | February 2026 | Confidential*
