# Implementation Plan: Strategy Type Tagging

**Branch**: `006-strategy-type-tagging` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from [spec.md](spec.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace legacy portfolio tagging on transactions with a single optional strategy-type tag. This adds a `strategy_type` field to transactions, removes `portfolio_id`, updates the FastAPI API (tagging + filtering + supported options endpoint), updates the Angular Transactions UI to tag via a fixed strategy list, and updates tests accordingly.

Technical approach is captured in [research.md](research.md) with the key decision to store `strategy_type` as a nullable string constrained by a DB CHECK.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Python 3.12 (backend), TypeScript (frontend)  
**Primary Dependencies**: FastAPI, Pydantic, SQLAlchemy 2.0 (async), Alembic; Angular 19, Angular Material  
**Storage**: PostgreSQL 17  
**Testing**: pytest (+ httpx client fixtures); Angular unit tests (Karma/Jasmine)  
**Target Platform**: Local dev via Docker Compose; SPA + REST API
**Project Type**: Full-stack web application (Angular SPA + FastAPI backend)  
**Performance Goals**: Responsive UI tagging; transaction list endpoint supports filtering without noticeable lag at typical personal scale  
**Constraints**: Preserve auth scoping (JWT `sub`) for all transaction operations; validate strategy type values strictly  
**Scale/Scope**: Single-user use; transaction list paging already in place (`skip`/`limit`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Modular Architecture**: PASS — changes scoped to Trade Tracker files in `api/` and `web/`.
- **II. Spec-Driven Workflow Order**: PASS — spec exists; this plan is grounded in it.
- **III. TDD**: PASS — implementation will add/update tests before changing behavior.
- **IV. Strict Tech Stack Adherence**: PASS — no new frameworks introduced.
- **V. Consistent API & Database Conventions**: PASS — RESTful endpoints; keep pagination; use migrations.
- **VI. Modern Coding Standards**: PASS — type hints + Pydantic schemas; Angular standalone components.
- **VII. Container-First Approach**: PASS — no infra changes required.
- **VIII. Structured Version Control**: WARN — current branch name is `006-strategy-type-tagging` (created by repo tooling) rather than `feature/<name>`.
  - Justification: repository scripts and current workflow create numbered feature branches; reconciling branch naming conventions is out of scope for this feature.
- **IX. CI-Equivalent Checks Before Push**: PASS — will run backend + frontend checks before push.

## Project Structure

### Documentation (this feature)

```text
specs/006-strategy-type-tagging/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
api/
├── alembic/
│   └── versions/
│       └── <new_revision>_add_strategy_type_tagging.py
└── app/
  ├── models/
  │   └── trade.py
  ├── routers/
  │   └── transactions.py
  └── schemas/
    └── trade.py

api/tests/
├── test_transactions_upload.py
└── test_portfolios_and_tagging.py  # will be renamed/repurposed for strategy tagging

web/src/app/
├── core/services/api.service.ts
├── features/transactions/transactions.component.ts
├── features/transactions/transactions.component.spec.ts
└── shared/models/transaction.model.ts
```

**Structure Decision**: This is a web application with a FastAPI backend under `api/` and an Angular SPA under `web/`. Strategy tagging spans both modules and is implemented by updating the transaction DB model + API endpoints + the Transactions UI.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Branch naming differs from `feature/<name>` | Repository tooling creates numbered branches | Renaming conventions require repo-wide governance change |

## Phase 0: Outline & Research (COMPLETE)

Research decisions are captured in [research.md](research.md).

## Phase 1: Design & Contracts (COMPLETE)

- Data model changes and validation: [data-model.md](data-model.md)
- API surface contract for UI integration: [contracts/api.md](contracts/api.md)
- Local run + manual verification: [quickstart.md](quickstart.md)

## Phase 1: Agent Context Update (COMPLETE)

- Ran: `.specify/scripts/bash/update-agent-context.sh copilot`

## Phase 2: Implementation Planning

### Backend (FastAPI + SQLAlchemy + Alembic)

1. Add a `StrategyType` enum (single source of truth) used by schemas and API validation.
2. Create an Alembic migration:
  - Add nullable `strategy_type` column to `transaction`.
  - Add a DB CHECK constraint restricting values to the supported set.
  - Drop the FK constraint on `transaction.portfolio_id` (discover name dynamically if needed).
  - Drop `portfolio_id` column.
3. Update ORM model `Transaction`:
  - Remove `portfolio_id` and the `portfolio` relationship.
  - Add `strategy_type` field.
4. Update Pydantic schemas:
  - Replace `portfolio_id` with `strategy_type` in `TransactionResponse`.
  - Replace `TransactionTagRequest` with a strategy patch model supporting set/clear.
5. Update transactions router:
  - `GET /transactions`: support `tagged` and `strategy_type` query params; remove portfolio-based `assigned` semantics.
  - Add `GET /transactions/strategy-types` returning the supported list (value + label + description).
  - Add `PATCH /transactions/{id}/strategy-type` to set/clear.
6. Update/replace portfolio-tagging tests:
  - Update upload tests to assert transactions start untagged (`strategy_type` null).
  - Add/update tagging tests to set/change/clear strategy type and verify filters.

### Frontend (Angular)

1. Update shared Transaction model to replace `portfolio_id` with `strategy_type` (nullable).
2. Update ApiService:
  - Replace `tagTransaction` with `setTransactionStrategyType(transactionId, strategyType | null)`.
  - Add `getStrategyTypes()` to fetch options.
  - Update `getTransactions` params to use `tagged` and `strategy_type`.
3. Update TransactionsComponent:
  - Replace Portfolio column with Strategy Type column.
  - Render a `mat-select` containing an "Untagged" option + supported values.
  - On selection change, call the strategy patch API.
  - Update filter toggle label from Unassigned → Untagged and wire to `tagged=false`.
4. Update Angular unit tests to match the new behavior.

### Verification

- Backend: `cd api && uv run ruff check . && uv run ruff format --check . && uv run mypy app --ignore-missing-imports && uv run pytest`
- Frontend: `cd web && npm run lint && npm run build -- --configuration=production` (or via Docker if needed)

