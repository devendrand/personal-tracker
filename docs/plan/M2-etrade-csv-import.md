# M2: E*TRADE CSV Transaction Import (Plan)

**Date**: 2026-02-23  
**Feature**: E*TRADE CSV Transaction Import  
**Spec**: `specs/001-etrade-csv-import/spec.md`

## Goal

Enable an authenticated user to upload an E*TRADE “Account Activity” CSV and import each activity row (including transfers/cash movements) into their transaction store. All imported transactions start **unassigned** to any portfolio; users tag them later via an “Unassigned” view.

## Non-Goals (This Iteration)

- Automatic portfolio tagging during import
- Direct brokerage sync/integration
- Advanced analytics beyond storing and later tagging transactions

## Key Decisions

- **Import as-is**: Preserve original row fields for traceability.
- **Always unassigned**: Imported transactions are never auto-tagged to a portfolio.
- **Pseudo account**: Treat uploads as belonging to a single stable “pseudo brokerage account” identifier for now.
- **Duplicate prevention**: Re-uploading overlapping CSVs should not create duplicate transactions.

## Approach

1. **Define data model + migration**
   - Add tables/entities for transactions, portfolios, and import batches.
   - Ensure user ownership/scoping is enforced at the data level.

2. **Test-first implementation (TDD)**
   - Write failing tests for parsing, validation, duplicate detection, and authorization.
   - Implement import behavior to satisfy tests.

3. **Implement upload + listing + tagging APIs**
   - Upload endpoint accepts a CSV file, validates structure, imports rows, and returns an import summary.
   - List transactions with filters including “unassigned”.
   - Tagging endpoint assigns a transaction to a user-owned portfolio.

4. **Wire UI upload + unassigned workflow**
   - Add file picker + upload call.
   - Add an “Unassigned” filter/view.
   - Add a tagging mechanism to assign a transaction to a portfolio.

## Verification Criteria

- **Import correctness**: Uploading the sample CSV imports expected rows and produces an import summary.
- **Validation**: Invalid/malformed CSV is rejected with a clear reason.
- **Idempotency**: Re-uploading the same CSV does not create duplicates.
- **Authorization**: Users can only import, view, and tag their own transactions and portfolios.
- **Unassigned workflow**: Imported transactions appear in an “Unassigned” view and can be tagged later.
