# Implementation Plan: Fix Dev Authentication Reliability

**Branch**: `004-fix-dev-auth` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-fix-dev-auth/spec.md`

---

## Summary

The dev auth system has two bugs causing persistent 401 Unauthorized errors:

1. **Static backend token**: `security.py` creates `DEV_TOKEN` once at module load using a 30-minute expiry. The `/auth/dev-token` endpoint returns this same stale token forever — after 30 minutes it is expired and all requests fail permanently.
2. **No client-side expiry check**: `DevTokenBootstrapService` skips the token fetch if `localStorage` already contains a token, without checking whether that token is still valid. An expired token in storage causes the bootstrap to silently no-op.

**Fix**: (1) Make `get_dev_token()` generate a fresh token per call. (2) Add a JWT expiry check in the bootstrap service before the early-return guard.

No database changes. No new dependencies. Production auth flow is unaffected.

---

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript / Angular 19 (frontend)
**Primary Dependencies**: FastAPI, python-jose (JWT), Angular HttpClient
**Storage**: `localStorage` (client-side token cache only) — no DB changes
**Testing**: `pytest` + `httpx` (backend), Angular Karma/Jasmine (frontend)
**Target Platform**: Local development environment (Docker)
**Project Type**: Web application (FastAPI backend + Angular frontend)
**Performance Goals**: No performance impact — changes are trivially cheap (one JWT sign per request)
**Constraints**: Fix MUST NOT affect production auth flow; dev endpoint MUST remain dev-only
**Scale/Scope**: 2 files changed in backend, 1 file changed in frontend, 2 test files added/updated

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Modular Architecture | PASS | Changes scoped to `api/app/core/`, `api/app/routers/`, `web/src/app/core/services/` |
| II. Spec-Driven Workflow | PASS | spec.md → plan.md → tasks.md → implement |
| III. TDD | PASS | Tests written first, must fail before implementation |
| IV. Tech Stack Adherence | PASS | Python 3.12, FastAPI, Angular 19 — no new dependencies |
| V. API Conventions | PASS | `GET /auth/dev-token` remains RESTful; response schema unchanged |
| VI. Modern Coding Standards | PASS | Type hints, async/await, `inject()`, signals unchanged |
| VII. Container-First | PASS | No Docker changes needed |
| VIII. Version Control | PASS | Branch `004-fix-dev-auth` cut from `main` |
| IX. CI Checks | PASS | Backend lint + tests; frontend lint + build required before push |

No violations. Complexity tracking not required.

---

## Project Structure

### Documentation (this feature)

```text
specs/004-fix-dev-auth/
├── spec.md                              ✅ done
├── plan.md                              ✅ this file
├── research.md                          ✅ done
├── contracts/
│   └── dev-token-endpoint.md           ✅ done
├── quickstart.md                        ✅ done
├── checklists/
│   └── requirements.md                 ✅ done
└── tasks.md                             ⏳ /speckit.tasks
```

### Source Code (affected files only)

```text
api/
├── app/
│   ├── core/
│   │   └── security.py         # Remove DEV_TOKEN module-level constant
│   └── routers/
│       └── auth.py             # get_dev_token() generates token inline
└── tests/
    └── test_auth.py            # Tests for GET /auth/dev-token freshness

web/src/app/core/
├── services/
│   └── dev-token-bootstrap.service.ts          # Add JWT expiry check
└── services/
    └── dev-token-bootstrap.service.spec.ts     # Unit tests for expiry logic
```

---

## Implementation Phases

### Phase A — Backend Fix (independent, no frontend dependency)

#### A1: Remove static `DEV_TOKEN` constant

**File**: `api/app/core/security.py`

Remove line 69:
```python
# DELETE this line:
DEV_TOKEN = create_access_token({"sub": "dev_user", "dev": True})
```

#### A2: Update `get_dev_token` endpoint

**File**: `api/app/routers/auth.py`

- Remove `DEV_TOKEN` from the import on line 9
- Update `get_dev_token()` to generate a fresh token per call:

```python
@router.get("/dev-token", response_model=Token)
async def get_dev_token() -> Token:
    """Get a development token for testing.

    WARNING: Remove this endpoint in production!
    Generates a fresh token on every call to avoid expiry issues during development.
    """
    access_token = create_access_token(
        data={"sub": "dev_user", "dev": True},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return Token(access_token=access_token)
```

#### A3: Backend tests (write FIRST — must fail before A1/A2)

**File**: `api/tests/test_auth.py`

Tests to write:
- `test_dev_token_returns_200` — endpoint returns HTTP 200
- `test_dev_token_returns_access_token` — response contains `access_token` field
- `test_dev_token_is_decodable` — token decodes to payload with `sub = "dev_user"`
- `test_dev_token_has_future_expiry` — decoded `exp` is in the future
- `test_dev_token_fresh_per_call` — two consecutive calls return tokens with different `exp` values (sleep 1s between calls)

---

### Phase B — Frontend Fix (independent of Phase A at code level, but logically dependent)

#### B1: Add JWT expiry check in bootstrap service

**File**: `web/src/app/core/services/dev-token-bootstrap.service.ts`

Add a private helper `isTokenValid(token: string): boolean` that:
1. Splits the JWT on `.` to get the payload segment
2. Base64-decodes the payload segment (`atob`)
3. Parses as JSON
4. Returns `Date.now() < payload.exp * 1000`
5. Returns `false` on any error (malformed token)

Update `ensureDevToken()` to replace:
```typescript
const existing = localStorage.getItem('access_token');
if (existing) {
  return;
}
```
with:
```typescript
const existing = localStorage.getItem('access_token');
if (existing && this.isTokenValid(existing)) {
  return;
}
if (existing) {
  localStorage.removeItem('access_token');
}
```

#### B2: Frontend unit tests (write FIRST — must fail before B1)

**File**: `web/src/app/core/services/dev-token-bootstrap.service.spec.ts`

Tests to write:
- `should skip fetch when valid token exists in localStorage` — mock localStorage with a non-expired JWT, verify no HTTP call is made
- `should fetch new token when localStorage token is expired` — mock localStorage with an expired JWT, verify HTTP call is made to `/auth/dev-token`
- `should fetch new token when localStorage is empty` — no token in storage, verify HTTP call is made
- `should clear expired token before fetching` — expired token in storage; after `ensureDevToken()` resolves, verify localStorage has the new token (not the old expired one)
- `should handle malformed token gracefully` — put garbage in localStorage, verify it clears and fetches

---

## Dependency Order

```
A3 (write backend tests) → A1 + A2 (backend fix) → verify A3 tests pass
B2 (write frontend tests) → B1 (frontend fix)     → verify B2 tests pass
A + B independent of each other — can be done in parallel
```

---

## Verification

After both phases complete, run the quickstart validation steps in `quickstart.md`:

1. Fresh load — zero 401s in Network tab
2. Simulate expired token — app auto-recovers
3. Consecutive `/auth/dev-token` calls — different `exp` values
4. All automated tests pass
