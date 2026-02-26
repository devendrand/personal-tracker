---

description: "Task list for Remove Portfolio Navigation & Page"

---

# Tasks: Remove Portfolio Navigation & Page

**Input**: Design documents from `specs/003-remove-portfolio-nav/`

**Tests**: Tests are REQUIRED. Tasks MUST include tests that cover acceptance scenarios and all documented edge cases.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure frontend unit tests can run so TDD is possible for this feature.

- [x] T001 Add Angular Karma/Jasmine devDependencies in web/package.json (include: karma, karma-jasmine, karma-chrome-launcher, jasmine-core, @types/jasmine, karma-coverage)
- [x] T002 Add Karma configuration in web/karma.conf.js (include custom launcher ChromeHeadlessNoSandbox with flags: --no-sandbox, --disable-gpu)
- [x] T003 Wire Karma config into web/angular.json (add test.options.karmaConfig)
- [x] T004 Add Angular test entrypoint in web/src/test.ts
- [x] T005 Validate frontend tests run in Docker (requires Chromium in the web image): docker compose run --rm --no-deps web sh -lc "npm ci && npm run test -- --watch=false --browsers=ChromeHeadlessNoSandbox"

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm current code locations and ensure no hidden in-app routes/links remain.

**⚠️ CRITICAL**: No user story work can begin until Phase 1 is complete.

- [x] T006 Inventory all references to "/portfolios" in web/src/app/** (keep dashboard wording per spec; identify links that must be removed)

**Checkpoint**: Frontend test harness works; route/link inventory complete.

---

## Phase 3: User Story 1 - No Portfolios entry in navigation (Priority: P1) 🎯

**Goal**: Remove the “Portfolios” item from the main navigation.

**Independent Test**: Render the app shell and verify navigation contains no “Portfolios” item.

### Tests for User Story 1 (REQUIRED) ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [x] T007 [P] [US1] Add unit test asserting navGroups has no "Portfolios" label in web/src/app/app.component.spec.ts

### Implementation for User Story 1

- [x] T008 [US1] Remove the Portfolios nav item from navGroups in web/src/app/app.component.ts


**Checkpoint**: US1 test passes; app nav no longer shows “Portfolios”.

---

## Phase 4: User Story 2 - Portfolios page is not accessible (Priority: P1) 🎯

**Goal**: `/portfolios` is not an in-app page; direct navigation redirects to `/dashboard` (URL updates).

**Independent Test**: Navigating to `/portfolios` results in `/dashboard` without rendering a portfolios page.

### Tests for User Story 2 (REQUIRED) ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [x] T009 [P] [US2] Add route-config test: routes includes redirect for "portfolios" and does not lazy-load PortfoliosComponent in web/src/app/app.routes.spec.ts
- [x] T010 [P] [US2] Add router navigation test: navigating to "/portfolios" ends at "/dashboard" in web/src/app/app.routes.spec.ts

### Implementation for User Story 2

- [x] T011 [US2] Replace the portfolios route with a redirectTo "dashboard" (pathMatch "full") in web/src/app/app.routes.ts

### Cleanup (US2)

- [x] T012 [P] [US2] Remove any remaining in-app links to "/portfolios" (excluding dashboard wording/cards) in web/src/app/**
- [x] T013 [US2] Decide on portfolios feature cleanup: either delete unused component file(s) or keep them orphaned but unreferenced (document decision) in web/src/app/features/portfolios/**


**Checkpoint**: `/portfolios` redirect tests pass; manual URL entry redirects and updates the browser URL.

---

## Phase 5: User Story 3 - Portfolio tagging remains available (Priority: P2)

**Goal**: Transaction portfolio tagging UI remains present and functional.

**Independent Test**: Transactions page still shows a Portfolio column and supports selecting an existing portfolio.

### Tests for User Story 3 (REQUIRED) ⚠️

- [x] T014 [P] [US3] Add unit test: when portfolios list is non-empty, Portfolio column renders a mat-select in web/src/app/features/transactions/transactions.component.spec.ts
- [x] T015 [P] [US3] Add unit test: selecting a portfolio calls ApiService.tagTransaction with transaction id + portfolio id in web/src/app/features/transactions/transactions.component.spec.ts

### Implementation for User Story 3

- [x] T016 [US3] Ensure any refactors from US1/US2 do not break portfolio tagging code paths in web/src/app/features/transactions/transactions.component.ts

**Checkpoint**: US3 tests pass; portfolio tagging remains available.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [x] T017 Run quickstart verification steps in specs/003-remove-portfolio-nav/quickstart.md (nav item absent; /portfolios redirects; tagging still works)
- [x] T018 Map each spec edge case to a concrete automated test (edge case → test ID) in specs/003-remove-portfolio-nav/spec.md
- [x] T019 Sync with updated main per constitution (fetch, update main, integrate origin/main into feature branch)
- [x] T020 Run CI-equivalent checks before push: ./scripts/ci_local.sh
- [x] T021 [P] Add router history/back simulation test for /portfolios redirect consistency using Location.back() in web/src/app/app.routes.spec.ts
- [x] T022 [P] Add dashboard regression test: dashboard still renders "Portfolios" wording/cards (explicitly out of scope to remove) in web/src/app/features/dashboard/dashboard.component.spec.ts
- [x] T023 Confirm FR-005: no backend or Alembic migration changes for this feature (git diff should not include api/ or api/alembic/versions/)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Phase 1
- **User Stories (Phase 3–5)**: Depend on Phase 2
- **Polish (Final Phase)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2
- **US2 (P1)**: Can start after Phase 2 (independent of US1, but typically paired for a complete “remove portfolios entry/page” change)
- **US3 (P2)**: Can start after Phase 2; validate after US1/US2 to ensure nothing regressed

---

## Parallel Opportunities

- Phase 1 tasks are mostly sequential (shared files/config), except:
  - T002 and T004 can be prepared in parallel once dependency choices are clear.
- After Phase 1:
  - [P] tests T007, T009, T010, T014, T015 can be authored in parallel (different files).
  - Implementation T008 and T011 can be done in parallel (different files).

---

## Parallel Example: US2

```bash
# In parallel (different files):
T009  "Add route-config test" (web/src/app/app.routes.spec.ts)
T010  "Add router navigation test" (web/src/app/app.routes.spec.ts)

# Then:
T011  "Replace portfolios route with redirect" (web/src/app/app.routes.ts)
```

---

## Implementation Strategy

### MVP

- Implement **US1 + US2** (both P1) to fully satisfy the user-facing removal (nav + route redirect).

### Incremental Delivery

1. Phase 1–2: test harness + inventory
2. US1: remove nav item
3. US2: redirect `/portfolios` -> `/dashboard` + remove in-app links
4. US3: verify tagging didn’t regress
5. Final Phase: quickstart + sync main + CI-equivalent checks
