import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { NetWorthService } from '../../services/networth.service';
import {
  NWAccount,
  NWAccountCreate,
  AccountType,
  ASSET_CATEGORIES,
  LIABILITY_CATEGORIES,
  getCategoryDisplayName
} from '../../models/networth.model';

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatListModule,
    MatChipsModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="account-management-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Account Management</mat-card-title>
          <mat-card-subtitle>Manage your asset and liability accounts</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <mat-chip-listbox [value]="filterType" (change)="onFilterChange($event)">
              <mat-chip-option value="all">All</mat-chip-option>
              <mat-chip-option value="asset">Assets</mat-chip-option>
              <mat-chip-option value="liability">Liabilities</mat-chip-option>
            </mat-chip-listbox>
          </div>

          <!-- Account List -->
          @if (accounts().length > 0) {
            <mat-list>
              @for (account of accounts(); track account.id) {
                <mat-list-item [class.inactive]="!account.isActive">
                  <mat-icon matListItemIcon>
                    {{ account.accountType === 'asset' ? 'savings' : 'credit_card' }}
                  </mat-icon>
                  <span matListItemTitle>
                    {{ account.name }}
                    @if (!account.isActive) {
                      <span class="inactive-badge">(Inactive)</span>
                    }
                  </span>
                  <span matListItemLine>
                    {{ getCategoryDisplayName(account.category) }}
                    @if (account.institution) {
                      &middot; {{ account.institution }}
                    }
                  </span>
                  <button mat-icon-button matListItemMeta (click)="editAccount(account)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matListItemMeta color="warn" (click)="deleteAccount(account)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          } @else {
            <div class="empty-state">
              <mat-icon>account_balance_wallet</mat-icon>
              <p>No accounts found. Add your first account below.</p>
            </div>
          }

          <!-- Add/Edit Form -->
          <div class="form-section">
            <h3>{{ editing() ? 'Edit Account' : 'Add New Account' }}</h3>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Account Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g., Chase Checking" required>
                <mat-error>Name is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Account Type</mat-label>
                <mat-select formControlName="accountType" required (selectionChange)="onTypeChange()">
                  <mat-option value="asset">Asset</mat-option>
                  <mat-option value="liability">Liability</mat-option>
                </mat-select>
                <mat-error>Type is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <mat-select formControlName="category" required>
                  @for (cat of availableCategories(); track cat) {
                    <mat-option [value]="cat">{{ getCategoryDisplayName(cat) }}</mat-option>
                  }
                </mat-select>
                <mat-error>Category is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Institution (optional)</mat-label>
                <input matInput formControlName="institution" placeholder="e.g., Chase Bank">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Notes (optional)</mat-label>
                <textarea matInput formControlName="notes" rows="2"></textarea>
              </mat-form-field>

              @if (editing()) {
                <mat-slide-toggle formControlName="isActive">Active</mat-slide-toggle>
              }

              <div class="form-actions">
                @if (editing()) {
                  <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
                }
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                  @if (submitting()) {
                    Saving...
                  } @else if (editing()) {
                    Update Account
                  } @else {
                    Add Account
                  }
                </button>
              </div>
            </form>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .account-management-container {
      padding: 16px;
      max-width: 700px;
      margin: 0 auto;
    }

    .filter-tabs {
      margin-bottom: 16px;
    }

    mat-list-item.inactive {
      opacity: 0.6;
    }

    .inactive-badge {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      margin-left: 8px;
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

    .form-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    .form-section h3 {
      margin-bottom: 16px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    mat-form-field {
      width: 100%;
    }

    mat-slide-toggle {
      margin: 8px 0;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
  `]
})
export class AccountManagementComponent implements OnInit {
  private readonly netWorthService = inject(NetWorthService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  accounts = signal<NWAccount[]>([]);
  availableCategories = signal<string[]>(ASSET_CATEGORIES);
  editing = signal(false);
  editingId = signal<number | null>(null);
  submitting = signal(false);
  filterType = 'all';

  getCategoryDisplayName = getCategoryDisplayName;

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    accountType: ['asset', Validators.required],
    category: ['', Validators.required],
    institution: [''],
    notes: [''],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadAccounts();
    this.updateAvailableCategories();
  }

  loadAccounts(): void {
    const type = this.filterType === 'all' ? undefined : (this.filterType as AccountType);
    this.netWorthService.getAccounts(type, undefined, false).subscribe({
      next: (accounts) => this.accounts.set(accounts),
      error: (err) => console.error('Failed to load accounts', err)
    });
  }

  onFilterChange(event: MatChipListboxChange): void {
    this.filterType = event.value || 'all';
    this.loadAccounts();
  }

  onTypeChange(): void {
    this.updateAvailableCategories();
    this.form.patchValue({ category: '' });
  }

  updateAvailableCategories(): void {
    const type = this.form.get('accountType')?.value;
    this.availableCategories.set(
      type === 'liability' ? LIABILITY_CATEGORIES : ASSET_CATEGORIES
    );
  }

  editAccount(account: NWAccount): void {
    this.editing.set(true);
    this.editingId.set(account.id);
    this.form.patchValue({
      name: account.name,
      accountType: account.accountType,
      category: account.category,
      institution: account.institution || '',
      notes: account.notes || '',
      isActive: account.isActive
    });
    this.updateAvailableCategories();
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editingId.set(null);
    this.form.reset({ accountType: 'asset', isActive: true });
    this.updateAvailableCategories();
  }

  deleteAccount(account: NWAccount): void {
    if (confirm(`Are you sure you want to deactivate "${account.name}"?`)) {
      this.netWorthService.deleteAccount(account.id).subscribe({
        next: () => {
          this.snackBar.open('Account deactivated', 'Close', { duration: 3000 });
          this.loadAccounts();
        },
        error: (err) => {
          console.error('Failed to delete account', err);
          this.snackBar.open('Failed to deactivate account', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    const formValue = this.form.value;

    const payload: NWAccountCreate = {
      name: formValue.name,
      accountType: formValue.accountType,
      category: formValue.category,
      institution: formValue.institution || undefined,
      notes: formValue.notes || undefined,
      isActive: formValue.isActive
    };

    if (this.editing()) {
      this.netWorthService.updateAccount(this.editingId()!, payload).subscribe({
        next: () => {
          this.snackBar.open('Account updated', 'Close', { duration: 3000 });
          this.loadAccounts();
          this.cancelEdit();
          this.submitting.set(false);
        },
        error: (err) => {
          console.error('Failed to update account', err);
          this.snackBar.open('Failed to update account', 'Close', { duration: 3000 });
          this.submitting.set(false);
        }
      });
    } else {
      this.netWorthService.createAccount(payload).subscribe({
        next: () => {
          this.snackBar.open('Account added', 'Close', { duration: 3000 });
          this.loadAccounts();
          this.form.reset({ accountType: 'asset', isActive: true });
          this.submitting.set(false);
        },
        error: (err) => {
          console.error('Failed to create account', err);
          this.snackBar.open('Failed to create account', 'Close', { duration: 3000 });
          this.submitting.set(false);
        }
      });
    }
  }
}
