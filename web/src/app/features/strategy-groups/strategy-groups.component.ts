import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';

import { ApiService } from '../../core/services/api.service';
import { StrategyGroup } from '../../shared/models/transaction.model';

@Component({
  selector: 'app-strategy-groups',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatListModule,
  ],
  template: `
    <div class="sg-container">
      <h1>Strategy Groups</h1>
      <p class="subtitle">Create named groups to organize your option legs and trades (e.g. "AAPL Wheel Q1 2025").</p>

      <mat-card class="create-card">
        <mat-card-content>
          <h3>Create New Group</h3>
          <div class="create-form">
            <mat-form-field appearance="outline">
              <mat-label>Group Name</mat-label>
              <input matInput [(ngModel)]="newName" placeholder="e.g. AAPL Wheel Q1 2025" />
            </mat-form-field>
            <mat-form-field appearance="outline" style="width: 140px;">
              <mat-label>Symbol</mat-label>
              <input matInput [(ngModel)]="newSymbol" placeholder="e.g. AAPL" style="text-transform: uppercase;" />
            </mat-form-field>
            <button
              mat-raised-button
              color="primary"
              [disabled]="!newName.trim() || !newSymbol.trim() || creating()"
              (click)="onCreate()"
            >
              <mat-icon>add</mat-icon>
              Create
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          @if (loading()) {
            <div class="loading">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (groups().length === 0) {
            <div class="empty-state">
              <mat-icon>folder_open</mat-icon>
              <h3>No strategy groups yet</h3>
              <p>Create a group above, then assign transaction legs to it from the Transactions view.</p>
            </div>
          } @else {
            <mat-list>
              @for (g of groups(); track g.id) {
                <mat-list-item>
                  <span matListItemTitle>{{ g.name }}</span>
                  <span matListItemLine>{{ g.symbol }} &middot; Created {{ g.created_at | date:'mediumDate' }}</span>
                  <button mat-icon-button color="warn" (click)="onDelete(g)" [attr.aria-label]="'Delete ' + g.name">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .sg-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 4px;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      color: rgba(0, 0, 0, 0.6);
      margin: 0 0 24px;
    }

    .create-card {
      margin-bottom: 24px;
    }

    .create-form {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;

      mat-form-field {
        flex: 1;
        min-width: 200px;
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
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

    mat-list-item {
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
  `]
})
export class StrategyGroupsComponent implements OnInit {
  private api = inject(ApiService);

  groups = signal<StrategyGroup[]>([]);
  loading = signal(true);
  creating = signal(false);

  newName = '';
  newSymbol = '';

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading.set(true);
    this.api.getStrategyGroups().subscribe({
      next: (data) => {
        this.groups.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load strategy groups:', err);
        this.loading.set(false);
      }
    });
  }

  onCreate(): void {
    const name = this.newName.trim();
    const symbol = this.newSymbol.trim().toUpperCase();
    if (!name || !symbol) return;

    this.creating.set(true);
    this.api.createStrategyGroup({ name, symbol }).subscribe({
      next: () => {
        this.newName = '';
        this.newSymbol = '';
        this.creating.set(false);
        this.loadGroups();
      },
      error: (err) => {
        console.error('Failed to create strategy group:', err);
        this.creating.set(false);
      }
    });
  }

  onDelete(group: StrategyGroup): void {
    if (!confirm(`Delete "${group.name}"? All assigned legs will be unassigned.`)) return;
    this.api.deleteStrategyGroup(group.id).subscribe({
      next: () => this.loadGroups(),
      error: (err) => console.error('Failed to delete strategy group:', err)
    });
  }
}
