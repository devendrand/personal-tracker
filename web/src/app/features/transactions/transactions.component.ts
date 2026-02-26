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
import { Transaction } from '../../shared/models/transaction.model';

interface StrategyTypeOption {
  value: string;
  label: string;
  description: string;
}

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
          [value]="showUnassignedOnly ? 'unassigned' : 'all'"
          (change)="onFilterChanged($event.value)"
          aria-label="Transaction filter"
        >
          <mat-button-toggle value="all">All</mat-button-toggle>
          <mat-button-toggle value="unassigned">Untagged</mat-button-toggle>
        </mat-button-toggle-group>

        <mat-form-field appearance="fill" style="width: 220px; margin-left: 12px;">
          <mat-select
            [disabled]="showUnassignedOnly"
            [value]="selectedStrategyType"
            (selectionChange)="onStrategyFilterSelected($event.value)"
            placeholder="All strategies"
          >
            <mat-option value="">All strategies</mat-option>
            @for (opt of strategyTypeOptions; track opt.value) {
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

              <ng-container matColumnDef="strategy_type">
                <th mat-header-cell *matHeaderCellDef>Strategy Type</th>
                <td mat-cell *matCellDef="let t">
                  @if (strategyTypeOptions.length === 0) {
                    <span>--</span>
                  } @else {
                    <mat-form-field appearance="fill" style="width: 220px;">
                      <mat-select
                        [value]="t.strategy_type ?? ''"
                        (selectionChange)="onStrategyTypeSelected(t, $event.value)"
                        placeholder="Untagged"
                      >
                        <mat-option value="">Untagged</mat-option>
                        @for (opt of strategyTypeOptions; track opt.value) {
                          <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
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
  strategyTypeOptions: StrategyTypeOption[] = [];
  loading = true;
  uploading = false;
  showUnassignedOnly = false;
  selectedStrategyType = '';
  uploadSummary: { imported: number; skipped: number; failed: number; duplicates: number } | null = null;

  displayedColumns = ['date', 'symbol', 'type', 'description', 'quantity', 'price', 'amount', 'strategy_type'];

  ngOnInit(): void {
    this.loadStrategyTypes();
    this.loadTransactions();
  }

  onFilterChanged(value: string): void {
    this.showUnassignedOnly = value === 'unassigned';
    if (this.showUnassignedOnly) {
      this.selectedStrategyType = '';
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

  onStrategyFilterSelected(strategyType: string): void {
    this.selectedStrategyType = strategyType;
    this.loadTransactions();
  }

  onStrategyTypeSelected(t: Transaction, strategyType: string): void {
    const value = strategyType || null;
    this.api.setTransactionStrategyType(t.id, value).subscribe({
      next: () => this.loadTransactions(),
      error: (err) => console.error('Tagging failed:', err)
    });
  }

  loadStrategyTypes(): void {
    this.api.getStrategyTypes().subscribe({
      next: (data) => (this.strategyTypeOptions = data),
      error: (err) => console.error('Failed to load strategy types:', err)
    });
  }

  loadTransactions(): void {
    this.loading = true;
    const tagged = this.showUnassignedOnly ? false : undefined;
    const strategy_type = this.selectedStrategyType || undefined;
    this.api.getTransactions({ tagged, strategy_type }).subscribe({
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
