import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';
import { LegTypeOption, StrategyGroup, Transaction } from '../../shared/models/transaction.model';

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
    MatSelectModule
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
      max-width: 1200px;
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
  `]
})
export class TransactionsComponent implements OnInit {
  private api = inject(ApiService);

  transactions: Transaction[] = [];
  legTypeOptions: LegTypeOption[] = [];
  strategyGroups: StrategyGroup[] = [];
  loading = true;
  uploading = false;
  showUntaggedOnly = false;
  selectedLegType = '';
  uploadSummary: { imported: number; skipped: number; failed: number; duplicates: number } | null = null;

  displayedColumns = ['date', 'symbol', 'type', 'description', 'quantity', 'price', 'amount', 'leg_type', 'strategy_group'];

  ngOnInit(): void {
    this.loadLegTypes();
    this.loadStrategyGroups();
    this.loadTransactions();
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
}
