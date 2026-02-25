# Data Model — Remove Portfolio Create Page

**Date**: 2026-02-24

## Summary

This feature does not introduce new entities and does not modify storage. It removes portfolio *creation* as a supported workflow.

## Entities (unchanged)

### Portfolio

- Persisted in table: `portfolio`
- Key fields: `id`, `user_sub`, `name`, `created_at`, `updated_at`
- Relationship: a portfolio can be referenced by many transactions

### Transaction

- Persisted in table: `transaction`
- Key field used here: `portfolio_id` (nullable FK referencing `portfolio.id`)

## Behavioral constraints

- Existing `portfolio` rows remain readable.
- Existing `transaction.portfolio_id` values remain valid and must not be altered.
