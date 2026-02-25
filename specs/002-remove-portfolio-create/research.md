# Phase 0 Research — Remove Portfolio Create Page

**Date**: 2026-02-24

## Decision: Remove portfolio creation UX and API support

**Decision**: Remove all portfolio creation entry points from the Angular UI and make portfolio creation unsupported in the FastAPI public API.

**Rationale**:
- The product change request explicitly removes portfolio creation from UI and backend API.
- Minimizes scope by preserving portfolio reads and transaction association to existing portfolios.

**Alternatives considered**:
- Keep `POST /api/portfolios` but hide UI: rejected because it still allows creation via API and violates “remove related backend API”.
- Replace portfolios with strategy tags entirely: rejected as a larger behavior change not requested.

## Decision: Achieve API removal via route removal (resulting in 405)

**Decision**: Remove the `POST` handler from the `/api/portfolios` router.

**Rationale**:
- With `GET /api/portfolios` still registered, FastAPI will respond with `405 Method Not Allowed` for `POST` by default.

**Alternatives considered**:
- Return `410 Gone` from `POST`: rejected as extra code path and still an exposed endpoint contract.

## Decision: No database/migration changes

**Decision**: Leave the `portfolio` table and `Transaction.portfolio_id` intact.

**Rationale**:
- This feature removes creation workflow only; it should not delete existing data or references.

## Decision: Validate the frontend using Docker (no host node/npm required)

**Decision**: Use the existing containerized frontend setup (`web/Dockerfile` + `docker compose`) to run the production build and manual UI verification steps.

**Rationale**:
- The current environment may not have `node`/`npm`, but the repo already standardizes Node usage via Docker.
- A `docker build` of the `builder` stage is equivalent to running `npm run build` and will fail if compilation fails.
- Manual UI validation can be performed against the Compose `web` service on port `4200`.

**Alternatives considered**:
- Installing Node on the host: rejected as an environment dependency not required by the repo’s container-first workflow.
- Skipping the frontend build: rejected because it leaves the final validation item incomplete.
