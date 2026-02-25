# Quickstart — Remove Portfolio Create Page

**Date**: 2026-02-24

## Manual verification

### UI

Option A (preferred; no host `node`/`npm` required):

1. Start services: `docker compose up --build -d web`
2. Open `http://localhost:4200/portfolios`.
3. Confirm there is no "New Portfolio" button or other create workflow.
4. If you have zero portfolios, confirm the empty state does not offer a "Create" action.

Option B (host Node):

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

## Frontend build verification (equivalent to `cd web && npm run build`)

Option A (preferred; build in Docker):

- `docker build -f web/Dockerfile --target builder -t trade-tracker-web:builder web`

Option B (writes `web/dist` to host via bind mount):

- `docker compose run --rm --no-deps web npm ci`
- `docker compose run --rm --no-deps web npm run build -- --configuration production`

## Verification results

- 2026-02-25: `cd api && uv run pytest` → PASS (10 tests)
- 2026-02-25: `docker build -f web/Dockerfile --target builder -t trade-tracker-web:builder web` → PASS
