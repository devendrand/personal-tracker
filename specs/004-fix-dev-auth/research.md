# Research: Fix Dev Authentication Reliability

**Branch**: `004-fix-dev-auth` | **Date**: 2026-02-26

---

## Finding 1: Static DEV_TOKEN Root Cause

**Decision**: Remove the module-level `DEV_TOKEN` constant and generate a fresh token on every `/auth/dev-token` request.

**Rationale**: `security.py:69` creates `DEV_TOKEN = create_access_token({"sub": "dev_user", "dev": True})` once at import time using the default 30-minute expiry. The `get_dev_token` endpoint at `auth.py:50` returns this same static value for the lifetime of the backend process. After 30 minutes, it is expired — but the endpoint keeps returning it. The interceptor's retry logic fetches this expired token, stores it, retries the request with it, gets another 401, and gives up (blocked by `DID_RETRY` flag).

**Fix**: `get_dev_token()` must call `create_access_token()` inline on every request. The `DEV_TOKEN` constant in `security.py` can be removed entirely — no other code references it except the import in `auth.py`.

**Alternatives considered**:
- *Long-lived static token (e.g., 30-day expiry)*: Quick but fragile — forces restarts to pick up secret key changes; wrong signal for future real-auth work.
- *Token refresh endpoint*: Overkill for a dev-only stub.

---

## Finding 2: Bootstrap Service Does Not Validate Existing Token Expiry

**Decision**: Add a JWT expiry check in `DevTokenBootstrapService.ensureDevToken()` before the early-return on existing token.

**Rationale**: `dev-token-bootstrap.service.ts:19-22` returns immediately if `localStorage` contains `access_token`, regardless of whether that token is still valid. This means an expired token in `localStorage` causes the bootstrap to silently succeed while all subsequent API requests fail with 401. The fix is to decode the JWT payload (base64, client-side — no library needed) and compare `exp * 1000` against `Date.now()`. If expired or malformed, clear the token and proceed to fetch a fresh one.

**Fix**: Replace the simple `if (existing) return` guard with an expiry-aware check:
```
if (existing && isTokenValid(existing)) return;
localStorage.removeItem('access_token');
// proceed to fetch
```
where `isTokenValid` decodes the JWT payload and checks `exp`.

**Alternatives considered**:
- *Let the interceptor handle it via 401 retry*: This works for the token-expired path but still leaves a burst of 401s on first navigation after expiry. The bootstrap service fixing it earlier is cleaner.
- *Store expiry timestamp separately in localStorage*: Redundant — the `exp` claim is already in the token.

---

## Finding 3: Interceptor On-Demand Bootstrap Path Is Correct

**Decision**: No changes needed to the on-demand bootstrap in `auth.interceptor.ts:81-98`.

**Rationale**: When a request fires with no token, the interceptor calls `bootstrapDevToken()` via `HttpClient`, stores the result, and retries with `DID_RETRY=true`. This is correct. The only reason it fails today is that the backend returns an expired static token. Once Finding 1 is fixed (fresh token on every request), this path will work reliably.

---

## Finding 4: `provideAppInitializer` Already Blocks Routing

**Decision**: No changes needed to `app.config.ts`.

**Rationale**: Angular's `provideAppInitializer` awaits the returned `Promise<void>` before completing the bootstrap phase. Since `ensureDevToken()` returns a `Promise`, routing is already blocked until the promise resolves. The observed race condition is not caused by a missing `await` — it is caused by the bootstrap silently succeeding with an expired token (Finding 2). Once Finding 2 is fixed, the initializer correctly gates routing.

---

## Affected Files

| File | Change |
|------|--------|
| `api/app/core/security.py` | Remove `DEV_TOKEN` module-level constant |
| `api/app/routers/auth.py` | `get_dev_token()` calls `create_access_token()` inline; remove `DEV_TOKEN` import |
| `web/src/app/core/services/dev-token-bootstrap.service.ts` | Add expiry check before early-return on existing token |
| `api/tests/test_auth.py` | New / updated tests for `GET /auth/dev-token` |
| `web/src/app/core/services/dev-token-bootstrap.service.spec.ts` | New tests for expiry-aware bootstrap logic |

No database migrations. No new dependencies. No changes to production auth flow.
