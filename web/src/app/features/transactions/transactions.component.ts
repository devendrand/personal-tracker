import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { LegTypeOption, RoundTripGroup, StrategyGroup, Transaction } from '../../shared/models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="transactions-container">
      <div class="header">
        <h1>Transactions</h1>
        <input
          #fileInput
          type="file"
          accept=".csv,text/csv"
          (change)="onFileSelected($event)"
          style="display:none"
        />
        <button mat-raised-button color="primary" (click)="fileInput.click()" [disabled]="uploading">
          <mat-icon>upload_file</mat-icon>
          Upload CSV
        </button>
      </div>

      @if (uploadSummary) {
        <mat-card class="summary">
          <mat-card-content>
            Imported {{ uploadSummary.imported }} | Duplicates {{ uploadSummary.duplicates }} | Skipped {{ uploadSummary.skipped }} | Failed {{ uploadSummary.failed }}
          </mat-card-content>
        </mat-card>
      }

      <div class="filters">
        <mat-button-toggle-group
          [value]="showUntaggedOnly ? 'untagged' : 'all'"
          (change)="onFilterChanged($event.value)"
          aria-label="Transaction filter"
        >
          <mat-button-toggle value="all">All</mat-button-toggle>
          <mat-button-toggle value="untagged">Untagged</mat-button-toggle>
        </mat-button-toggle-group>

        <mat-form-field appearance="fill" style="width: 220px; margin-left: 12px;">
          <mat-select
            [disabled]="showUntaggedOnly"
            [value]="selectedLegType"
            (selectionChange)="onLegTypeFilterSelected($event.value)"
            placeholder="All leg types"
          >
            <mat-option value="">All leg types</mat-option>
            @for (opt of legTypeOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Round-trip action toolbar (shown when rows are selected) -->
      @if (selectedIds().size > 0) {
        <mat-card class="action-bar">
          <mat-card-content>
            <span class="selection-count">{{ selectedIds().size }} selected</span>

            @if (canLink()) {
              <button mat-raised-button color="accent" (click)="onLinkSelected()">
                <mat-icon>link</mat-icon>
                Link
              </button>
            }

            @if (canAddToGroup()) {
              <button mat-raised-button color="accent" (click)="onAddToGroup()">
                <mat-icon>add_link</mat-icon>
                Add to Group
              </button>
            }

            @if (canUngroup()) {
              <button mat-raised-button color="warn" (click)="onUngroup()">
                <mat-icon>link_off</mat-icon>
                Ungroup
              </button>
            }

            @if (canUngroupAll()) {
              <button mat-raised-button color="warn" (click)="onUngroupAll()">
                <mat-icon>link_off</mat-icon>
                Ungroup All
              </button>
            }

            <button mat-button (click)="clearSelection()">
              Clear selection
            </button>
          </mat-card-content>
        </mat-card>
      }

      <mat-card>
        <mat-card-content>
          @if (loading) {
            <div class="loading">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading transactions...</p>
            </div>
          } @else if (transactions.length === 0) {
            <div class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              <h3>No transactions yet</h3>
              <p>Upload your E*TRADE CSV file to get started.</p>
            </div>
          } @else {
            <table mat-table [dataSource]="transactions" class="transactions-table">

              <!-- Checkbox column -->
              <ng-container matColumnDef="select">
                <th mat-header-cell *matHeaderCellDef>
                  <mat-checkbox
                    [checked]="allSelected()"
                    [indeterminate]="someSelected()"
                    (change)="toggleSelectAll($event.checked)"
                    aria-label="Select all transactions"
                  ></mat-checkbox>
                </th>
                <td mat-cell *matCellDef="let t">
                  <mat-checkbox
                    [checked]="selectedIds().has(t.id)"
                    (change)="toggleSelect(t, $event.checked)"
                    [aria-label]="'Select transaction ' + t.id"
                  ></mat-checkbox>
                </td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let t">{{ t.activity_date | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="symbol">
                <th mat-header-cell *matHeaderCellDef>Symbol</th>
                <td mat-cell *matCellDef="let t">{{ t.symbol || '--' }}</td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let t">{{ t.activity_type }}</td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let t">{{ t.description }}</td>
              </ng-container>

              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Qty</th>
                <td mat-cell *matCellDef="let t">{{ t.quantity ?? '--' }}</td>
              </ng-container>

              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Price</th>
                <td mat-cell *matCellDef="let t">{{ (t.price !== null && t.price !== undefined) ? (t.price | currency) : '--' }}</td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let t">{{ (t.amount !== null && t.amount !== undefined) ? (t.amount | currency) : '--' }}</td>
              </ng-container>

              <ng-container matColumnDef="leg_type">
                <th mat-header-cell *matHeaderCellDef>Leg Type</th>
                <td mat-cell *matCellDef="let t">
                  @if (legTypeOptions.length === 0) {
                    <span>--</span>
                  } @else {
                    <mat-form-field appearance="fill" style="width: 180px;">
                      <mat-select
                        [value]="t.leg_type ?? ''"
                        (selectionChange)="onLegTypeSelected(t, $event.value)"
                        placeholder="Untagged"
                      >
                        <mat-option value="">Untagged</mat-option>
                        @for (opt of legTypeOptions; track opt.value) {
                          <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="strategy_group">
                <th mat-header-cell *matHeaderCellDef>Strategy Group</th>
                <td mat-cell *matCellDef="let t">
                  @if (!t.symbol) {
                    <span>--</span>
                  } @else {
                    <mat-form-field appearance="fill" style="width: 200px;">
                      <mat-select
                        [value]="t.strategy_group_id ?? ''"
                        (selectionChange)="onStrategyGroupSelected(t, $event.value)"
                        placeholder="Ungrouped"
                      >
                        <mat-option value="">Ungrouped</mat-option>
                        @for (g of groupsForSymbol(t.symbol); track g.id) {
                          <mat-option [value]="g.id">{{ g.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  }
                </td>
              </ng-container>

              <!-- Round-trip group badge column -->
              <ng-container matColumnDef="round_trip">
                <th mat-header-cell *matHeaderCellDef>Round Trip</th>
                <td mat-cell *matCellDef="let t">
                  @if (t.round_trip_group_id) {
                    <div class="group-badge-cell">
                      <mat-chip
                        class="group-badge"
                        [matTooltip]="groupBadgeTooltip(t.round_trip_group_id)"
                        (click)="toggleGroupExpansion(t.round_trip_group_id)"
                      >
                        <mat-icon>link</mat-icon>
                        RT-{{ groupDisplayOrder(t.round_trip_group_id) }}
                      </mat-chip>
                      @if (expandedGroupId() === t.round_trip_group_id) {
                        <div class="group-members">
                          @for (m of groupMembers(t.round_trip_group_id); track m.id) {
                            <div class="member-row" [class.current-member]="m.id === t.id">
                              {{ m.activity_date | date:'shortDate' }} — {{ m.activity_type }}
                              @if (m.amount !== null && m.amount !== undefined) {
                                ({{ m.amount | currency }})
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  } @else {
                    <span class="no-group">--</span>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .transactions-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 500;
      }

      button mat-icon {
        margin-right: 8px;
      }
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;

      p {
        margin-top: 16px;
        color: rgba(0, 0, 0, 0.6);
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: rgba(0, 0, 0, 0.3);
      }

      h3 {
        margin: 16px 0 8px;
      }

      p {
        color: rgba(0, 0, 0, 0.6);
        margin: 0;
      }
    }

    .transactions-table {
      width: 100%;
    }

    .filters {
      margin-bottom: 16px;
    }

    .summary {
      margin-bottom: 16px;
    }

    .action-bar {
      margin-bottom: 16px;
      background-color: #e3f2fd;

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        padding: 8px 16px;
      }

      .selection-count {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.7);
        margin-right: 8px;
      }
    }

    .group-badge-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .group-badge {
      cursor: pointer;
      font-size: 12px;
      height: 28px;
      display: flex;
      align-items: center;
      gap: 4px;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .group-members {
      border-left: 2px solid #2196f3;
      padding-left: 8px;
      margin-top: 4px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);

      .member-row {
        padding: 2px 0;

        &.current-member {
          font-weight: 600;
          color: rgba(0, 0, 0, 0.87);
        }
      }
    }

    .no-group {
      color: rgba(0, 0, 0, 0.3);
    }
  `]
})
export class TransactionsComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  transactions: Transaction[] = [];
  legTypeOptions: LegTypeOption[] = [];
  strategyGroups: StrategyGroup[] = [];
  roundTripGroups: RoundTripGroup[] = [];
  loading = true;
  uploading = false;
  showUntaggedOnly = false;
  selectedLegType = '';
  uploadSummary: { imported: number; skipped: number; failed: number; duplicates: number } | null = null;

  // Signals for selection state
  selectedIds = signal<Set<string>>(new Set());
  expandedGroupId = signal<string | null>(null);

  displayedColumns = ['select', 'date', 'symbol', 'type', 'description', 'quantity', 'price', 'amount', 'leg_type', 'strategy_group', 'round_trip'];

  // ---- computed selection helpers ----

  allSelected = computed(() => {
    const sel = this.selectedIds();
    return this.transactions.length > 0 && sel.size === this.transactions.length;
  });

  someSelected = computed(() => {
    const sel = this.selectedIds();
    return sel.size > 0 && sel.size < this.transactions.length;
  });

  /** True when 2+ are selected and ALL are unlinked and share the same symbol. */
  canLink = computed(() => {
    const sel = this.selectedIds();
    if (sel.size < 2) return false;
    const selected = this.transactions.filter(t => sel.has(t.id));
    const allUnlinked = selected.every(t => t.round_trip_group_id === null);
    const symbols = new Set(selected.map(t => t.symbol).filter(Boolean));
    return allUnlinked && symbols.size === 1;
  });

  /**
   * True when selection includes exactly one linked transaction (determines target group)
   * plus one or more unlinked transactions with the same symbol.
   */
  canAddToGroup = computed(() => {
    const sel = this.selectedIds();
    if (sel.size < 2) return false;
    const selected = this.transactions.filter(t => sel.has(t.id));
    const linked = selected.filter(t => t.round_trip_group_id !== null);
    const unlinked = selected.filter(t => t.round_trip_group_id === null);
    if (linked.length !== 1 || unlinked.length < 1) return false;
    // All selected must share the same symbol
    const symbols = new Set(selected.map(t => t.symbol).filter(Boolean));
    return symbols.size === 1;
  });

  /** True when at least one linked transaction is selected. */
  canUngroup = computed(() => {
    const sel = this.selectedIds();
    if (sel.size === 0) return false;
    return this.transactions.some(t => sel.has(t.id) && t.round_trip_group_id !== null);
  });

  /**
   * True when exactly one group's transactions are ALL selected.
   */
  canUngroupAll = computed(() => {
    const sel = this.selectedIds();
    if (sel.size === 0) return false;
    const selected = this.transactions.filter(t => sel.has(t.id));
    const groupIds = new Set(selected.map(t => t.round_trip_group_id).filter(Boolean));
    if (groupIds.size !== 1) return false;
    const groupId = [...groupIds][0] as string;
    const allGroupMembers = this.transactions.filter(t => t.round_trip_group_id === groupId);
    return selected.length === allGroupMembers.length;
  });

  ngOnInit(): void {
    this.loadLegTypes();
    this.loadStrategyGroups();
    this.loadTransactions();
    this.loadRoundTripGroups();
  }

  onFilterChanged(value: string): void {
    this.showUntaggedOnly = value === 'untagged';
    if (this.showUntaggedOnly) {
      this.selectedLegType = '';
    }
    this.loadTransactions();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.api.uploadTransactionsCsv(file).subscribe({
      next: (summary) => {
        this.uploadSummary = summary;
        this.uploading = false;
        this.loadTransactions();
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.uploading = false;
      }
    });

    // Allow selecting the same file again.
    input.value = '';
  }

  onLegTypeFilterSelected(legType: string): void {
    this.selectedLegType = legType;
    this.loadTransactions();
  }

  onLegTypeSelected(t: Transaction, legType: string): void {
    const value = legType || null;
    this.api.patchLegType(t.id, value).subscribe({
      next: () => this.loadTransactions(),
      error: (err) => console.error('Leg type tagging failed:', err)
    });
  }

  loadLegTypes(): void {
    this.api.getLegTypes().subscribe({
      next: (data) => (this.legTypeOptions = data),
      error: (err) => console.error('Failed to load leg types:', err)
    });
  }

  loadStrategyGroups(): void {
    this.api.getStrategyGroups().subscribe({
      next: (data) => (this.strategyGroups = data),
      error: (err) => console.error('Failed to load strategy groups:', err)
    });
  }

  loadRoundTripGroups(): void {
    this.api.getRoundTripGroups().subscribe({
      next: (data) => (this.roundTripGroups = data),
      error: (err) => console.error('Failed to load round-trip groups:', err)
    });
  }

  groupsForSymbol(symbol: string): StrategyGroup[] {
    return this.strategyGroups.filter((g) => g.symbol === symbol);
  }

  onStrategyGroupSelected(t: Transaction, groupId: string): void {
    const value = groupId || null;
    this.api.patchStrategyGroup(t.id, value).subscribe({
      next: () => this.loadTransactions(),
      error: (err) => console.error('Strategy group assignment failed:', err)
    });
  }

  loadTransactions(): void {
    this.loading = true;
    const tagged = this.showUntaggedOnly ? false : undefined;
    const leg_type = this.selectedLegType || undefined;
    this.api.getTransactions({ tagged, leg_type }).subscribe({
      next: (data) => {
        this.transactions = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load transactions:', err);
        this.loading = false;
      }
    });
  }

  // ---- selection ----

  toggleSelect(t: Transaction, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) {
      next.add(t.id);
    } else {
      next.delete(t.id);
    }
    this.selectedIds.set(next);
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.selectedIds.set(new Set(this.transactions.map(t => t.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // ---- round-trip actions ----

  onLinkSelected(): void {
    const ids = [...this.selectedIds()];
    this.api.linkTransactions({ transaction_ids: ids }).subscribe({
      next: (group) => {
        this.snackBar.open(`Linked as Round Trip RT-${group.display_order}`, 'OK', { duration: 3000 });
        this.clearSelection();
        this.loadTransactions();
        this.loadRoundTripGroups();
      },
      error: (err) => {
        const msg = err?.error?.detail ?? 'Failed to link transactions';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  onAddToGroup(): void {
    const selected = this.transactions.filter(t => this.selectedIds().has(t.id));
    const linkedTxn = selected.find(t => t.round_trip_group_id !== null);
    const unlinkedIds = selected
      .filter(t => t.round_trip_group_id === null)
      .map(t => t.id);

    if (!linkedTxn?.round_trip_group_id) return;

    this.api.addToRoundTripGroup(linkedTxn.round_trip_group_id, { transaction_ids: unlinkedIds }).subscribe({
      next: (group) => {
        this.snackBar.open(`Added to Round Trip RT-${group.display_order}`, 'OK', { duration: 3000 });
        this.clearSelection();
        this.loadTransactions();
        this.loadRoundTripGroups();
      },
      error: (err) => {
        const msg = err?.error?.detail ?? 'Failed to add to group';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  onUngroup(): void {
    const selected = this.transactions.filter(t => this.selectedIds().has(t.id));

    // Group linked transactions by their group_id, then remove each set
    const byGroup = new Map<string, string[]>();
    for (const t of selected) {
      if (t.round_trip_group_id) {
        const existing = byGroup.get(t.round_trip_group_id) ?? [];
        existing.push(t.id);
        byGroup.set(t.round_trip_group_id, existing);
      }
    }

    let pending = byGroup.size;
    if (pending === 0) return;

    for (const [groupId, txnIds] of byGroup) {
      this.api.removeFromRoundTripGroup(groupId, { transaction_ids: txnIds }).subscribe({
        next: () => {
          pending--;
          if (pending === 0) {
            this.snackBar.open('Ungrouped successfully', 'OK', { duration: 3000 });
            this.clearSelection();
            this.loadTransactions();
            this.loadRoundTripGroups();
          }
        },
        error: (err) => {
          const msg = err?.error?.detail ?? 'Failed to ungroup';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        }
      });
    }
  }

  onUngroupAll(): void {
    const selected = this.transactions.filter(t => this.selectedIds().has(t.id));
    const groupId = selected.find(t => t.round_trip_group_id)?.round_trip_group_id;
    if (!groupId) return;

    this.api.deleteRoundTripGroup(groupId).subscribe({
      next: () => {
        this.snackBar.open('Group disbanded', 'OK', { duration: 3000 });
        this.clearSelection();
        this.loadTransactions();
        this.loadRoundTripGroups();
      },
      error: (err) => {
        const msg = err?.error?.detail ?? 'Failed to disband group';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  // ---- group badge helpers ----

  groupDisplayOrder(groupId: string): number {
    return this.roundTripGroups.find(g => g.id === groupId)?.display_order ?? 0;
  }

  groupBadgeTooltip(groupId: string): string {
    const group = this.roundTripGroups.find(g => g.id === groupId);
    if (!group) return 'Round-trip group';
    return `RT-${group.display_order} · ${group.member_count} transactions`;
  }

  toggleGroupExpansion(groupId: string): void {
    this.expandedGroupId.set(
      this.expandedGroupId() === groupId ? null : groupId
    );
  }

  groupMembers(groupId: string): Transaction[] {
    return this.transactions.filter(t => t.round_trip_group_id === groupId);
  }
}
