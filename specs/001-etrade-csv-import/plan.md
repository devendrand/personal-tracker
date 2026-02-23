# Implementation Plan: E*TRADE CSV Transaction Import

**Branch**: `feature/etrade-csv-import` | **Date**: 2026-02-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-etrade-csv-import/spec.md`

**Canonical plan**: `docs/plan/M2-etrade-csv-import.md` (required by repository constitution)

## Summary

Implement a CSV upload flow that ingests an E*TRADE “Account Activity” export, parses and stores each activity row as a transaction (including transfers/cash movements), and marks every imported transaction as unassigned to any portfolio. Provide a UI mechanism to view “Unassigned” transactions and tag them to a strategy portfolio later.

## Technical Context

**Backend**
- **Language/Version**: Python 3.12+
- **Framework**: FastAPI
- **Storage**: PostgreSQL 17
- **ORM/Migrations**: SQLAlchemy 2.0 (async) + Alembic
- **Auth**: JWT (dev-friendly stubs currently exist)

**Frontend**
- **Framework**: Angular 19+ (standalone components)
- **UI**: Angular Material
- **HTTP**: existing `ApiService` supports multipart upload via `FormData`

**Testing**
- Backend: pytest (existing test scaffolding is minimal)

**Constraints**
- Import must tolerate non-tabular header/footer lines and placeholder values like `--`.
- Some activity rows do not include symbol/quantity/price; model and UI must allow nullables.

## Constitution Check

- Plan-first: satisfied by `docs/plan/M2-etrade-csv-import.md`.
- Tech stack: stays within FastAPI/SQLAlchemy/Alembic/Postgres/Angular.
- TDD: mandatory; write failing tests before implementing behavior.

## Project Structure

### Documentation (this feature)

```text
specs/001-etrade-csv-import/
├── spec.md
├── plan.md
├── tasks.md
└── samples/
    └── DownloadTxnHistory-2.csv
```

### Source Code (repository root)

```text
api/
└── app/
    ├── models/         # Add trade tracker models (transaction, portfolio, import batch)
    ├── schemas/        # Add trade tracker schemas
    ├── routers/        # Implement transactions upload + tagging endpoints
    └── ...

web/src/app/
├── core/services/      # ApiService already exists
├── features/
│   ├── dashboard/      # Wire "Upload Transactions" button to navigate to /transactions
│   ├── transactions/   # Add file picker + upload + unassigned filter/tagging UI
│   └── portfolios/     # Ensure portfolio list exists for tagging
└── shared/models/      # Update transaction model to support nullable fields
```

**Structure Decision**: Implement CSV import and tagging as a Trade Tracker feature spanning `api/app/*` and `web/src/app/features/transactions/*`, reusing existing routers/routes and UI entry points.

## Implementation Strategy (MVP-first)

1. Backend: data model + migration for transactions/portfolios/import batches.
2. Backend: implement `POST /api/transactions/upload` (multipart) to import and return summary.
3. Backend: implement listing endpoints for transactions and portfolios; implement tagging endpoint(s).
4. Frontend: wire transactions page upload button to call `/transactions/upload` and refresh list.
5. Frontend: add "Unassigned" view/filter and allow tagging a transaction to a portfolio.
