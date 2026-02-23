import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard</h1>
      <p class="subtitle">Welcome to Trade Tracker</p>
      
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>account_balance</mat-icon>
            <mat-card-title>Total Value</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="stat-value">$0.00</p>
            <p class="stat-label">Portfolio value</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>trending_up</mat-icon>
            <mat-card-title>Total P&L</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="stat-value">$0.00</p>
            <p class="stat-label">Unrealized gains</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>receipt_long</mat-icon>
            <mat-card-title>Transactions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="stat-value">0</p>
            <p class="stat-label">Total trades</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>folder</mat-icon>
            <mat-card-title>Portfolios</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="stat-value">0</p>
            <p class="stat-label">Active portfolios</p>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="getting-started">
        <mat-card-header>
          <mat-card-title>Getting Started</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Upload your E*TRADE transaction CSV to get started with tracking your trades.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="goToTransactions()">
            <mat-icon>upload_file</mat-icon>
            Upload Transactions
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
      margin-bottom: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      mat-card-header {
        margin-bottom: 8px;
      }

      mat-icon[mat-card-avatar] {
        background: #e3f2fd;
        color: #1976d2;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .stat-value {
      font-size: 32px;
      font-weight: 500;
      margin: 0;
      color: #1976d2;
    }

    .stat-label {
      color: rgba(0, 0, 0, 0.6);
      margin: 4px 0 0 0;
      font-size: 14px;
    }

    .getting-started {
      mat-card-actions {
        padding: 16px;
      }

      button mat-icon {
        margin-right: 8px;
      }
    }
  `]
})
export class DashboardComponent {
  private readonly router = inject(Router);

  goToTransactions(): void {
    this.router.navigate(['/transactions']);
  }
}
