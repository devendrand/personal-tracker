# Quickstart — Remove Portfolio Create Page

**Date**: 2026-02-24

## Manual verification

### UI

1. Start the frontend: `cd web && ng serve`
2. Navigate to `/portfolios`.
3. Confirm there is no "New Portfolio" button.
4. If you have zero portfolios, confirm the empty state does not offer a "Create" action.

### API

1. Start the backend: `cd api && uv run fastapi dev app/main.py`
2. With an authenticated request:
   - `GET /api/portfolios` returns `200`.
   - `POST /api/portfolios` returns `405`.

## Automated verification

- Backend tests: `cd api && uv run pytest`
