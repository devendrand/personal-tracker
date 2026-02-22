import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { NetWorthService } from '../../services/networth.service';
import { NetWorthSummary, formatCurrency, getCategoryDisplayName } from '../../models/networth.model';

@Component({
  selector: 'app-networth-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  template: `
    <div class="dashboard-container">
      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (!summary()) {
        <mat-card class="empty-state-card">
          <mat-card-content>
            <div class="empty-state">
              <mat-icon>account_balance</mat-icon>
              <h2>Welcome to Net Worth Tracker</h2>
              <p>Start by adding your accounts and recording your first snapshot.</p>
              <div class="empty-actions">
                <button mat-raised-button color="primary" routerLink="/networth/accounts">
                  <mat-icon>add</mat-icon>
                  Add Accounts
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Summary Cards -->
        <div class="summary-grid">
          <mat-card class="summary-card net-worth">
            <mat-card-content>
              <div class="summary-label">Net Worth</div>
              <div class="summary-value" [class.positive]="summary()!.currentNetWorth >= 0" [class.negative]="summary()!.currentNetWorth < 0">
                {{ formatCurrency(summary()!.currentNetWorth) }}
              </div>
              <div class="summary-change" [class.positive]="summary()!.changeFromPrevious >= 0" [class.negative]="summary()!.changeFromPrevious < 0">
                @if (summary()!.changeFromPrevious >= 0) {
                  <mat-icon>trending_up</mat-icon>
                } @else {
                  <mat-icon>trending_down</mat-icon>
                }
                {{ formatCurrency(Math.abs(summary()!.changeFromPrevious)) }}
                ({{ summary()!.changePercent > 0 ? '+' : '' }}{{ summary()!.changePercent.toFixed(1) }}%)
              </div>
              <div class="summary-date">as of {{ summary()!.snapshotDate | date:'mediumDate' }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card assets">
            <mat-card-content>
              <div class="summary-label">Total Assets</div>
              <div class="summary-value positive">
                {{ formatCurrency(summary()!.totalAssets) }}
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card liabilities">
            <mat-card-content>
              <div class="summary-label">Total Liabilities</div>
              <div class="summary-value negative">
                {{ formatCurrency(summary()!.totalLiabilities) }}
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Breakdown Cards -->
        <div class="breakdown-grid">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Assets by Category</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="category-list">
                @for (entry of getAssetCategories(); track entry.category) {
                  <div class="category-row">
                    <span class="category-name">{{ getCategoryDisplayName(entry.category) }}</span>
                    <span class="category-value">{{ formatCurrency(entry.amount) }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Liabilities by Category</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="category-list">
                @for (entry of getLiabilityCategories(); track entry.category) {
                  <div class="category-row">
                    <span class="category-name">{{ getCategoryDisplayName(entry.category) }}</span>
                    <span class="category-value">{{ formatCurrency(entry.amount) }}</span>
                  </div>
                }
                @empty {
                  <div class="no-liabilities">No liabilities - great job!</div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button mat-raised-button color="primary" routerLink="/networth/snapshot/new">
            <mat-icon>add</mat-icon>
            New Snapshot
          </button>
          <button mat-stroked-button routerLink="/networth/trend">
            <mat-icon>show_chart</mat-icon>
            View Trend
          </button>
          <button mat-stroked-button routerLink="/networth/accounts">
            <mat-icon>account_balance</mat-icon>
            Manage Accounts
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 16px;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .empty-state-card {
      max-width: 500px;
      margin: 40px auto;
    }

    .empty-state {
      text-align: center;
      padding: 40px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: rgba(0, 0, 0, 0.4);
      }

      h2 {
        margin-top: 16px;
      }

      p {
        color: rgba(0, 0, 0, 0.6);
      }
    }

    .empty-actions {
      margin-top: 24px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      text-align: center;
      padding: 8px;
    }

    .summary-card.net-worth {
      grid-column: span 1;
    }

    .summary-label {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-value {
      font-size: 32px;
      font-weight: 500;
      margin: 8px 0;
    }

    .summary-value.positive {
      color: #4caf50;
    }

    .summary-value.negative {
      color: #f44336;
    }

    .summary-change {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 14px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .summary-change.positive {
      color: #4caf50;
    }

    .summary-change.negative {
      color: #f44336;
    }

    .summary-date {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 8px;
    }

    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .category-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .category-row:last-child {
      border-bottom: none;
    }

    .category-name {
      color: rgba(0, 0, 0, 0.7);
    }

    .category-value {
      font-weight: 500;
      font-family: monospace;
    }

    .no-liabilities {
      text-align: center;
      padding: 16px;
      color: #4caf50;
      font-style: italic;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }
  `]
})
export class NetWorthDashboardComponent implements OnInit {
  private readonly netWorthService = inject(NetWorthService);

  summary = signal<NetWorthSummary | null>(null);
  loading = signal(true);

  // Expose helper functions to template
  formatCurrency = formatCurrency;
  getCategoryDisplayName = getCategoryDisplayName;
  Math = Math;

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading.set(true);
    this.netWorthService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load summary', err);
        this.summary.set(null);
        this.loading.set(false);
      }
    });
  }

  getAssetCategories(): Array<{ category: string; amount: number }> {
    const summary = this.summary();
    if (!summary) return [];
    return Object.entries(summary.assetsByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }

  getLiabilityCategories(): Array<{ category: string; amount: number }> {
    const summary = this.summary();
    if (!summary) return [];
    return Object.entries(summary.liabilitiesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }
}
