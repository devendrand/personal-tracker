import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { NetWorthService } from '../../services/networth.service';
import { NetWorthTrendResponse, TrendDataPoint, formatCurrency } from '../../models/networth.model';

@Component({
  selector: 'app-networth-trend',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterLink
  ],
  template: `
    <div class="trend-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Net Worth Trend</mat-card-title>
          <mat-card-subtitle>Track your net worth over time</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-button-toggle-group [(value)]="selectedPeriod" (change)="loadTrend()">
              <mat-button-toggle value="3m">3 Months</mat-button-toggle>
              <mat-button-toggle value="6m">6 Months</mat-button-toggle>
              <mat-button-toggle value="1y">1 Year</mat-button-toggle>
              <mat-button-toggle value="2y">2 Years</mat-button-toggle>
              <mat-button-toggle value="all">All Time</mat-button-toggle>
            </mat-button-toggle-group>

            <button mat-button routerLink="/networth">
              <mat-icon>arrow_back</mat-icon>
              Back to Dashboard
            </button>
          </div>

          @if (loading()) {
            <div class="loading">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (!trendData() || trendData()!.dataPoints.length === 0) {
            <div class="empty-state">
              <mat-icon>show_chart</mat-icon>
              <p>Not enough data to show a trend. Create more snapshots over time.</p>
            </div>
          } @else {
            <div class="trend-summary">
              <div class="summary-item">
                <span class="label">Period Change</span>
                <span class="value" [class.positive]="trendData()!.netChange >= 0" [class.negative]="trendData()!.netChange < 0">
                  @if (trendData()!.netChange >= 0) { + }
                  {{ formatCurrency(trendData()!.netChange) }}
                </span>
              </div>
              <div class="summary-item">
                <span class="label">Change %</span>
                <span class="value" [class.positive]="trendData()!.netChangePercent >= 0" [class.negative]="trendData()!.netChangePercent < 0">
                  @if (trendData()!.netChangePercent >= 0) { + }
                  {{ trendData()!.netChangePercent.toFixed(1) }}%
                </span>
              </div>
              <div class="summary-item">
                <span class="label">From</span>
                <span class="value">{{ trendData()!.periodStart | date:'mediumDate' }}</span>
              </div>
              <div class="summary-item">
                <span class="label">To</span>
                <span class="value">{{ trendData()!.periodEnd | date:'mediumDate' }}</span>
              </div>
            </div>

            <div class="chart-placeholder">
              <!-- Chart visualization would go here -->
              <!-- Consider using ngx-charts, Chart.js, or similar -->
              <div class="chart-area">
                <p class="chart-message">Chart visualization coming soon</p>
                <p class="chart-hint">Integrate ngx-charts or Chart.js for interactive charts</p>
              </div>

              <div class="data-table">
                <h3>Data Points</h3>
                <div class="data-grid">
                  @for (point of trendData()!.dataPoints; track point.date) {
                    <div class="data-row">
                      <span class="date">{{ point.date | date:'shortDate' }}</span>
                      <span class="assets positive">{{ formatCurrency(point.totalAssets) }}</span>
                      <span class="liabilities negative">{{ formatCurrency(point.totalLiabilities) }}</span>
                      <span class="net-worth" [class.positive]="point.netWorth >= 0" [class.negative]="point.netWorth < 0">
                        {{ formatCurrency(point.netWorth) }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .trend-container {
      padding: 16px;
    }

    .filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 60px;
    }

    .empty-state {
      text-align: center;
      padding: 60px;
      color: rgba(0, 0, 0, 0.6);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
      }
    }

    .trend-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .summary-item {
      text-align: center;
    }

    .summary-item .label {
      display: block;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
    }

    .summary-item .value {
      display: block;
      font-size: 18px;
      font-weight: 500;
      margin-top: 4px;
    }

    .positive {
      color: #4caf50;
    }

    .negative {
      color: #f44336;
    }

    .chart-placeholder {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .chart-area {
      height: 300px;
      background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .chart-message {
      font-size: 18px;
      color: rgba(0, 0, 0, 0.6);
    }

    .chart-hint {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.4);
    }

    .data-table h3 {
      margin-bottom: 16px;
    }

    .data-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;
    }

    .data-row {
      display: grid;
      grid-template-columns: 100px 1fr 1fr 1fr;
      gap: 16px;
      padding: 8px 12px;
      background: #fafafa;
      border-radius: 4px;
      font-size: 14px;
    }

    .data-row .date {
      color: rgba(0, 0, 0, 0.7);
    }

    .data-row .assets,
    .data-row .liabilities,
    .data-row .net-worth {
      text-align: right;
      font-family: monospace;
    }
  `]
})
export class NetWorthTrendComponent implements OnInit {
  private readonly netWorthService = inject(NetWorthService);

  trendData = signal<NetWorthTrendResponse | null>(null);
  loading = signal(true);
  selectedPeriod = '1y';

  formatCurrency = formatCurrency;

  ngOnInit(): void {
    this.loadTrend();
  }

  loadTrend(): void {
    this.loading.set(true);
    this.netWorthService.getTrend(this.selectedPeriod).subscribe({
      next: (data) => {
        this.trendData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load trend', err);
        this.trendData.set(null);
        this.loading.set(false);
      }
    });
  }
}
