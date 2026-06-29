import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export type BookingStatus = 'pending' | 'completed' | 'no-show' | 'cancelled';

/** Mirrors server/src/bookings/booking.entity.ts. Kept loose (strings + nulls)
 *  because the admin table just renders whatever the API returns — there's no
 *  client-side mutation of the shape. */
export interface AdminBooking {
  id: string;
  tourTitle: string;
  tourSlug: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredContact: string;
  experienceLevels: string[];
  numberOfRiders: number;
  preferredDates: string;
  startDate: string | null;
  endDate: string | null;
  extras: string[] | null;
  depositAmount: string | number;
  currency: string;
  paypalOrderId: string | null;
  locale: string;
  emailsSent: boolean;
  status: BookingStatus;
  tourCompletedAt: string | null;
  cancelledAt: string | null;
  attributionChannel: string | null;
  attributionSource: string | null;
  attributionMedium: string | null;
  attributionCampaign: string | null;
  attributionReferrer: string | null;
  attributionLandingPath: string | null;
  attributionCapturedAt: string | null;
  createdAt: string;
}

export interface CommissionByChannel {
  channel: string;
  count: number;
  revenue: number;
  commission: number;
}

export interface CommissionSummary {
  from: string;
  to: string;
  rate: number;
  totalCompletedRevenue: number;
  attributableRevenue: number;
  commissionOwed: number;
  completedCount: number;
  attributableCount: number;
  byChannel: CommissionByChannel[];
}

@Injectable({ providedIn: 'root' })
export class BookingAdminService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
    });
  }

  getAll(): Observable<AdminBooking[]> {
    return this.http.get<AdminBooking[]>(`${this.apiUrl}/bookings/admin/all`, {
      headers: this.authHeaders(),
    });
  }

  getSummary(from?: Date, to?: Date, rate = 0.03): Observable<CommissionSummary> {
    const params: Record<string, string> = { rate: String(rate) };
    if (from) params['from'] = from.toISOString();
    if (to) params['to'] = to.toISOString();
    return this.http.get<CommissionSummary>(`${this.apiUrl}/bookings/admin/summary`, {
      headers: this.authHeaders(),
      params,
    });
  }

  setStatus(id: string, status: BookingStatus, timestamp?: Date): Observable<AdminBooking> {
    return this.http.patch<AdminBooking>(
      `${this.apiUrl}/bookings/${id}/status`,
      { status, ...(timestamp ? { timestamp: timestamp.toISOString() } : {}) },
      { headers: this.authHeaders() },
    );
  }
}
