# Personal Tracker

A personal multi-purpose tracking platform with multiple modules:

- **Trade Tracker**: Manage E*TRADE transaction exports, categorize trades into custom portfolios and strategies, gain actionable insights
- **Swim Performance Tracker**: Track swim times, manage PRs by event, visualize improvement over time
- **Net Worth Tracker**: Weekly net worth snapshots, track assets and liabilities, visualize trends

## Prerequisites

- **Docker** & **Docker Compose** (v2.x+)
- **Node.js** 22 LTS (for local Angular development)
- **Python** 3.12+ (for local backend development)
- **uv** 0.10+ (Python package manager)

## Quick Start

1. **Clone and configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred values
   ```

2. **Start all services**
   ```bash
   docker compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8000
   - API Docs (Swagger): http://localhost:8000/docs
   - API Docs (ReDoc): http://localhost:8000/redoc

## Development

### Backend (FastAPI)

```bash
cd api

# Install dependencies
uv sync

# Run migrations
uv run alembic upgrade head

# Start dev server (without Docker)
uv run fastapi dev app/main.py
```

### Frontend (Angular)

```bash
cd web

# Install dependencies
npm install

# Start dev server (without Docker)
ng serve
```

### CI-equivalent checks (required before push)

Run everything (recommended):

```bash
./scripts/ci_local.sh
```

Backend:

```bash
cd api
uv run ruff check .
uv run ruff format --check .
uv run mypy app --ignore-missing-imports
uv run pytest
```

Frontend (Docker, no host Node required):

```bash
docker compose run --rm --no-deps web sh -lc "npm ci && npm run lint && npm run build -- --configuration=production"
```

### Database Migrations

```bash
cd api

# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback one migration
uv run alembic downgrade -1
```

## Project Structure

```
trade-tracker/
├── api/                 # FastAPI backend
│   ├── app/             # Application code
│   ├── alembic/         # Database migrations
│   └── Dockerfile
├── web/                 # Angular frontend
│   ├── src/app/         # Application code
│   └── Dockerfile
├── db/                  # Database setup
│   └── init/            # Postgres init scripts
├── docs/                # Documentation
│   ├── TradeTracker_PRD_v1.0.md
│   └── plan/            # Implementation plans
└── docker-compose.yml
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21 + Angular Material |
| Backend | Python FastAPI |
| Database | PostgreSQL 17 |
| Auth | JWT (python-jose) |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Package Manager | uv (Python), npm (Node) |

## License

Private - All rights reserved
