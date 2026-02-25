---
description: "Task list for removing portfolio creation (UI + public API)"
---

# Tasks: Remove Portfolio Create Page

**Feature**: `specs/002-remove-portfolio-create/`

**Input docs**:
- `specs/002-remove-portfolio-create/spec.md`
- `specs/002-remove-portfolio-create/plan.md`
- `specs/002-remove-portfolio-create/research.md`
- `specs/002-remove-portfolio-create/data-model.md`
- `specs/002-remove-portfolio-create/contracts/http-api.md`
- `specs/002-remove-portfolio-create/quickstart.md`

**Tests**: Backend pytest tasks are included (repo constitution requires TDD; frontend validation is via Docker build).

## Phase 1: Setup (Shared)

**Purpose**: Confirm baseline behavior and ensure prerequisites for story work.

- [ ] T001 Confirm acceptance scenarios/FRs are reflected in specs/002-remove-portfolio-create/spec.md
- [x] T001 Confirm acceptance scenarios/FRs are reflected in specs/002-remove-portfolio-create/spec.md
- [x] T002 Run backend baseline tests and record any pre-existing failures in specs/002-remove-portfolio-create/quickstart.md
- [x] T003 Run a frontend production build via Docker and record any pre-existing failures in specs/002-remove-portfolio-create/quickstart.md (`docker build -f web/Dockerfile --target builder -t trade-tracker-web:builder web`)

---

## Phase 2: Foundational (Blocking prerequisites)

**Purpose**: Ensure tests can seed portfolios without using the removed create API.

- [x] T004 Add async SQLAlchemy session fixture for direct seeding in api/tests/conftest.py
- [x] T005 Add test helper fixture to create a Portfolio for a user_sub in api/tests/conftest.py
- [x] T006 Ensure fixtures explicitly commit so API requests can read seeded rows in api/tests/conftest.py

**Checkpoint**: Tests can seed portfolios without `POST /api/portfolios`.

---

## Phase 3: User Story 1 — No portfolio creation from the app (Priority: P1) 🎯 MVP

**Goal**: The UI provides no workflow/page/button/CTA for creating portfolios while keeping `/portfolios` accessible and read-only.

**Independent Test**: Navigate to `/portfolios`; confirm there are no create actions; if there are 0 portfolios, empty state has no create CTA.

### Implementation

- [x] T007 [US1] Remove portfolio creation CTAs and creation-oriented copy in web/src/app/features/portfolios/portfolios.component.ts
- [x] T008 [P] [US1] Remove the portfolio creation API client helper in web/src/app/core/services/api.service.ts
- [x] T009 [P] [US1] Confirm `/portfolios` route remains configured (no create routes added) in web/src/app/app.routes.ts
- [x] T010 [P] [US1] Confirm main nav entry for Portfolios remains present (read-only access preserved) in web/src/app/app.component.ts

**Checkpoint**: UI lists portfolios and is read-only.

---

## Phase 4: User Story 2 — Portfolio creation is not supported by the API (Priority: P1)

**Goal**: `POST /api/portfolios` returns `405 Method Not Allowed` by removing the handler while preserving `GET` endpoints.

**Independent Test**: Authenticated `GET /api/portfolios` returns `200`; authenticated `POST /api/portfolios` returns `405`.

### Tests (write first; must fail before implementation)

- [x] T011 [US2] Add/adjust a test asserting `POST /api/portfolios` returns `405` in api/tests/test_portfolios_and_tagging.py
- [x] T012 [US2] Refactor portfolio-listing assertions to seed portfolios via DB fixtures (not the API) in api/tests/test_portfolios_and_tagging.py
- [x] T013 [US2] Refactor tagging test to seed a portfolio via DB fixtures (not the API) in api/tests/test_portfolios_and_tagging.py

### Implementation

- [x] T014 [US2] Remove the `@router.post("")` handler while preserving `GET` handlers in api/app/routers/portfolios.py
- [x] T015 [P] [US2] Remove create schema(s) and exports related to portfolio creation in api/app/schemas/trade.py and api/app/schemas/__init__.py
- [x] T016 [US2] Run backend tests and ensure they pass in api/tests/ (command documented in specs/002-remove-portfolio-create/quickstart.md)

**Checkpoint**: API rejects creation with `405` and existing reads/tagging still work.

---

## Phase 5: User Story 3 — Continue using existing portfolios (Priority: P2)

**Goal**: Removing portfolio creation does not break existing portfolio reads or transaction-to-portfolio association flows.

**Independent Test**: Existing portfolios are visible; tagging a transaction to an existing portfolio still works.

- [x] T017 [US3] Verify transaction tagging flow end-to-end and update assertions if needed in api/tests/test_portfolios_and_tagging.py
- [x] T018 [US3] Sanity-check transactions UI still loads portfolios and allows tagging in web/src/app/features/transactions/transactions.component.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, quickstart validation, and final verification in a container-first environment.

- [x] T019 Update PRD to remove portfolio creation requirement and API endpoint in docs/TradeTracker_PRD_v1.0.md
- [x] T020 [P] Search and remove/adjust portfolio creation instructions in docs/ and README.md
- [x] T021 Run manual quickstart UI verification using Docker and update steps if needed in specs/002-remove-portfolio-create/quickstart.md
- [x] T022 Run frontend production build via Docker and update the TODO checklist status in specs/002-remove-portfolio-create/todo.md (`docker build -f web/Dockerfile --target builder -t trade-tracker-web:builder web`)

---

## Dependencies & Execution Order

### Story completion order

- Phase 1 (Setup) → Phase 2 (Foundational) is required.
- US1 (UI removal) and US2 (API removal) can proceed after Phase 2; they touch different layers and can be parallelized.
- US3 (regression) depends on US1 + US2 being complete.
- Phase 6 (polish/verification) depends on desired user stories being complete.

### User Story dependency graph

```text
Setup -> Foundational -> (US1 + US2) -> US3 -> Polish
```

---

## Parallel Execution Examples

### US1 parallel work

- T008 in web/src/app/core/services/api.service.ts
- T009 in web/src/app/app.routes.ts
- T010 in web/src/app/app.component.ts

### US2 parallel work (after tests exist)

- T014 in api/app/routers/portfolios.py
- T015 in api/app/schemas/trade.py and api/app/schemas/__init__.py

---

## Implementation Strategy

### Suggested MVP scope

- Complete Phase 1–3 (US1) and validate `/portfolios` is read-only.

### Full completion

- Complete Phases 4–6, ensuring API rejects create with `405`, existing portfolios/tagging still work, docs match behavior, and Docker-based frontend validation passes.
