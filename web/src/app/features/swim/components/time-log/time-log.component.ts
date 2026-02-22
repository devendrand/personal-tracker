import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';

import { SwimService } from '../../services/swim.service';
import { SwimEvent, Swimmer, PoolType, SwimTimeCreate } from '../../models/swim.model';

@Component({
  selector: 'app-time-log',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatIconModule,
    RouterLink
  ],
  template: `
    <div class="time-log-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Log Swim Time</mat-card-title>
          <mat-card-subtitle>Record a new swim time</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Swimmer</mat-label>
              <mat-select formControlName="swimmerId" required>
                @for (swimmer of swimmers(); track swimmer.id) {
                  <mat-option [value]="swimmer.id">{{ swimmer.name }}</mat-option>
                }
              </mat-select>
              <mat-error>Please select a swimmer</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Pool Type</mat-label>
              <mat-select formControlName="poolType" required (selectionChange)="onPoolTypeChange()">
                <mat-option value="SCY">SCY (Short Course Yards)</mat-option>
                <mat-option value="SCM">SCM (Short Course Meters)</mat-option>
                <mat-option value="LCM">LCM (Long Course Meters)</mat-option>
              </mat-select>
              <mat-error>Please select pool type</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Event</mat-label>
              <mat-select formControlName="eventId" required>
                @for (event of filteredEvents(); track event.id) {
                  <mat-option [value]="event.id">{{ event.displayName }}</mat-option>
                }
              </mat-select>
              <mat-error>Please select an event</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Time (mm:ss.hh)</mat-label>
              <input matInput formControlName="timeFormatted" placeholder="0:30.45" required>
              <mat-hint>Format: minutes:seconds.hundredths</mat-hint>
              <mat-error>Enter time in mm:ss.hh format</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="recordedDate" required>
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-error>Please select a date</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Meet Name (optional)</mat-label>
              <input matInput formControlName="meetName" placeholder="e.g., Winter Championships">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Notes (optional)</mat-label>
              <textarea matInput formControlName="notes" rows="3"></textarea>
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button" routerLink="/swim">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || submitting()">
                @if (submitting()) {
                  Saving...
                } @else {
                  Save Time
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .time-log-container {
      padding: 16px;
      max-width: 600px;
      margin: 0 auto;
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
      margin-top: 16px;
    }
  `]
})
export class TimeLogComponent implements OnInit {
  private readonly swimService = inject(SwimService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  swimmers = signal<Swimmer[]>([]);
  events = signal<SwimEvent[]>([]);
  filteredEvents = signal<SwimEvent[]>([]);
  submitting = signal(false);

  form: FormGroup = this.fb.group({
    swimmerId: [null, Validators.required],
    poolType: ['SCY', Validators.required],
    eventId: [null, Validators.required],
    timeFormatted: ['', [Validators.required, Validators.pattern(/^\d{1,2}:\d{2}\.\d{2}$/)]],
    recordedDate: [new Date(), Validators.required],
    meetName: [''],
    notes: ['']
  });

  ngOnInit(): void {
    this.loadSwimmers();
    this.loadEvents();
  }

  loadSwimmers(): void {
    this.swimService.getSwimmers().subscribe({
      next: (swimmers) => {
        this.swimmers.set(swimmers);
        if (swimmers.length === 1) {
          this.form.patchValue({ swimmerId: swimmers[0].id });
        }
      },
      error: (err) => console.error('Failed to load swimmers', err)
    });
  }

  loadEvents(): void {
    this.swimService.getEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.filterEvents();
      },
      error: (err) => console.error('Failed to load events', err)
    });
  }

  onPoolTypeChange(): void {
    this.filterEvents();
    this.form.patchValue({ eventId: null });
  }

  filterEvents(): void {
    const poolType = this.form.get('poolType')?.value;
    const filtered = this.events().filter(e => e.poolType === poolType);
    this.filteredEvents.set(filtered);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    const { swimmerId, ...timeData } = this.form.value;

    // Format date for API
    const recordedDate = timeData.recordedDate instanceof Date
      ? timeData.recordedDate.toISOString().split('T')[0]
      : timeData.recordedDate;

    const payload: SwimTimeCreate = {
      eventId: timeData.eventId,
      timeFormatted: timeData.timeFormatted,
      recordedDate,
      poolType: timeData.poolType,
      meetName: timeData.meetName || undefined,
      notes: timeData.notes || undefined
    };

    this.swimService.logTime(swimmerId, payload).subscribe({
      next: (result) => {
        const message = result.isPr ? 'New PR logged!' : 'Time logged successfully!';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.router.navigate(['/swim']);
      },
      error: (err) => {
        console.error('Failed to log time', err);
        this.snackBar.open('Failed to log time', 'Close', { duration: 3000 });
        this.submitting.set(false);
      }
    });
  }
}
