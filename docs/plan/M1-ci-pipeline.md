# Plan: CI/CD Pipeline and Branch Protection

## Overview

Set up GitHub Actions CI workflow with linting, building, and testing. Configure branch protection to enforce PR-based workflow with required approvals.

## Steps

1. **Add Python dev dependencies** - Update `api/pyproject.toml`
   - Add `ruff>=0.8.0` for linting/formatting
   - Add `mypy>=1.13.0` for type checking
   - Add `pytest-asyncio>=0.24.0` for async tests
   - Add Ruff and mypy configuration sections

2. **Add ESLint to Angular** - Run in `web/` directory
   - `ng add @angular-eslint/schematics`
   - Creates `eslint.config.js` and updates `angular.json`

3. **Create CI workflow** - Create `.github/workflows/ci.yml`
   - `lint-backend`: Run Ruff check and format verification
   - `lint-frontend`: Run ESLint on Angular code
   - `build-backend`: Run mypy type checking
   - `build-frontend`: Production build Angular app
   - `test-backend`: Run pytest with PostgreSQL service
   - `ci-success`: Summary job for branch protection

4. **Configure branch protection on GitHub**
   - Require PR before merging to `main`
   - Require approval from code owner (you)
   - Require `CI Success` status check to pass
   - Block direct pushes to `main`

## Verification

```bash
# Local verification
cd api && uv sync --dev
uv run ruff check .
uv run ruff format --check .
uv run mypy app --ignore-missing-imports

cd web && npm run lint
npm run build -- --configuration=production
```

## Decisions

- **Ruff over Black/Flake8**: Modern standard, works with uv, replaces both linter and formatter
- **Mypy for type checking**: Catches type errors before runtime
- **Angular ESLint**: Official Angular linting solution
