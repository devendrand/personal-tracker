# Research: Round-Trip Linking Feature

## Research Tasks Completed

### R1: SQLAlchemy Async Query Patterns

**Decision**: Use `selectinload` for eager loading of round-trip groups when querying transactions.

**Rationale**: 
- `selectinload` issues a separate IN query, efficient for loading related objects
- Works well with async SQLAlchemy 2.0
- Pattern already used in existing codebase (e.g., `pnl.py`)

**Implementation pattern**:
```python
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(Transaction)
    .where(Transaction.user_sub == user_sub)
    .options(selectinload(Transaction.round_trip_group))
)
```

**Alternatives considered**:
- `joinedload`: Not ideal for one-to-many or when not all results need the relation
- Lazy loading: Not available in async context

---

### R2: Angular Material Table Checkbox Selection

**Decision**: Use Angular Material's `MatCheckbox` with selection model.

**Rationale**:
- Standard pattern in Angular Material
- Already imported in existing components
- Works with existing `MatTable` implementation

**Implementation pattern**:
```typescript
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';

selection = new SelectionModel<Transaction>(true, []);

isAllSelected() {
  const numSelected = this.selection.selected.length;
  const numRows = this.transactions.length;
  return numSelected === numRows;
}

toggleAllRows() {
  if (this.isAllSelected()) {
    this.selection.clear();
    return;
  }
  this.selection.select(...this.transactions);
}
```

**Alternatives considered**:
- Custom checkbox implementation: More code, less accessible
- Third-party table with selection: Adds dependency

---

### R3: SQLAlchemy Transaction Atomicity

**Decision**: Use `db.flush()` for validation, `db.commit()` only after all operations succeed. Use try/except with rollback.

**Rationale**:
- `flush()` writes to DB but doesn't commit, allowing rollback
- Pattern already established in existing routers (e.g., `transactions.py`)
- Ensures atomicity per FR-013

**Implementation pattern**:
```python
try:
    # Create group
    group = RoundTripGroup(...)
    db.add(group)
    await db.flush()  # Get group ID
    
    # Update transactions
    for txn_id in transaction_ids:
        txn = await db.get(Transaction, txn_id)
        txn.round_trip_group_id = group.id
        await db.flush()
    
    # Commit all at once
    await db.commit()
except Exception:
    await db.rollback()
    raise
```

**Alternatives considered**:
- Manual transaction control: More complex, not needed for this use case
- Savepoints: Not needed for single logical operation

---

## Summary

All research tasks completed. The implementation will use:
- SQLAlchemy 2.0 async with `selectinload` for queries
- Angular Material `MatCheckbox` with `SelectionModel` for UI
- Flush-then-commit pattern for atomic operations

No unresolved questions remain. Proceed to Phase 1.