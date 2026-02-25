# Contracts — HTTP API (Portfolios)

**Date**: 2026-02-24

## Scope

Defines the expected public API behavior related to portfolios after portfolio creation is removed.

## Endpoints

### List portfolios

- Method: `GET`
- Path: `/api/portfolios`
- Auth: Required
- Expected result: `200 OK` with a list of user-scoped portfolios.

### Get portfolio

- Method: `GET`
- Path: `/api/portfolios/{portfolio_id}`
- Auth: Required
- Expected result:
  - `200 OK` for a portfolio owned by the user
  - `404 Not Found` if the portfolio does not exist or is not owned by the user

### Create portfolio (REMOVED)

- Method: `POST`
- Path: `/api/portfolios`
- Expected result: `405 Method Not Allowed`

## Frontend contract

- The Portfolios feature MUST not render any "create portfolio" controls.
- The API client MUST not expose a portfolio creation helper.
