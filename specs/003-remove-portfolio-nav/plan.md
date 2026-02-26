# Implementation Plan: Remove Portfolio Navigation & Page

**Branch**: `feature/remove-portfolio-nav` | **Date**: 2026-02-25 | **Spec**: `specs/003-remove-portfolio-nav/spec.md`
**Input**: Feature specification from `/specs/003-remove-portfolio-nav/spec.md`

## Summary

Remove the “Portfolios” navigation entry and remove the Portfolios page route from the Angular app. Direct navigation to `/portfolios` must redirect to `/dashboard` (and update the browser URL). Portfolio tagging flows elsewhere in the app must continue to work.

## Technical Context

**Language/Version**: TypeScript (strict), Angular 19.2.x  
**Primary Dependencies**: Angular Router, Angular Material  
**Storage**: N/A  
**Testing**: Backend: `pytest` (existing). Frontend: `ng test` (Karma/Jasmine) scaffolding may be required for new unit tests.  
**Target Platform**: Web browser (served via Docker / `ng serve`)  
**Project Type**: Web application (Angular frontend + FastAPI backend)  
**Performance Goals**: N/A (no perf-sensitive logic added)  
**Constraints**: Do not break Transactions portfolio-tagging workflows; do not rename/remove dashboard “Portfolios” labels/cards (explicitly out of scope).  
**Scale/Scope**: Small UI-only change (nav + router config)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec-driven workflow**: Spec exists and clarifications are captured in the spec.
- **TDD**: Add automated tests for at least:
  - navGroups does not include a “Portfolios” item
  - the `/portfolios` route redirects to `/dashboard` (URL update implied by redirect)
  If frontend test harness is currently missing/incomplete, add the minimum Angular Karma/Jasmine scaffolding needed to run unit tests.
- **Strict tech stack**: Use Angular 19+ standalone components and Angular Router patterns already present.
- **Branching**: Work stays on `feature/remove-portfolio-nav`.
- **CI-equivalent checks before push**: Run `./scripts/ci_local.sh`.
- **Sync with updated main before CI checks** (Principle IX): Immediately before running CI-equivalent checks, sync `main` and integrate `origin/main` into the feature branch (merge or rebase) before running `./scripts/ci_local.sh`.

Status: PASS (no unjustified constitution violations).

## Project Structure

### Documentation (this feature)

```text
specs/003-remove-portfolio-nav/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-routes.md
└── tasks.md             # created by /speckit.tasks (later)
```

### Source Code (repository root)

```text
web/
└── src/app/
    ├── app.component.ts         # remove "Portfolios" nav item
    ├── app.routes.ts            # redirect /portfolios -> /dashboard
    └── features/portfolios/     # remove or leave unreachable (no route)

api/
└── (no changes)
```

**Structure Decision**: Use the existing `web/` Angular application structure; changes are limited to route configuration and navigation configuration.

## Implementation Steps

1) **Write failing tests (TDD)**
- Add minimal Angular unit test scaffolding if missing (Karma/Jasmine config + dependencies) so `cd web && npm run test` can execute.
- Add a unit test asserting `AppComponent.navGroups` has no item with label `Portfolios`.
- Add a unit test asserting the `routes` configuration contains `{ path: 'portfolios', redirectTo: 'dashboard', pathMatch: 'full' }` and no longer lazy-loads a `PortfoliosComponent` route.

2) **Implement navigation + route changes**
- Update `AppComponent.navGroups` to remove the Portfolios nav item.
- Update `routes` in `app.routes.ts`:
  - Replace the `portfolios` component route with a redirect to `dashboard`.
  - Ensure the redirect updates the URL (Angular `redirectTo` behavior).

3) **Cleanup**
- Ensure there are no remaining in-app links to `/portfolios`.
- Optionally delete the portfolios feature component directory if it becomes unused and nothing else references it.

4) **Verification**
- Manual sanity check: navigate to `/portfolios` in the browser and confirm URL changes to `/dashboard`.
- Confirm Transactions portfolio tagging UI still works.

5) **Before push (Principle IX)**
- Sync `main` and integrate latest `origin/main` into the feature branch.
- Run CI-equivalent checks: `./scripts/ci_local.sh`.

## Complexity Tracking

N/A
