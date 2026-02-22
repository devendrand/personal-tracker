import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { SwimService } from '../../services/swim.service';
import { SwimTime, PoolType, SwimEvent } from '../../models/swim.model';

@Component({
  selector: 'app-time-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatSelectModule,
    FormsModule
  ],
  template: `
    <div class="time-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Swim Times</mat-card-title>
          <mat-card-subtitle>All recorded times</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-form-field>
              <mat-label>Pool Type</mat-label>
              <mat-select [(value)]="selectedPoolType" (selectionChange)="loadTimes()">
                <mat-option value="">All</mat-option>
                <mat-option value="SCY">SCY</mat-option>
                <mat-option value="SCM">SCM</mat-option>
                <mat-option value="LCM">LCM</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Event</mat-label>
              <mat-select [(value)]="selectedEventId" (selectionChange)="loadTimes()">
                <mat-option [value]="null">All Events</mat-option>
                @for (event of events(); track event.id) {
                  <mat-option [value]="event.id">{{ event.displayName }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-chip-listbox [value]="prsOnly" (change)="onPrsFilterChange($event)">
              <mat-chip-option value="true">PRs Only</mat-chip-option>
            </mat-chip-listbox>
          </div>

          @if (times().length === 0) {
            <div class="empty-state">
              <mat-icon>timer_off</mat-icon>
              <p>No times found matching your filters.</p>
            </div>
          } @else {
            <table mat-table [dataSource]="times()">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let row">{{ row.recordedDate | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="event">
                <th mat-header-cell *matHeaderCellDef>Event</th>
                <td mat-cell *matCellDef="let row">{{ row.event.displayName }}</td>
              </ng-container>

              <ng-container matColumnDef="time">
                <th mat-header-cell *matHeaderCellDef>Time</th>
                <td mat-cell *matCellDef="let row" class="time-cell">
                  {{ row.timeFormatted }}
                  @if (row.isPr) {
                    <mat-icon class="pr-badge" color="primary">emoji_events</mat-icon>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="pool">
                <th mat-header-cell *matHeaderCellDef>Pool</th>
                <td mat-cell *matCellDef="let row">{{ row.poolType }}</td>
              </ng-container>

              <ng-container matColumnDef="notes">
                <th mat-header-cell *matHeaderCellDef>Notes</th>
                <td mat-cell *matCellDef="let row">{{ row.notes || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button color="warn" (click)="deleteTime(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator
              [length]="times().length"
              [pageSize]="10"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPage($event)">
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .time-list-container {
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

    table {
      width: 100%;
    }

    .time-cell {
      font-family: monospace;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pr-badge {
      font-size: 18px;
      width: 18px;
      height: 18px;
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
  `]
})
export class TimeListComponent implements OnInit {
  swimmerId = input.required<number>();

  private readonly swimService = inject(SwimService);

  times = signal<SwimTime[]>([]);
  events = signal<SwimEvent[]>([]);

  selectedPoolType: PoolType | '' = '';
  selectedEventId: number | null = null;
  prsOnly = '';

  displayedColumns = ['date', 'event', 'time', 'pool', 'notes', 'actions'];

  ngOnInit(): void {
    this.loadEvents();
    this.loadTimes();
  }

  loadEvents(): void {
    this.swimService.getEvents().subscribe({
      next: (events) => this.events.set(events),
      error: (err) => console.error('Failed to load events', err)
    });
  }

  loadTimes(): void {
    const poolType = this.selectedPoolType || undefined;
    const eventId = this.selectedEventId || undefined;
    const prsOnly = this.prsOnly === 'true';

    this.swimService.getTimes(this.swimmerId(), eventId, poolType as PoolType, prsOnly).subscribe({
      next: (times) => this.times.set(times),
      error: (err) => console.error('Failed to load times', err)
    });
  }

  onPrsFilterChange(event: MatChipListboxChange): void {
    this.prsOnly = event.value || '';
    this.loadTimes();
  }

  deleteTime(time: SwimTime): void {
    if (confirm('Are you sure you want to delete this time?')) {
      this.swimService.deleteTime(this.swimmerId(), time.id).subscribe({
        next: () => this.loadTimes(),
        error: (err) => console.error('Failed to delete time', err)
      });
    }
  }

  onPage(_event: PageEvent): void {
    // Client-side pagination is handled by mat-paginator
    // For server-side pagination, implement here
  }
}
