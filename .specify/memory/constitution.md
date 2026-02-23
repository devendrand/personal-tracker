<!--
Sync Impact Report:
- Version: 1.1.0
- Changes: Expanded and refined principles based on a full project review. Added principles for Modular Architecture, Containerization, and specific coding standards.
- Templates requiring updates: None.
- Follow-up TODOs: None.
-->
# Personal Tracker Constitution

## Core Principles

### I. Modular Architecture
The project is divided into distinct modules (`api`, `web`) and feature-specific sub-modules (`networth`, `swim`). All new development must respect this separation of concerns, ensuring that features are self-contained and loosely coupled.

### II. Plan-First Development
All feature development or significant modification must begin with a documented implementation plan in the `docs/plan/` directory. This plan must outline the approach, key decisions, and verification criteria before any code is written.

### III. Test-Driven Development (TDD)
Development must follow a Test-Driven Development (TDD) approach. Failing tests that define the expected behavior must be written before the implementation begins. The development cycle of Red-Green-Refactor is mandatory. Backend tests will use `pytest` with `httpx`.

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
All work must be done on a `feature/<feature_name>` branch. Work must be committed in small, focused increments with clear, descriptive messages.

## Governance

This constitution is the primary source of truth for development practices. Amendments require a documented proposal, review, and an approved migration plan. All pull requests must be reviewed for compliance with these principles.

**Version**: 1.1.0 | **Ratified**: 2026-02-22 | **Last Amended**: 2026-02-22

