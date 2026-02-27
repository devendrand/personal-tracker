# Tasks: PnL Leg Tagging & Strategy Groups

**Input**: Design documents from `/specs/007-pnl-leg-tagging/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests are REQUIRED per Constitution Principle III (TDD). Write tests first, ensure they FAIL, then implement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Establish baseline before any changes.

- [x] T001 Verify existing test suite passes before model changes: `cd api && uv run pytest -v` — capture baseline pass/fail count

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB model and migration — MUST complete before any user story work.

**⚠️ CRITICAL**: No user story work can begin until Phase 2 is complete.

- [x] T002 Write failing migration smoke test in `api/tests/test_migration_smoke.py` — assert `strategy_group` table exists, `transaction.leg_type` column exists, `transaction.strategy_group_id` column exists, `transaction.strategy_type` column absent — tests MUST FAIL before migration
- [x] T003 Update `api/app/models/trade.py` — (a) remove `StrategyType(StrEnum)` entirely; (b) add `LegType(StrEnum)` with values CSP, CC, BUY, SELL; (c) add `StrategyGroup(Base)` model with fields: id (UUID PK), user_sub (indexed), name, symbol, created_at, updated_at, and `legs` relationship to Transaction with `passive_deletes=True`; (d) on `Transaction`: remove `strategy_type` mapped column, add `leg_type: Mapped[str | None]` (String 10, nullable), add `strategy_group_id: Mapped[str | None]` (String 36, FK→strategy_group.id ondelete=SET NULL, nullable, indexed), add `strategy_group` relationship back-populated from StrategyGroup
- [x] T004 Generate Alembic migration: `cd api && uv run alembic revision --autogenerate -m "add_leg_type_and_strategy_group"` — a new file appears in `api/alembic/versions/`
- [x] T005 Review and edit the generated migration file in `api/alembic/versions/` — verify operation order: (1) create `strategy_group` table, (2) add `transaction.leg_type` column, (3) add `transaction.strategy_group_id` FK column with `ondelete="SET NULL"`, (4) drop `transaction.strategy_type` column; fix any autogenerate errors
- [x] T006 Apply migration: `cd api && uv run alembic upgrade head` — verify migration smoke tests in `api/tests/test_migration_smoke.py` now PASS

**Checkpoint**: DB schema updated — user story implementation can now begin.

---

## Phase 3: User Story 1 — Tag a Transaction with a Leg Type (P1) 🎯 MVP

**Goal**: Users can classify each imported transaction as CSP, CC, BUY, or SELL. The four-value `leg_type` field replaces the old six-value `strategy_type` field end-to-end.

**Independent Test**: Upload a CSV, call `PATCH /api/transactions/{id}/leg-type` with body `{"leg_type": "CSP"}`, verify `GET /api/transactions` returns the transaction with `leg_type: "CSP"`. Call `GET /api/transactions/leg-types` and verify 4 options returned.

### Tests for US1 ⚠️ (Write FIRST — must FAIL before implementation)

- [x] T007 [P] [US1] Write failing tests in `api/tests/test_leg_type_tagging.py` covering: (a) `GET /api/transactions/leg-types` returns exactly 4 options (CSP, CC, BUY, SELL); (b) `PATCH /api/transactions/{id}/leg-type` with `{"leg_type": "CSP"}` returns updated transaction with `leg_type="CSP"`; (c) `PATCH` with `{"leg_type": null}` clears the tag; (d) `GET /api/transactions?tagged=true` only returns tagged transactions; (e) `GET /api/transactions?leg_type=BUY` filters correctly; (f) `PATCH` on non-existent transaction returns 404; (g) unauthenticated requests return 401 — tests MUST FAIL before implementation
- [x] T008 [P] [US1] Update `api/tests/test_strategy_type_tagging.py` — delete this file (all covered tests reference the removed strategy_type field and removed endpoints; replaced by test_leg_type_tagging.py)

### Implementation for US1

- [x] T009 [P] [US1] Update `api/app/schemas/trade.py` — (a) replace `from app.models.trade import StrategyType` with `from app.models.trade import LegType`; (b) update `TransactionResponse`: replace `strategy_type: StrategyType | None` with `leg_type: LegType | None` and add `strategy_group_id: str | None = None`; (c) replace `TransactionStrategyTypePatchRequest` class with `LegTypePatchRequest(leg_type: LegType | None)`; (d) replace `StrategyTypeOption` class with `LegTypeOption(value: LegType, label: str, description: str)`; (e) remove `ImportSummary` references to strategy_type if any
- [x] T010 [US1] Update `api/app/routers/transactions.py` — (a) replace `from app.models.trade import StrategyType, Transaction` with `LegType, Transaction`; (b) replace schema imports (StrategyTypeOption→LegTypeOption, TransactionStrategyTypePatchRequest→LegTypePatchRequest); (c) rename route `GET /strategy-types` → `GET /leg-types` returning 4 `LegTypeOption` items (CSP="Cash-Secured Put", CC="Covered Call", BUY="Buy", SELL="Sell"); (d) rename route `PATCH /{id}/strategy-type` → `PATCH /{id}/leg-type` using `LegTypePatchRequest`, updating `txn.leg_type`; (e) update `GET /` filter: replace `strategy_type: StrategyType | None` param with `leg_type: LegType | None`, update all `.where(Transaction.strategy_type...)` to `.where(Transaction.leg_type...)`; (f) update all `TransactionResponse(...)` calls to use `leg_type=` kwarg and include `strategy_group_id=txn.strategy_group_id`
- [x] T011 [P] [US1] Add `getLegTypes()` and `patchLegType(id: string, legType: string | null)` methods to `web/src/app/core/api-client.service.ts` — GET `/api/transactions/leg-types`, PATCH `/api/transactions/${id}/leg-type` with body `{leg_type: legType}`
- [x] T012 [US1] Update `web/src/app/features/transactions/transactions.component.ts` — (a) update `Transaction` interface: replace `strategy_type: string | null` with `leg_type: string | null` and add `strategy_group_id: string | null`; (b) replace strategy-type dropdown with leg-type dropdown using `getLegTypes()` for options; (c) replace `setTransactionStrategyType()` call with `patchLegType()`; (d) update table column header and cell to show `leg_type`; (e) update filter logic (tagged/untagged, leg_type filter)

**Checkpoint**: `GET /api/transactions/leg-types` → 4 items; `PATCH /api/transactions/{id}/leg-type` → saves tag; UI shows CSP/CC/BUY/SELL dropdown.

---

## Phase 4: User Story 2 — Create Named Strategy Groups and Assign Legs (P2)

**Goal**: Users can create a named strategy group (e.g., "AAPL Wheel Q1 2025"), assign tagged legs to it, and unassign/delete groups without losing legs.

**Independent Test**: `POST /api/strategy-groups` with `{"name": "AAPL Wheel", "symbol": "AAPL"}` → 201. `PATCH /api/transactions/{id}/strategy-group` with that group id → transaction shows `strategy_group_id`. `DELETE /api/strategy-groups/{id}` → 204, then verify the leg has `strategy_group_id=null`.

### Tests for US2 ⚠️ (Write FIRST — must FAIL before implementation)

- [x] T013 [P] [US2] Write failing tests in `api/tests/test_strategy_groups.py` covering: (a) `GET /api/strategy-groups` returns empty list for new user; (b) `POST /api/strategy-groups` with name+symbol → 201 and returned id; (c) `DELETE /api/strategy-groups/{id}` → 204; (d) deleted group's legs have `strategy_group_id=null`; (e) `GET` after delete shows empty list; (f) 404 on delete of non-existent/other-user group; (g) user A groups not visible to user B; (h) `PATCH /api/transactions/{id}/strategy-group` assigns leg to group; (i) assigning leg from AAPL transaction to MSFT group returns 400; (j) transaction with null symbol cannot be assigned → 400; (k) unassign by passing `{"strategy_group_id": null}`; (l) unauthenticated requests return 401 — tests MUST FAIL

### Implementation for US2

- [x] T014 [P] [US2] Create `api/app/schemas/strategy_group.py` — `StrategyGroupCreate(name: str, symbol: str)`, `StrategyGroupResponse(id: str, name: str, symbol: str, created_at: datetime)`, `AssignLegRequest(strategy_group_id: str | None)`
- [x] T015 [US2] Create `api/app/routers/strategy_groups.py` — router with prefix `/strategy-groups`, tags=["Strategy Groups"]; implement: `GET /` → query all StrategyGroup for current user, return `list[StrategyGroupResponse]`; `POST /` → create StrategyGroup (201), normalize symbol to uppercase; `DELETE /{group_id}` → fetch group (404 if missing/wrong user), set `strategy_group_id=null` on all linked Transaction rows via UPDATE statement, delete group, return 204
- [x] T015 [US2] Update `api/app/routers/transactions.py` — add `PATCH /{transaction_id}/strategy-group` endpoint: fetch txn (404 if missing/wrong user); if `strategy_group_id` is not None, fetch group (404 if missing/wrong user), validate `group.symbol == txn.symbol` (400 if mismatch), validate `txn.symbol is not None` (400 if null); set `txn.strategy_group_id`; flush; return updated `TransactionResponse`
- [x] T015 [US2] Update `api/app/routers/__init__.py` — add `from app.routers.strategy_groups import router as strategy_groups_router` and add to `__all__`
- [x] T015 [US2] Update `api/app/main.py` — add `strategy_groups_router` to imports and `app.include_router(strategy_groups_router, prefix="/api")`
- [x] T015 [P] [US2] Add `getStrategyGroups()`, `createStrategyGroup(name, symbol)`, `deleteStrategyGroup(id)`, `patchStrategyGroup(txnId, groupId | null)` methods to `web/src/app/core/api-client.service.ts`
- [x] T020 [US2] Create `web/src/app/features/strategy-groups/strategy-groups.component.ts` — standalone Angular 19 component; `signal<StrategyGroup[]>([])` for groups list; `inject(ApiClientService)`; `ngOnInit` calls `getStrategyGroups()`; template: create form (name input + symbol input + submit button calling `createStrategyGroup()`), list of groups with name/symbol and delete button calling `deleteStrategyGroup()`; refresh list after create/delete
- [x] T021 [US2] Create `web/src/app/features/strategy-groups/strategy-groups.routes.ts` — `export const STRATEGY_GROUPS_ROUTES: Routes = [{ path: '', component: StrategyGroupsComponent }]`
- [x] T022 [US2] Update `web/src/app/features/transactions/transactions.component.ts` — add "Assign to Group" action per transaction row: a select dropdown populated from `getStrategyGroups()` (filtered by matching symbol), calls `patchStrategyGroup(txnId, groupId)` on change; add "Unassign" option (null) to the dropdown

**Checkpoint**: Strategy groups CRUD works; legs can be assigned/unassigned; delete cascades to unassign without deleting legs.

---

## Phase 5: User Story 3 — View Hierarchical PnL (P3)

**Goal**: Users see a PnL page with Ticker → StrategyGroup → Legs hierarchy. PnL per leg equals the transaction amount. Untagged legs excluded; tagged ungrouped legs appear in "Ungrouped" bucket.

**Independent Test**: Seed tagged transactions (some grouped, some not); call `GET /api/pnl`; verify total = sum of all tagged amounts; verify tickers, groups (including "Ungrouped"), and legs structure matches data-model.md contract.

### Tests for US3 ⚠️ (Write FIRST — must FAIL before implementation)

- [x] T023 [P] [US3] Write failing tests in `api/tests/test_pnl.py` covering: (a) no tagged transactions → `{total_realized_pnl: 0, tickers: []}`; (b) CSP open +$150 + expiration $0 in group → group total=$150, 2 legs; (c) CSP open +$200 + BTC -$50 in group → group total=$150; (d) BUY -$1000 + SELL +$1200 in group → group total=$200; (e) mixed Wheel group (CSP + CC legs) → PnL = sum of amounts; (f) tagged leg with no group → appears under "Ungrouped" with correct amount; (g) untagged leg (leg_type=null) excluded entirely; (h) transaction with null symbol excluded even if tagged; (i) user B cannot see user A's PnL (returns own empty/different total); (j) unauthenticated → 401 — tests MUST FAIL

### Implementation for US3

- [x] T024 [P] [US3] Create `api/app/schemas/pnl.py` — `LegPnL(transaction_id, activity_date, activity_type, description, leg_type: LegType, amount: Decimal, realized_pnl: Decimal)`; `StrategyGroupPnL(strategy_group_id: str | None, name: str, total_realized_pnl: Decimal, legs: list[LegPnL])`; `TickerPnL(symbol: str, total_realized_pnl: Decimal, groups: list[StrategyGroupPnL])`; `PnLSummaryResponse(total_realized_pnl: Decimal, tickers: list[TickerPnL])`
- [x] T025 [US3] Create `api/app/services/pnl_service.py` — `calculate_pnl(transactions: list[Transaction]) -> PnLSummaryResponse`: (a) filter to transactions where `leg_type IS NOT NULL` and `symbol IS NOT NULL`; (b) group by `symbol` → then by `strategy_group_id` (None = "Ungrouped"); (c) for each leg: `realized_pnl = transaction.amount or Decimal(0)`; (d) group total = sum of leg realized_pnl; (e) ticker total = sum of group totals; (f) grand total = sum of ticker totals; (g) sort tickers by symbol asc, named groups first then "Ungrouped" last; (h) sort legs by activity_date asc within each group
- [x] T026 [US3] Create `api/app/routers/pnl.py` — router with prefix `/pnl`, tags=["PnL"]; `GET /` → query all `Transaction` for `current_user` where `leg_type IS NOT NULL` with eager-load of `strategy_group`; call `pnl_service.calculate_pnl(transactions)`; return `PnLSummaryResponse`
- [x] T027 [US3] Update `api/app/routers/__init__.py` — add `from app.routers.pnl import router as pnl_router` and add to `__all__`
- [x] T028 [US3] Update `api/app/main.py` — add `pnl_router` to imports and `app.include_router(pnl_router, prefix="/api")`
- [x] T029 [P] [US3] Create `web/src/app/features/pnl/models/pnl.models.ts` — TypeScript interfaces matching `api/app/schemas/pnl.py`: `LegPnL`, `StrategyGroupPnL`, `TickerPnL`, `PnLSummaryResponse` (amounts as `number`)
- [x] T030 [P] [US3] Add `getPnL(): Observable<PnLSummaryResponse>` to `web/src/app/core/api-client.service.ts` — GET `/api/pnl`
- [x] T031 [US3] Create `web/src/app/features/pnl/pnl.component.ts` — standalone Angular 19 component; `signal<PnLSummaryResponse | null>(null)`, `signal<boolean>(false)` for loading; `inject(ApiClientService)`; call `getPnL()` in `ngOnInit`; template: show total at top, `@for (ticker of pnl().tickers)` → collapsible row with ticker symbol + total PnL; expand → `@for (group of ticker.groups)` → group name + group PnL; expand → `@for (leg of group.legs)` → date, description, leg_type, amount; color amounts green if positive, red if negative using CSS class binding
- [x] T032 [US3] Create `web/src/app/features/pnl/pnl.routes.ts` — `export const PNL_ROUTES: Routes = [{ path: '', component: PnlComponent }]`

**Checkpoint**: `GET /api/pnl` returns correct hierarchy; PnL page at `/pnl` shows collapsible Ticker → Group → Legs tree with correct totals.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Wire up routing, navigation, and verify full CI pass.

- [x] T033 [P] Update `web/src/app/app.routes.ts` — add lazy routes: `{ path: 'pnl', loadChildren: () => import('./features/pnl/pnl.routes').then(m => m.PNL_ROUTES), canActivate: [authGuard] }` and `{ path: 'strategy-groups', loadChildren: () => import('./features/strategy-groups/strategy-groups.routes').then(m => m.STRATEGY_GROUPS_ROUTES), canActivate: [authGuard] }`
- [x] T034 [P] Add nav links for "PnL" and "Strategy Groups" in the existing nav/sidebar component (locate the nav component file first — likely in `web/src/app/` root or `core/`)
- [x] T035 Run full CI-equivalent checks: `./scripts/ci_local.sh` — fix any ruff, mypy, pytest, eslint, or build failures before marking complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — MVP deliverable
- **Phase 4 (US2)**: Depends on Phase 2 — can start in parallel with US1 after Phase 2
- **Phase 5 (US3)**: Depends on Phase 2 — can start in parallel with US1/US2 after Phase 2; reads strategy_group_id set by US2 (soft dependency)
- **Phase 6 (Polish)**: Depends on US1 + US2 + US3 being complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Can start after Phase 2 — independent of US1 (no schema overlap); US2 adds `assign-to-group` to transactions router but doesn't touch leg-type endpoint
- **US3 (P3)**: Can start after Phase 2 — reads `leg_type` (US1) and `strategy_group_id` (US2), but PnL service works correctly even with no groups (shows all legs as "Ungrouped")

### Within Each Phase

- Tests MUST be written and MUST FAIL before implementation
- Schemas before routers
- Services before routers that use them
- Backend complete before frontend wires up API calls
- Commit after each logical group (test write, model, router, frontend)

---

## Parallel Opportunities

### Phase 2 (Foundational)

```
T002 (smoke test) → then T003+T004+T005 sequentially (model→generate→review→apply)
```

### Phase 3 (US1) — after Phase 2

```
Parallel: T007 (api tests) + T008 (delete old tests)
Then: T009 (schemas) → T010 (router) sequential
Parallel: T011 (api-client) + T012 (frontend component) — after T009/T010
```

### Phase 4 (US2) — after Phase 2

```
Parallel: T013 (tests)
Then: T014 (schemas) → T015 (strategy-groups router) + T016 (transactions router patch) → T017+T018 (wire up) sequential
Parallel: T019 (api-client) + T020 (component) + T021 (routes) — after T015
T022 (transactions assign-group UI) — after T019, T020
```

### Phase 5 (US3) — after Phase 2

```
Parallel: T023 (tests)
Then: T024 (schemas) → T025 (service) → T026 (router) → T027+T028 (wire up) sequential
Parallel: T029 (pnl.models.ts) + T030 (api-client) — after T024
T031 (component) → T032 (routes) — after T029+T030
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational — T002 → T003 → T004 → T005 → T006
3. Complete Phase 3: User Story 1 — T007 → T008 → T009 → T010 → T011 → T012
4. **STOP and VALIDATE**: `cd api && uv run pytest api/tests/test_leg_type_tagging.py -v` — all pass; open UI, tag a transaction
5. Users can now tag all transactions with the new leg types

### Incremental Delivery

1. MVP (US1) → Users can re-tag all transactions with CSP/CC/BUY/SELL
2. US2 → Users can create strategy groups and organize legs
3. US3 → Users can view hierarchical PnL
4. Polish → Full nav and CI green

---

## Notes

- [P] tasks = can run in parallel (different files, no shared state)
- [US1/US2/US3] maps each task to its user story for traceability
- **TDD required**: every test task must produce FAILING tests before implementation begins
- The existing `test_strategy_type_tagging.py` must be deleted (T008) before new tests added — avoids conftest conflicts
- The Alembic migration autogenerate (T004) may not perfectly detect all changes if SQLAlchemy reflection is incomplete — always review the generated file (T005) manually
- `strategy_group.symbol` stores uppercase ticker symbol — normalize in router before save
- `ondelete="SET NULL"` on the FK means PostgreSQL handles the cascade when a group is deleted — verify in T006 smoke test
