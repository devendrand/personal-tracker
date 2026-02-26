---
description: "Task list for Fix Dev Authentication Reliability"
---

# Tasks: Fix Dev Authentication Reliability

**Input**: Design documents from `/specs/004-fix-dev-auth/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Tests are REQUIRED per Constitution Principle III (TDD). Write tests first, ensure they FAIL, then implement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm existing test infrastructure is in place before writing new tests.

- [x] T001 Run existing backend test suite to establish passing baseline in `api/` (`uv run pytest -v`)
- [x] T002 [P] Confirm frontend test runner is configured in `web/` (`npx ng test --watch=false --browsers=ChromeHeadless`)

---

## Phase 2: User Story 1 — Authenticated Page Load (Priority: P1) 🎯 MVP

**Goal**: Eliminate persistent 401 errors caused by the backend returning an expired static token. Every call to `GET /api/auth/dev-token` must return a freshly minted, valid token.

**Independent Test**: After the backend fix, call `GET /api/auth/dev-token` twice (1 second apart) and verify the two tokens have different `exp` values. Load the app in a fresh browser tab — zero 401 errors in the network tab.

### Tests for User Story 1 (REQUIRED — write FIRST, verify FAIL before T009) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementing T009–T010**

- [x] T003 [P] [US1] Add test `test_dev_token_returns_200` asserting `GET /api/auth/dev-token` returns HTTP 200 in `api/tests/test_auth.py`
- [x] T004 [P] [US1] Add test `test_dev_token_response_contains_access_token` asserting response body has `access_token` string field in `api/tests/test_auth.py`
- [x] T005 [P] [US1] Add test `test_dev_token_payload_has_dev_user_sub` asserting decoded token contains `sub == "dev_user"` in `api/tests/test_auth.py`
- [x] T006 [P] [US1] Add test `test_dev_token_has_future_expiry` asserting decoded `exp` claim is greater than current UTC timestamp in `api/tests/test_auth.py`
- [x] T007 [P] [US1] Add test `test_dev_token_fresh_per_call` asserting two consecutive calls return tokens with **different** `exp` values (sleep 1s between calls) in `api/tests/test_auth.py`
- [x] T008 [US1] Run backend tests to confirm T007 (`test_dev_token_fresh_per_call`) fails with current static token implementation (`uv run pytest tests/test_auth.py -v`)

### Implementation for User Story 1

- [x] T009 [US1] Remove module-level `DEV_TOKEN` constant (line 69) from `api/app/core/security.py`
- [x] T010 [US1] Update `get_dev_token()` in `api/app/routers/auth.py`: remove `DEV_TOKEN` import, generate token inline via `create_access_token(data={"sub": "dev_user", "dev": True}, expires_delta=timedelta(minutes=settings.access_token_expire_minutes))`
- [x] T011 [US1] Run backend tests to confirm all T003–T007 now pass (`uv run pytest tests/test_auth.py -v`)

**Checkpoint**: Backend fix complete. `GET /api/auth/dev-token` returns a fresh valid token on every request. US1 backend is independently testable — restart the backend and verify no stale token is ever returned.

---

## Phase 3: User Story 2 — Stable Navigation Between Pages (Priority: P2)

**Goal**: Ensure the Angular bootstrap service validates token expiry before returning early. An expired token in `localStorage` must be cleared and a fresh one fetched, so navigation after the 30-minute expiry window works without any 401s.

**Independent Test**: Manually set an expired JWT in `localStorage` (see `quickstart.md` Test 2), navigate to any page, and confirm data loads successfully with zero 401 errors — no manual refresh required.

### Tests for User Story 2 (REQUIRED — write FIRST, verify FAIL before T017) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementing T017–T018**

- [x] T012 [P] [US2] Add test `should skip fetch when valid token exists in localStorage` — mock `localStorage` with a non-expired JWT, assert `fetch` is NOT called in `web/src/app/core/services/dev-token-bootstrap.service.spec.ts`
- [x] T013 [P] [US2] Add test `should fetch new token when localStorage token is expired` — mock `localStorage` with an expired JWT, assert `fetch` IS called in `web/src/app/core/services/dev-token-bootstrap.service.spec.ts`
- [x] T014 [P] [US2] Add test `should fetch new token when localStorage is empty` — no token in storage, assert `fetch` IS called in `web/src/app/core/services/dev-token-bootstrap.service.spec.ts`
- [x] T015 [P] [US2] Add test `should clear expired token before fetching` — expired token in storage, after `ensureDevToken()` resolves assert `localStorage` has the **new** token (not the original expired one) in `web/src/app/core/services/dev-token-bootstrap.service.spec.ts`
- [x] T016 [P] [US2] Add test `should handle malformed token gracefully` — put non-JWT garbage in `localStorage`, assert it is cleared and a fresh token is fetched in `web/src/app/core/services/dev-token-bootstrap.service.spec.ts`
- [x] T017 [US2] Run frontend unit tests to confirm T013–T016 fail with current implementation (`npx ng test --include="**/dev-token-bootstrap.service.spec.ts" --watch=false --browsers=ChromeHeadless`)

### Implementation for User Story 2

- [x] T018 [US2] Add private `isTokenValid(token: string): boolean` method to `DevTokenBootstrapService` in `web/src/app/core/services/dev-token-bootstrap.service.ts`: split on `.`, base64-decode middle segment with `atob()`, parse JSON, return `Date.now() < payload.exp * 1000`; return `false` on any error
- [x] T019 [US2] Update `ensureDevToken()` in `web/src/app/core/services/dev-token-bootstrap.service.ts`: replace `if (existing) { return; }` with `if (existing && this.isTokenValid(existing)) { return; }` followed by `if (existing) { localStorage.removeItem('access_token'); }`
- [x] T020 [US2] Run frontend unit tests to confirm all T012–T016 now pass (`npx ng test --include="**/dev-token-bootstrap.service.spec.ts" --watch=false --browsers=ChromeHeadless`)

**Checkpoint**: Frontend fix complete. Bootstrap service reliably detects and replaces expired tokens. Both user stories are now independently functional.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: CI compliance and end-to-end validation.

- [x] T021 Run full backend test suite to confirm zero regressions (`cd api && uv run pytest -v`)
- [x] T022 [P] Run backend lint and type check in `api/` (`uv run ruff check . && uv run ruff format --check . && uv run mypy app --ignore-missing-imports`)
- [x] T023 [P] Run frontend lint in `web/` (`npm run lint`)
- [x] T024 [P] Run frontend production build to confirm no TypeScript errors in `web/` (`npm run build -- --configuration=production`)
- [x] T025 Perform manual end-to-end verification per `specs/004-fix-dev-auth/quickstart.md` (Tests 1–3)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Baseline)**: No dependencies — run immediately
- **Phase 2 (US1 — Backend)**: Depends on Phase 1
- **Phase 3 (US2 — Frontend)**: Depends on Phase 1; **logically benefits from Phase 2** (frontend will call the fixed backend) but can be written and unit-tested independently
- **Phase 4 (Polish)**: Depends on Phase 2 + Phase 3 both complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after baseline — no dependencies on US2
- **US2 (P2)**: Can start after Phase 1 — unit tests are fully independent of backend; integration relies on US1 being done first

### Within Each User Story

- Tests MUST be written and MUST FAIL before implementation
- T008 (fail verification) before T009–T010 (backend implementation)
- T017 (fail verification) before T018–T019 (frontend implementation)
- T009 before T010 (remove constant before updating import)
- T018 before T019 (helper method before calling it)

### Parallel Opportunities

- T003–T007 (backend test writing) can all run in parallel
- T012–T016 (frontend test writing) can all run in parallel
- T003–T007 and T012–T016 can run in parallel across backend and frontend
- T022, T023, T024 (lint/type check/build) can all run in parallel

---

## Parallel Example: Write All Tests Together

```bash
# Backend tests (T003–T007) — all to same file, write in one pass:
Task: "Write test_dev_token_returns_200 in api/tests/test_auth.py"
Task: "Write test_dev_token_fresh_per_call in api/tests/test_auth.py"

# Frontend tests (T012–T016) — all to same file, write in one pass:
Task: "Write all DevTokenBootstrapService expiry tests in web/src/app/core/services/dev-token-bootstrap.service.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline verification
2. Complete Phase 2: US1 backend fix (T003–T011)
3. **STOP and VALIDATE**: Run quickstart Test 3 (token freshness) and Test 1 (page load)
4. App is already significantly more stable — backend never returns a stale token

### Incremental Delivery

1. Phase 1 + Phase 2 → Backend fix live, app survives 30-minute sessions
2. Phase 3 → Frontend fix added, bootstrap service also validates expiry client-side
3. Phase 4 → CI clean, manual verification complete, ready for PR

---

## Notes

- [P] tasks = different files or no inter-task dependency, safe to run in parallel
- Backend tests use `httpx.AsyncClient` via existing `client` fixture in `conftest.py`
- Frontend tests use Angular `TestBed` with `HttpClientTestingModule` to mock HTTP calls
- `isTokenValid()` uses `atob()` (available in all modern browsers) — no additional library needed
- `DEV_TOKEN` in `security.py` is only referenced in `auth.py` — safe to remove outright
- Production auth flow (`/api/auth/token` POST) is completely unaffected by these changes
