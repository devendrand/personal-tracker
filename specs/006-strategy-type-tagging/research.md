# Research: Strategy Type Tagging

Date: 2026-02-26

## Decision 1: Store `strategy_type` as string + CHECK constraint

- Decision: Add `transaction.strategy_type` as a nullable string column and enforce allowed values via a named CHECK constraint.
- Rationale:
  - The codebase already models enumerations as strings (e.g., swim/networth enums are stored as string values).
  - Easier forward/backward evolution than a native PostgreSQL ENUM (adding/removing values is simpler).
  - Keeps Alembic migrations straightforward and reversible at the schema level.
- Alternatives considered:
  - Native PostgreSQL ENUM: stronger DB typing but harder to evolve and downgrade.

## Decision 2: Migration strategy for removing `portfolio_id`

- Decision: In a single migration, add `strategy_type`, then drop the foreign key constraint and drop the `portfolio_id` column from `transaction`.
- Rationale:
  - Current repo is single-user/dev-focused and does not appear to require multi-release, backwards-compatible migrations.
  - Keeping both columns would create ambiguity in source-of-truth for tagging.
- Notes:
  - The FK constraint name may differ across environments since it was originally created without an explicit name; the migration should discover and drop the FK constraint dynamically.
- Alternatives considered:
  - Expand/contract in two releases (keep both columns temporarily) for production zero-downtime rollouts.

## Decision 3: Backend enum definition

- Decision: Define a Python enum for strategy types and use it in request/response schemas for validation.
- Rationale:
  - Ensures invalid values are rejected at the API boundary.
  - Generates accurate OpenAPI documentation.
- Alternatives considered:
  - Accept raw strings and validate manually.

## Decision 4: API contract for tagging + filtering

- Decision: Replace portfolio-based filtering and tagging with strategy-type tagging:
  - Listing: `GET /api/transactions` supports `tagged` (bool) and `strategy_type` (enum) query params.
  - Tagging: `PATCH /api/transactions/{transaction_id}/strategy-type` accepts `{ "strategy_type": <enum|null> }` to set or clear.
  - Options: `GET /api/transactions/strategy-types` returns the supported values (and optionally labels/descriptions) for consistent UI rendering.
- Rationale:
  - Keeps the transaction list endpoint as the single entry point for browsing/filtering.
  - Field-scoped PATCH endpoint is explicit and avoids accidental updates to unrelated fields.
- Alternatives considered:
  - Reuse the existing `POST /api/transactions/{id}/tag` route shape and rename payload fields.

## Decision 5: Frontend strategy type options source

- Decision: Fetch supported strategy types from the backend options endpoint and render in a `mat-select` per row.
- Rationale:
  - Avoids duplicating the enum list in the frontend.
  - Keeps ordering/labels consistent with backend.
- Alternatives considered:
  - Hardcode the list in the Angular app.
