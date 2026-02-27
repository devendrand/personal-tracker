# Feature Specification: Transaction Round-Trip Linking

**Feature Branch**: `009-round-trip-link`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "Add manual round-trip linking feature for transactions"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Link Transactions into a Round-Trip Group (Priority: P1)

A user viewing their transaction list selects two or more transactions that form a logical round-trip (e.g., an opening and closing trade) and clicks "Link" to permanently associate them as a group. The system creates the group, visually marks all linked transactions with a group badge, and confirms the action. The user can later expand the badge to see all members of the group.

**Why this priority**: This is the core feature — without it, no other grouping or management capabilities exist. It enables users to organize related trades for future analysis.

**Independent Test**: Can be tested by selecting any two unlinked transactions, clicking Link, confirming in the modal, and verifying all selected transactions now display a group badge and are retrievable as a group.

**Acceptance Scenarios**:

1. **Given** a user has two or more unlinked transactions visible in their transaction list, **When** they select them and click "Link", **Then** the system presents a confirmation modal listing the selected transactions before committing.
2. **Given** a user confirms the link action, **When** the system processes the request, **Then** all selected transactions are persistently associated as a single group and each displays a group badge in the transaction list.
3. **Given** a user clicks the group badge on a linked transaction, **When** the badge expands, **Then** the user sees all other transactions belonging to the same group.
4. **Given** a user attempts to link a transaction that is already in a different group, **When** the system processes the request, **Then** the action is rejected and the user is shown a conflict notice listing the already-grouped transactions with an instruction to ungroup them first.

---

### User Story 2 - Add Transactions to an Existing Group (Priority: P2)

A user wants to add one or more additional transactions to an already-existing round-trip group. They select an existing group member (to identify the target group) and one or more unlinked transactions, then choose "Add to Group." The system adds the new transactions to the group and refreshes the badges.

**Why this priority**: Groups may not always be complete at initial link time; users need to incrementally build or correct group membership after creation.

**Independent Test**: Can be tested by first creating a group, then selecting a new unlinked transaction alongside a group member and choosing "Add to Group," verifying the new transaction now shows the same group badge.

**Acceptance Scenarios**:

1. **Given** a user has an existing group and an unlinked transaction, **When** they select a group member and the unlinked transaction then choose "Add to Group", **Then** the unlinked transaction is added to the group and displays the same group badge.
2. **Given** a user tries to add a transaction already in a different group, **When** the system processes the request, **Then** the action is rejected with a conflict notice naming the conflicting transactions and their current groups.

---

### User Story 3 - Remove Transactions from a Group / Ungroup (Priority: P3)

A user can remove individual transactions from a round-trip group (leaving others intact) or disband an entire group at once. After removal, previously linked transactions revert to an unlinked state and the group badge disappears from them.

**Why this priority**: Users will make mistakes during linking or their understanding of a trade set may change over time; ungrouping provides the necessary corrective action.

**Independent Test**: Can be tested by selecting a group member and choosing "Ungroup," verifying the transaction no longer displays a group badge while remaining group members retain their badge.

**Acceptance Scenarios**:

1. **Given** a user selects one or more members of an existing group and clicks "Ungroup", **When** the system processes the request, **Then** the selected transactions are removed from the group and lose their group badge; the remaining members retain their badge.
2. **Given** a user dissolves an entire group (removes all members or explicitly deletes it), **When** the action completes, **Then** no transactions display that group's badge and the group no longer exists.
3. **Given** a group has only two members and one is ungrouped, **When** that removal is processed, **Then** the remaining single transaction is also ungrouped (a group cannot have a single member).

---

### Edge Cases

- What happens when a user selects only one transaction and tries to link it? The action is unavailable or rejected with a message requiring at least two transactions.
- What happens if a request fails partway through (e.g., network error)? The operation is rolled back atomically; no transactions are left in an ambiguous partial state.
- What happens when the user selects a mix of unlinked and already-linked transactions for a new group? The system rejects the action and identifies the conflicting (already-linked) transactions.
- What happens when a user tries to access or modify another user's groups? The system denies the operation — only the owning user's groups are visible and modifiable.
- What happens when the user refreshes the page after grouping? The group state is persisted and badges reappear correctly.
- What happens when all members of a group are removed via "Ungroup All"? The group ceases to exist entirely with no orphaned records.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to select multiple transactions simultaneously in the transaction list.
- **FR-002**: Users MUST be able to initiate a "Link" action on a multi-transaction selection that groups those transactions into a persistent round-trip group.
- **FR-003**: The system MUST present a confirmation step before creating a group, displaying the list of transactions about to be linked.
- **FR-004**: The system MUST enforce that each transaction belongs to at most one round-trip group at any time.
- **FR-005**: The system MUST reject any link or add-to-group request that would place an already-grouped transaction into a second group, returning a conflict response that identifies the conflicting transactions and their current group.
- **FR-006**: Users MUST be able to add unlinked transactions to an existing group by identifying the target group via any of its current members.
- **FR-007**: Users MUST be able to remove individual transactions from a group without affecting remaining group members.
- **FR-008**: Users MUST be able to disband an entire group, returning all its members to an unlinked state.
- **FR-009**: The system MUST display a visual group indicator (badge) on each linked transaction in the transaction list; the badge MUST NOT expose the internal group identifier directly.
- **FR-010**: Users MUST be able to expand the group badge to view all transactions belonging to the same group.
- **FR-011**: The system MUST display a user-friendly conflict notice whenever a link or add-to-group action is rejected, listing the conflicting transactions and instructing the user to ungroup them first.
- **FR-012**: All group operations MUST be scoped to the authenticated user — a user MUST NOT be able to view, create, modify, or delete groups belonging to another user.
- **FR-013**: Group membership changes MUST be atomic — either all requested changes succeed or none are applied.
- **FR-014**: The group association on each transaction MUST persist across page refreshes and sessions.
- **FR-015**: The grouping feature MUST have no effect on profit-and-loss calculations or transaction leg types; round-trip groups are inert metadata at this stage.

### Key Entities

- **Round-Trip Group**: An association of two or more transactions owned by a single user. Identified internally by a system-generated unique identifier (not shown to users directly). Carries no business logic impact at this stage.
- **Transaction**: An existing record of a financial event. Gains a nullable reference to a Round-Trip Group. A transaction with no group reference is considered "unlinked."
- **Group Membership**: The state of a transaction belonging to a specific round-trip group. Exclusive — one transaction can be in at most one group at any time.
- **Conflict**: The condition where a requested group operation would assign an already-grouped transaction to a different group. Must be surfaced to the user with actionable detail.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can link a set of transactions into a round-trip group in under 30 seconds from selecting the first transaction.
- **SC-002**: Group membership is persisted immediately — a page refresh after linking always shows the correct badges with no loss of group state.
- **SC-003**: Conflict detection is reliable — zero cases where an already-grouped transaction is silently moved into a different group without the user ungrouping it first.
- **SC-004**: Users can successfully complete the full round-trip workflow (create group, add member, remove member, disband) without any data loss or inconsistent UI state.
- **SC-005**: All group operations are atomic — no partial updates occur when a request fails partway through.
- **SC-006**: The feature has no measurable impact on profit-and-loss totals or transaction leg-type values — these fields remain unchanged after any group operation.

## Assumptions

- The transaction list already supports or will add basic multi-row selection via checkboxes.
- "Friendly group badge" means a small visual chip or label using a display-friendly identifier (e.g., a sequential group number or icon) rather than the raw internal identifier. The exact visual design is deferred to planning.
- A group must always have at least 2 members. Removing a transaction from a 2-member group disbands the entire group (both members become unlinked).
- The "Add to Group" flow requires exactly one existing group to be selected as the target, identified by selecting one of its current members. Selecting members of two different groups simultaneously is out of scope.
- No user-visible naming of round-trip groups is required in this iteration.
- The conflict policy is strict reject-on-conflict; there is no force-move or override capability.
- Backend ownership enforcement is required; all API operations implicitly filter by the authenticated user's identity.

## Clarifications

### Session 2026-02-27

- Q: Should linking require same symbol for all transactions in a group? → A: Option A — require same `symbol` for all transactions (safe default).
