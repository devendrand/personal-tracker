# Product Requirements Document
## Trade Tracker & Portfolio Analytics Platform

**Version:** 1.0 | **Date:** February 2026 | **Status:** Draft

---

## 1. Overview

### 1.1 Purpose

This document defines the product requirements for a personal trade tracking and portfolio analytics platform. The system enables a user to upload E*TRADE transaction exports, categorize trades into custom portfolios and strategies, and gain actionable insights through real-time data enrichment and reporting.

### 1.2 Problem Statement

Active traders who employ multiple strategies (e.g., wheel strategy, covered calls, long holds, systematic investment plans) across a single brokerage account have no easy way to:

- Attribute each transaction to the correct strategy or portfolio category
- Track multi-leg option strategies that span multiple transactions over time (e.g., sell put → assignment → sell covered call → delivery)
- Generate strategy-specific performance reports with enriched real-time market data

### 1.3 Goals

- Ingest and parse E*TRADE transaction exports (CSV/XLSX)
- Allow tagging of trades to portfolios and named strategies
- Support grouping of related transactions into strategy chains (e.g., Wheel Strategy)
- Provide real-time price enrichment for tracked tickers
- Generate portfolio-level and strategy-level performance reports

### 1.4 Out of Scope (v1.0)

- Direct brokerage API integration (order placement, live account sync)
- Tax-lot optimization or tax reporting
- Multi-user or team collaboration features
- Mobile native apps

---

## 2. Stakeholders & Users

| Role | Name / Group | Responsibility |
|------|-------------|----------------|
| Product Owner | End User (Trader) | Defines requirements, primary system user |
| Developer | Engineering Team | Design, build, and deploy the platform |
| Data Provider | Free Market API (e.g., Yahoo Finance, Polygon.io free tier) | Real-time and delayed price feeds |

---

## 3. Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Angular (latest) | SPA; Angular Material for UI components |
| Backend API | Python FastAPI | RESTful + WebSocket endpoints |
| Database | PostgreSQL | Primary data store; TimescaleDB extension optional for time-series price data |
| Real-Time Pricing | WebSocket / REST (free tier) | Yahoo Finance unofficial API, Polygon.io free tier, or Finnhub free tier |
| Auth | JWT + OAuth2 (FastAPI) | Single-user initially; expandable to multi-user |
| Hosting | TBD (Docker Compose for local dev) | Containerized deployment |

---

## 4. Functional Requirements

### 4.1 Transaction Ingestion

#### FR-01: File Upload

The system shall accept E*TRADE transaction export files in CSV format. The upload interface shall be accessible from the main dashboard. The backend shall parse and normalize the file into a standardized internal transaction schema.

#### FR-02: Transaction Normalization

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

#### FR-03: Duplicate Detection

The system shall detect and reject duplicate transaction records on re-upload, using a composite key of (date, ticker, action, quantity, price).

---

### 4.2 Trade Tagging & Portfolio Management

#### FR-04: Portfolio Creation

Users shall be able to create named portfolios/categories. Each portfolio shall have a name, description, color label, and type. Supported portfolio types shall include: Wheel Strategy, Covered Call, Long Hold, SIP (Systematic Investment Plan), Speculative, and Custom.

#### FR-05: Trade Tagging

Users shall be able to tag any individual transaction to one or more portfolios. Tagging shall be available from the transaction list view and the trade detail view. The system shall support bulk tagging of multiple transactions.

#### FR-06: Strategy Chain Grouping

Users shall be able to group a series of related transactions into a named strategy chain. For example, a Wheel Strategy chain might include:

1. Sell Put
2. Put Assignment
3. Sell Covered Call
4. Covered Call Delivery

The system shall display chained transactions together in the strategy view, showing net P&L across the entire chain.

#### FR-07: Auto-Tag Suggestions

If a user has previously tagged a ticker to a specific portfolio/strategy, the system shall suggest the same tag when new transactions for that ticker are imported. The user must confirm or override the suggestion.

---

### 4.3 Real-Time Price Enrichment

#### FR-08: Live Price Feed

For each unique ticker present in the user's portfolio, the system shall fetch and display the current market price. Price data shall be sourced from a free-tier API (e.g., Yahoo Finance, Polygon.io, or Finnhub). Price updates shall occur via WebSocket where available, otherwise polling every 60 seconds during market hours.

#### FR-09: Price Display

Current price shall be displayed alongside each position in the portfolio view. The display shall include:

- Current price
- Daily change ($)
- Daily change (%)
- Timestamp of the last price update

#### FR-10: Market Hours Awareness

The system shall distinguish between regular market hours (9:30 AM – 4:00 PM ET, weekdays) and after-hours. Price polling shall be suspended outside market hours and upon application being backgrounded to respect free-tier API rate limits.

---

### 4.4 Reporting

#### FR-11: Portfolio Summary Report

The system shall generate a summary report per portfolio showing:

- Total invested capital
- Current market value
- Unrealized P&L
- Realized P&L (from closed positions)
- Total premium collected (for options strategies)
- Win rate (% of profitable closed trades)
- Number of open vs. closed positions

#### FR-12: Strategy Chain Report

For strategy-chained trades (e.g., Wheel), the report shall show:

- Each leg of the chain
- Premium received or paid per leg
- Net credit or debit for the chain
- Days in trade (DIT)
- Annualized return on capital
- Final status (open, closed, assigned, delivered)

#### FR-13: Ticker-Level Report

For any ticker, users shall be able to view all historical transactions, total shares currently held, average cost basis, current market value, unrealized gain/loss, and total dividends received.

#### FR-14: Transaction Log

A complete, filterable, and sortable transaction log shall be available. Filters shall include date range, ticker, transaction type, portfolio/tag, and open/closed status.

#### FR-15: SIP Tracker

For portfolios tagged as SIP, the system shall provide a dedicated view showing contribution history, average purchase price over time, total units accumulated, and current value vs. total invested.

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | Dashboard shall load within 2 seconds for portfolios with up to 5,000 transactions. |
| NFR-02 | Reliability | API uptime target of 99.5% for local/self-hosted deployment. |
| NFR-03 | Security | All API endpoints shall require JWT authentication. Passwords shall be hashed with bcrypt. |
| NFR-04 | Scalability | Database schema shall support up to 100,000 transactions without schema changes. |
| NFR-05 | Usability | Core workflows (upload, tag, view report) shall be completable in under 3 clicks from the dashboard. |
| NFR-06 | Data Integrity | Transaction data shall never be modified after import; amendments shall be tracked as separate records. |
| NFR-07 | Rate Limits | The system shall respect free-tier API rate limits and implement exponential backoff on 429 responses. |

---

## 6. Data Model (Conceptual)

### 6.1 Core Entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| Transaction | id, date, ticker, action, quantity, price, fees, raw_data | Immutable after import |
| Portfolio | id, name, type, description, color | User-defined groupings |
| TransactionTag | transaction_id, portfolio_id, created_at | Many-to-many join |
| StrategyChain | id, name, portfolio_id, status, created_at | Groups related transactions |
| ChainLeg | chain_id, transaction_id, leg_order, notes | Ordered legs of a strategy |
| TickerPrice | ticker, price, change, change_pct, updated_at | Cache of latest prices |
| PriceHistory | ticker, timestamp, open, high, low, close, volume | Optional historical OHLCV |

---

## 7. API Design (Key Endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/transactions/upload | Upload E*TRADE CSV; returns parsed preview |
| POST | /api/transactions/confirm | Confirm and persist parsed transactions |
| GET | /api/transactions | List transactions (filterable/paginated) |
| GET | /api/portfolios | List all portfolios |
| POST | /api/portfolios | Create a new portfolio |
| POST | /api/tags/bulk | Tag one or more transactions to a portfolio |
| GET | /api/reports/portfolio/{id} | Get portfolio summary report |
| GET | /api/reports/ticker/{symbol} | Get ticker-level report |
| POST | /api/chains | Create a strategy chain |
| POST | /api/chains/{id}/legs | Add transaction legs to a chain |
| GET | /api/prices/{symbol} | Get latest cached price for ticker |
| WS | /ws/prices | WebSocket stream for real-time price updates |

---

## 8. User Stories

| ID | As a trader, I want to... | Acceptance Criteria |
|----|--------------------------|---------------------|
| US-01 | Upload my E*TRADE transaction CSV so the system logs my trades automatically. | File accepted; transactions parsed and previewed; confirmed transactions saved. |
| US-02 | Tag my GOOGL trades as 'Wheel Strategy' so I can track that strategy separately. | Tag applied; trades visible under Wheel Strategy portfolio. |
| US-03 | Group my GOOGL sell-put, assignment, and covered call into one strategy chain. | Chain created with 3 legs; net P&L displayed across all legs. |
| US-04 | See the current price of GOOGL whenever I view my GOOGL positions. | Current price shown with daily change; refreshed every 60s during market hours. |
| US-05 | View a report for my Wheel Strategy portfolio showing total premium collected. | Report shows realized/unrealized P&L, premium collected, win rate. |
| US-06 | Track my SPY monthly SIP contributions and see my average cost basis. | SIP portfolio shows contribution history, avg cost, total units, current value. |
| US-07 | Filter my transaction log by ticker, date, and strategy. | Transaction log supports multi-filter with real-time results. |

---

## 9. Suggested Delivery Milestones

| Milestone | Target | Deliverables |
|-----------|--------|-------------|
| M1 – Foundation | Sprint 1–2 | DB schema, FastAPI skeleton, JWT auth, E*TRADE CSV parser, basic transaction list UI |
| M2 – Tagging | Sprint 3–4 | Portfolio CRUD, transaction tagging (single + bulk), tag suggestions, Angular portfolio views |
| M3 – Strategy Chains | Sprint 5–6 | Strategy chain creation, chain leg management, chain P&L calculation, chain report view |
| M4 – Live Prices | Sprint 7 | Free API integration, WebSocket price feed, price display in portfolio views |
| M5 – Reports | Sprint 8–9 | Portfolio summary, ticker report, SIP tracker, transaction log with filters, export to CSV |
| M6 – Polish | Sprint 10 | Error handling, loading states, mobile-responsive layout, performance tuning, documentation |

---

## 10. Open Questions & Decisions Required

- **Price API selection:** Which free-tier price API to use? (Yahoo Finance unofficial, Polygon.io free, Finnhub free, or Alpha Vantage free) — rate limits and reliability vary.
- **Options P&L granularity:** Should options be tracked at the contract level or position level for P&L reporting?
- **Partial fills:** How should partial fills (multiple fill prices for one order) be handled in the CSV parser?
- **Manual entry:** Should the system support manual transaction entry in addition to CSV upload?
- **Deployment target:** Is local self-hosting the target deployment, or cloud hosting (e.g., Railway, Render, AWS)?
- **Historical data:** Should historical price data be stored for backtesting or chart visualization in a future phase?

---

*Trade Tracker PRD v1.0 | February 2026 | Confidential*
