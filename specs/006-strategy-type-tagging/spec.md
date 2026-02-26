# Feature Specification: Strategy Type Tagging

**Feature Branch**: `006-strategy-type-tagging`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "Tag each transaction with a strategy type from the PRD Supported strategy types list. Replace legacy portfolio tagging: remove portfolio_id from transactions and use strategy_type as the only transaction classification tag (tagged/untagged)."

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

### User Story 1 - Tag a transaction with a strategy type (Priority: P1)

As a trader who has uploaded transactions, I want to tag each transaction with a strategy type (from a fixed list) so I can classify my trading activity by strategy.

**Why this priority**: Strategy classification is the primary organization mechanism for the Trade Tracker.

**Independent Test**: Can be fully tested by uploading transactions, setting a strategy type on at least one transaction, and confirming the updated value is visible and persists on reload.

**Acceptance Scenarios**:

1. **Given** I have at least one uploaded transaction, **When** I set its strategy type to "Wheel Strategy", **Then** the transaction displays as tagged with the `WHEEL` strategy type and the selection is saved.
2. **Given** I have at least one uploaded transaction, **When** I set its strategy type to "Covered Call", **Then** the transaction displays as tagged with the `COVERED_CALL` strategy type and the selection is saved.
3. **Given** I have uploaded transactions, **When** I view the transaction log, **Then** I can clearly see which transactions are tagged vs untagged.

---

### User Story 2 - Change or clear a strategy tag (Priority: P2)

As a trader, I want to change or remove a strategy tag from a transaction so I can correct mistakes.

**Why this priority**: Mis-tagging is expected; corrections must be simple and safe.

**Independent Test**: Can be fully tested by tagging a transaction, changing it to a different strategy type, and then clearing it back to untagged.

**Acceptance Scenarios**:

1. **Given** a transaction is tagged as `WHEEL`, **When** I change it to `COVERED_CALL`, **Then** it updates and remains correct after a refresh.
2. **Given** a transaction is tagged as `CSP`, **When** I clear the tag (returning it to an untagged state), **Then** it appears as untagged after a refresh.

---

### User Story 3 - Filter by tagged/untagged and strategy type (Priority: P3)

As a trader, I want to filter transactions by strategy type and by tagged/untagged status so I can quickly find items that need classification.

**Why this priority**: Enables a practical workflow after each import: tag the remaining untagged transactions.

**Independent Test**: Can be fully tested by tagging some transactions, leaving others untagged, and verifying the filter results match.

**Acceptance Scenarios**:

1. **Given** there are both tagged and untagged transactions, **When** I filter to show only untagged transactions, **Then** only untagged transactions appear.
2. **Given** transactions exist across multiple strategy types, **When** I filter by a specific strategy type, **Then** only transactions with that strategy type appear.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- Attempting to tag a transaction that the user cannot access (should be blocked and not persist any change).
- Clearing a tag should result in an explicitly untagged state (not an incorrect default tag).
- Two sessions updating the same transaction’s tag close together should converge to a consistent final state.
- Invalid strategy type values should be rejected (only the fixed supported list is accepted).

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST allow a user to set a strategy type on a transaction.
- **FR-002**: System MUST allow a transaction to be untagged (no strategy type set).
- **FR-003**: System MUST support exactly the fixed strategy types defined in the PRD: `WHEEL`, `COVERED_CALL`, `COLLAR`, `CSP`, `LONG_HOLD`, `SIP`.
- **FR-004**: System MUST allow a user to change an existing strategy tag on a transaction.
- **FR-005**: System MUST allow a user to clear a strategy tag (returning to untagged).
- **FR-006**: System MUST expose the strategy type options in a way that clients can render the fixed list consistently.
- **FR-006**: System MUST make the supported strategy types available so the user interface can present the fixed list consistently.
- **FR-007**: System MUST support filtering transactions by strategy type.
- **FR-008**: System MUST support filtering transactions by tagged/untagged status.
- **FR-009**: System MUST NOT support portfolio-based tagging as a transaction classification mechanism.

### Key Entities *(include if feature involves data)*

- **Transaction**: An immutable imported trade activity record that can be optionally tagged with one strategy type.
- **Strategy Type**: A fixed, system-defined classification label applied to a transaction (single-select).

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: A user can tag or clear a strategy type for a single transaction in under 10 seconds.
- **SC-002**: After tagging transactions, the tags persist correctly after refresh/reload and after returning later.
- **SC-003**: At least 95% of tag update attempts succeed on the first try (no retries needed due to validation or server errors).
- **SC-004**: In a basic usability test, at least 90% of first-time users can tag a transaction with a strategy type within 2 minutes without assistance.

## Assumptions

- All imported transactions start untagged (strategy type is unset).
- Strategy types are fixed and shipped by the system (no user creation/editing).
- The legacy portfolio-based tagging concept is deprecated and removed as part of this feature.

## Out of Scope

- Strategy chain creation and management.
- Auto-tag suggestions during import.
- Strategy-level reporting beyond the ability to tag/filter.

