# Implementation Plan: Remove Portfolio Create Page

**Branch**: `feature/remove-portfolio-create` | **Date**: 2026-02-24 | **Spec**: [specs/002-remove-portfolio-create/spec.md](spec.md)
**Input**: Feature specification from `specs/002-remove-portfolio-create/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Remove all portfolio creation UX (the "New Portfolio" CTA / empty state CTA / any create page) and disable portfolio creation via the public backend API, while preserving portfolio listing and the ability to associate transactions to existing portfolios.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Python 3.12+ (FastAPI backend), TypeScript (Angular 19+)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (async), Pydantic; Angular standalone components + Angular Material  
**Storage**: PostgreSQL 17 (dev/prod), SQLite for tests via `sqlite+aiosqlite`  
**Testing**: pytest + httpx (backend); no dedicated frontend unit tests for this slice currently  
**Target Platform**: Local dev via Docker Compose on macOS; containerized deployment  
**Project Type**: Web application (SPA + REST API)  
**Performance Goals**: N/A (surface-area reduction)  
**Constraints**: Preserve reads (`GET /api/portfolios`) and transaction association behavior; remove only creation UX/API  
**Scale/Scope**: Small refactor across portfolio router, API client, and Portfolios screen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Modular Architecture: PASS (changes isolated to `api/` and `web/`)
- Plan-First Development: PASS (this plan + `docs/plan/` entry created prior to code)
- TDD: PASS (implementation phase will start with failing tests proving `POST /api/portfolios` is unsupported)
- Strict Tech Stack Adherence: PASS (no new technologies)
- Consistent API & Database Conventions: PASS (read endpoints preserved; create removed)
- Container-First Approach: PASS (no infra changes)
- Structured Version Control: PASS (work on feature branch)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
api/
├── app/
│   ├── routers/
│   │   └── portfolios.py
│   ├── schemas/
│   │   └── trade.py
│   └── models/
│       └── trade.py
└── tests/
  └── test_portfolios_and_tagging.py

web/
└── src/app/
  ├── core/services/
  │   └── api.service.ts
  └── features/portfolios/
    └── portfolios.component.ts
```

**Structure Decision**: Web application with separate backend (`api/`) and frontend (`web/`). This change touches the portfolios router and its schemas/tests, plus the Angular portfolio UI and API client.
