---

description: "Task list for PnL Commission Fix & Additional Metrics"
---

# Tasks: PnL Commission Fix & Additional Metrics

**Input**: Design documents from `/specs/008-fix-pnl-commission/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/pnl.md ✅, quickstart.md ✅

**Tests**: Tests are REQUIRED per Constitution Principle III (TDD). Write tests first, ensure they FAIL, then implement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Confirm the existing infrastructure satisfies all feature pre-conditions before any code changes.

- [x] T001 Confirm `commission` column exists on `transaction` table and no Alembic migration is required by inspecting `api/app/models/trade.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No new infrastructure required. The `commission` column already exists; no new routes, models, or database tables are introduced. All backend changes land in existing files. Phase 2 is satisfied by Phase 1 completion.

**⚠️ CRITICAL**: Confirm T001 passes before starting user story phases.

**Checkpoint**: Foundation confirmed — user story implementation can begin.

---

## Phase 3: User Story 1 — Correct PnL Reflects Commission Deduction (Priority: P1) 🎯 MVP

**Goal**: Fix the per-leg `realized_pnl` formula from `amount` to `amount + commission_raw`, expose the individual leg commission as a positive value, and cascade the correction through group/ticker/grand-total aggregations automatically.

**Independent Test**: Seed a tagged transaction with `amount=150.00`, `commission=-0.65`. Call `GET /api/pnl`. Verify `legs[0].realized_pnl == "149.35"` and `legs[0].commission == "0.65"`.

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T002 [US1] Write failing commission-fix tests in `api/tests/test_pnl.py`: `test_pnl_commission_deducted` (amount=150 commission=-0.65 → realized_pnl=149.35), `test_pnl_null_commission_treated_as_zero` (null commission → realized_pnl=amount), and `test_pnl_commission_displayed_as_positive` (stored -0.65 → returned "0.65")

### Implementation for User Story 1

- [x] T003 [US1] Add `commission: Decimal` field to `LegPnL` Pydantic schema in `api/app/schemas/pnl.py`
- [x] T004 [US1] Fix `realized_pnl` formula to `amount + commission_raw` and populate `commission=abs(commission_raw)` in `LegPnL` construction in `api/app/services/pnl_service.py`
- [x] T005 [US1] Run US1 tests to verify they now pass: `cd api && uv run pytest tests/test_pnl.py::test_pnl_commission_deducted tests/test_pnl.py::test_pnl_null_commission_treated_as_zero tests/test_pnl.py::test_pnl_commission_displayed_as_positive -v`

**Checkpoint**: At this point, User Story 1 is fully functional — per-leg `realized_pnl` is commission-adjusted and individual leg commission is exposed correctly.

---

## Phase 4: User Story 2 — View Transaction Count and Commission Summary (Priority: P2)

**Goal**: Expose `transaction_count` and `total_commission` at group, ticker, and grand-total levels in the API response, and surface them as two new columns ("# Trades" and "Commission") on the PnL page.

**Independent Test**: Seed a strategy group with 3 tagged legs having commissions of -0.65, -0.65, 0.00. Call `GET /api/pnl`. Verify group `transaction_count == 3`, group `total_commission == "1.30"`, ticker `transaction_count == 3`, ticker `total_commission == "1.30"`, and `total_transaction_count == 3`, `total_commission == "1.30"` at the summary level. Then load the PnL page in the browser and confirm the "# Trades" and "Commission" columns appear at group, ticker, and grand-total rows.

### Tests for User Story 2 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [US2] Write failing metric tests in `api/tests/test_pnl.py`: `test_pnl_group_transaction_count` (3 legs → count=3), `test_pnl_total_commission_aggregation` (commissions -0.65/-0.65/0 → group total_commission="1.30"), `test_pnl_ticker_rollup` (ticker sums group counts and commissions), `test_pnl_grand_total_fields` (PnLSummaryResponse has correct `total_transaction_count` and `total_commission`)
- [x] T007 [US2] Add `transaction_count` and `total_commission` assertions to ALL existing tests in `api/tests/test_pnl.py` (existing fixtures have commission=0.00 so values will be 0/"0.00000…")

### Backend Implementation for User Story 2

- [x] T008 [US2] Add `transaction_count: int` and `total_commission: Decimal` to `StrategyGroupPnL` and `TickerPnL` schemas, and `total_transaction_count: int` and `total_commission: Decimal` to `PnLSummaryResponse` in `api/app/schemas/pnl.py`
- [x] T009 [US2] Compute `transaction_count = len(leg_pnls)` and `total_commission = sum(leg.commission for leg in leg_pnls)` after building group legs in `api/app/services/pnl_service.py`
- [x] T010 [US2] Compute ticker-level `transaction_count` and `total_commission` as sums across groups, and grand-total `total_transaction_count` and `total_commission` as sums across tickers in `api/app/services/pnl_service.py`
- [x] T011 [US2] Update empty-state early return to include `total_transaction_count=0` and `total_commission=Decimal("0")` in `api/app/services/pnl_service.py`
- [x] T012 [US2] Run full backend PnL test suite to verify all tests pass: `cd api && uv run pytest tests/test_pnl.py -v`

### Frontend Implementation for User Story 2

- [x] T013 [P] [US2] Add `commission: string` to `LegPnL`; add `transaction_count: number` and `total_commission: string` to `StrategyGroupPnL`, `TickerPnL`, and `PnLSummaryResponse` in `web/src/app/features/pnl/models/pnl.models.ts`
- [x] T014 [P] [US2] Add "Commission" column (leg rows) and "# Trades" + "Commission" columns (group rows, ticker rows, grand-total card) to the PnL table in `web/src/app/features/pnl/pnl.component.ts`; display commission values via `CurrencyPipe`, omit "# Trades" on leg rows per FR-013
- [x] T015 [US2] Verify frontend compiles and lints clean: `docker compose run --rm --no-deps web sh -lc "npm ci && npm run lint && npm run build -- --configuration=production"`

**Checkpoint**: At this point, both User Stories 1 and 2 are fully functional — PnL is commission-adjusted, and transaction count + commission totals appear at all aggregation levels.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Full CI gate before push.

- [x] T016 Run full CI-equivalent checks to confirm backend + frontend pass together: `./scripts/ci_local.sh`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Satisfied by Phase 1 — confirms no migration needed
- **User Story 1 (Phase 3)**: Depends on Phase 1; no dependencies on US2
- **User Story 2 (Phase 4)**: Depends on US1 completion (backend schemas/service built; `LegPnL.commission` must exist before group aggregation)
- **Polish (Phase 5)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Start immediately after T001 — independent, no cross-story dependencies
- **US2 (P2)**: Backend portion (T006–T012) depends on US1 complete; frontend portion (T013–T015) can begin in parallel with US1 once T001 confirms no migration

### Within Each User Story

- Tests MUST be written and MUST FAIL before implementation
- Schemas before service (service references schema types)
- Backend service before frontend (frontend displays API data)

### Parallel Opportunities

- **T013 and T014** (frontend models + component) can run in parallel — different files, no shared dependency at implementation time
- **T003 and T006–T007** (write US2 tests) can overlap after T002 tests are written — T006/T007 do not depend on T003 passing

---

## Parallel Example: User Story 2 Frontend

```bash
# T013 and T014 can be executed simultaneously:
Task A: "Add new fields to TypeScript interfaces in web/src/app/features/pnl/models/pnl.models.ts"
Task B: "Add # Trades and Commission columns to pnl.component.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: confirm T001
2. Complete Phase 3: US1 (T002 → T003 → T004 → T005)
3. **STOP and VALIDATE**: `GET /api/pnl` returns corrected `realized_pnl` with `commission` field on legs
4. Deploy if ready

### Incremental Delivery

1. T001 → Phase 3 (US1) → validate API fix (**MVP**)
2. T006–T012 (US2 backend) → T013–T015 (US2 frontend) → validate PnL page shows new columns
3. T016 CI gate → push

### Parallel Team Strategy

With two developers after T001:

- **Developer A**: US1 backend (T002–T005)
- **Developer B**: US2 frontend prep (T013–T014) — can stub against the planned contract in `contracts/pnl.md`

Once US1 is done, Developer B integrates with the live API and Developer A moves to US2 backend (T006–T012).

---

## Notes

- `[P]` tasks = different files, no shared state — safe to run concurrently
- `[Story]` label maps each task to its user story for traceability
- No Alembic migration — confirm this before starting (T001)
- All `commission` API fields are positive/absolute — backend normalizes before returning; frontend displays as-is via `CurrencyPipe`
- Existing test fixtures all have `commission=0.00` — existing `realized_pnl` assertions remain unchanged
- Commit after each checkpoint to keep history bisectable
