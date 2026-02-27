# Implementation Plan: Round-Trip Linking

**Branch**: `009-round-trip-link` | **Date**: 2026-02-27 | **Spec**: `specs/009-round-trip-link/spec.md`
**Input**: Feature specification from `/specs/009-round-trip-link/spec.md`

## Summary

Add manual round-trip linking feature for transactions. Users can select multiple transactions and group them into round-trip associations. The feature includes creating groups, adding transactions to existing groups, and removing transactions from groups (including disbanding entire groups). All operations are atomic and scoped to the authenticated user.

**Technical Approach**: 
- Backend: Add `RoundTripGroup` model with FK from `Transaction`, new API endpoints for group management
- Frontend: Add checkbox selection to transaction table, group badge display, action buttons for link/unlink operations

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript / Angular 19+ (frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (async), Angular Material, PostgreSQL 17  
**Storage**: PostgreSQL 17 with Alembic migrations  
**Testing**: pytest (backend), Jasmine/Karma (frontend)  
**Target Platform**: Linux server (API), Web browser (frontend)  
**Project Type**: Full-stack web application  
**Performance Goals**: Standard web app latency (<200ms p95)  
**Constraints**: JWT authentication, atomic transactions for group operations  
**Scale/Scope**: Single-user personal finance tracker (typical: <10k transactions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate Evaluation

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Spec-Driven Workflow | ✅ PASS | Following `/speckit.plan` workflow |
| III. Test-Driven Development | ✅ PASS | Tests will be written first per TDD requirement |
| IV. Strict Tech Stack Adherence | ✅ PASS | Using FastAPI, SQLAlchemy 2.0 async, Angular 19 |
| V. API & Database Conventions | ✅ PASS | RESTful endpoints, UUIDs, timestamps |
| VI. Modern Coding Standards | ✅ PASS | Type hints, Pydantic, async/await, signals |
| VII. Container-First Approach | ✅ PASS | Already using docker-compose |
| VIII. Structured Version Control | ✅ PASS | Using `feature/<name>` branch pattern |
| IX. CI-Equivalent Checks | ✅ PASS | Will run ruff/mypy/pytest and npm lint/build |

**Conclusion**: All gates pass. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/009-round-trip-link/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api-round-trip.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
api/
├── app/
│   ├── models/
│   │   └── trade.py           # Add RoundTripGroup model
│   ├── routers/
│   │   └── round_trip.py      # NEW: Round-trip API endpoints
│   └── schemas/
│       └── round_trip.py      # NEW: Pydantic schemas
├── alembic/
│   └── versions/              # Add migration for round_trip_group table
└── tests/
    └── test_round_trip.py     # NEW: Unit/integration tests

web/
└── src/app/
    ├── features/
    │   └── transactions/
    │       ├── components/
    │       │   └── transactions.component.ts  # Add selection + grouping UI
    │       └── services/
    │           └── api.service.ts  # Add round-trip API methods
    └── shared/
        └── models/
            └── transaction.model.ts  # Add round-trip types
```

**Structure Decision**: Web application (backend + frontend). Follows existing feature-based pattern established in `api/app/` and `web/src/app/features/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No Constitution violations. Complexity assessment:

- **Data Model**: Simple — one new table (`round_trip_group`) with FK from `transaction`
- **API**: Moderate — 4-5 new endpoints (link, add-to-group, ungroup, list-groups, get-group-members)
- **Frontend**: Moderate — add checkbox selection, group badge display, action buttons
- **Testing**: Moderate — unit tests for API, component tests for UI

**Overall Complexity**: Medium — well-contained feature with clear boundaries

---

# Phase 0: Research & Clarification

## Research Required

Based on the Technical Context, the following items need research:

1. **SQLAlchemy async relationship patterns** — How to efficiently query transactions by group
2. **Angular Material selection patterns** — Checkbox selection in mat-table
3. **Atomic transaction handling** — SQLAlchemy session rollback patterns

## Research Tasks

| Task | Description |
|------|-------------|
| R1 | Research SQLAlchemy async query patterns for many-to-one with eager loading |
| R2 | Research Angular Material table checkbox selection implementation |
| R3 | Research SQLAlchemy transaction atomicity (flush vs commit, rollback) |

---

# Phase 1: Design & Contracts

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Group ID strategy | UUID | Consistent with existing models (Transaction, StrategyGroup) |
| Display identifier | Sequential `display_order` | User-friendly, simple to implement |
| Symbol enforcement | Same symbol required | Per clarification in spec — safe default |
| Conflict handling | Strict reject | Per spec — no force-move capability |

## Phase 1 Artifacts

- ✅ `research.md` — Research findings documented
- ✅ `data-model.md` — Entity definitions and relationships
- ✅ `contracts/api-round-trip.md` — API endpoint contracts
- ✅ `quickstart.md` — Setup and verification guide

## Re-check Constitution

All gates still pass after Phase 1 design. No new violations introduced.

---

**End of Plan** — Ready for `/speckit.tasks`
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
