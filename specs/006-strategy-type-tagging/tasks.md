# Tasks: Strategy Type Tagging

**Input**: Design documents from [specs/006-strategy-type-tagging/](.)
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md)

**Tests**: Tests are REQUIRED per Constitution Principle III (TDD). Write tests first, ensure they FAIL, then implement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Every task includes exact file paths

---

## Phase 1: Setup (Shared)

- [x] T001 Confirm spec + plan alignment in specs/006-strategy-type-tagging/spec.md and specs/006-strategy-type-tagging/plan.md
- [x] T002 Confirm current behavior and baseline tests pass: api/tests/* and web/src/app/features/transactions/transactions.component.spec.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB + model + response-shape changes that all user stories depend on.

### Tests for Foundation (REQUIRED)

- [x] T003 [P] Add failing backend regression test asserting transactions expose `strategy_type` and do not expose `portfolio_id` in api/tests/test_transactions_upload.py

### Implementation for Foundation

- [x] T004 Add `StrategyType` enum definition in api/app/models/trade.py
- [x] T005 Create Alembic migration to add `transaction.strategy_type`, drop FK + drop `transaction.portfolio_id` in api/alembic/versions/<new_revision>_strategy_type_tagging.py
- [x] T006 Update SQLAlchemy models to remove `portfolio_id` and portfolio↔transaction relationship and add `strategy_type` in api/app/models/trade.py
- [x] T007 Update Pydantic response schema to replace `portfolio_id` with `strategy_type` in api/app/schemas/trade.py
- [x] T008 Update transaction listing response mapping to return `strategy_type` in api/app/routers/transactions.py

**Checkpoint**: Backend migrations apply, and `GET /api/transactions` returns `strategy_type` field (nullable) with no `portfolio_id`.

---

## Phase 3: User Story 1 (P1) — Tag a transaction with a strategy type 🎯 MVP

**Goal**: User can tag a single transaction with a strategy type from a fixed list.

**Independent Test**: Upload CSV, set one transaction’s strategy type, reload and see it persisted.

### Tests for User Story 1 (REQUIRED)

- [x] T009 [P] [US1] Add failing backend test for `GET /api/transactions/strategy-types` in api/tests/test_strategy_type_tagging.py
- [x] T010 [P] [US1] Add failing backend test for setting strategy type via `PATCH /api/transactions/{id}/strategy-type` in api/tests/test_strategy_type_tagging.py
- [x] T011 [P] [US1] Update Angular unit test to expect Strategy Type dropdown and API call in web/src/app/features/transactions/transactions.component.spec.ts

### Implementation for User Story 1

- [x] T012 [US1] Add `GET /api/transactions/strategy-types` endpoint returning value/label/description in api/app/routers/transactions.py
- [x] T013 [US1] Add request schema for strategy-type patch (set-only initially) in api/app/schemas/trade.py
- [x] T014 [US1] Implement `PATCH /api/transactions/{id}/strategy-type` to set a non-null strategy type in api/app/routers/transactions.py
- [x] T015 [P] [US1] Update frontend Transaction model to include `strategy_type?: string | null` in web/src/app/shared/models/transaction.model.ts
- [x] T016 [P] [US1] Add API methods `getStrategyTypes()` and `setTransactionStrategyType()` in web/src/app/core/services/api.service.ts
- [x] T017 [US1] Replace portfolio UI with Strategy Type UI in web/src/app/features/transactions/transactions.component.ts

**Checkpoint**: User can tag a transaction as `WHEEL` or `COVERED_CALL` via UI and refresh shows persisted tag.

---

## Phase 4: User Story 2 (P2) — Change or clear a strategy tag

**Goal**: User can change an existing tag and clear it back to untagged.

**Independent Test**: Tag `WHEEL` → change to `COVERED_CALL` → clear to untagged; refresh persists.

### Tests for User Story 2 (REQUIRED)

- [x] T018 [P] [US2] Add failing backend test for clearing strategy type (PATCH with null) in api/tests/test_strategy_type_tagging.py
- [x] T019 [P] [US2] Add failing backend test for changing strategy type (PATCH from one value to another) in api/tests/test_strategy_type_tagging.py
- [x] T020 [P] [US2] Update Angular unit test to support selecting “Untagged” and re-tagging in web/src/app/features/transactions/transactions.component.spec.ts

### Implementation for User Story 2

- [x] T021 [US2] Update patch request schema to allow `strategy_type: StrategyType | null` in api/app/schemas/trade.py
- [x] T022 [US2] Update PATCH handler to support clearing (null) and changing values in api/app/routers/transactions.py
- [x] T023 [US2] Ensure UI includes an “Untagged” option and sends null to clear in web/src/app/features/transactions/transactions.component.ts

**Checkpoint**: Change and clear work in UI and API; invalid values rejected.

---

## Phase 5: User Story 3 (P3) — Filter by tagged/untagged and strategy type

**Goal**: User can filter transaction list by tagged status and by strategy type.

**Independent Test**: With some tagged + untagged transactions, toggle filters and confirm list contents.

### Tests for User Story 3 (REQUIRED)

- [x] T024 [P] [US3] Add failing backend test for `GET /api/transactions?tagged=false` returning only untagged in api/tests/test_strategy_type_tagging.py
- [x] T025 [P] [US3] Add failing backend test for `GET /api/transactions?strategy_type=WHEEL` returning only WHEEL in api/tests/test_strategy_type_tagging.py
- [x] T026 [P] [US3] Update Angular unit test for filter toggle label “Untagged” and correct API query params in web/src/app/features/transactions/transactions.component.spec.ts

### Implementation for User Story 3

- [x] T027 [US3] Update list endpoint query params from `assigned` to `tagged` + `strategy_type` in api/app/routers/transactions.py
- [x] T028 [P] [US3] Update ApiService `getTransactions` signature to accept `{ tagged?: boolean; strategy_type?: string }` in web/src/app/core/services/api.service.ts
- [x] T029 [US3] Update TransactionsComponent filter toggle to “Untagged” and wire to `tagged=false` in web/src/app/features/transactions/transactions.component.ts
- [x] T030 [US3] Add a minimal strategy-type filter control (single-select) and wire to `strategy_type` query param in web/src/app/features/transactions/transactions.component.ts

**Checkpoint**: User can view only untagged transactions and filter to a specific strategy type.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T031 Remove or rewrite the legacy portfolio-tagging test in api/tests/test_portfolios_and_tagging.py to reflect strategy tagging (keep portfolio listing tests if still relevant)
- [x] T032 [P] Remove dead imports/usages of portfolio-tagging on transactions in api/app/routers/transactions.py and web/src/app/features/transactions/transactions.component.ts
- [x] T033 Run backend CI-equivalent checks: scripts/ci_local.sh (or `cd api && uv run ruff check . && uv run ruff format --check . && uv run mypy app --ignore-missing-imports && uv run pytest`)
- [x] T034 Run frontend CI-equivalent checks: `cd web && npm ci && npm run lint && npm run build -- --configuration=production`
- [ ] T035 Validate manual flows in specs/006-strategy-type-tagging/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): no dependencies
- Phase 2 (Foundational): depends on Phase 1; blocks all user stories
- Phase 3 (US1): depends on Phase 2
- Phase 4 (US2): depends on Phase 3 (reuses patch endpoint + UI dropdown)
- Phase 5 (US3): depends on Phase 3; can be done before/after US2
- Phase 6 (Polish): depends on whichever user stories are in-scope (typically US1–US3)

### User Story Dependencies

- **US1 (P1)**: depends on Phase 2; no other story dependencies
- **US2 (P2)**: depends on US1 (needs tagging endpoint and dropdown)
- **US3 (P3)**: depends on US1 (needs strategy_type stored + returned)

### Dependency Graph (Stories)

```text
Foundation -> US1
US1 -> US2
US1 -> US3
```

---

## Parallel Execution Examples

### US1 parallel work

- Backend tests can be written in parallel:
  - T009 (options endpoint test) + T010 (patch endpoint test) in api/tests/test_strategy_type_tagging.py
- Frontend plumbing can be done in parallel:
  - T015 (transaction model) + T016 (api service) in web/src/app/

### US3 parallel work

- Backend filter tests can be written in parallel:
  - T024 + T025 in api/tests/test_strategy_type_tagging.py
- Frontend filter wiring can be split:
  - T028 (ApiService params) in web/src/app/core/services/api.service.ts
  - T029/T030 (component UI) in web/src/app/features/transactions/transactions.component.ts

### US2 parallel work

- Tests can be written in parallel:
  - T018 (clear) + T019 (change) in api/tests/test_strategy_type_tagging.py
- Frontend and backend changes can be split:
  - T021/T022 (backend schema + handler) in api/app/
  - T023 (UI clear option) in web/src/app/features/transactions/transactions.component.ts

---

## Implementation Strategy

### MVP (US1 only)

1. Complete Phase 1 + Phase 2
2. Complete US1 (tests first, then implementation)
3. Stop and validate that tagging persists across refresh

### Incremental delivery

- Add US2 (change/clear)
- Add US3 (filtering)
- Finish with Phase 6 cleanup + CI-equivalent checks
