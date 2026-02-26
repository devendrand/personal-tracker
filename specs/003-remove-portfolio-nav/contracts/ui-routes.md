# UI Route Contract: Remove Portfolio Navigation & Page

**Feature**: Remove Portfolio Navigation & Page  
**Branch**: feature/remove-portfolio-nav  
**Date**: 2026-02-25

## Navigation

- The main navigation MUST NOT include a “Portfolios” item.

## Routes

### Former route: `/portfolios`

- The application MUST NOT render a Portfolios page.
- Visiting `/portfolios` MUST redirect to `/dashboard`.
- The redirect MUST update the browser URL to `/dashboard`.

### Current route: `/dashboard`

- Remains unchanged.

## Non-goals

- No changes to backend HTTP API routes.
- No renaming/removal of dashboard “Portfolios” labels/cards.
