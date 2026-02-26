<!--
Sync Impact Report:
- Version change: 1.3.2 → 1.3.3
- Modified principles:
	- VIII: Structured Version Control (branch naming simplified from feature/<feature_name> to feature/<name>)
	- IX: CI-Equivalent Checks Before Push (branch naming simplified from feature/<feature_name> to feature/<name>)
- Added sections: None
- Removed sections: None
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md (branch placeholder updated)
	- ✅ .specify/templates/spec-template.md (branch placeholder updated)
	- ✅ .specify/templates/tasks-template.md (no branch references, no change needed)
- Follow-up TODOs:
	- None
-->
# Personal Tracker Constitution

## Core Principles

### I. Modular Architecture
The project is divided into distinct modules (`api`, `web`) and feature-specific sub-modules (`networth`, `swim`). All new development must respect this separation of concerns, ensuring that features are self-contained and loosely coupled.

### II. Spec-Driven Workflow Order
All feature work MUST follow the Spec Kit workflow sequence so intent is captured before code:

1. `/speckit.specify`: create a feature specification (user scenarios, acceptance scenarios, and edge cases).
2. `/speckit.clarify`: resolve underspecified requirements BEFORE planning (may be skipped only when explicitly justified in the spec/plan).
3. `/speckit.plan`: produce an implementation plan grounded in the spec.
4. `/speckit.tasks`: produce an executable task breakdown from the plan.
5. `/speckit.implement`: implement strictly according to tasks.

For milestone-level or cross-cutting work that isn't tied to a single Spec Kit feature directory, maintain a plan in `docs/plan/` as well.

### III. Test-Driven Development (TDD)
Development MUST follow a Test-Driven Development (TDD) approach:

- Tests MUST be written first and MUST fail before implementation.
- Tests MUST cover acceptance scenarios AND the documented edge cases.
- Use the smallest test type that provides confidence (unit where possible; integration/contract where needed).

Backend tests use `pytest` with `httpx` where applicable.

### IV. Strict Tech Stack Adherence
All development must strictly adhere to the technologies and versions defined in the project's documentation. Key technologies include:
- **Backend**: Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), `uv` package manager.
- **Frontend**: Angular 19+ (standalone components), TypeScript (strict mode), Angular Material.
- **Database**: PostgreSQL 17 with Alembic for migrations.

### V. Consistent API & Database Conventions
- **API**: All APIs must be RESTful, using plural resource names, appropriate HTTP status codes (e.g., 201 for create), and paginated list endpoints.
- **Database**: Primary keys should be UUIDs where appropriate. All tables must include `created_at` and `updated_at` timestamps.

### VI. Modern Coding Standards
- **Python/FastAPI**: Use type hints, Pydantic models for validation, `async/await` for I/O, and dependency injection.
- **Angular/TypeScript**: Use standalone components, signals for state management, `inject()` for DI, and built-in control flow (`@if`, `@for`).

### VII. Container-First Approach
The application is designed to be developed and deployed using containers. All services must be defined in the `docker-compose.yml` file, and every module must have a corresponding `Dockerfile`.

### VIII. Structured Version Control
All work MUST be done on a `feature/<name>` branch cut from the latest `main`:

- For every feature, you MUST start from `main`, update it, and only then create the feature branch.
	Minimum required sequence:
	- `git checkout main`
	- `git fetch --all --prune`
	- `git pull --ff-only`
	- `git checkout -b feature/<name>`
- Do not commit directly to `main`.
- Commit in small, focused increments with clear, descriptive messages.
- Before pushing, follow Principle IX (CI-equivalent checks).

### IX. CI-Equivalent Checks Before Push
After completing implementation work (and always before pushing to the remote), developers MUST run the CI-equivalent checks locally and fix any failures.

Immediately before running CI-equivalent checks, you MUST sync your feature branch with the latest `main` to minimize late merge conflicts:

- `git fetch --all --prune`
- `git checkout main`
- `git pull --ff-only`
- `git checkout feature/<name>`
- Integrate latest `main` into your feature branch (choose one and be consistent):
	- Merge: `git merge --no-ff origin/main`
	- Rebase: `git rebase origin/main`

If this introduces changes or conflicts, resolve them and then run CI-equivalent checks.

For this repository, "CI-equivalent" means matching the GitHub Actions CI workflow:

- **Backend (`api/`)**:

	- `cd api && uv run ruff check .`
	- `cd api && uv run ruff format --check .`
	- `cd api && uv run mypy app --ignore-missing-imports`
	- `cd api && uv run pytest`

- **Frontend (`web/`)**:

	- `cd web && npm ci`
	- `cd web && npm run lint`
	- `cd web && npm run build -- --configuration=production`

If the host environment does not have Node installed, use Docker for the frontend checks:

- `docker compose run --rm --no-deps web sh -lc "npm ci && npm run lint && npm run build -- --configuration=production"`

## Governance

This constitution is the primary source of truth for development practices. Amendments require a documented proposal, review, and an approved migration plan. All pull requests must be reviewed for compliance with these principles.

Versioning follows semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: backward-incompatible governance changes (e.g., principle removals/redefinitions)
- MINOR: new principles/sections or materially expanded guidance
- PATCH: clarifications, wording, and non-semantic refinements

**Version**: 1.3.3 | **Ratified**: 2026-02-22 | **Last Amended**: 2026-02-26
