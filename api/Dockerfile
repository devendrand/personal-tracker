# Trade Tracker API Dockerfile
# Multi-stage build optimized for uv package manager

FROM python:3.12-slim-bookworm AS base

# Copy uv binary from official image
COPY --from=ghcr.io/astral-sh/uv:0.10.4 /uv /uvx /bin/

WORKDIR /app

# ── Stage: dependencies ────────────────────────────────────────
FROM base AS deps

# Install dependencies (cached layer)
RUN --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-dev

# ── Stage: development ─────────────────────────────────────────
FROM base AS dev

# Copy dependencies from deps stage
COPY --from=deps /app/.venv /app/.venv

# Copy source code
COPY . /app

# Install project in dev mode
RUN uv sync --locked

# Set PATH to include virtual environment
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app:$PYTHONPATH"

EXPOSE 8000

# Default command (overridden by docker-compose for dev)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ── Stage: production ──────────────────────────────────────────
FROM base AS prod

# Copy dependencies from deps stage
COPY --from=deps /app/.venv /app/.venv

# Copy source code
COPY . /app

# Install project without dev dependencies
RUN uv sync --locked --no-dev

# Set PATH to include virtual environment
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app:$PYTHONPATH"

EXPOSE 8000

# Run with production settings
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
