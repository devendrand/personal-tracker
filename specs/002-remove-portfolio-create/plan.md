# Implementation Plan: Remove Portfolio Create Page

**Branch**: `feature/remove-portfolio-create` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from [specs/002-remove-portfolio-create/spec.md](spec.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Remove all portfolio creation entry points from the Angular UI and remove the FastAPI `POST /api/portfolios` handler so the API returns `405 Method Not Allowed` while preserving `GET` endpoints.

Remaining work for this spec is verification-only:
- Run a frontend production build (equivalent to `cd web && npm run build`) using Docker (host environment may not have `node`/`npm`).
- Perform the manual quickstart UI checks using the existing `docker compose` `web` service.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Python 3.12+ (backend), TypeScript (strict) + Angular 19+ (frontend)  \
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (async), Alembic, Angular Material  \
**Storage**: PostgreSQL 17  \
**Testing**: `pytest` + `httpx` (backend); Angular build as a compilation check (frontend)  \
**Target Platform**: Containerized dev/prod via Docker Compose (macOS dev host)  \
**Project Type**: Web application (FastAPI backend + Angular SPA)  \
**Performance Goals**: N/A (scope is feature removal + behavior preservation)  \
**Constraints**: Do not introduce new UI/flows; keep Portfolios read-only; ensure API rejects create with `405`  \
**Scale/Scope**: Small scoped change (one screen + one API route + docs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Modular Architecture: PASS (changes are isolated to `api/` + `web/`, no cross-module coupling added)
- Plan-First Development: PASS (spec plan/docs exist under `specs/002-remove-portfolio-create/` and milestone plan exists in `docs/plan/`)
- Test-Driven Development (TDD): PASS (backend coverage captured in `specs/002-remove-portfolio-create/tasks.md`; `pytest` used)
- Strict Tech Stack Adherence: PASS (FastAPI/SQLAlchemy/Angular; frontend validation uses existing Node-in-Docker setup)
- Container-First Approach: PASS (frontend validation explicitly uses `web/Dockerfile` + `docker compose`)
- Structured Version Control: PASS (feature branch is `feature/remove-portfolio-create`)

## Project Structure

### Documentation (this feature)

```text
specs/002-remove-portfolio-create/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
api/
├── app/
│   ├── routers/
│   │   └── portfolios.py
│   ├── schemas/
│   │   └── trade.py
│   └── main.py
└── tests/
    └── test_portfolios_and_tagging.py

web/
├── src/app/
│   ├── app.routes.ts
│   ├── app.component.ts
│   ├── core/services/api.service.ts
│   └── features/portfolios/portfolios.component.ts
├── Dockerfile
└── package.json
```

**Structure Decision**: Web application with two top-level modules (`api/` and `web/`), validated via backend tests and a Docker-based frontend build.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations for this feature.

## Verification Plan (closes remaining TODO)

### Frontend build (no host `node`/`npm`)

- Preferred (build-only compile check): `docker build -f web/Dockerfile --target builder -t trade-tracker-web:builder web`
- Alternative (writes `web/dist` onto the host via bind mount):
  - `docker compose run --rm --no-deps web npm ci`
  - `docker compose run --rm --no-deps web npm run build -- --configuration production`

### Manual UI checks (Docker dev server)

- `docker compose up --build -d web`
- Open `http://localhost:4200/portfolios`
- Confirm there is no create button/workflow and empty-state has no CTA

### Backend regression

- `cd api && uv run pytest`
