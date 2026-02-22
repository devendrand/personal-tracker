# Plan: Project Skeleton & Tech Stack Setup
**Milestone:** M0 — Foundation Pre-work  
**Date:** February 2026  
**Status:** Approved

---

## TL;DR

Bootstrap a monorepo at `trade-tracker/` with three Docker-composed services: `db` (Postgres 17), `api` (FastAPI + uv), and `web` (Angular 21 standalone + Angular Material). The backend gets a Pydantic-settings config, async SQLAlchemy engine, Alembic migrations scaffold, and a JWT stub middleware. The frontend gets a shell with routing, feature folder structure, and an Angular Material theme. No business logic is implemented — this delivers a running, wired-together skeleton that all future milestones build on.

---

## Decisions

- **Monorepo** — single repo with `/api` and `/web` folders
- **Python tooling** — `uv` (pyproject.toml, uv.lock, .python-version)
- **Angular version** — v21 (active LTS); standalone components, no NgModules
- **Auth scope** — JWT stub only; hardcoded dev token returned; no login UI or user DB table yet
- **asyncpg** over psycopg2 — consistent with SQLAlchemy async pattern
- **Migrations inside `api/`** — tightly coupled to SQLAlchemy models; correct for single-service ownership
- **`db/init/`** at repo root — Postgres extension SQL, separated from app code
- **`proxy.conf.json`** added alongside CORS — either workflow usable without code changes

---

## Full Repository Structure

```
trade-tracker/
├── .env                              ← local secrets (gitignored)
├── .env.example                      ← committed template
├── .gitignore
├── docker-compose.yml
├── README.md
│
├── docs/
│   ├── TradeTracker_PRD_v1.0.md
│   └── plan/
│       └── M0-project-skeleton.md   ← this file
│
├── db/
│   └── init/
│       └── 01_extensions.sql        ← CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
│
├── api/
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── .python-version              ← "3.12"
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py                   ← reads DATABASE_URL from os.getenv
│   │   ├── script.py.mako
│   │   └── versions/                ← generated migration scripts
│   └── app/
│       ├── main.py                  ← FastAPI() instance, CORS, routers
│       ├── dependencies.py          ← get_db, get_current_user Depends stubs
│       ├── core/
│       │   ├── config.py            ← pydantic-settings (DATABASE_URL, SECRET_KEY)
│       │   └── security.py          ← JWT encode/decode + bcrypt stubs
│       ├── db/
│       │   └── session.py           ← async engine + AsyncSession factory
│       ├── models/
│       │   └── __init__.py          ← Base = declarative_base()
│       ├── schemas/
│       │   └── __init__.py
│       └── routers/
│           ├── auth.py              ← POST /api/auth/token stub
│           ├── transactions.py      ← GET /api/transactions stub
│           └── portfolios.py        ← GET /api/portfolios stub
│
└── web/
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    ├── proxy.conf.json              ← /api/* → http://localhost:8000
    ├── Dockerfile
    └── src/
        ├── index.html
        ├── main.ts
        ├── styles.scss
        └── app/
            ├── app.ts               ← root standalone component
            ├── app.routes.ts        ← lazy-loaded routes
            ├── app.config.ts        ← provideRouter, provideHttpClient, provideAnimations
            ├── core/
            │   ├── services/
            │   │   └── api.service.ts
            │   ├── guards/
            │   │   └── auth.guard.ts
            │   └── interceptors/
            │       └── auth.interceptor.ts
            ├── features/
            │   ├── dashboard/
            │   ├── transactions/
            │   └── portfolios/
            └── shared/
                ├── models/
                │   ├── transaction.model.ts
                │   └── portfolio.model.ts
                └── components/
```

---

## Implementation Steps

1. **Repo init** — `.gitignore`, `.env.example`, top-level `README.md`
2. **Backend scaffold** — `uv init --app` in `api/`, add all dependencies, create folder layout with stub files
3. **Alembic setup** — `uv run alembic init --template async alembic`, patch `env.py` to read `DATABASE_URL` from env, create empty initial revision
4. **JWT stub** — implement `create_access_token`, `decode_access_token`, `verify_password`, `get_password_hash`; wire `get_current_user` Depends returning 401 on bad token
5. **Backend Dockerfile** — uv binary from official image, cached deps layer, dev command overridden by Compose
6. **Frontend scaffold** — `ng new` with `--standalone --routing --style=scss --strict`, then `ng add @angular/material`
7. **Frontend structure** — create `core/`, `features/`, `shared/` folders; stub components; lazy routes; environment files
8. **Frontend Dockerfile** — multi-stage (dev / builder / prod-nginx); Compose targets `dev`
9. **Docker Compose** — `db`, `api`, `web` services; healthcheck on db; bind mounts; `db/init/` mounted to `/docker-entrypoint-initdb.d/`
10. **CORS + proxy** — `CORSMiddleware` in `main.py` for `localhost:4200`; `proxy.conf.json` in Angular

---

## Version Reference

| Tool / Package | Version |
|---|---|
| Python | 3.12 |
| uv | 0.10.4 |
| FastAPI (`fastapi[standard]`) | 0.115.x |
| SQLAlchemy | 2.0.x |
| Alembic | 1.14.x |
| asyncpg | 0.30.x |
| Angular CLI / Angular | 21.1.x |
| Angular Material | 21.x |
| Node.js | 22 LTS |
| Postgres Docker image | postgres:17-alpine |

---

## Verification

- `docker compose up --build` → all three containers start cleanly
- `GET http://localhost:8000/docs` → Swagger UI loads with stub routes
- `GET http://localhost:8000/api/transactions` with Bearer token → `200 []`
- `GET http://localhost:8000/api/transactions` without token → `401`
- `http://localhost:4200` → Angular app loads with Material toolbar + router outlet
- `uv run alembic upgrade head` inside `api/` → runs without error
