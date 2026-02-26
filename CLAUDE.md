# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal Tracker is a multi-module tracking platform: Trade Tracker (E*TRADE transaction management), Swim Performance Tracker, and Net Worth Tracker. It is a full-stack app with an Angular 19 frontend, FastAPI backend, and PostgreSQL database.

## Commands

### Start All Services
```bash
docker compose up --build
```

### Backend (FastAPI)
```bash
cd api
uv sync                                          # Install dependencies
uv run alembic upgrade head                      # Apply migrations
uv run fastapi dev app/main.py                   # Dev server (port 8000)

# Linting & type checking
uv run ruff check .
uv run ruff format --check .
uv run mypy app --ignore-missing-imports

# Tests
uv run pytest                                    # All tests
uv run pytest tests/path/to/test_file.py -v     # Single test file
```

### Frontend (Angular)
```bash
cd web
npm install
ng serve                                         # Dev server (port 4200)
npm run lint
npm run build -- --configuration=production
```

### CI-Equivalent Checks (required before push)
```bash
./scripts/ci_local.sh                            # Run everything

# Frontend via Docker (no host Node required)
docker compose run --rm --no-deps web sh -lc "npm ci && npm run lint && npm run build -- --configuration=production"
```

### Database Migrations
```bash
cd api
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1
```

## Architecture

### Backend (`api/app/`)
- **`core/`** — `config.py` (pydantic-settings), `security.py` (JWT + bcrypt)
- **`db/session.py`** — Async SQLAlchemy session factory
- **`models/`** — SQLAlchemy ORM models: `trade.py`, `swim.py`, `networth.py`
- **`routers/`** — Feature-based route handlers; all mounted under `/api` prefix in `main.py`
- **`schemas/`** — Pydantic request/response models (separate from ORM models)
- **`services/`** — Business logic: E*TRADE CSV parsing, transaction import workflow
- **`dependencies.py`** — Shared DI: `get_db` (AsyncSession), `get_current_user` (JWT validation)

All database operations use `async/await` with SQLAlchemy 2.0 `AsyncSession`. Authentication is JWT-based; every protected endpoint depends on `get_current_user`.

### Frontend (`web/src/app/`)
- **`core/`** — Auth interceptor (attaches JWT to all requests), route guards, `ApiClientService`, `DevTokenBootstrapService` (injects a dev JWT on startup)
- **`features/`** — One directory per domain (`swim/`, `networth/`, `transactions/`, `portfolios/`, `dashboard/`), each with `components/`, `models/`, `services/`, and a `*.routes.ts`
- **`shared/`** — Shared TypeScript interfaces

Routes are lazy-loaded. All components are standalone (no NgModules). Use `signal()` and `computed()` for state, `inject()` for DI, and `@if`/`@for` control flow syntax.

TypeScript path aliases: `@core/*`, `@features/*`, `@shared/*`, `@env`.

### Data Flow
Angular component → `ApiClientService` (HTTP + auth interceptor adds Bearer token) → FastAPI router → `get_current_user` dependency → service/ORM query → Pydantic schema → JSON response.

## Code Conventions

### Python
- Type hints on all function parameters and return values
- Pydantic schemas for all API request/response shapes
- Endpoint pattern: `async def`, `db: AsyncSession = Depends(get_db)`, `current_user: User = Depends(get_current_user)`
- RESTful plural resource names; `201` for create, `204` for delete; `skip`/`limit` for pagination; `501` for unimplemented stubs
- UUIDs for primary keys; `created_at`/`updated_at` on all tables; enums for fixed value sets; foreign keys indexed

### TypeScript/Angular
- Standalone components with `imports: [...]` listing only what the component uses
- `inject()` over constructor injection
- Reactive forms over template-driven
- Component selectors: `app-` prefix, kebab-case; directive selectors: `app` prefix, camelCase

## Development Workflow

1. Start from updated `main`: `git fetch && git pull --ff-only`
2. Create a `feature/<name>` branch
3. Write a spec/plan in `specs/` before coding
4. Follow TDD: write failing tests first, then implement
5. Sync with `main` before CI checks: merge/rebase `origin/main` into your branch
6. Run CI-equivalent checks (`./scripts/ci_local.sh`) before `git push`

## Speckit Workflow

All feature work follows this spec-driven sequence before any code is written. Slash commands are defined in `.claude/commands/` and executed via the Skill tool.

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `/speckit.specify` | Create the feature spec: user scenarios, acceptance criteria, edge cases |
| 2 | `/speckit.clarify` | Surface and resolve underspecified requirements (skip only if fully clear) |
| 3 | `/speckit.plan` | Produce an implementation plan grounded in the spec |
| 4 | `/speckit.tasks` | Generate a dependency-ordered `tasks.md` from the plan |
| 5 | `/speckit.implement` | Execute all tasks in `tasks.md` |

Additional commands:
- `/speckit.analyze` — cross-artifact consistency check across spec, plan, and tasks (non-destructive)
- `/speckit.checklist` — generate a feature-specific checklist
- `/speckit.taskstoissues` — convert tasks into GitHub issues
- `/speckit.constitution` — create or update `.specify/memory/constitution.md`

Artifacts live in `specs/<NNN>-<feature-name>/` (e.g. `specs/004-user-auth/`). The constitution at `.specify/memory/constitution.md` is the authoritative source for project principles.
