import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { SwimService } from '../../services/swim.service';
import { Swimmer, SwimmerCreate } from '../../models/swim.model';

@Component({
  selector: 'app-swim-profile',
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
    MatListModule,
    MatDialogModule
  ],
  template: `
    <div class="profile-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Swimmer Profiles</mat-card-title>
          <mat-card-subtitle>Manage swimmer profiles</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <!-- Swimmer List -->
          @if (swimmers().length > 0) {
            <mat-list>
              @for (swimmer of swimmers(); track swimmer.id) {
                <mat-list-item>
                  <mat-icon matListItemIcon>person</mat-icon>
                  <span matListItemTitle>{{ swimmer.name }}</span>
                  <span matListItemLine>
                    Age: {{ swimmer.age }}
                    @if (swimmer.teamName) {
                      | Team: {{ swimmer.teamName }}
                    }
                  </span>
                  <button mat-icon-button matListItemMeta (click)="editSwimmer(swimmer)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matListItemMeta color="warn" (click)="deleteSwimmer(swimmer)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          } @else {
            <div class="empty-state">
              <mat-icon>person_add</mat-icon>
              <p>No swimmers yet. Add your first swimmer below.</p>
            </div>
          }

          <!-- Add/Edit Form -->
          <div class="form-section">
            <h3>{{ editing() ? 'Edit Swimmer' : 'Add New Swimmer' }}</h3>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" required>
                <mat-error>Name is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Date of Birth</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="dateOfBirth" required>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error>Date of birth is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Team Name (optional)</mat-label>
                <input matInput formControlName="teamName">
              </mat-form-field>

              <div class="form-actions">
                @if (editing()) {
                  <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
                }
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                  @if (submitting()) {
                    Saving...
                  } @else if (editing()) {
                    Update Swimmer
                  } @else {
                    Add Swimmer
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
    .profile-container {
      padding: 16px;
      max-width: 600px;
      margin: 0 auto;
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

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
  `]
})
export class SwimProfileComponent implements OnInit {
  private readonly swimService = inject(SwimService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  swimmers = signal<Swimmer[]>([]);
  editing = signal(false);
  editingId = signal<number | null>(null);
  submitting = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    dateOfBirth: [null, Validators.required],
    teamName: ['']
  });

  ngOnInit(): void {
    this.loadSwimmers();
  }

  loadSwimmers(): void {
    this.swimService.getSwimmers().subscribe({
      next: (swimmers) => this.swimmers.set(swimmers),
      error: (err) => console.error('Failed to load swimmers', err)
    });
  }

  editSwimmer(swimmer: Swimmer): void {
    this.editing.set(true);
    this.editingId.set(swimmer.id);
    this.form.patchValue({
      name: swimmer.name,
      dateOfBirth: new Date(swimmer.dateOfBirth),
      teamName: swimmer.teamName || ''
    });
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  deleteSwimmer(swimmer: Swimmer): void {
    if (confirm(`Are you sure you want to delete ${swimmer.name}? This will also delete all their times.`)) {
      this.swimService.deleteSwimmer(swimmer.id).subscribe({
        next: () => {
          this.snackBar.open('Swimmer deleted', 'Close', { duration: 3000 });
          this.loadSwimmers();
        },
        error: (err) => {
          console.error('Failed to delete swimmer', err);
          this.snackBar.open('Failed to delete swimmer', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    const formValue = this.form.value;

    // Format date for API
    const dateOfBirth = formValue.dateOfBirth instanceof Date
      ? formValue.dateOfBirth.toISOString().split('T')[0]
      : formValue.dateOfBirth;

    const payload: SwimmerCreate = {
      name: formValue.name,
      dateOfBirth,
      teamName: formValue.teamName || undefined
    };

    if (this.editing()) {
      this.swimService.updateSwimmer(this.editingId()!, payload).subscribe({
        next: () => {
          this.snackBar.open('Swimmer updated', 'Close', { duration: 3000 });
          this.loadSwimmers();
          this.cancelEdit();
          this.submitting.set(false);
        },
        error: (err) => {
          console.error('Failed to update swimmer', err);
          this.snackBar.open('Failed to update swimmer', 'Close', { duration: 3000 });
          this.submitting.set(false);
        }
      });
    } else {
      this.swimService.createSwimmer(payload).subscribe({
        next: () => {
          this.snackBar.open('Swimmer added', 'Close', { duration: 3000 });
          this.loadSwimmers();
          this.form.reset();
          this.submitting.set(false);
        },
        error: (err) => {
          console.error('Failed to create swimmer', err);
          this.snackBar.open('Failed to create swimmer', 'Close', { duration: 3000 });
          this.submitting.set(false);
        }
      });
    }
  }
}
