import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SwimService } from '../../services/swim.service';
import { PRDashboardRow, PoolType, Swimmer } from '../../models/swim.model';

@Component({
  selector: 'app-swim-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterLink
  ],
  template: `
    <div class="swim-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>PR Dashboard</mat-card-title>
          <mat-card-subtitle>Personal Records Overview</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-form-field>
              <mat-label>Swimmer</mat-label>
              <mat-select [(value)]="selectedSwimmerId" (selectionChange)="loadPRs()">
                @for (swimmer of swimmers(); track swimmer.id) {
                  <mat-option [value]="swimmer.id">{{ swimmer.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Pool Type</mat-label>
              <mat-select [(value)]="selectedPoolType" (selectionChange)="loadPRs()">
                <mat-option value="">All</mat-option>
                <mat-option value="SCY">SCY</mat-option>
                <mat-option value="SCM">SCM</mat-option>
                <mat-option value="LCM">LCM</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" routerLink="/swim/log">
              <mat-icon>add</mat-icon>
              Log Time
            </button>
          </div>

          @if (loading()) {
            <div class="loading">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (prData().length === 0) {
            <div class="empty-state">
              <mat-icon>pool</mat-icon>
              <p>No times logged yet. Start by logging your first swim time!</p>
              <button mat-raised-button color="primary" routerLink="/swim/log">
                Log First Time
              </button>
            </div>
          } @else {
            <table mat-table [dataSource]="prData()">
              <ng-container matColumnDef="event">
                <th mat-header-cell *matHeaderCellDef>Event</th>
                <td mat-cell *matCellDef="let row">{{ row.eventName }}</td>
              </ng-container>

              <ng-container matColumnDef="poolType">
                <th mat-header-cell *matHeaderCellDef>Pool</th>
                <td mat-cell *matCellDef="let row">{{ row.poolType }}</td>
              </ng-container>

              <ng-container matColumnDef="currentPr">
                <th mat-header-cell *matHeaderCellDef>Current PR</th>
                <td mat-cell *matCellDef="let row" class="pr-time">{{ row.currentPr }}</td>
              </ng-container>

              <ng-container matColumnDef="prDate">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let row">{{ row.prDate | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="improvement">
                <th mat-header-cell *matHeaderCellDef>Improvement</th>
                <td mat-cell *matCellDef="let row" class="improvement">
                  @if (row.improvementSeconds > 0) {
                    <span class="improved">
                      -{{ row.improvementSeconds.toFixed(2) }}s ({{ row.improvementPercent.toFixed(1) }}%)
                    </span>
                  } @else {
                    <span class="first-time">First time</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="count">
                <th mat-header-cell *matHeaderCellDef>Times</th>
                <td mat-cell *matCellDef="let row">{{ row.totalTimesLogged }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button [routerLink]="['/swim/progression', row.eventId]">
                    <mat-icon>show_chart</mat-icon>
                  </button>
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
    .swim-dashboard {
      padding: 16px;
    }

    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    mat-form-field {
      min-width: 150px;
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

    table {
      width: 100%;
    }

    .pr-time {
      font-weight: 500;
      font-family: monospace;
    }

    .improvement .improved {
      color: #4caf50;
      font-weight: 500;
    }

    .improvement .first-time {
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
    }
  `]
})
export class SwimDashboardComponent implements OnInit {
  private readonly swimService = inject(SwimService);

  swimmers = signal<Swimmer[]>([]);
  prData = signal<PRDashboardRow[]>([]);
  loading = signal(false);

  selectedSwimmerId: number | null = null;
  selectedPoolType: PoolType | '' = '';

  displayedColumns = ['event', 'poolType', 'currentPr', 'prDate', 'improvement', 'count', 'actions'];

  ngOnInit(): void {
    this.loadSwimmers();
  }

  loadSwimmers(): void {
    this.swimService.getSwimmers().subscribe({
      next: (swimmers) => {
        this.swimmers.set(swimmers);
        if (swimmers.length > 0) {
          this.selectedSwimmerId = swimmers[0].id;
          this.loadPRs();
        }
      },
      error: (err) => console.error('Failed to load swimmers', err)
    });
  }

  loadPRs(): void {
    if (!this.selectedSwimmerId) return;

    this.loading.set(true);
    const poolType = this.selectedPoolType || undefined;
    
    this.swimService.getPRDashboard(this.selectedSwimmerId, poolType as PoolType).subscribe({
      next: (data) => {
        this.prData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load PR dashboard', err);
        this.loading.set(false);
      }
    });
  }
}
