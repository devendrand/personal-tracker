#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(CDPATH='' cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Running CI-equivalent checks (repo: ${REPO_ROOT})"

echo "==> Backend: ruff + mypy + pytest"
(
  cd "${REPO_ROOT}/api"
  uv run ruff check .
  uv run ruff format --check .
  uv run mypy app --ignore-missing-imports
  uv run pytest
)

echo "==> Frontend (Docker): npm ci + lint + production build"
(
  cd "${REPO_ROOT}"
  docker compose run --rm --no-deps web sh -lc "npm ci && npm run lint && npm test -- --watch=false --code-coverage --browsers=ChromeHeadlessNoSandbox && npm run build -- --configuration=production"
)

echo "==> CI-equivalent checks PASSED" 
