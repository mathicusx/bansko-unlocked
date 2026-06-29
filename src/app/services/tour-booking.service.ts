import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AttributionTouch } from './attribution.service';

/** Mirrors the backend CreateBookingDto (server/src/bookings/dto). */
export interface CreateBookingPayload {
  tourId?: string;
  tourSlug?: string;
  tourTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  preferredContact: 'whatsapp' | 'phone' | 'email' | 'other';
  /** Free text when preferredContact === 'other'. */
  preferredContactOther?: string;
  /** One or more — groups can be mixed-level. */
  experienceLevels: Array<'beginner' | 'intermediate' | 'advanced'>;
  numberOfRiders: number;
  preferredDates: string;
  /** ISO date (YYYY-MM-DD) — used for "popular month" stats aggregation. */
  startDate?: string;
  endDate?: string;
  extras?: string[];
  depositAmount: number;
  currency: string;
  paypalOrderId?: string;
  locale?: string;
  /** First-touch attribution captured by [[AttributionService]]. Persisted on
   *  the backend so SEO/AI-driven bookings can be counted for commission. */
  attribution?: AttributionTouch;
}

/** Mirrors BookingStats on the backend. Both fields may be null when the
 *  quota threshold isn't met — the UI then renders nothing rather than a
 *  weak "1 booked" message. */
export interface BookingStats {
  recentBookings: number | null;
  popularMonth: { year: number; month: number; count: number } | null;
}

/**
 * Posts a confirmed booking (after PayPal captures the deposit) to the NestJS
 * API, which persists it to Postgres and dispatches the Resend notification +
 * confirmation emails. Separate from the legacy Airtable `BookingService`.
 */
@Injectable({ providedIn: 'root' })
export class TourBookingService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  createBooking(payload: CreateBookingPayload): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/bookings`, payload);
  }

  /** Fetch the quota-gated booking stats for the social-proof badge. */
  getStats(): Observable<BookingStats> {
    return this.http.get<BookingStats>(`${this.apiUrl}/bookings/stats`);
  }
}
