import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="transactions-container">
      <div class="header">
        <h1>Transactions</h1>
        <button mat-raised-button color="primary">
          <mat-icon>upload_file</mat-icon>
          Upload CSV
        </button>
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
                <td mat-cell *matCellDef="let t">{{ t.date | date:'medium' }}</td>
              </ng-container>

              <ng-container matColumnDef="ticker">
                <th mat-header-cell *matHeaderCellDef>Ticker</th>
                <td mat-cell *matCellDef="let t">{{ t.ticker }}</td>
              </ng-container>

              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef>Action</th>
                <td mat-cell *matCellDef="let t">{{ t.action }}</td>
              </ng-container>

              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Qty</th>
                <td mat-cell *matCellDef="let t">{{ t.quantity }}</td>
              </ng-container>

              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Price</th>
                <td mat-cell *matCellDef="let t">{{ t.price | currency }}</td>
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
  `]
})
export class TransactionsComponent implements OnInit {
  private api = inject(ApiService);

  transactions: Transaction[] = [];
  loading = true;
  displayedColumns = ['date', 'ticker', 'action', 'quantity', 'price'];

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.api.get<Transaction[]>('/transactions').subscribe({
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
