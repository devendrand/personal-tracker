import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';

import { NetWorthService } from '../../services/networth.service';
import { NWAccount, NWSnapshotCreate, formatCurrency, getCategoryDisplayName, AccountType } from '../../models/networth.model';

interface AccountBalance {
  account: NWAccount;
  balance: number;
}

@Component({
  selector: 'app-snapshot-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  template: `
    <div class="snapshot-entry-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>New Net Worth Snapshot</mat-card-title>
          <mat-card-subtitle>Record your current account balances</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <div class="loading">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else if (accounts().length === 0) {
            <div class="empty-state">
              <mat-icon>account_balance_wallet</mat-icon>
              <p>No accounts found. Add accounts before creating a snapshot.</p>
              <button mat-raised-button color="primary" routerLink="/networth/accounts">
                Add Accounts
              </button>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Snapshot Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="snapshotDate" required>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              <!-- Assets Section -->
              <h3 class="section-header">
                <mat-icon>savings</mat-icon>
                Assets
              </h3>
              <div class="balance-entries">
                @for (account of assetAccounts(); track account.id) {
                  <div class="balance-row">
                    <div class="account-info">
                      <span class="account-name">{{ account.name }}</span>
                      <span class="account-category">{{ getCategoryDisplayName(account.category) }}</span>
                    </div>
                    <mat-form-field appearance="outline" class="balance-field">
                      <mat-label>Balance</mat-label>
                      <span matPrefix>$&nbsp;</span>
                      <input
                        matInput
                        type="number"
                        step="0.01"
                        [formControlName]="'balance_' + account.id"
                        (blur)="updateTotals()">
                    </mat-form-field>
                  </div>
                }
              </div>
              <div class="subtotal">
                Total Assets: <strong>{{ formatCurrency(totalAssets()) }}</strong>
              </div>

              <mat-divider></mat-divider>

              <!-- Liabilities Section -->
              <h3 class="section-header">
                <mat-icon>credit_card</mat-icon>
                Liabilities
              </h3>
              <div class="balance-entries">
                @for (account of liabilityAccounts(); track account.id) {
                  <div class="balance-row">
                    <div class="account-info">
                      <span class="account-name">{{ account.name }}</span>
                      <span class="account-category">{{ getCategoryDisplayName(account.category) }}</span>
                    </div>
                    <mat-form-field appearance="outline" class="balance-field">
                      <mat-label>Balance</mat-label>
                      <span matPrefix>$&nbsp;</span>
                      <input
                        matInput
                        type="number"
                        step="0.01"
                        [formControlName]="'balance_' + account.id"
                        (blur)="updateTotals()">
                    </mat-form-field>
                  </div>
                }
                @empty {
                  <div class="no-accounts">No liability accounts</div>
                }
              </div>
              <div class="subtotal">
                Total Liabilities: <strong>{{ formatCurrency(totalLiabilities()) }}</strong>
              </div>

              <mat-divider></mat-divider>

              <!-- Net Worth Summary -->
              <div class="net-worth-summary" [class.positive]="netWorth() >= 0" [class.negative]="netWorth() < 0">
                <span>Net Worth:</span>
                <span class="net-worth-value">{{ formatCurrency(netWorth()) }}</span>
              </div>

              <mat-form-field appearance="outline" class="notes-field">
                <mat-label>Notes (optional)</mat-label>
                <textarea matInput formControlName="notes" rows="2"></textarea>
              </mat-form-field>

              <div class="form-actions">
                <button mat-button type="button" routerLink="/networth">Cancel</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="submitting()">
                  @if (submitting()) {
                    Saving...
                  } @else {
                    Save Snapshot
                  }
                </button>
              </div>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .snapshot-entry-container {
      padding: 16px;
      max-width: 700px;
      margin: 0 auto;
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

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 24px 0 16px;
      color: rgba(0, 0, 0, 0.7);
    }

    .balance-entries {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .balance-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .account-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .account-name {
      font-weight: 500;
    }

    .account-category {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
    }

    .balance-field {
      width: 150px;
    }

    .subtotal {
      text-align: right;
      margin: 16px 0;
      font-size: 16px;
    }

    .no-accounts {
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
      padding: 8px 0;
    }

    mat-divider {
      margin: 16px 0;
    }

    .net-worth-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 16px 0;
      font-size: 20px;
    }

    .net-worth-summary.positive .net-worth-value {
      color: #4caf50;
    }

    .net-worth-summary.negative .net-worth-value {
      color: #f44336;
    }

    .net-worth-value {
      font-weight: 600;
    }

    .notes-field {
      width: 100%;
      margin-top: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `]
})
export class SnapshotEntryComponent implements OnInit {
  private readonly netWorthService = inject(NetWorthService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  accounts = signal<NWAccount[]>([]);
  assetAccounts = signal<NWAccount[]>([]);
  liabilityAccounts = signal<NWAccount[]>([]);
  loading = signal(true);
  submitting = signal(false);
  totalAssets = signal(0);
  totalLiabilities = signal(0);
  netWorth = signal(0);

  formatCurrency = formatCurrency;
  getCategoryDisplayName = getCategoryDisplayName;

  form: FormGroup = this.fb.group({
    snapshotDate: [new Date(), Validators.required],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.netWorthService.getAccounts(undefined, undefined, true).subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.assetAccounts.set(accounts.filter(a => a.accountType === AccountType.ASSET));
        this.liabilityAccounts.set(accounts.filter(a => a.accountType === AccountType.LIABILITY));
        
        // Add form controls for each account
        accounts.forEach(account => {
          this.form.addControl(
            `balance_${account.id}`,
            this.fb.control(account.currentBalance || 0)
          );
        });

        this.updateTotals();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load accounts', err);
        this.loading.set(false);
      }
    });
  }

  updateTotals(): void {
    let assets = 0;
    let liabilities = 0;

    this.assetAccounts().forEach(account => {
      const value = this.form.get(`balance_${account.id}`)?.value || 0;
      assets += Number(value);
    });

    this.liabilityAccounts().forEach(account => {
      const value = this.form.get(`balance_${account.id}`)?.value || 0;
      liabilities += Number(value);
    });

    this.totalAssets.set(assets);
    this.totalLiabilities.set(liabilities);
    this.netWorth.set(assets - liabilities);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    const formValue = this.form.value;

    // Format date for API
    const snapshotDate = formValue.snapshotDate instanceof Date
      ? formValue.snapshotDate.toISOString().split('T')[0]
      : formValue.snapshotDate;

    // Build balances array
    const balances = this.accounts()
      .map(account => ({
        accountId: account.id,
        balance: Number(formValue[`balance_${account.id}`] || 0)
      }))
      .filter(b => b.balance !== 0);

    const payload: NWSnapshotCreate = {
      snapshotDate,
      notes: formValue.notes || undefined,
      balances
    };

    this.netWorthService.createSnapshot(payload).subscribe({
      next: () => {
        this.snackBar.open('Snapshot saved!', 'Close', { duration: 3000 });
        this.router.navigate(['/networth']);
      },
      error: (err) => {
        console.error('Failed to save snapshot', err);
        this.snackBar.open('Failed to save snapshot', 'Close', { duration: 3000 });
        this.submitting.set(false);
      }
    });
  }
}
