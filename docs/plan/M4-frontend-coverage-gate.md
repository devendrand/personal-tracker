# M4: Frontend Coverage Gate

## Goal
Add a frontend unit-test coverage check to the CI-equivalent workflow so that coverage regressions are caught early.

## Scope
- Run Angular unit tests in CI (headless browser).
- Generate code coverage output.
- Fail the CI job if global coverage drops below an initial baseline threshold.

## Non-Goals
- Increase frontend test coverage in this milestone.
- Add end-to-end tests.

## Approach
- Enable global coverage thresholds in the Karma coverage reporter.
- Run `ng test` with `--code-coverage` and `--watch=false` in both:
  - Local CI script
  - GitHub Actions workflow

## Verification
- `./scripts/ci_local.sh` passes locally.
- GitHub Actions includes a dedicated frontend test job that fails when coverage is below the configured thresholds.
