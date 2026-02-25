# M3 — Remove Portfolio Create Page

**Date**: 2026-02-24  
**Feature**: `specs/002-remove-portfolio-create/`

## Goal

Remove the portfolio creation workflow from the application (UI + public API) while keeping portfolio reads and existing transaction associations intact.

## Approach

- Frontend (Angular)
  - Remove portfolio creation CTAs and any create page routing.
  - Remove unused API client method for portfolio creation.

- Backend (FastAPI)
  - Remove `POST /api/portfolios` handler to make creation unsupported.
  - Preserve `GET /api/portfolios` and `GET /api/portfolios/{id}`.
  - Update tests to avoid calling the removed create endpoint.

## Verification Criteria

- UI shows no portfolio creation CTAs.
- `POST /api/portfolios` returns `405 Method Not Allowed`.
- `GET /api/portfolios` continues to work.
- Backend tests pass.

### Frontend validation (when host `node`/`npm` is unavailable)

- Production build (equivalent to `cd web && npm run build`): `docker build -f web/Dockerfile --target builder -t trade-tracker-web:builder web`
- Manual UI check: `docker compose up --build -d web` then open `http://localhost:4200/portfolios`
