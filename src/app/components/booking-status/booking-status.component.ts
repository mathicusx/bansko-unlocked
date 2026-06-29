import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { BookingService } from '../../services/booking.service';
import { BookingFields } from '../../models/booking.model';

@Component({
  selector: 'app-booking-status',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule
  ],
  template: `
    <mat-card class="status-card">
      <mat-card-header>
        <mat-card-title>Check Your Booking Status</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <form [formGroup]="emailForm" (ngSubmit)="checkBookings()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email Address</mat-label>
            <input matInput type="email" formControlName="email" required>
            <mat-error *ngIf="emailForm.get('email')?.hasError('required')">
              Email is required
            </mat-error>
            <mat-error *ngIf="emailForm.get('email')?.hasError('email')">
              Please enter a valid email
            </mat-error>
          </mat-form-field>
          
          <button mat-raised-button color="primary" type="submit" 
                  [disabled]="!emailForm.valid || isLoading">
            Check Bookings
          </button>
        </form>

        <div *ngIf="bookings.length > 0" class="bookings-list">
          <h3>Your Bookings</h3>
          <div *ngFor="let booking of bookings" class="booking-item">
            <div class="booking-details">
              <h4>{{booking['Customer Name']}}</h4>
              <!-- <p><strong>Dates:</strong> {{formatDate(booking['Start Date'])}} - {{formatDate(booking['End Date'])}}</p> -->
              <p><strong>Total:</strong> £{{booking['Total Amount']}}</p>
              <p><strong>Deposit:</strong> £{{booking['Deposit Amount']}} 
                <span *ngIf="booking['Deposit Paid']">(✅ Paid)</span>
                <span *ngIf="!booking['Deposit Paid']">(❌ Pending)</span>
              </p>
            </div>
            <div class="status-chip">
              <mat-chip [ngClass]="getStatusClass(booking['Status'])">
                <mat-icon>{{getStatusIcon(booking['Status'])}}</mat-icon>
                {{booking['Status']}}
              </mat-chip>
            </div>
          </div>
        </div>

        <div *ngIf="searched && bookings.length === 0" class="no-bookings">
          <p>No bookings found for this email address.</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .status-card {
      max-width: 600px;
      margin: 20px auto;
      transition: all 0.3s ease;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .bookings-list {
      margin-top: 24px;
    }

    .booking-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .booking-details h4 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .booking-details p {
      margin: 4px 0;
      color: #666;
    }

    .status-chip {
      flex-shrink: 0;
    }

    .pending-chip {
      background-color: #fff3cd;
      color: #856404;
    }

    .confirmed-chip {
      background-color: #d1edff;
      color: #0c63e4;
    }

    .cancelled-chip {
      background-color: #f8d7da;
      color: #721c24;
    }

    .no-bookings {
      text-align: center;
      padding: 24px;
      color: #666;
    }

    mat-chip {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `]
})
export class BookingStatusComponent implements OnInit {
  emailForm: FormGroup;
  bookings: BookingFields[] = [];
  isLoading = false;
  searched = false;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {}

  checkBookings() {
    if (this.emailForm.valid) {
      this.isLoading = true;
      const email = this.emailForm.get('email')?.value;
      
      this.bookingService.getCustomerBookings(email).subscribe({
        next: (bookings) => {
          this.bookings = bookings;
          this.isLoading = false;
          this.searched = true;
        },
        error: (error) => {
          console.error('Error fetching bookings:', error);
          this.isLoading = false;
          this.searched = true;
          this.bookings = [];
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB');
  }

  getStatusClass(status: string): string {
    return `${status.toLowerCase()}-chip`;
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'schedule';
      case 'confirmed': return 'check_circle';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  }
}