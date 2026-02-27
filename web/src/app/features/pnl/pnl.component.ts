import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

import { ApiService } from '../../core/services/api.service';
import { PnLSummaryResponse } from './models/pnl.models';

@Component({
  selector: 'app-pnl',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
  ],
  template: `
    <div class="pnl-container">
      <h1>Realized PnL</h1>

      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (pnl()) {
        <mat-card class="total-card">
          <mat-card-content>
            <div class="total-row">
              <span class="total-label">Total Realized PnL</span>
              <span class="total-value" [class.positive]="isPositive(pnl()!.total_realized_pnl)" [class.negative]="isNegative(pnl()!.total_realized_pnl)">
                {{ toNumber(pnl()!.total_realized_pnl) | currency }}
              </span>
            </div>
          </mat-card-content>
        </mat-card>

        @if (pnl()!.tickers.length === 0) {
          <div class="empty-state">
            <mat-icon>bar_chart</mat-icon>
            <h3>No PnL data yet</h3>
            <p>Tag your transactions with a leg type (CSP, CC, BUY, or SELL) to see realized PnL.</p>
          </div>
        } @else {
          @for (ticker of pnl()!.tickers; track ticker.symbol) {
            <mat-card class="ticker-card">
              <mat-card-header (click)="toggleTicker(ticker.symbol)" style="cursor: pointer;">
                <mat-card-title>
                  <div class="ticker-header">
                    <span class="ticker-symbol">{{ ticker.symbol }}</span>
                    <span class="ticker-pnl" [class.positive]="isPositive(ticker.total_realized_pnl)" [class.negative]="isNegative(ticker.total_realized_pnl)">
                      {{ toNumber(ticker.total_realized_pnl) | currency }}
                    </span>
                    <mat-icon>{{ expandedTickers().has(ticker.symbol) ? 'expand_less' : 'expand_more' }}</mat-icon>
                  </div>
                </mat-card-title>
              </mat-card-header>

              @if (expandedTickers().has(ticker.symbol)) {
                <mat-card-content>
                  @for (group of ticker.groups; track group.strategy_group_id ?? 'ungrouped') {
                    <div class="group-section">
                      <div class="group-header" role="button" tabindex="0" (click)="toggleGroup(ticker.symbol, group.strategy_group_id)" (keydown.enter)="toggleGroup(ticker.symbol, group.strategy_group_id)" (keydown.space)="toggleGroup(ticker.symbol, group.strategy_group_id)" style="cursor: pointer;">
                        <span class="group-name">{{ group.name }}</span>
                        <span class="group-pnl" [class.positive]="isPositive(group.total_realized_pnl)" [class.negative]="isNegative(group.total_realized_pnl)">
                          {{ toNumber(group.total_realized_pnl) | currency }}
                        </span>
                        <mat-icon>{{ isGroupExpanded(ticker.symbol, group.strategy_group_id) ? 'expand_less' : 'expand_more' }}</mat-icon>
                      </div>

                      @if (isGroupExpanded(ticker.symbol, group.strategy_group_id)) {
                        <table class="legs-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Description</th>
                              <th>Leg Type</th>
                              <th class="amount-col">PnL</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (leg of group.legs; track leg.transaction_id) {
                              <tr>
                                <td>{{ leg.activity_date | date:'mediumDate' }}</td>
                                <td>{{ leg.description }}</td>
                                <td><span class="leg-type-chip">{{ leg.leg_type }}</span></td>
                                <td class="amount-col" [class.positive]="isPositive(leg.realized_pnl)" [class.negative]="isNegative(leg.realized_pnl)">
                                  {{ toNumber(leg.realized_pnl) | currency }}
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      }
                    </div>
                  }
                </mat-card-content>
              }
            </mat-card>
          }
        }
      }
    </div>
  `,
  styles: [`
    .pnl-container {
      padding: 24px;
      max-width: 960px;
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 24px;
      font-size: 28px;
      font-weight: 500;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 80px;
    }

    .total-card {
      margin-bottom: 24px;
      background: #f5f5f5;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-label {
      font-size: 18px;
      font-weight: 500;
    }

    .total-value {
      font-size: 24px;
      font-weight: 700;
    }

    .positive { color: #2e7d32; }
    .negative { color: #c62828; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px;
      text-align: center;
      color: rgba(0, 0, 0, 0.5);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }

      h3 { margin: 0 0 8px; }
      p { margin: 0; }
    }

    .ticker-card {
      margin-bottom: 16px;
    }

    .ticker-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .ticker-symbol {
      font-size: 20px;
      font-weight: 700;
      flex: 1;
    }

    .ticker-pnl {
      font-size: 18px;
      font-weight: 600;
    }

    .group-section {
      margin: 12px 0;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 4px;
    }

    .group-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: rgba(0,0,0,0.03);
      gap: 16px;
    }

    .group-name {
      flex: 1;
      font-weight: 500;
    }

    .group-pnl {
      font-weight: 600;
    }

    .legs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;

      th, td {
        padding: 8px 16px;
        text-align: left;
        border-bottom: 1px solid rgba(0,0,0,0.08);
      }

      th {
        background: rgba(0,0,0,0.02);
        font-weight: 500;
        color: rgba(0,0,0,0.6);
      }

      .amount-col {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
    }

    .leg-type-chip {
      display: inline-block;
      padding: 2px 8px;
      background: #e3f2fd;
      color: #1565c0;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
  `]
})
export class PnlComponent implements OnInit {
  private api = inject(ApiService);

  pnl = signal<PnLSummaryResponse | null>(null);
  loading = signal(true);
  expandedTickers = signal<Set<string>>(new Set());
  expandedGroups = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.api.getPnL().subscribe({
      next: (data) => {
        this.pnl.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load PnL:', err);
        this.loading.set(false);
      }
    });
  }

  toNumber(value: string): number {
    return parseFloat(value);
  }

  isPositive(value: string): boolean {
    return parseFloat(value) > 0;
  }

  isNegative(value: string): boolean {
    return parseFloat(value) < 0;
  }

  toggleTicker(symbol: string): void {
    const s = new Set(this.expandedTickers());
    if (s.has(symbol)) {
      s.delete(symbol);
    } else {
      s.add(symbol);
    }
    this.expandedTickers.set(s);
  }

  toggleGroup(symbol: string, groupId: string | null): void {
    const key = `${symbol}:${groupId ?? 'ungrouped'}`;
    const s = new Set(this.expandedGroups());
    if (s.has(key)) {
      s.delete(key);
    } else {
      s.add(key);
    }
    this.expandedGroups.set(s);
  }

  isGroupExpanded(symbol: string, groupId: string | null): boolean {
    return this.expandedGroups().has(`${symbol}:${groupId ?? 'ungrouped'}`);
  }
}
