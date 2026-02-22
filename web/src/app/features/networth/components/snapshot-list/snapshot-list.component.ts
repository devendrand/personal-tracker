import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { NetWorthService } from '../../services/networth.service';
import { NWSnapshotSummary, formatCurrency } from '../../models/networth.model';

@Component({
  selector: 'app-snapshot-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  template: `
    <div class="snapshot-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Snapshot History</mat-card-title>
          <mat-card-subtitle>All net worth snapshots</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="actions-bar">
            <button mat-raised-button color="primary" routerLink="/networth/snapshot/new">
              <mat-icon>add</mat-icon>
              New Snapshot
            </button>
          </div>

          @if (loading()) {
            <div class="loading">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (snapshots().length === 0) {
            <div class="empty-state">
              <mat-icon>history</mat-icon>
              <p>No snapshots yet. Create your first snapshot to start tracking.</p>
              <button mat-raised-button color="primary" routerLink="/networth/snapshot/new">
                Create First Snapshot
              </button>
            </div>
          } @else {
            <table mat-table [dataSource]="snapshots()">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let row">{{ row.snapshotDate | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="assets">
                <th mat-header-cell *matHeaderCellDef>Assets</th>
                <td mat-cell *matCellDef="let row" class="money positive">
                  {{ formatCurrency(row.totalAssets) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="liabilities">
                <th mat-header-cell *matHeaderCellDef>Liabilities</th>
                <td mat-cell *matCellDef="let row" class="money negative">
                  {{ formatCurrency(row.totalLiabilities) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="netWorth">
                <th mat-header-cell *matHeaderCellDef>Net Worth</th>
                <td mat-cell *matCellDef="let row" class="money" 
                    [class.positive]="row.netWorth >= 0"
                    [class.negative]="row.netWorth < 0">
                  {{ formatCurrency(row.netWorth) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="change">
                <th mat-header-cell *matHeaderCellDef>Change</th>
                <td mat-cell *matCellDef="let row; let i = index" class="change">
                  @if (i < snapshots().length - 1) {
                    @let prevNetWorth = snapshots()[i + 1].netWorth;
                    @let change = row.netWorth - prevNetWorth;
                    <span [class.positive]="change >= 0" [class.negative]="change < 0">
                      @if (change >= 0) {
                        +
                      }
                      {{ formatCurrency(change) }}
                    </span>
                  } @else {
                    <span class="first">-</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="notes">
                <th mat-header-cell *matHeaderCellDef>Notes</th>
                <td mat-cell *matCellDef="let row" class="notes">
                  {{ row.notes || '-' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button [routerLink]="['/networth/snapshot', row.id]">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteSnapshot(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator
              [length]="snapshots().length"
              [pageSize]="25"
              [pageSizeOptions]="[10, 25, 52, 104]"
              (page)="onPage($event)">
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .snapshot-list-container {
      padding: 16px;
    }

    .actions-bar {
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

    table {
      width: 100%;
    }

    .money {
      font-family: monospace;
      font-weight: 500;
    }

    .positive {
      color: #4caf50;
    }

    .negative {
      color: #f44336;
    }

    .change .first {
      color: rgba(0, 0, 0, 0.5);
    }

    .notes {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: rgba(0, 0, 0, 0.6);
      font-size: 12px;
    }
  `]
})
export class SnapshotListComponent implements OnInit {
  private readonly netWorthService = inject(NetWorthService);

  snapshots = signal<NWSnapshotSummary[]>([]);
  loading = signal(true);

  formatCurrency = formatCurrency;

  displayedColumns = ['date', 'assets', 'liabilities', 'netWorth', 'change', 'notes', 'actions'];

  ngOnInit(): void {
    this.loadSnapshots();
  }

  loadSnapshots(): void {
    this.loading.set(true);
    this.netWorthService.getSnapshots().subscribe({
      next: (snapshots) => {
        this.snapshots.set(snapshots);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load snapshots', err);
        this.loading.set(false);
      }
    });
  }

  deleteSnapshot(snapshot: NWSnapshotSummary): void {
    const dateStr = new Date(snapshot.snapshotDate).toLocaleDateString();
    if (confirm(`Are you sure you want to delete the snapshot from ${dateStr}?`)) {
      this.netWorthService.deleteSnapshot(snapshot.id).subscribe({
        next: () => this.loadSnapshots(),
        error: (err) => console.error('Failed to delete snapshot', err)
      });
    }
  }

  onPage(event: PageEvent): void {
    // Pagination handled by mat-paginator for client-side
  }
}
