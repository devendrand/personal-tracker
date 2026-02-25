# Feature Specification: Remove Portfolio Create Page

**Feature Branch**: `feature/remove-portfolio-create`  
**Created**: 2026-02-24  
**Status**: Draft  
**Input**: User description: "Create specification to remove the portfolio create page and related code based on the Module A strategy tagging addendum"

## Clarifications

### Session 2026-02-24

- Q: How should the API behave for portfolio creation after removal? → A: Remove the `POST /api/portfolios` handler so the API returns `405 Method Not Allowed` while preserving `GET` endpoints.
- Q: Should the Portfolios screen remain in the UI? → A: Keep the `/portfolios` route and main navigation entry, but make the screen read-only (no create actions).
- Q: Should PRD docs be updated to remove portfolio creation references? → A: Yes—update PRD docs to remove/strike portfolio creation references so requirements match behavior.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - No portfolio creation from the app (Priority: P1)

As a user, I can no longer create a portfolio from the application.

**Why this priority**: This is the requested change and the highest-impact scope reduction.

**Independent Test**: Can be tested by navigating through the app and confirming there is no “Create Portfolio” workflow, button, or page.

**Acceptance Scenarios**:

1. **Given** I open the Portfolios area, **When** the screen renders, **Then** I do not see any action that creates a portfolio.
2. **Given** I have no portfolios, **When** the empty-state screen renders, **Then** it does not present a portfolio creation call-to-action.

---

### User Story 2 - Portfolio creation is not supported by the API (Priority: P1)

As a user (or client), I cannot create a portfolio through the system’s API.

**Why this priority**: Removing “related backend API” prevents backdoor creation and aligns behavior across UI and API.

**Independent Test**: Can be tested by attempting a portfolio creation request and confirming the system rejects it.

**Acceptance Scenarios**:

1. **Given** I am authenticated, **When** I submit a portfolio creation request, **Then** the system rejects the request (method not supported).

---

### User Story 3 - Continue using existing portfolios (Priority: P2)

As a user, I can continue to use any portfolios that already exist.

**Why this priority**: Removing creation must not break existing portfolio reads or transaction-to-portfolio associations.

**Independent Test**: Can be tested by verifying existing portfolios are still visible and transactions can still be associated with an existing portfolio.

**Acceptance Scenarios**:

1. **Given** portfolios already exist for me, **When** I view my portfolios, **Then** I can still see them.
2. **Given** an existing portfolio, **When** I associate a transaction with it, **Then** that association persists.

---

### Edge Cases

- If a user has zero portfolios, the app should remain usable without suggesting they create one.
- If an older client attempts portfolio creation, the request should be rejected clearly (method not supported).
- If a transaction was previously associated with a portfolio, it must remain associated after this change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST NOT provide any user interface for creating portfolios (no “create portfolio” page, button, or call-to-action).
- **FR-001a**: The Portfolios screen MUST remain available (route + navigation entry) and MUST be read-only.
- **FR-002**: The system MUST NOT allow portfolios to be created through the public API.
- **FR-002a**: Portfolio creation requests MUST be rejected with `405 Method Not Allowed` (by removing the `POST` handler while preserving portfolio `GET` endpoints).
- **FR-003**: The system MUST continue to allow users to view any portfolios that already exist.
- **FR-004**: The system MUST continue to allow associating transactions to existing portfolios.
- **FR-006**: User-facing and developer-facing documentation in the repository MUST be updated so it does not instruct users to create portfolios from the UI or API.
- **FR-006a**: The Trade Tracker PRD MUST be updated to remove/strike the portfolio creation requirement and the portfolio creation API endpoint from its tables.

### Key Entities *(include if feature involves data)*

- **Portfolio**: A user-scoped grouping that may exist for organizing transactions.
- **Transaction**: A record that can be associated with an existing portfolio.

## Assumptions

- Portfolios may already exist (created historically or provisioned outside of the app UI).
- This feature does not remove portfolios as a concept; it removes only the creation workflow.

## Out of Scope

- Removing portfolio listing or portfolio-based reporting.
- Creating new portfolio provisioning mechanisms (admin screens, migrations, imports).
- Implementing Strategy Type tagging (Module A addendum).
- Changing existing transaction history beyond preserving associations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user cannot find any in-app workflow that creates a portfolio.
- **SC-002**: Portfolio creation attempts via API are rejected 100% of the time.
- **SC-003**: Existing portfolio viewing and transaction association behaviors continue to work for pre-existing portfolios.
