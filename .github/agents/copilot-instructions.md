# trade-tracker Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-26

## Active Technologies
- Python 3.12 (backend), TypeScript (frontend) + FastAPI, Pydantic, SQLAlchemy 2.0 (async), Alembic; Angular 19, Angular Material (006-strategy-type-tagging)
  
- PostgreSQL 17 (006-strategy-type-tagging)

## Project Structure

```text
api/
web/
docs/
specs/
```
## Commands

```bash
# Start all services
docker compose up --build

# Backend (api/)
cd api && uv run ruff check .
cd api && uv run ruff format --check .
cd api && uv run mypy app --ignore-missing-imports
cd api && uv run pytest

# Frontend (web/) via Docker (no host Node required)
docker compose run --rm --no-deps web sh -lc "npm ci && npm run lint && npm run build -- --configuration=production"
```

## Code Style

Python 3.12+ (backend), TypeScript (strict) + Angular 19+ (frontend): Follow standard conventions

## Recent Changes
- 006-strategy-type-tagging: Added Python 3.12 (backend), TypeScript (frontend) + FastAPI, Pydantic, SQLAlchemy 2.0 (async), Alembic; Angular 19, Angular Material
- 006-strategy-type-tagging: Added PostgreSQL 17


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
