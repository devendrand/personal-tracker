# Feature Specification: Fix Dev Authentication Reliability

**Feature Branch**: `004-fix-dev-auth`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "Fix dev authentication reliability: the /api/auth/dev-token endpoint returns a static token created once at backend startup, causing persistent 401 Unauthorized errors when the token expires mid-session. Additionally, Angular requests fire before the token bootstrap promise resolves, creating a race condition on initial load and page navigation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated Page Load (Priority: P1)

A developer opens the application in their browser. All pages load without a 401 Unauthorized error flash, regardless of how long the backend has been running. The app never shows a blank page or an unexpected error due to an expired or missing token.

**Why this priority**: This is the most visible failure — every page load currently results in a burst of 401 errors before the token bootstrap catches up. Fixing this unblocks all development and testing workflows.

**Independent Test**: Open the app in a fresh browser tab after the backend has been running for more than 30 minutes. Navigate to the Transactions page. No 401 errors should appear in the network tab and data should load on the first attempt.

**Acceptance Scenarios**:

1. **Given** the app is opened in a fresh browser tab, **When** the initial route loads, **Then** all API requests succeed on the first attempt with no 401 errors.
2. **Given** the backend has been running for longer than the token expiry window, **When** any page is navigated to, **Then** a fresh valid token is obtained and all API requests succeed without manual intervention.
3. **Given** the app is refreshed (F5), **When** the page reloads, **Then** API requests succeed on the first load without an intermediate 401 burst.

---

### User Story 2 - Stable Navigation Between Pages (Priority: P2)

A developer navigates between different sections of the app (e.g., Transactions → Dashboard → Net Worth). Each section loads its data correctly without triggering repeated authentication failures or requiring a manual refresh.

**Why this priority**: The race condition manifests on every in-app navigation, not just initial load. Until this is fixed, navigating between pages produces intermittent 401 bursts, making the app unreliable to use during development.

**Independent Test**: Navigate between at least three different pages in sequence. Each page should load its data on the first request without any 401 errors in the network tab.

**Acceptance Scenarios**:

1. **Given** the app is on the Transactions page, **When** the user navigates to the Dashboard, **Then** the Dashboard data loads successfully without any 401 errors.
2. **Given** the user has navigated through multiple pages, **When** they return to a previously-visited page, **Then** the data loads correctly without re-triggering the authentication bootstrap cycle.
3. **Given** a valid token is already stored, **When** any API request is made, **Then** the existing token is reused and no unnecessary calls to the dev-token endpoint are made.

---

### Edge Cases

- What happens when the dev-token endpoint itself is temporarily unreachable during bootstrap?
- What happens if the app is left open for an extended period and the stored token expires while the user is idle?
- What happens when multiple simultaneous API requests fire during the bootstrap window?
- How does the system behave if localStorage is unavailable (e.g., private browsing with restrictions)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dev-token endpoint MUST generate and return a fresh token on every request, not a pre-computed static token.
- **FR-002**: The application bootstrap MUST complete token acquisition before any authenticated API route is allowed to render or fire requests.
- **FR-003**: The token storage mechanism MUST be consistent — all requests MUST read from the same storage location that the bootstrap writes to.
- **FR-004**: On receiving a 401 response, the system MUST attempt to obtain a fresh token and retry the failed request exactly once.
- **FR-005**: The retry mechanism MUST NOT enter an infinite loop — a second 401 after retry MUST be treated as a terminal failure for that request.
- **FR-006**: The dev authentication flow MUST only be active in non-production environments; production builds MUST NOT expose or call the dev-token endpoint.

### Key Entities

- **Dev Token**: A short-lived credential issued by the backend for local development; has an expiry time and identifies a fixed dev user.
- **Token Bootstrap**: The client-side process that acquires and stores the dev token before the application becomes interactive.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero 401 Unauthorized errors appear in the browser network tab on initial page load after a clean app start.
- **SC-002**: Zero 401 Unauthorized errors appear when navigating between any two pages in the application.
- **SC-003**: The application remains fully functional after being left open for a duration longer than the default token expiry window (30 minutes), without requiring a manual browser refresh.
- **SC-004**: The dev-token endpoint is called at most once per page load cycle; repeat navigation does not trigger redundant token fetches when a valid token is already stored.

## Assumptions

- This fix applies to the **development environment only**; production uses proper user authentication (JWT via login flow) which is not affected.
- The default token expiry is 30 minutes as configured via `ACCESS_TOKEN_EXPIRE_MINUTES`.
- The fix does not require changes to how the production authentication flow works.
- localStorage is available in all supported development browsers.
