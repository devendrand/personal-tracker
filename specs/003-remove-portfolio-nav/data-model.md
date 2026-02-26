# Data Model: Remove Portfolio Navigation & Page

**Feature**: Remove Portfolio Navigation & Page  
**Branch**: feature/remove-portfolio-nav  
**Date**: 2026-02-25

## Summary

This feature makes a frontend navigation/routing change only. No database schema, API schema, or persistence model changes are required.

## Entities (unchanged)

### Portfolio
- Exists as a user-scoped grouping for transactions.
- No changes to fields or relationships.

### Transaction
- May reference an associated portfolio.
- No changes to fields or relationships.

## Validation / Rules (unchanged)

- Existing portfolio-tagging behavior in the Transactions UI must remain functional.
