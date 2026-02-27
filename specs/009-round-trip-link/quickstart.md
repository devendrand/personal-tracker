# Quickstart: Round-Trip Linking Feature

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 17 (via Docker)
- Python 3.12+ with `uv` package manager
- Node.js 18+ with npm

## Setup Steps

### 1. Start Database

```bash
docker compose up -d db
```

### 2. Run Database Migration

```bash
cd api
uv run alembic upgrade head
```

### 3. Start Backend

```bash
cd api
uv run fastapi dev app/main.py
```

### 4. Start Frontend

```bash
cd web
npm install
ng serve
```

### 5. Verify Setup

1. Open http://localhost:4200
2. Navigate to Transactions
3. Upload a CSV with transactions
4. Verify transactions display in the table

## Feature Verification

### Test User Story 1: Link Transactions

1. Select 2+ transactions using checkboxes (column to be added)
2. Click "Link" button
3. Confirm in modal dialog
4. Verify group badge appears on linked transactions

### Test User Story 2: Add to Group

1. Select a grouped transaction + an unlinked transaction
2. Click "Add to Group"
3. Verify both show the same group badge

### Test User Story 3: Ungroup

1. Select a grouped transaction
2. Click "Ungroup"
3. Verify badge is removed

### Test Edge Cases

- Try linking with different symbols → should reject
- Try linking already-grouped transactions → should show conflict
- Try linking single transaction → button should be disabled

## API Testing

```bash
# Get auth token (adjust for your auth setup)
TOKEN="your-jwt-token"

# List round-trip groups
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/round-trips

# Link transactions
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transaction_ids": ["tx-1", "tx-2"]}' \
  http://localhost:8000/api/round-trips/link
```

## Running Tests

```bash
# Backend tests
cd api && uv run pytest

# Frontend tests
cd web && npm run test
```

## Troubleshooting

- **Migration fails**: Ensure PostgreSQL is running (`docker compose up -d db`)
- **Frontend build fails**: Run `npm ci` first
- **API returns 401**: Check JWT token is valid and not expired