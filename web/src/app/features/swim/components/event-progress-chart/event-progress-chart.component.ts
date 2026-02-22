import { Component, OnInit, inject, signal, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SwimService } from '../../services/swim.service';
import { EventProgressionResponse, PoolType } from '../../models/swim.model';

@Component({
  selector: 'app-event-progress-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterLink
  ],
  template: `
    <div class="chart-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            @if (progressionData()) {
              {{ progressionData()!.event.displayName }} Progression
            } @else {
              Event Progression
            }
          </mat-card-title>
          <mat-card-subtitle>Time improvement over time</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-form-field>
              <mat-label>Pool Type</mat-label>
              <mat-select [(value)]="selectedPoolType" (selectionChange)="loadProgression()">
                <mat-option value="SCY">SCY</mat-option>
                <mat-option value="SCM">SCM</mat-option>
                <mat-option value="LCM">LCM</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-button routerLink="/swim">
              <mat-icon>arrow_back</mat-icon>
              Back to Dashboard
            </button>
          </div>

          @if (loading()) {
            <div class="loading">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (!progressionData() || progressionData()!.times.length === 0) {
            <div class="empty-state">
              <mat-icon>show_chart</mat-icon>
              <p>No data available for this event.</p>
            </div>
          } @else {
            <div class="chart-placeholder">
              <!-- Chart visualization would go here -->
              <!-- Consider using ngx-charts, Chart.js, or similar -->
              <div class="chart-area">
                <p class="chart-message">Chart visualization coming soon</p>
                <p class="chart-hint">Integrate ngx-charts or Chart.js for interactive charts</p>
              </div>

              <div class="data-summary">
                <h3>Time Data</h3>
                <div class="time-points">
                  @for (point of progressionData()!.times; track point.date) {
                    <div class="time-point" [class.pr]="point.isPr">
                      <span class="date">{{ point.date | date:'shortDate' }}</span>
                      <span class="time">{{ point.timeFormatted }}</span>
                      @if (point.isPr) {
                        <mat-icon class="pr-icon">emoji_events</mat-icon>
                      }
                      @if (point.meetName) {
                        <span class="meet">{{ point.meetName }}</span>
                      }
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
    .chart-container {
      padding: 16px;
    }

    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: rgba(0, 0, 0, 0.6);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
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

    .data-summary h3 {
      margin-bottom: 16px;
    }

    .time-points {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
    }

    .time-point {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 14px;
    }

    .time-point.pr {
      background: #e3f2fd;
      border-left: 3px solid #1976d2;
    }

    .time-point .date {
      color: rgba(0, 0, 0, 0.6);
      min-width: 80px;
    }

    .time-point .time {
      font-family: monospace;
      font-weight: 500;
    }

    .time-point .pr-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #1976d2;
    }

    .time-point .meet {
      color: rgba(0, 0, 0, 0.5);
      font-size: 12px;
      margin-left: auto;
    }
  `]
})
export class EventProgressChartComponent implements OnInit {
  swimmerId = input.required<number>();
  eventId = input.required<number>();

  private readonly swimService = inject(SwimService);

  progressionData = signal<EventProgressionResponse | null>(null);
  loading = signal(false);
  selectedPoolType: PoolType = PoolType.SCY;

  constructor() {
    // React to input changes
    effect(() => {
      const sid = this.swimmerId();
      const eid = this.eventId();
      if (sid && eid) {
        this.loadProgression();
      }
    });
  }

  ngOnInit(): void {
    this.loadProgression();
  }

  loadProgression(): void {
    this.loading.set(true);

    this.swimService.getEventProgression(
      this.swimmerId(),
      this.eventId(),
      this.selectedPoolType
    ).subscribe({
      next: (data) => {
        this.progressionData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load progression', err);
        this.progressionData.set(null);
        this.loading.set(false);
      }
    });
  }
}
