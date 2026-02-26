# Research: Remove Portfolio Navigation & Page

**Feature**: Remove Portfolio Navigation & Page  
**Branch**: feature/remove-portfolio-nav  
**Date**: 2026-02-25

## Decisions

### 1) Route behavior for `/portfolios`
- **Decision**: Redirect `/portfolios` to `/dashboard` and update the browser URL to `/dashboard`.
- **Rationale**: Handles bookmarks/history/manual entry without exposing the removed page; consistent with typical Angular `redirectTo` behavior.
- **Alternatives considered**:
  - Show a Not Found page (rejected: less friendly for existing bookmarks)
  - Render dashboard while keeping URL `/portfolios` (rejected: misleading URL + harder to reason about/measure)

### 2) Scope of removal
- **Decision**: Remove the navigation entry and the route/page; keep portfolio tagging in Transactions and keep dashboard “Portfolios” labels/cards.
- **Rationale**: Matches requested UX change without breaking portfolio-related workflows used elsewhere.
- **Alternatives considered**:
  - Remove all portfolio references everywhere (rejected: out of scope)

### 3) Backend/API changes
- **Decision**: No backend changes.
- **Rationale**: This feature is a frontend navigation/routing change only.
- **Alternatives considered**:
  - Remove portfolio endpoints (rejected: explicitly out of scope)

## Notes

- This feature is intentionally UI-only; the data model remains unchanged.
