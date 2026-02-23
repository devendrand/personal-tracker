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
import { Portfolio } from '../../shared/models/portfolio.model';
import { Transaction } from '../../shared/models/transaction.model';

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
          <mat-button-toggle value="unassigned">Unassigned</mat-button-toggle>
        </mat-button-toggle-group>
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
                <td mat-cell *matCellDef="let t">{{ t.price != null ? (t.price | currency) : '--' }}</td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let t">{{ t.amount != null ? (t.amount | currency) : '--' }}</td>
              </ng-container>

              <ng-container matColumnDef="portfolio">
                <th mat-header-cell *matHeaderCellDef>Portfolio</th>
                <td mat-cell *matCellDef="let t">
                  @if (portfolios.length === 0) {
                    <span>--</span>
                  } @else {
                    <mat-form-field appearance="fill" style="width: 220px;">
                      <mat-select
                        [value]="t.portfolio_id ?? ''"
                        (selectionChange)="onPortfolioSelected(t, $event.value)"
                        placeholder="Unassigned"
                      >
                        <mat-option value="">Unassigned</mat-option>
                        @for (p of portfolios; track p.id) {
                          <mat-option [value]="p.id">{{ p.name }}</mat-option>
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
  portfolios: Portfolio[] = [];
  loading = true;
  uploading = false;
  showUnassignedOnly = false;
  uploadSummary: { imported: number; skipped: number; failed: number; duplicates: number } | null = null;

  displayedColumns = ['date', 'symbol', 'type', 'description', 'quantity', 'price', 'amount', 'portfolio'];

  ngOnInit(): void {
    this.loadPortfolios();
    this.loadTransactions();
  }

  onFilterChanged(value: string): void {
    this.showUnassignedOnly = value === 'unassigned';
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

  onPortfolioSelected(t: Transaction, portfolioId: string): void {
    // Only support assigning to a real portfolio; "Unassigned" is a no-op in v1.
    if (!portfolioId) {
      return;
    }
    this.api.tagTransaction(t.id, portfolioId).subscribe({
      next: () => this.loadTransactions(),
      error: (err) => console.error('Tagging failed:', err)
    });
  }

  loadPortfolios(): void {
    this.api.getPortfolios().subscribe({
      next: (data) => (this.portfolios = data),
      error: (err) => console.error('Failed to load portfolios:', err)
    });
  }

  loadTransactions(): void {
    this.loading = true;
    const assigned = this.showUnassignedOnly ? false : undefined;
    this.api.getTransactions({ assigned }).subscribe({
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
