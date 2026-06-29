import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import {
  AdminBooking,
  BookingAdminService,
  BookingStatus,
  CommissionSummary,
} from '../../services/booking-admin.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.scss',
})
export class AdminBookingsComponent implements OnInit {
  private adminApi = inject(BookingAdminService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private seo = inject(SeoService);

  bookings: AdminBooking[] = [];
  filtered: AdminBooking[] = [];
  summary: CommissionSummary | null = null;

  loading = true;
  summaryLoading = true;

  // Filters
  statusFilter: '' | BookingStatus = '';
  channelFilter = '';
  searchText = '';
  rangeFrom = '';
  rangeTo = '';

  // Commission rate is editable so we can model "what if" before locking the
  // partnership number. Defaults to 3% — the agreed rate.
  commissionRate = 0.03;

  readonly displayedColumns = [
    'createdAt',
    'customer',
    'tour',
    'riders',
    'deposit',
    'channel',
    'status',
    'actions',
  ];

  readonly statusOptions: Array<{ value: BookingStatus; label: string; colour: string }> = [
    { value: 'pending', label: 'Pending', colour: '#888888' },
    { value: 'completed', label: 'Completed', colour: '#2e7d32' },
    { value: 'no-show', label: 'No-show', colour: '#f57c00' },
    { value: 'cancelled', label: 'Cancelled', colour: '#c62828' },
  ];

  ngOnInit(): void {
    // Admin pages must not be indexed — mirrors the policy in the SeoService doc.
    this.seo.setNoIndex();

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/admin/login']);
      return;
    }

    // Default range = this month so the summary card has data on first paint.
    const now = new Date();
    this.rangeFrom = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    this.rangeTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    this.loadBookings();
    this.loadSummary();
  }

  loadBookings(): void {
    this.loading = true;
    this.adminApi.getAll().subscribe({
      next: (rows) => {
        this.bookings = rows;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 401 || err?.status === 403) {
          this.auth.logout();
          this.router.navigate(['/admin/login']);
        } else {
          this.snack.open('Failed to load bookings', 'Close', { duration: 4000 });
        }
      },
    });
  }

  loadSummary(): void {
    this.summaryLoading = true;
    const from = this.rangeFrom ? new Date(this.rangeFrom) : undefined;
    const to = this.rangeTo ? new Date(this.rangeTo + 'T23:59:59') : undefined;
    this.adminApi.getSummary(from, to, this.commissionRate).subscribe({
      next: (s) => {
        this.summary = s;
        this.summaryLoading = false;
      },
      error: () => {
        this.summaryLoading = false;
        this.snack.open('Failed to load commission summary', 'Close', { duration: 4000 });
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();
    this.filtered = this.bookings.filter((b) => {
      if (this.statusFilter && b.status !== this.statusFilter) return false;
      if (this.channelFilter && (b.attributionChannel ?? '') !== this.channelFilter) return false;
      if (search) {
        const haystack = [
          b.customerName,
          b.customerEmail,
          b.customerPhone,
          b.tourTitle,
          b.attributionChannel ?? '',
          b.attributionSource ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  /** Distinct channels actually present in the booking list — drives the
   *  filter dropdown so we don't show stale options. */
  get availableChannels(): string[] {
    const set = new Set<string>();
    for (const b of this.bookings) {
      if (b.attributionChannel) set.add(b.attributionChannel);
    }
    return Array.from(set).sort();
  }

  setStatus(b: AdminBooking, status: BookingStatus): void {
    const previous = b.status;
    b.status = status; // optimistic — revert on error
    this.adminApi.setStatus(b.id, status).subscribe({
      next: (updated) => {
        Object.assign(b, updated);
        this.applyFilters();
        // Refresh summary because moving a row in/out of 'completed' changes
        // the commission total.
        this.loadSummary();
        this.snack.open(`Marked as ${status}`, 'Close', { duration: 2000 });
      },
      error: () => {
        b.status = previous;
        this.snack.open('Failed to update status', 'Close', { duration: 4000 });
      },
    });
  }

  statusColour(status: BookingStatus): string {
    return this.statusOptions.find((s) => s.value === status)?.colour ?? '#888888';
  }

  channelBadgeColour(channel: string | null): string {
    if (!channel) return '#9e9e9e';
    if (channel.startsWith('ai-')) return '#7b1fa2';
    if (channel.startsWith('organic-')) return '#1565c0';
    if (channel.startsWith('paid-')) return '#ef6c00';
    if (channel.startsWith('social-')) return '#0277bd';
    if (channel === 'direct') return '#555555';
    if (channel === 'email') return '#00838f';
    return '#666666';
  }

  /** True for the channels currently covered by the 3% commission deal —
   *  used by the UI to flag which rows actually pay out. */
  isCommissionable(channel: string | null): boolean {
    if (!channel) return false;
    return channel.startsWith('ai-') || channel.startsWith('organic-');
  }

  formatMoney(amount: number | string, currency = 'EUR'): string {
    const value = typeof amount === 'string' ? Number(amount) : amount;
    return `${currency} ${value.toFixed(2)}`;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }

  goToTours(): void {
    this.router.navigate(['/admin/tours']);
  }
}
