# Product Requirements Document
## Personal Tracker Platform

**Version:** 2.0 | **Date:** February 2026 | **Status:** Active
**Supersedes:** `TradeTracker_PRD_v1.0.md`, `ModuleA_StrategyTagging_Addendum_v1.0.md`, `ModuleB_SwimTracker_Addendum_v1.0.md`, `ModuleC_NetWorthTracker_Addendum_v1.0.md`

---

## 1. Overview

### 1.1 Purpose

This document is the single source of truth for the Personal Tracker platform. It consolidates the original Trade Tracker PRD, all module addendums (A, B, C), and all implemented feature specifications. All future requirements work should reference and update this document directly.

### 1.2 Problem Statement

This platform solves three distinct personal finance and fitness tracking problems for a single user:

**Trade Tracker**: Active traders who employ multiple strategies (e.g., Wheel, covered calls, long holds, SIPs) across a single brokerage account have no easy way to attribute each transaction to the correct strategy, track multi-leg option chains spanning multiple transactions, or generate strategy-specific performance reports with enriched market data.

**Swim Performance Tracker**: Parents tracking a competitive swimmer's performance have no centralized tool to log times, detect personal bests across events, and visualize improvement trends.

**Net Worth Tracker**: Individuals tracking their financial health lack a simple, manual tool to snapshot all account balances weekly, visualize total net worth over time, and understand where growth is occurring.

### 1.3 Goals

- Ingest and parse E*TRADE transaction exports (CSV)
- Tag trades to portfolios and named strategy types
- Support grouping of related transactions into strategy chains (e.g., Wheel Strategy)
- Provide real-time price enrichment for tracked tickers
- Generate portfolio-level and strategy-level performance reports
- Log swim times, auto-detect personal bests, and display progression charts
- Record weekly net worth snapshots and visualize financial trends over time

### 1.4 Out of Scope

- Direct brokerage API integration (order placement, live account sync)
- Tax-lot optimization or tax reporting
- Multi-user or team collaboration features
- Mobile native apps
- Real-time bank connections (net worth entry is intentionally manual)

---

## 2. Stakeholders & Users

| Role | Notes |
|------|-------|
| Product Owner / End User | Defines requirements; primary system user (trader and swimmer's parent) |
| Developer | Design, build, and deploy the platform |
| Data Provider | Free-tier market API (Yahoo Finance, Polygon.io, or Finnhub) for price feeds |

---

## 3. Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Angular 19 | SPA; standalone components; Angular Material for UI |
| Backend API | Python FastAPI | RESTful + WebSocket endpoints; async throughout |
| Database | PostgreSQL 17 | Primary data store; shared schema across all modules |
| Real-Time Pricing | WebSocket / REST (free tier) | Yahoo Finance, Polygon.io, or Finnhub |
| Auth | JWT + OAuth2 (FastAPI) | Single-user; dev environment uses a fresh-per-request dev token |
| Hosting | Docker Compose | Local dev; containerized for consistency |

---

## 4. Functional Requirements

### Module 1: Trade Tracker

#### 4.1 Transaction Ingestion

##### FR-01: File Upload
The system shall accept E*TRADE transaction export files in CSV format. The upload interface shall be accessible from the main dashboard. The backend shall parse and normalize the file into a standardized internal transaction schema.

##### FR-02: Transaction Normalization
The parser shall correctly identify and map the following transaction types from E*TRADE exports:

| Transaction Type | E*TRADE Action | System Category |
|-----------------|---------------|----------------|
| Buy Stock | BUY | EQUITY_BUY |
| Sell Stock | SELL | EQUITY_SELL |
| Buy Option | BUY_TO_OPEN / BUY_TO_CLOSE | OPTION_BUY |
| Sell Option | SELL_TO_OPEN / SELL_TO_CLOSE | OPTION_SELL |
| Option Assignment | ASSIGNMENT | ASSIGNMENT |
| Option Expiration | EXPIRATION | EXPIRATION |
| Option Exercise | EXERCISE | EXERCISE |
| Dividend | DIV | DIVIDEND |
| Transfer / Online Transfer | TRNSFR | TRANSFER |

Non-trade activity types (e.g., transfers, cash movements) shall be imported as transactions rather than skipped.

##### FR-03: Duplicate Detection
The system shall detect and reject duplicate transaction records on re-upload using a composite key of: user, activity/trade date, activity type, description, symbol (or blank), quantity (or blank), and amount. Duplicates are counted in the import summary but never re-created.

---

#### 4.2 Trade Tagging & Portfolio Management

##### FR-04: Portfolio Read-Only (Amended — Module A)
Portfolio creation is **not supported** in the application UI or via the public API. `POST /api/portfolios` returns `405 Method Not Allowed`. Users may view and use any existing portfolios for transaction tagging. Portfolios represent user-scoped groupings (e.g., "my IWM trades") and are orthogonal to strategy type.

##### FR-04a: Strategy Type as System Enum (Module A)
Strategy types are a hardcoded backend enum. There is no UI or API to create, rename, edit, or delete strategy types. The six supported values are fixed and may only be changed via a code change and redeployment.

**Supported strategy types:**

| Enum Value | Display Label | Description |
|------------|--------------|-------------|
| `WHEEL` | Wheel Strategy | Sell cash-secured put → accept assignment → sell covered call. Tagged across the full chain of related transactions. |
| `COVERED_CALL` | Covered Call | Selling a call option against an existing long stock position, independent of the Wheel Strategy. |
| `COLLAR` | Collar | Long stock + sell covered call + buy protective put to cap downside risk. |
| `CSP` | Cash Secured Put | Selling a put option while holding sufficient cash to cover assignment, independent of the Wheel Strategy. |
| `LONG_HOLD` | Long Hold | Buying and holding a stock or ETF long-term with no active options overlay. |
| `SIP` | SIP | Systematic Investment Plan — recurring, scheduled purchases of a stock or ETF. |

##### FR-05: One Strategy Tag Per Transaction (Amended — Module A)
Each transaction may be tagged with **at most one** strategy type. The tag is optional — untagged transactions are valid and appear in an "Untagged" filter view. Once tagged, a strategy type may be changed by the user at any time, but a transaction cannot hold two strategy types simultaneously.

##### FR-05a: Strategy Tag UI (Module A)
The strategy type selector shall be a single-select dropdown in the transaction detail view and the bulk-tag panel. The dropdown shall always show the fixed enum list in the order defined above, plus an "Untagged / None" option to remove a tag.

##### FR-05b: Untagged Transaction View (Module A)
The transaction log shall include an "Untagged" filter option that surfaces all transactions with no strategy type assigned. This serves as a prompt for the user to tag recently imported transactions.

##### FR-06: Strategy Chain Grouping
Users shall be able to group a series of related transactions into a named strategy chain. For example, a Wheel Strategy chain may include: (1) Sell Put, (2) Put Assignment, (3) Sell Covered Call, (4) Covered Call Delivery. The system shall display chained transactions together in the strategy view, showing net P&L across the entire chain.

##### FR-07: Auto-Tag Suggestions
If a user has previously tagged a ticker to a specific portfolio or strategy, the system shall suggest the same tag when new transactions for that ticker are imported. The user must confirm or override the suggestion.

---

#### 4.3 Real-Time Price Enrichment

##### FR-08: Live Price Feed
For each unique ticker present in the user's portfolio, the system shall fetch and display the current market price from a free-tier API (Yahoo Finance, Polygon.io, or Finnhub). Price updates shall occur via WebSocket where available, otherwise polling every 60 seconds during market hours.

##### FR-09: Price Display
Current price shall be displayed alongside each position in the portfolio view, including: current price, daily change ($), daily change (%), and timestamp of last price update.

##### FR-10: Market Hours Awareness
The system shall distinguish between regular market hours (9:30 AM – 4:00 PM ET, weekdays) and after-hours. Price polling shall be suspended outside market hours and when the application is backgrounded, to respect free-tier API rate limits.

---

#### 4.4 Reporting

##### FR-11: Portfolio Summary Report
The system shall generate a summary report per portfolio showing: total invested capital, current market value, unrealized P&L, realized P&L (from closed positions), total premium collected (for options strategies), win rate (% of profitable closed trades), and number of open vs. closed positions.

##### FR-12: Strategy Chain Report
For strategy-chained trades, the report shall show each leg, premium received or paid per leg, net credit or debit for the chain, days in trade (DIT), annualized return on capital, and final status (open, closed, assigned, delivered).

##### FR-13: Ticker-Level Report
For any ticker, users shall be able to view all historical transactions, total shares currently held, average cost basis, current market value, unrealized gain/loss, and total dividends received.

##### FR-14: Transaction Log
A complete, filterable, and sortable transaction log shall be available. Filters shall include: date range, ticker, transaction type, strategy type, portfolio/tag, assigned/unassigned status, and open/closed status.

##### FR-15: SIP Tracker
For portfolios tagged as SIP, the system shall provide a dedicated view showing contribution history, average purchase price over time, total units accumulated, and current value vs. total invested.

---

### Module 2: Swim Performance Tracker

#### 4.5 Swimmer Profile

##### FR-16: Single Swimmer Profile
The system shall maintain one swimmer profile containing full name, date of birth (used to auto-calculate age), and optional club/team name. The profile shall be editable at any time.

---

#### 4.6 Event Catalog

##### FR-17: Standard Event Definitions
The system shall ship with a pre-populated catalog of valid competitive events. An event is defined by distance, unit, and stroke. Users select from the catalog — they do not create events manually. Only valid stroke/distance combinations shall be presented in the UI (e.g., 1650y IM is excluded).

**Supported strokes:** Freestyle, Backstroke, Breaststroke, Butterfly, Individual Medley (IM)

| Pool Type | Distances |
|-----------|-----------|
| Short Course Yards (SCY) | 25y, 50y, 100y, 200y, 400y, 500y, 1000y, 1650y |
| Short Course Meters (SCM) | 25m, 50m, 100m, 200m, 400m, 800m, 1500m |
| Long Course Meters (LCM) | 50m, 100m, 200m, 400m, 800m, 1500m |

---

#### 4.7 Time Entry & Meet Logging

##### FR-18: Manual Time Entry
Users shall log a swim time by selecting an event, entering the time in `mm:ss.hh` format, selecting a date (defaults to today), selecting pool type (SCY/SCM/LCM), and optionally entering a meet name and free-text notes. Times are stored internally as decimal seconds for sorting and comparison.

##### FR-19: Edit and Delete
Users shall be able to edit or delete any previously entered time. Any edit shall trigger a re-evaluation of PR status for the affected event.

##### FR-20: Meet Grouping
A meet record is auto-created when a new meet name is typed during time entry. The meet log view shall show all meets in reverse chronological order, with all events swum, times recorded per event, and whether each time was a PR at that meet.

---

#### 4.8 Personal Best (PR) Detection

##### FR-21: Automatic PR Calculation
The system shall determine the PR for each event as the fastest recorded time for that swimmer in that event and pool type. PR status shall be recalculated on every add, edit, or delete.

##### FR-22: PR Flag on Entry
When a new time beats the current PR, the system shall display a visual congratulatory indicator on confirmation (e.g., "New Personal Best!") and immediately update the PR dashboard.

##### FR-23: PR History Preservation
When a PR is broken, the previous PR record shall remain in the database with its `is_pr` flag set to `false`. This preserves the full PR evolution history for use in the progression chart.

---

#### 4.9 Swim Reporting & Visualization

##### FR-24: Event Progression Chart
For any selected event, the system shall render a line chart of all recorded times over time. The x-axis is date; the y-axis is time (displayed as `mm:ss.hh`). PR times shall be visually distinguished (e.g., gold marker). An optional best-fit trend line shall be toggleable. The chart shall be filterable by pool type.

##### FR-25: PR Dashboard
The PR dashboard shall show one row per event with at least one logged time, displaying: event name, pool type, current PR, date achieved, first-ever time, improvement (seconds and %), and total times logged. The table shall be sortable by any column and filterable by pool type.

##### FR-26: Time History Log
A full filterable log of all times shall be available. Filters: event, pool type, date range, meet name, and PR-only toggle. Results shall be sortable and exportable to CSV.

---

### Module 3: Net Worth Tracker

#### 4.10 Account Setup

##### FR-27: Account Management
Users shall be able to create and manage a list of financial accounts. Each account has: name, institution (optional), account type (required), category (auto-derived from type), currency (defaults to USD), and notes (optional).

**Supported account types and auto-assigned category:**

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

##### FR-28: Account Archiving
Users shall be able to archive accounts that are no longer active. Archived accounts are hidden from the weekly entry form but their historical balance data is fully preserved and visible in past snapshots and reports.

---

#### 4.11 Weekly Snapshot Entry

##### FR-29: Weekly Balance Entry
Users shall record a weekly snapshot by entering the current balance for each active account. The entry form shall: default the snapshot date to today; show all active accounts grouped by type (Assets first, then Liabilities); pre-populate each account's balance from the most recent previous snapshot; show a running total of assets, liabilities, and net worth as balances are entered; and require at least one balance to be entered before submission.

##### FR-30: Snapshot History
All submitted snapshots shall be stored with their date and individual account balances. Users shall be able to view, edit, or delete any past snapshot. Editing a past snapshot does not cascade changes to other snapshots.

##### FR-31: Weekly Reminder Badge
The dashboard shall display a non-intrusive badge or prompt if no snapshot has been submitted in the past 8 days. The badge disappears once a new snapshot is submitted.

---

#### 4.12 Net Worth Reporting

##### FR-32: Weekly Change Summary Card
The dashboard shall display a summary card showing: current total net worth (from the most recent snapshot), change since the previous snapshot ($ and %), highest net worth ever recorded with the date achieved, and date of the most recent snapshot.

##### FR-33: Net Worth Trend Chart
The system shall display a line chart of total net worth across all weekly snapshots. Supports: time range selector (1 month, 3 months, 6 months, 1 year, all time); toggleable series (total net worth, total assets, total liabilities); and hover tooltip showing snapshot date, total net worth, assets, and liabilities for any data point.

##### FR-34: Snapshot Breakdown View
For any selected snapshot date, the system shall display: each active account's balance at that snapshot, accounts grouped by type, each account's percentage of total assets or liabilities, change vs. the previous snapshot ($ delta), and totals at the bottom.

##### FR-35: Category Trend Drill-Down
Users shall be able to select any account type category (e.g., Retirement, Brokerage, Mortgage) and view a line chart showing the combined total of all accounts in that category across all weekly snapshots. This enables tracking, for example, how retirement savings grow independently of other assets.

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Dashboard shall load within 2 seconds for portfolios with up to 5,000 transactions. |
| NFR-02 | Reliability | API uptime target of 99.5% for local/self-hosted deployment. |
| NFR-03 | Security | All API endpoints shall require JWT authentication. Passwords shall be hashed with bcrypt. Dev-token endpoint is never active in production builds. |
| NFR-04 | Scalability | Database schema shall support up to 100,000 transactions without schema changes. |
| NFR-05 | Usability | Core workflows (upload, tag, view report) shall be completable in under 3 clicks from the dashboard. |
| NFR-06 | Data Integrity | Transaction data shall never be modified after import; amendments shall be tracked as separate records. |
| NFR-07 | Rate Limits | The system shall respect free-tier API rate limits and implement exponential backoff on 429 responses. |

---

## 6. Data Model

### 6.1 Trade Tracker Entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| `transaction` | id, user_id, date, ticker, action, quantity, price, amount, fees, description, raw_data, portfolio_id, strategy_type, created_at | Immutable after import; `portfolio_id` is nullable (unassigned); `strategy_type` is nullable enum |
| `portfolio` | id, user_id, name, created_at | Read-only in UI/API; used as grouping concept |
| `strategy_chain` | id, name, portfolio_id, status, created_at | Groups related multi-leg transactions |
| `chain_leg` | chain_id, transaction_id, leg_order, notes | Ordered legs of a strategy chain |
| `ticker_price` | ticker, price, change, change_pct, updated_at | Cache of latest prices from market API |
| `price_history` | ticker, timestamp, open, high, low, close, volume | Optional historical OHLCV for charts |

**Strategy type enum (PostgreSQL):**
```sql
CREATE TYPE strategy_type_enum AS ENUM (
  'WHEEL', 'COVERED_CALL', 'COLLAR', 'CSP', 'LONG_HOLD', 'SIP'
);
```

### 6.2 Swim Tracker Entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| `swimmer` | id, name, date_of_birth, team_name, created_at | Single row in v1 |
| `swim_event` | id, distance, unit, stroke, pool_type | Pre-seeded catalog; not user-editable |
| `swim_meet` | id, name, date, location, notes | Auto-created on first time entry referencing it |
| `swim_time` | id, swimmer_id, event_id, meet_id, time_seconds, recorded_date, pool_type, notes, is_pr, created_at | Core record; `is_pr` recalculated on write |

### 6.3 Net Worth Tracker Entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| `nw_account` | id, name, institution, account_type, category, currency, is_archived, notes, created_at | User-defined financial accounts |
| `nw_snapshot` | id, snapshot_date, notes, created_at | One record per weekly entry session |
| `nw_snapshot_balance` | id, snapshot_id, account_id, balance (NUMERIC 15,2) | One row per account per snapshot |

Net worth, total assets, and total liabilities are calculated at query time from `nw_snapshot_balance` joined to `nw_account` — never stored as columns to avoid sync issues.

---

## 7. API Design

### 7.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/token` | Production login — returns JWT |
| GET | `/api/auth/dev-token` | Dev only — returns a fresh JWT on every call (never cached) |

### 7.2 Trade Tracker

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions/upload` | Upload E*TRADE CSV; returns import summary |
| GET | `/api/transactions` | List transactions (filters: `?strategy_type=`, `?assigned=true/false`, date, ticker, type) |
| POST | `/api/transactions/{id}/tag` | Tag a transaction to a portfolio |
| PATCH | `/api/transactions/{id}/strategy` | Set or clear strategy type on a transaction |
| POST | `/api/tags/bulk` | Bulk-tag transactions (optional `strategy_type` + `portfolio_id`) |
| GET | `/api/portfolios` | List portfolios (read-only) |
| POST | `/api/portfolios` | **Returns 405 Method Not Allowed** — creation not supported |
| GET | `/api/strategy-types` | Returns hardcoded strategy type list (enum value + label + description) |
| GET | `/api/reports/portfolio/{id}` | Portfolio summary report (breakdown by strategy type) |
| GET | `/api/reports/ticker/{symbol}` | Ticker-level report |
| POST | `/api/chains` | Create a strategy chain |
| POST | `/api/chains/{id}/legs` | Add transaction legs to a chain |
| GET | `/api/prices/{symbol}` | Latest cached price for ticker |
| WS | `/ws/prices` | WebSocket stream for real-time price updates |

### 7.3 Swim Tracker

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/swim/profile` | Get swimmer profile |
| PUT | `/api/swim/profile` | Update swimmer profile |
| GET | `/api/swim/events` | List all valid events from the catalog |
| GET | `/api/swim/times` | List times (filters: event, date, meet, pool type, is_pr) |
| POST | `/api/swim/times` | Log a new time; triggers PR recalculation |
| PUT | `/api/swim/times/{id}` | Edit a time; triggers PR recalculation |
| DELETE | `/api/swim/times/{id}` | Delete a time; triggers PR recalculation |
| GET | `/api/swim/meets` | List all meets |
| POST | `/api/swim/meets` | Create a meet explicitly |
| GET | `/api/swim/reports/prs` | Current PR per event (PR dashboard data) |
| GET | `/api/swim/reports/event/{event_id}` | Full time history + chart data for one event |

### 7.4 Net Worth Tracker

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/networth/accounts` | List all accounts (filter: `?include_archived=true`) |
| POST | `/api/networth/accounts` | Create a new account |
| PUT | `/api/networth/accounts/{id}` | Update account details or archive it |
| DELETE | `/api/networth/accounts/{id}` | Delete account (only if no snapshot balances reference it) |
| GET | `/api/networth/snapshots` | List all snapshots in reverse chronological order |
| GET | `/api/networth/snapshots/latest` | Most recent snapshot with all balances (pre-populate entry form) |
| POST | `/api/networth/snapshots` | Submit a new weekly snapshot with balances |
| PUT | `/api/networth/snapshots/{id}` | Edit a past snapshot's balances |
| DELETE | `/api/networth/snapshots/{id}` | Delete a snapshot |
| GET | `/api/networth/reports/summary` | Current net worth, weekly change, all-time high |
| GET | `/api/networth/reports/trend` | Net worth trend data (supports `?range=1m|3m|6m|1y|all`) |
| GET | `/api/networth/reports/breakdown/{snapshot_id}` | Account breakdown for a specific snapshot |
| GET | `/api/networth/reports/category/{account_type}` | Trend for a specific account type over time |

---

## 8. User Stories

### Trade Tracker

| ID | As a trader, I want to... | Acceptance Criteria |
|----|--------------------------|---------------------|
| US-01 | Upload my E*TRADE transaction CSV so the system logs my trades automatically. | File accepted; transactions parsed and previewed; import summary shows imported/skipped/failed counts; all transactions start unassigned. |
| US-02 | Tag my GOOGL trades as 'Wheel Strategy' so I can track that strategy separately. | Strategy type tag applied from fixed enum dropdown; trades visible under Wheel filter. |
| US-03 | Group my GOOGL sell-put, assignment, and covered call into one strategy chain. | Chain created with 3 legs; net P&L displayed across all legs. |
| US-04 | See the current price of GOOGL whenever I view my GOOGL positions. | Current price shown with daily change; refreshed every 60s during market hours. |
| US-05 | View a report for my Wheel Strategy portfolio showing total premium collected. | Report shows realized/unrealized P&L, premium collected, win rate, broken down by strategy type. |
| US-06 | Track my SPY monthly SIP contributions and see my average cost basis. | SIP portfolio shows contribution history, average cost, total units, and current value. |
| US-07 | Filter my transaction log by ticker, date, strategy, and assigned status. | Transaction log supports multi-filter with real-time results including "Untagged" filter. |

### Swim Tracker

| ID | As a swim parent, I want to... | Acceptance Criteria |
|----|-------------------------------|---------------------|
| US-08 | Log my daughter's 100y freestyle time after a meet. | Time saved with event, date, meet name, pool type, and optional notes. |
| US-09 | See immediately if a new time is a personal best. | New PR flagged visually on entry; PR dashboard updated instantly. |
| US-10 | View a chart of all her 100y freestyle times over time. | Line chart shows all times for the selected event with date x-axis, PR markers, and optional trend line. |
| US-11 | See all her current personal bests across every event in one view. | PR dashboard shows current PR, date achieved, and improvement % per event. |
| US-12 | Look back at what she swam at a specific meet last season. | Meet log shows all events and times recorded under that meet name with PR flags. |

### Net Worth Tracker

| ID | As a user, I want to... | Acceptance Criteria |
|----|------------------------|---------------------|
| US-13 | Set up my accounts once so I can quickly update balances each week. | Account list created; active accounts appear in weekly entry form grouped by type. |
| US-14 | Enter my weekly balances quickly without re-typing unchanged values. | Entry form pre-populates last snapshot's balances; running net worth total updates live as I type. |
| US-15 | See a chart of my total net worth over the past year. | Trend chart shows all weekly snapshots with selectable time ranges and toggleable asset/liability series. |
| US-16 | See how my net worth breaks down by account for any given week. | Breakdown view shows each account's balance, % of total, and change vs. previous snapshot. |
| US-17 | Be reminded if I forget to log my weekly update. | Dashboard badge appears if no snapshot has been submitted in the past 8 days; disappears after entry. |

---

## 9. Implemented Features

The following features have been fully implemented and are live in the codebase. Each entry captures the key decisions and constraints that arose during implementation.

### Feature 001: E*TRADE CSV Transaction Import

**Status:** Implemented | **Branch:** `feature/etrade-csv-import`

**What was built:** CSV upload endpoint, row parsing and normalization, duplicate detection, import summary, unassigned filter view, and transaction-to-portfolio tagging.

**Key decisions:**
- All activity types (including transfers and cash movements) are imported as transactions — nothing is skipped based on type.
- All imported transactions start as unassigned regardless of existing portfolios; no automatic tagging during import.
- Duplicate detection key: user + activity date + activity type + description + symbol + quantity + amount.
- The parser handles E*TRADE's non-tabular header/footer lines (report headers, totals rows, disclaimer text) — these are safely ignored.
- Placeholder values like `--` or blank in optional fields (symbol, quantity, price) are accepted; the row is still imported.
- A stable pseudo-account identifier is used for all uploads in this iteration (no multi-account separation yet).

**Constraints / out of scope:** Real-time brokerage sync; automated reconciliation of historical records beyond duplicate prevention; portfolio analytics beyond storage and tagging.

---

### Feature 002: Remove Portfolio Create

**Status:** Implemented | **Branch:** `feature/remove-portfolio-create`

**What was built:** Removed `POST /api/portfolios` handler (now returns `405 Method Not Allowed`). Removed all "Create Portfolio" UI, buttons, pages, and calls-to-action. Portfolio listing and transaction-to-portfolio tagging remain fully functional.

**Key decisions:**
- Portfolio creation is intentionally disabled at both API and UI layers per Module A decision: strategy types are system-managed enums; portfolios are pre-existing groupings.
- `GET /api/portfolios` remains and continues to return existing portfolios.
- The Portfolios screen remained in the navigation at this stage (removed in Feature 003).
- Empty-state views do not offer portfolio creation.

**Constraints / out of scope:** Strategy Type tagging implementation; portfolio provisioning mechanisms; changes to portfolio-based reporting.

---

### Feature 003: Remove Portfolio Navigation & Page

**Status:** Implemented | **Branch:** `feature/remove-portfolio-nav`

**What was built:** Removed "Portfolios" entry from the main navigation. Removed the `/portfolios` Angular route and page. Added a redirect from `/portfolios` → `/dashboard` (URL updates in browser).

**Key decisions:**
- Portfolios as a concept are not removed — portfolio tagging on transactions continues to work.
- `/portfolios` URL redirect goes to `/dashboard` and updates the browser URL.
- Dashboard may still reference portfolio labels/cards; renaming those references is explicitly out of scope.
- Browser back/forward navigation into the former `/portfolios` URL behaves consistently (no broken page rendered).

**Constraints / out of scope:** Removing portfolio-related backend endpoints; renaming portfolio terminology across the app; introducing a replacement portfolio management screen.

---

### Feature 004: Fix Dev Authentication Reliability

**Status:** Implemented | **Branch:** `004-fix-dev-auth`

**What was built:** Two independent fixes for dev-environment 401 errors:

**Backend fix:** `GET /api/auth/dev-token` now generates a **fresh JWT on every call** using `create_access_token()`. The previous static `DEV_TOKEN` module-level constant (created once at backend startup) was removed from `security.py`. This eliminates the root cause of 401 errors after the 30-minute token expiry window.

**Frontend fix:** `DevTokenBootstrapService.ensureDevToken()` now validates the stored token's expiry before returning early. An expired token in `localStorage` is cleared and a fresh token is fetched. The `isTokenValid()` helper decodes the JWT's middle segment using `atob()` and checks `Date.now() < payload.exp * 1000`.

**Key decisions:**
- Dev token endpoint never caches — always calls `create_access_token()` on each HTTP request.
- Client-side expiry check uses `atob()` (no external library); returns `false` on any parse error (malformed token treated as invalid).
- The fix is dev-environment-only; production auth flow (`POST /api/auth/token`) is completely unaffected.
- `provideAppInitializer` already blocked routing until the bootstrap Promise resolved; that behavior was preserved.
- Default token expiry: 30 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES` setting).

**Constraints / out of scope:** Infinite retry loop prevention (a second 401 after retry is a terminal failure); production environment (no changes).

---

## 10. Delivery Milestones

| Milestone | Deliverables | Status |
|-----------|-------------|--------|
| M1 – Foundation | DB schema, FastAPI skeleton, JWT auth, E*TRADE CSV parser, basic transaction list UI | Done (Feature 001) |
| M2 – Tagging | Transaction tagging (single + bulk), Portfolios read-only, remove portfolio create/nav | Done (Features 001–003) |
| M2a – Dev Auth | Fix dev token freshness + bootstrap expiry check | Done (Feature 004) |
| M3 – Strategy Chains | Strategy chain creation, leg management, chain P&L calculation, chain report view | Pending |
| M4 – Strategy Types UI | Strategy type dropdown in transaction view, bulk-tag with strategy, untagged filter view | Pending |
| M5 – Live Prices | Free API integration, WebSocket price feed, price display in portfolio views | Pending |
| M6 – Reports | Portfolio summary, ticker report, SIP tracker, transaction log with full filters, export to CSV | Pending |
| M7 – Swim Tracker | Swimmer profile, event catalog seeding, time entry, PR auto-detection, meet log, progression chart, PR dashboard, time history log | Pending |
| M8 – Net Worth Tracker | Account setup, weekly snapshot entry form, snapshot history, reminder badge, dashboard summary card, trend chart, snapshot breakdown, category drill-down | Pending |
| M9 – Polish | Error handling, loading states, mobile-responsive layout, performance tuning | Pending |

---

## 11. Open Questions

**Trade Tracker**
- **Price API selection:** Which free-tier price API to use? Yahoo Finance unofficial, Polygon.io free, Finnhub free, or Alpha Vantage free — rate limits and reliability vary.
- **Options P&L granularity:** Should options be tracked at the contract level or position level for P&L reporting?
- **Partial fills:** How should partial fills (multiple fill prices for one order) be handled in the CSV parser?
- **Manual entry:** Should the system support manual transaction entry in addition to CSV upload?
- **Strategy chain and strategy type alignment:** Should the strategy type on each leg transaction be auto-set to `WHEEL` when a Wheel chain is created, or should leg-level tagging remain manual?
- **Strategy-type-level reporting:** Should there be a dedicated strategy-type report (e.g., "all my Wheel trades and combined P&L") in addition to portfolio-level reports?
- **Historical data:** Should historical price data be stored for backtesting or chart visualization in a future phase?

**Swim Tracker**
- **Course conversion:** Should the system convert times between SCY, SCM, and LCM for cross-comparison, or keep PRs strictly within each pool type? (Current default: strictly separate — no conversion.)
- **Age group standards:** Should times be benchmarked against USA Swimming published age group time standards (A, AA, AAA, etc.) in a future version?
- **Multiple swimmers:** Is there a future need for a second swimmer profile (e.g., a sibling)?
- **Meet import:** Should a future version support importing times from USA Swimming meet results or Hy-Tek export files?

**Net Worth Tracker**
- **Currency handling:** For accounts in multiple currencies, convert to a base currency for net worth totals or display separately? (Recommended: single base currency in v1.)
- **Investment account valuation:** Should the user enter current market value or cost basis for brokerage/retirement accounts? (Market value recommended for accurate net worth.)
- **Net worth goal:** Should users be able to set a target net worth and visualize progress toward it?
- **Historical import:** Should the system support a one-time CSV import of historical weekly balances to backfill the trend chart?
- **Real estate valuation:** Should real estate accounts prompt for a quarterly update rather than weekly given slow price changes?

**Deployment**
- **Deployment target:** Is local self-hosting the permanent target, or cloud hosting (e.g., Railway, Render, AWS)?

---

*Personal Tracker PRD v2.0 | February 2026*
