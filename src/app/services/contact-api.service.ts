import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Mirrors the backend CreateContactDto (server/src/contact/dto). */
export interface CreateContactPayload {
  name: string;
  email: string;
  message: string;
  /** Picks the confirmation-email language. English-only for now. */
  locale?: 'en';
  /** Which surface submitted — surfaced in the staff notification subject. */
  source?: 'contact-page' | 'floating-help';
}

/** Mirrors the backend ContactService.submit() return shape. */
export interface ContactSubmitResult {
  ok: boolean;
  notifyOk: boolean;
  confirmOk: boolean;
}

/**
 * POSTs the contact form / floating-help message to the NestJS API, which
 * dispatches the Resend notification (to the staff inbox) + a branded
 * confirmation email back to the visitor. Replaces the old `mailto:` flow.
 */
@Injectable({ providedIn: 'root' })
export class ContactApiService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  submit(payload: CreateContactPayload): Observable<ContactSubmitResult> {
    return this.http.post<ContactSubmitResult>(`${this.apiUrl}/contact`, payload);
  }
}
