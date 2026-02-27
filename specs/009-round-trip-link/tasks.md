# Tasks: Round-Trip Linking

**Feature**: Round-Trip Linking  
**Branch**: `009-round-trip-link`  
**Spec**: `specs/009-round-trip-link/spec.md`  
**Plan**: `specs/009-round-trip-link/plan.md`

## Implementation Strategy

**MVP Scope**: User Story 1 (Link Transactions) — Core grouping functionality must work first.  
**Incremental Delivery**: Each user story builds on the previous, but API endpoints can be tested independently.

---

## Phase 1: Database Migration

**Goal**: Add the `round_trip_group` table and update `transaction` with FK.

### Implementation

- [x] T001 Create Alembic migration for round_trip_group table in `api/alembic/versions/`
- [x] T002 Run migration to create table and add FK column to transaction

---

## Phase 2: Backend Foundational

**Goal**: Create model, schemas, and wire up router. Blocks all user stories.

### Implementation

- [x] T003 Add `RoundTripGroup` model to `api/app/models/trade.py`
- [x] T004 Add `round_trip_group_id` FK relationship to `Transaction` model in `api/app/models/trade.py`
- [x] T005 Create Pydantic schemas in `api/app/schemas/round_trip.py`
- [x] T006 Create `api/app/routers/round_trip.py` with router definition
- [x] T007 Update `api/app/routers/__init__.py` to export round_trip_router
- [x] T008 Update `api/app/main.py` to include round_trip_router

---

## Phase 3: User Story 1 - Link Transactions into a Round-Trip Group (P1)

**Goal**: Users can select multiple transactions and create a round-trip group.

**Independent Test**: Select 2+ unlinked transactions → Link → Verify group badge appears.

### Tests (TDD)

- [x] T009 [US1] Write unit tests for link_transactions endpoint in `api/tests/test_round_trip.py`
- [x] T010 [US1] Write tests for conflict detection (already-grouped transactions)

### Implementation

- [x] T011 [US1] Implement `POST /round-trips/link` endpoint in `api/app/routers/round_trip.py`
- [x] T012 [US1] Add validation: minimum 2 transactions, same symbol, all unlinked
- [x] T013 [US1] Implement conflict detection and 409 response
- [x] T014 [US1] Update `api/app/schemas/trade.py` to include `round_trip_group_id` in TransactionResponse

### Frontend

- [x] T015 [US1] Add round-trip types to `web/src/app/shared/models/transaction.model.ts`
- [x] T016 [US1] Add round-trip API methods to `web/src/app/core/services/api.service.ts`
- [x] T017 [US1] Add checkbox selection column to transactions table in `web/src/app/features/transactions/transactions.component.ts`
- [x] T018 [US1] Add "Link" button and confirmation dialog to transactions component
- [x] T019 [US1] Display group badge on linked transactions

---

## Phase 4: User Story 2 - Add Transactions to an Existing Group (P2)

**Goal**: Users can add unlinked transactions to an existing group.

**Independent Test**: Create group → Select group member + unlinked transaction → Add to Group → Verify badge.

### Tests (TDD)

- [x] T020 [US2] Write unit tests for add_to_group endpoint

### Implementation

- [x] T021 [US2] Implement `POST /round-trips/{group_id}/add` endpoint
- [x] T022 [US2] Add validation: target group exists, symbol matches, transactions unlinked
- [x] T023 [US2] Implement conflict detection for add operation

### Frontend

- [x] T024 [US2] Add "Add to Group" action when selection includes group member + unlinked transactions

---

## Phase 5: User Story 3 - Remove Transactions from a Group (P3)

**Goal**: Users can remove transactions from a group or disband entire group.

**Independent Test**: Select grouped transaction → Ungroup → Verify badge removed.

### Tests (TDD)

- [x] T025 [US3] Write unit tests for remove_from_group endpoint
- [x] T026 [US3] Write tests for group disbandment (2-member edge case)

### Implementation

- [x] T027 [US3] Implement `POST /round-trips/{group_id}/remove` endpoint
- [x] T028 [US3] Handle group disbandment when removing leaves < 2 members
- [x] T029 [US3] Implement `DELETE /round-trips/{group_id}` endpoint for explicit disband

### Frontend

- [x] T030 [US3] Add "Ungroup" action for selected grouped transactions
- [x] T031 [US3] Add "Ungroup All" option to disband entire group

---

## Phase 6: Additional API Endpoints

**Goal**: Complete API surface for group management and frontend integration.

### Implementation

- [x] T032 Implement `GET /round-trips` list endpoint
- [x] T033 Implement `GET /round-trips/{group_id}` detail endpoint with members

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Final integration, edge cases, and verification.

### Implementation

- [x] T034 Add group badge expansion (view all members) in frontend
- [x] T035 Verify atomicity: test rollback on partial failure
- [x] T036 Verify ownership enforcement: ensure users cannot access other users' groups

### CI Checks

- [x] T037 Run backend CI: `cd api && uv run ruff check . && uv run ruff format --check . && uv run mypy app --ignore-missing-imports && uv run pytest`
- [x] T038 Run frontend CI: `cd web && npm run lint && npm run build -- --configuration=production`

---

## Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─────────────────────────┐
    │                                            │
    ▼                                            │
Phase 3 (US1) ◄──────────────────────────────────┤
    │                                            │
    ▼                                            │
Phase 4 (US2) ───────────────────────────────────┤
    │                                            │
    ▼                                            │
Phase 5 (US3) ───────────────────────────────────┤
    │                                            │
    ▼                                            │
Phase 6 (Additional APIs) ───────────────────────┤
    │                                            │
    ▼                                            │
Phase 7 (Polish) ◄────────────────────────────────┘
```

---

## Parallel Opportunities

| Phase | Parallel Tasks |
|-------|----------------|
| Phase 2 | T003-T004 (model), T005 (schemas), T006 (router) can be done in parallel |
| Phase 3 | T011-T014 (backend), T015-T019 (frontend) are independent |
| Phase 4 | T021-T023 (backend), T024 (frontend) are independent |
| Phase 5 | T027-T029 (backend), T030-T031 (frontend) are independent |

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 38 |
| **User Story 1 (P1)** | 11 tasks |
| **User Story 2 (P2)** | 4 tasks |
| **User Story 3 (P3)** | 7 tasks |
| **Setup/Foundational** | 8 tasks |
| **Polish/CI** | 4 tasks |

**MVP Scope**: Tasks T001-T019 — Core linking functionality (User Story 1)