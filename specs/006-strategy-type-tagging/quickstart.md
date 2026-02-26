# Quickstart: Strategy Type Tagging

Date: 2026-02-26

## Goal

Upload transactions, tag them with a strategy type, and filter by tagged/untagged and strategy type.

## Backend

From repo root:

- Install/sync dependencies:
  - `cd api && uv sync`
- Apply migrations:
  - `cd api && uv run alembic upgrade head`
- Run dev server:
  - `cd api && uv run fastapi dev app/main.py`

## Frontend

From repo root:

- Install dependencies:
  - `cd web && npm install`
- Run dev server:
  - `cd web && ng serve`

## Manual Verification

1. Upload an E*TRADE CSV on the Transactions page.
2. Confirm imported transactions show as untagged initially.
3. Set a strategy type for a transaction (e.g., Wheel Strategy).
4. Reload the page and confirm the tag persists.
5. Filter to show only untagged transactions and confirm tagged rows disappear.
6. Filter by a specific strategy type and confirm only matching rows appear.
