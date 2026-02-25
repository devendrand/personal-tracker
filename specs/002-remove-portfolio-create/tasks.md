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

**Tests**: Backend pytest tasks are included (TDD required by plan).

## Phase 1: Setup (Shared)

- [ ] T001 Confirm acceptance scenarios + clarifications are reflected in `specs/002-remove-portfolio-create/spec.md`
- [ ] T002 Run backend baseline tests (`cd api && uv run pytest`) and note any pre-existing failures in `api/tests/`
- [ ] T003 Run frontend baseline build (`cd web && npm run build`) and note any pre-existing failures in `web/`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Add an async SQLAlchemy session fixture in `api/tests/conftest.py` (e.g., `db_session`) for seeding records directly
- [ ] T005 Add a small test helper/fixture in `api/tests/conftest.py` to create a `Portfolio` for a given `user_sub` (returns created model/id)
- [ ] T006 Ensure the new test fixtures are used with explicit `commit()` so the API client (separate session) can read seeded rows (update `api/tests/conftest.py`)

**Checkpoint**: Tests can seed portfolios without `POST /api/portfolios`.

---

## Phase 3: User Story 1 — No portfolio creation from the app (Priority: P1) 🎯 MVP

**Goal**: The UI provides no workflow, page, button, or call-to-action for creating portfolios, while keeping `/portfolios` accessible and read-only.

**Independent Test**:
- Navigate to `/portfolios` and confirm there are no create actions.
- If the user has 0 portfolios, the empty state does not suggest creating one.

### Implementation

- [ ] T007 [US1] Remove all portfolio creation CTAs and creation-oriented copy from `web/src/app/features/portfolios/portfolios.component.ts`
- [ ] T008 [P] [US1] Remove `createPortfolio()` from `web/src/app/core/services/api.service.ts` (and ensure no remaining call sites)
- [ ] T009 [P] [US1] Verify `/portfolios` route remains configured in `web/src/app/app.routes.ts` (no create routes added)
- [ ] T010 [P] [US1] Verify the main-nav entry for Portfolios remains in `web/src/app/app.component.ts` (read-only access preserved)

**Checkpoint**: UI still lists portfolios and is read-only.

---

## Phase 4: User Story 2 — Portfolio creation is not supported by the API (Priority: P1)

**Goal**: `POST /api/portfolios` is rejected with `405 Method Not Allowed` by removing the route handler while preserving `GET` endpoints.

**Independent Test**:
- Authenticated `GET /api/portfolios` returns `200`.
- Authenticated `POST /api/portfolios` returns `405`.

### Tests (write first; should fail before implementation)

- [ ] T011 [US2] Add/adjust a test asserting `POST /api/portfolios` returns `405` in `api/tests/test_portfolios_and_tagging.py`
- [ ] T012 [US2] Refactor portfolio-listing scope assertions to seed portfolios via the new DB fixtures (not the API) in `api/tests/test_portfolios_and_tagging.py`
- [ ] T013 [US2] Refactor the tagging test to seed a portfolio via DB fixtures (not the API) in `api/tests/test_portfolios_and_tagging.py`

### Implementation

- [ ] T014 [US2] Remove the `@router.post("")` handler from `api/app/routers/portfolios.py` (preserve the `GET` handlers)
- [ ] T015 [P] [US2] Remove `PortfolioCreate` schema from `api/app/schemas/trade.py` and clean up exports in `api/app/schemas/__init__.py`
- [ ] T016 [US2] Run `cd api && uv run pytest` and confirm all tests pass

**Checkpoint**: API rejects creation with `405` and existing reads/tagging still work.

---

## Phase 5: User Story 3 — Continue using existing portfolios (Priority: P2)

**Goal**: Removing portfolio creation does not break existing portfolio reads or transaction-to-portfolio association flows.

**Independent Test**:
- Existing portfolios are still visible.
- Tagging a transaction to an existing portfolio still works.

- [ ] T017 [US3] Verify transaction tagging flow still works end-to-end after API/UI changes (update any necessary assertions in `api/tests/test_portfolios_and_tagging.py`)
- [ ] T018 [US3] Sanity-check the transactions UI still loads portfolios and allows tagging in `web/src/app/features/transactions/transactions.component.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns (Required)

- [ ] T019 Update PRD to remove portfolio creation requirement and API endpoint in `docs/TradeTracker_PRD_v1.0.md` (update FR-04 + remove `POST /api/portfolios` from API table; align conceptual data model language)
- [ ] T020 Search repository docs for portfolio creation instructions and remove/adjust them (e.g., grep `docs/` + `README.md` for "create portfolio", "New Portfolio", and `POST /api/portfolios`)
- [ ] T021 Run the manual checks in `specs/002-remove-portfolio-create/quickstart.md` and adjust if steps need updating

---

## Dependencies & Execution Order

### Story / Phase Dependencies

- Phase 1 → Phase 2 is required.
- Phase 2 (test seeding fixtures) blocks Phase 4 (API removal) because existing tests currently create portfolios through the API.
- Phase 3 (UI removal) can proceed in parallel with Phase 4 after Phase 2 is complete.
- Phase 6 must be completed before considering the feature “done” (repo docs must match behavior).

### Suggested completion order

1. Phase 1 (baseline)
2. Phase 2 (test seeding)
3. Phase 3 (US1 UI MVP)
4. Phase 4 (US2 API removal)
5. Phase 5 (US3 regression checks)
6. Phase 6 (docs + quickstart validation)

### User Story Dependency Graph

```text
Phase 1 (Setup)
  -> Phase 2 (Foundational)
    -> US1 (UI removal)  \
    -> US2 (API removal)  +--> US3 (Regression) -> Phase 6 (Docs/Quickstart)
```

---

## Parallel Execution Examples

### User Story 1 (US1)

After Phase 2 completes, these can proceed in parallel (different files):

- T007 in `web/src/app/features/portfolios/portfolios.component.ts`
- T008 in `web/src/app/core/services/api.service.ts`
- T009 in `web/src/app/app.routes.ts`
- T010 in `web/src/app/app.component.ts`

### User Story 2 (US2)

After Phase 2 completes and once tests are updated (T011–T013), these can proceed in parallel:

- T014 in `api/app/routers/portfolios.py`
- T015 in `api/app/schemas/trade.py` and `api/app/schemas/__init__.py`

### User Story 3 (US3)

- T017 and T018 are sequential verification steps (API + UI), but can be assigned to different people if coordinated.

---

## Implementation Strategy

### MVP (US1)

- Complete Phases 1–3, then stop and verify the UI contains no portfolio creation workflow.

### Full feature completion

- Complete Phases 4–6, ensuring:
  - API rejects creation with `405`.
  - Existing portfolios and tagging continue to work.
  - PRD docs no longer describe portfolio creation or a `POST /api/portfolios` endpoint.
