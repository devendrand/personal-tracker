# GitHub Copilot Instructions for Personal Tracker

## Project Overview

Personal Tracker is a multi-module tracking platform with three modules:
- **Trade Tracker**: E*TRADE transaction management and portfolio analytics
- **Swim Performance Tracker**: Swim times, PRs by event, improvement visualization
- **Net Worth Tracker**: Weekly snapshots, assets/liabilities tracking, trend visualization

## Tech Stack

### Backend (FastAPI)
- **Python 3.12+** with **FastAPI**
- **SQLAlchemy 2.0** with async support
- **Alembic** for database migrations
- **PostgreSQL 17** database
- **uv** package manager (not pip)
- JWT authentication with **python-jose**

### Frontend (Angular)
- **Angular 19+** with standalone components
- **Angular Material** for UI components
- **TypeScript** with strict mode
- Lazy-loaded feature routes

## Code Style Guidelines

### Python/FastAPI
- Use type hints for all function parameters and return values
- Use Pydantic models for request/response validation
- Use async/await for database operations
- Follow PEP 8 naming conventions
- Organize routers by feature module
- Use dependency injection for services

```python
# Example endpoint pattern
@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ItemResponse:
    ...
```

### Angular/TypeScript
- Use standalone components (no NgModules)
- Use signals for state management (`signal()`, `computed()`)
- Use `inject()` for dependency injection
- Use control flow syntax (`@if`, `@for`, `@switch`) instead of structural directives
- Prefer reactive forms over template-driven forms

```typescript
// Example component pattern
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `...`
})
export class ExampleComponent {
  private readonly service = inject(ExampleService);
  items = signal<Item[]>([]);
}
```

## Project Structure

```
api/
├── app/
│   ├── core/          # Config, security utilities
│   ├── db/            # Database session management
│   ├── models/        # SQLAlchemy models
│   ├── routers/       # API route handlers
│   └── schemas/       # Pydantic schemas
├── alembic/           # Database migrations
└── scripts/           # Utility scripts

web/
└── src/app/
    ├── core/          # Guards, interceptors, core services
    ├── features/      # Feature modules (swim, networth, etc.)
    │   └── [feature]/
    │       ├── components/
    │       ├── models/
    │       ├── services/
    │       └── [feature].routes.ts
    └── shared/        # Shared components and models
```

## Common Commands

```bash
# Start all services
docker compose up --build

# Backend development
cd api && uv run fastapi dev app/main.py

# Create migration
cd api && uv run alembic revision --autogenerate -m "description"

# Apply migrations
cd api && uv run alembic upgrade head

# Frontend development
cd web && ng serve
```

## Database Conventions

- Use UUID for primary keys where appropriate
- Use `created_at` and `updated_at` timestamps on all tables
- Use SQLAlchemy enums for fixed value sets
- Foreign keys should be indexed

## API Conventions

- RESTful endpoints with plural resource names
- Use appropriate HTTP status codes (201 for create, 204 for delete)
- Paginate list endpoints with `skip` and `limit` parameters
- Return 501 Not Implemented for stub endpoints

## Testing

- Backend: pytest with httpx for async API tests
- Use fixtures for database setup/teardown
- Test files in `tests/` directory mirroring app structure

## Development Workflow

**IMPORTANT: Follow these practices for all implementations:**

1. **Create a Feature Branch**: Always create a `feature/<feature_name>` branch for each new implementation.
2. **Plan First**: Always document the implementation plan in `docs/plan/` before writing code
   - Create a markdown file describing the approach
   - List steps, decisions, and verification criteria

3. **Test-Driven Development (TDD)**: Always write tests before implementation
   - Write failing tests that define expected behavior
   - Implement code to make tests pass
   - Refactor while keeping tests green

4. **Incremental Commits**: Make small, focused commits with clear messages
