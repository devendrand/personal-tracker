# TODO

This file tracks follow-up work that is intentionally deferred.

## Auth: dev token bootstrap (Production hardening)

**Modules**
- Trade Tracker Web (Angular): auth bootstrap + interceptor
- Trade Tracker API (FastAPI): dev token endpoint

**Context**
- The web app currently auto-acquires a dev JWT from `/api/auth/dev-token` when a token is missing, and also refreshes/retries once on `401` to make local dev smoother when the API restarts.
- We added a belt-and-suspenders guard so the bootstrap is a no-op in production builds (`environment.production || !isDevMode()`), but production should still remove/disable these dev-only behaviors entirely.

### TODOs

- [ ] **WEB / Production:** Ensure dev-token bootstrap is completely disabled/removed for production builds.
  - File: web/src/app/core/services/dev-token-bootstrap.service.ts
  - Verify: production build never calls `/api/auth/dev-token` and never reads/writes `localStorage['access_token']` except via real auth.

- [ ] **WEB / Production:** Ensure the interceptor’s dev-only behaviors are disabled/removed for production.
  - File: web/src/app/core/interceptors/auth.interceptor.ts
  - Includes:
    - Fetching a dev token when missing.
    - Refreshing token on `401` and retrying requests.
  - Verify: in production, `401` results in a clean sign-out / redirect-to-login flow.

- [ ] **WEB / Production:** Implement the real authentication UX.
  - Decide: login page vs redirect to external IdP; where token is stored; refresh strategy.
  - Verify: user can authenticate without dev endpoints; token expiry is handled.

- [ ] **API / Production:** Lock down or remove `/api/auth/dev-token`.
  - Ensure it is only available in dev mode (explicit config flag), never in production.
  - Verify: endpoint is not routable in prod deployments.

- [ ] **DOCS:** Document the production auth expectations and deployment configuration.
  - Include environment variables and what “dev mode” means for both API and web.
