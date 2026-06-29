import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { isLocalhost } from './analytics.service';

/**
 * Standard Meta Pixel events we use across the funnel.
 * Keep this list aligned with the matching server-side Conversions API switch.
 */
export type PixelStandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Lead'
  | 'Contact'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Schedule'
  | 'CompleteRegistration'
  | 'Search';

export interface PixelEventOptions {
  /** Optional enriched user data — server hashes these before forwarding to Meta. */
  user?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    city?: string;
  };
  /** Custom event payload — must match Pixel parameter names. */
  custom?: Record<string, unknown>;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires a Meta Pixel event in the browser AND mirrors the same event server-side
 * (Conversions API) with a shared `event_id` so Meta deduplicates them.
 *
 * Usage:
 *   pixel.track('ViewContent', {
 *     custom: { content_ids: [tour.id], value: tour.priceEur, currency: 'EUR' },
 *     user:   { email: form.email }
 *   });
 *
 * The browser fires immediately; the server call is fire-and-forget so it never
 * blocks the UI even if the API endpoint is slow or unreachable.
 */
@Injectable({ providedIn: 'root' })
export class PixelService {
  private readonly isBrowser: boolean;
  private readonly capiUrl: string;
  /** False on developer machines so localhost traffic never reaches Meta. */
  private readonly trackingEnabled: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.trackingEnabled = this.isBrowser && !isLocalhost(window.location.hostname);
    // CAPI endpoint lives on the same NestJS API as tours/auth.
    this.capiUrl = `${environment.apiUrl}/events/meta`;
  }

  /**
   * Fire a Meta Pixel standard event with an event_id that the server CAPI call
   * will reuse for deduplication. Returns the generated event_id so the caller
   * can persist it (e.g. on a Purchase) for later analytics joins.
   */
  track(event: PixelStandardEvent, options: PixelEventOptions = {}): string {
    if (!this.trackingEnabled) return '';

    const eventId = this.generateEventId();
    const customData = options.custom ?? {};

    // 1. Browser-side: standard fbq pixel call. index.html only runs `fbq('init')`
    //    — PixelService is the single source of every PageView, so the browser
    //    pixel and the CAPI mirror below always share one `event_id` and Meta
    //    deduplicates them. Calls made before fbevents.js loads land in the fbq
    //    stub queue and replay (with this eventID) once the library is ready.
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', event, customData, { eventID: eventId });
      }
    } catch {
      // fbq may not be loaded yet on very early route changes; safe to swallow.
    }

    // 2. Server-side: mirror to NestJS endpoint that proxies to Meta CAPI.
    //    Fire-and-forget — never block UX, never throw to the caller.
    //
    //    Deferred to `requestIdleCallback` so the POST (which can take 2 s+
    //    on a render.com cold-start) doesn't sit in the critical-path
    //    waterfall during initial load. The event_time is captured NOW so
    //    Meta's dedup window still treats it as concurrent with the browser
    //    pixel fire.
    const payload = {
      event_name: event,
      event_id: eventId,
      event_source_url: window.location.href,
      action_source: 'website' as const,
      event_time: Math.floor(Date.now() / 1000),
      user_data: this.buildUserDataStub(options.user),
      custom_data: customData,
    };

    const sendCapi = () =>
      this.http
        .post(this.capiUrl, payload)
        .pipe(catchError(() => of(null)))
        .subscribe();

    const w = window as any;
    if ('requestIdleCallback' in w) {
      w.requestIdleCallback(sendCapi, { timeout: 3000 });
    } else {
      setTimeout(sendCapi, 1500);
    }

    return eventId;
  }

  /** Convenience helper for the most common event. */
  trackPageView(): string {
    return this.track('PageView');
  }

  /** Convenience helper for tour-detail pages. */
  trackViewContent(params: {
    contentId: string;
    contentName: string;
    category?: string;
    value?: number;
    currency?: string;
  }): string {
    return this.track('ViewContent', {
      custom: {
        content_ids: [params.contentId],
        content_name: params.contentName,
        content_category: params.category ?? 'Tour',
        content_type: 'product',
        value: params.value,
        currency: params.currency ?? 'EUR',
      },
    });
  }

  /** Convenience helper for lead events. `source` lets callers distinguish
   *  WhatsApp / phone / email / form leads in Events Manager. Pass `tour` when
   *  the enquiry happened on a tour detail page so the Lead is attributable per
   *  tour, exactly like the ViewContent / InitiateCheckout / Purchase funnel. */
  trackLead(
    email?: string,
    source: 'Contact Form' | 'WhatsApp' | 'Phone Call' | 'Email' = 'Contact Form',
    tour?: { id: string; name: string; category?: string },
  ): string {
    return this.track('Lead', {
      user: email ? { email } : undefined,
      custom: {
        lead_source: source,
        content_category: tour?.category ?? 'Tour Enquiry',
        ...(tour
          ? { content_ids: [tour.id], content_type: 'product', content_name: tour.name }
          : { content_name: source }),
      },
    });
  }

  /**
   * InitiateCheckout — the Meta-side counterpart of GA4 `begin_checkout`. Fired
   * when the rider clicks the PayPal deposit button on a tour detail page.
   * Pass the tour (contentId/contentName) so the Meta funnel is attributable
   * per tour, exactly like the GA4 funnel.
   */
  trackInitiateCheckout(params: {
    contentId?: string;
    contentName?: string;
    category?: string;
    value?: number;
    currency?: string;
  } = {}): string {
    return this.track('InitiateCheckout', {
      custom: {
        ...(params.contentId
          ? { content_ids: [params.contentId], content_type: 'product' }
          : {}),
        content_name: params.contentName ?? 'Tour Booking',
        content_category: params.category ?? 'Enduro & Buggy Tours',
        currency: params.currency ?? 'EUR',
        value: params.value,
      },
    });
  }

  /** Convenience helper for a successful Purchase / deposit. */
  trackPurchase(params: {
    orderId: string;
    value: number;
    currency: string;
    contentIds: string[];
    email?: string;
  }): string {
    return this.track('Purchase', {
      user: params.email ? { email: params.email } : undefined,
      custom: {
        content_ids: params.contentIds,
        content_type: 'product',
        value: params.value,
        currency: params.currency,
        order_id: params.orderId,
        num_items: params.contentIds.length,
      },
    });
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  /**
   * Generate a unique event ID — used to dedupe browser-pixel + server-CAPI events
   * in Meta Events Manager. Format is non-sensitive; just needs to be unique per
   * event instance.
   */
  private generateEventId(): string {
    if (this.isBrowser && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `eb_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Build a *plain-text* user_data stub the server will hash before forwarding.
   * NEVER hash on the client — the server is the only place that should do
   * SHA-256 + lowercase normalization to keep a single source of truth.
   * We also let Meta's auto-collected `fbp` / `fbc` cookies handle the rest.
   */
  private buildUserDataStub(user: PixelEventOptions['user']): Record<string, string> {
    if (!this.isBrowser) return {};

    const data: Record<string, string> = {};

    // Optional PII — only present on Lead / Purchase. Server hashes these.
    if (user?.email) data['em'] = user.email.trim().toLowerCase();
    if (user?.phone) data['ph'] = user.phone.replace(/\D/g, '');
    if (user?.firstName) data['fn'] = user.firstName.trim().toLowerCase();
    if (user?.lastName) data['ln'] = user.lastName.trim().toLowerCase();
    if (user?.country) data['country'] = user.country.trim().toLowerCase();
    if (user?.city) data['ct'] = user.city.trim().toLowerCase();

    // Match keys — sent on EVERY event (no PII required). `_fbp`/`_fbc` are the
    // strongest non-PII signals Meta uses to attribute a server event back to a
    // browser, so dropping them on PageView/ViewContent/InitiateCheckout
    // (which carry no `user`) silently tanks Event Match Quality.
    const fbp = this.readCookie('_fbp');
    const fbc = this.readCookie('_fbc');
    if (fbp) data['fbp'] = fbp;
    if (fbc) data['fbc'] = fbc;
    data['client_user_agent'] = navigator.userAgent;

    return data;
  }

  private readCookie(name: string): string | undefined {
    if (!this.isBrowser) return undefined;
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : undefined;
  }
}
