import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';
import { Portfolio } from '../../shared/models/portfolio.model';

@Component({
  selector: 'app-portfolios',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="portfolios-container">
      <div class="header">
        <h1>Portfolios</h1>
        <button mat-raised-button color="primary">
          <mat-icon>add</mat-icon>
          New Portfolio
        </button>
      </div>

      @if (loading) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading portfolios...</p>
        </div>
      } @else if (portfolios.length === 0) {
        <mat-card class="empty-state">
          <mat-card-content>
            <mat-icon>folder_open</mat-icon>
            <h3>No portfolios yet</h3>
            <p>Create a portfolio to start organizing your trades by strategy.</p>
            <button mat-raised-button color="primary">
              <mat-icon>add</mat-icon>
              Create First Portfolio
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="portfolios-grid">
          @for (portfolio of portfolios; track portfolio.id) {
            <mat-card class="portfolio-card">
              <mat-card-header>
                <mat-card-title>{{ portfolio.name }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-chip-set>
                    <mat-chip>{{ portfolio.type }}</mat-chip>
                  </mat-chip-set>
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ portfolio.description || 'No description' }}</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">View Details</button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .portfolios-container {
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
      mat-card-content {
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
          margin: 0 0 24px;
        }

        button mat-icon {
          margin-right: 8px;
        }
      }
    }

    .portfolios-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .portfolio-card {
      mat-card-subtitle {
        margin-top: 8px;
      }
    }
  `]
})
export class PortfoliosComponent implements OnInit {
  private api = inject(ApiService);

  portfolios: Portfolio[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadPortfolios();
  }

  loadPortfolios(): void {
    this.loading = true;
    this.api.get<Portfolio[]>('/portfolios').subscribe({
      next: (data) => {
        this.portfolios = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load portfolios:', err);
        this.loading = false;
      }
    });
  }
}
