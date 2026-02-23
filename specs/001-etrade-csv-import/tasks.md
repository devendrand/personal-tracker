---

description: "Task list for feature implementation"

---

# Tasks: E*TRADE CSV Transaction Import

**Input**: Design documents from `specs/001-etrade-csv-import/`

## Implementation Strategy

MVP is **User Story 1** (upload + import into store). Subsequent increments add (a) explicit “unassigned” discoverability and (b) tagging workflows.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align documentation and remove conflicting sources of truth.

- [X] T001 Confirm canonical spec is specs/001-etrade-csv-import/spec.md and remove/avoid any legacy drafts that could drift
- [X] T002 [P] Add feature quickstart in specs/001-etrade-csv-import/quickstart.md

**Critical consistency fixes**

- [X] T002a Create canonical implementation plan in docs/plan/M2-etrade-csv-import.md and keep specs/001-etrade-csv-import/plan.md in sync

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database + schemas required by all user stories.

- [X] T003 Create trade tracker SQLAlchemy models in api/app/models/trade.py (Transaction, Portfolio, ImportBatch)
- [X] T004 Update api/app/models/__init__.py to register trade models for Alembic
- [X] T005 [P] Create Pydantic schemas in api/app/schemas/trade.py (Transaction, Portfolio, ImportSummary)
- [X] T006 [P] Update api/app/schemas/__init__.py to export trade schemas
- [X] T007 Create Alembic migration for trade tables in api/alembic/versions/*_add_trade_tables.py

**Checkpoint**: DB schema + schemas exist; routers/services can persist data.

---

## Phase 3: User Story 1 - Import transactions from E*TRADE CSV (Priority: P1) 🎯 MVP

**Goal**: User uploads E*TRADE CSV and the system imports rows as-is into the transaction store.

**Independent Test**: Upload the sample CSV and confirm an import summary is returned and `GET /api/transactions` returns imported rows.

### Implementation (Backend)

- [X] T007a [US1] Write failing backend tests for CSV validation + parsing + upload import summary (pytest)
- [X] T008 [P] [US1] Implement E*TRADE CSV parser in api/app/services/etrade_csv_parser.py
- [X] T009 [P] [US1] Implement import service in api/app/services/transaction_import_service.py (uses parser + models)
- [X] T010 [US1] Implement POST /api/transactions/upload multipart endpoint in api/app/routers/transactions.py
- [X] T011 [US1] Implement GET /api/transactions list endpoint with pagination in api/app/routers/transactions.py

**Coverage fixes (FR-002, FR-005, FR-007, FR-009)**

- [X] T011a [US1] Validate required columns and reject malformed files with clear error (FR-002)
- [X] T011b [US1] Persist raw row fields/content for traceability (FR-005)
- [X] T011c [US1] Implement duplicate prevention across uploads per dedupe key (FR-007)
- [X] T011d [US1] Implement stable pseudo account identifier behavior for import batches (FR-009)

### Implementation (Frontend)

- [X] T012 [P] [US1] Update transaction UI model for nullable fields in web/src/app/shared/models/transaction.model.ts
- [X] T013 [US1] Wire Upload CSV button to file picker + upload call in web/src/app/features/transactions/transactions.component.ts
- [X] T014 [US1] Wire Dashboard Upload Transactions button to navigate to /transactions in web/src/app/features/dashboard/dashboard.component.ts

**Checkpoint**: Uploading CSV imports and lists transactions in the UI.

---

## Phase 4: User Story 2 - Imports do not auto-tag portfolios (Priority: P2)

**Goal**: All imported transactions are explicitly unassigned to any portfolio and discoverable as such.

**Independent Test**: After import, verify imported transactions are marked unassigned and can be queried as unassigned.

- [X] T015 [US2] Ensure imported transactions default to unassigned in api/app/services/transaction_import_service.py
- [X] T016 [US2] Add `assigned` filter support to GET /api/transactions in api/app/routers/transactions.py
- [X] T017 [P] [US2] Extend import summary response with unassigned count in api/app/schemas/trade.py
- [X] T018 [US2] Display import summary in web/src/app/features/transactions/transactions.component.ts

**Checkpoint**: Unassigned is first-class and visible.

---

## Phase 5: User Story 3 - Tag unassigned transactions later (Priority: P3)

**Goal**: Users can filter to unassigned transactions and tag them to a strategy portfolio on a later visit.

**Independent Test**: Create a portfolio, tag an unassigned transaction to it, and confirm it no longer appears in the unassigned list.

### Implementation (Backend)

- [X] T018a [US3] Write failing backend tests for auth scoping (users cannot view/tag others' data) (FR-012)
- [X] T019 [US3] Implement persisted portfolio list/create endpoints in api/app/routers/portfolios.py
- [X] T020 [US3] Implement transaction tagging endpoint in api/app/routers/transactions.py (assign portfolio to transaction)

**Coverage fixes (FR-012)**

- [X] T020a [US3] Enforce user scoping in all transactions/portfolios endpoints (FR-012)

### Implementation (Frontend)

- [X] T021 [P] [US3] Add portfolio API methods in web/src/app/core/services/api.service.ts (or a new feature service)
- [X] T022 [US3] Add "Unassigned" filter/toggle in web/src/app/features/transactions/transactions.component.ts
- [X] T023 [US3] Add per-transaction portfolio tagging UI in web/src/app/features/transactions/transactions.component.ts
- [X] T024 [P] [US3] Ensure portfolios list is loaded/visible in web/src/app/features/portfolios/portfolios.component.ts

**Checkpoint**: Users can assign imported transactions to a portfolio later.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T025 [P] Update feature documentation and usage steps in specs/001-etrade-csv-import/quickstart.md
- [X] T026 Add backend error handling + user-friendly import errors in api/app/routers/transactions.py
- [X] T027 Add basic logging for imports and tagging in api/app/routers/transactions.py

---

## Testing (TDD requirement)

The repository constitution requires test-first development. Add/maintain tests that cover:

- CSV structure validation and parsing
- Import idempotency / duplicate prevention
- Authorization and user scoping for import/list/tag operations

---

## Dependencies & Execution Order

### Dependency Graph (User Stories)

US1 → US2 → US3

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Phase 1
- **US1–US3**: depend on Phase 2
- **Polish**: depends on desired user stories

### User Story Dependencies

- **US1 (P1)**: no dependencies besides Foundational
- **US2 (P2)**: depends on US1 (unassigned behavior rides on import + listing)
- **US3 (P3)**: depends on US1 + US2 (needs imported, unassigned transactions)

## Parallel Execution Examples

### User Story 1

- [P] Implement E*TRADE CSV parser in api/app/services/etrade_csv_parser.py
- [P] Update transaction UI model in web/src/app/shared/models/transaction.model.ts

### User Story 3

- [P] Add portfolio API methods in web/src/app/core/services/api.service.ts (or new service)
- [P] Ensure portfolios list is loaded/visible in web/src/app/features/portfolios/portfolios.component.ts

### User Story 2

- [P] Extend import summary response with unassigned count in api/app/schemas/trade.py
