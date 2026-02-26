# Quickstart: Remove Portfolio Navigation & Page

**Feature**: Remove Portfolio Navigation & Page  
**Branch**: feature/remove-portfolio-nav  
**Date**: 2026-02-25

## Run

### Option A: Docker (recommended)

- Start everything:
  - `docker compose up --build`

- Open the app:
  - http://localhost:4200

### Option B: Frontend only (host Node)

- `cd web && npm install`
- `cd web && ng serve`

## Verify acceptance scenarios

1) **No Portfolios navigation item**
- Open the main navigation menu.
- Confirm there is no “Portfolios” item.

2) **`/portfolios` redirects to `/dashboard` and URL updates**
- In the browser address bar, navigate to `http://localhost:4200/portfolios`.
- Confirm you land on the dashboard screen.
- Confirm the URL becomes `/dashboard`.

3) **Portfolio tagging remains**
- Go to Transactions.
- Confirm you can still select an existing portfolio for a transaction (if portfolios exist).

## CI-equivalent checks (required before push)

- Run:
  - `./scripts/ci_local.sh`
