import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Metric } from 'web-vitals';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_MEASUREMENT_ID = 'G-9JNLT40KB6';

/**
 * Fires GA4 events via the gtag.js snippet bootstrapped in index.html.
 * Mirrors the shape of PixelService so callers can pair the two trackers.
 *
 * The gtag config in index.html uses { send_page_view: false } — page_views
 * are fired exclusively from here on Angular Router NavigationEnd so that
 * SPA navigations are counted correctly.
 */
/**
 * Hostnames that represent a developer machine, not a real visitor. Events
 * fired from these would otherwise pollute GA4 with non-genuine interactions
 * (and skew engagement / conversion metrics). The gtag config in index.html is
 * harmless on its own — it sends no events — so guarding here is sufficient.
 */
export function isLocalhost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  );
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly isBrowser: boolean;
  /** False on developer machines so localhost traffic never reaches GA4. */
  private readonly trackingEnabled: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.trackingEnabled = this.isBrowser && !isLocalhost(window.location.hostname);
  }

  /** Fire a GA4 page_view for the current URL. Skips /admin/* paths. */
  trackPageView(path: string): void {
    if (!this.trackingEnabled || typeof window.gtag !== 'function') return;
    if (path.startsWith('/admin')) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID,
    });
  }

  /**
   * Real-user Core Web Vitals (LCP, INP, CLS, FCP, TTFB) → GA4. Since CrUX has
   * no field data for this origin yet (too little traffic), this is our own RUM:
   * each metric is reported as a GA4 event so we can read p75 LCP/INP/CLS by
   * device / country / page in an exploration. The web-vitals lib is loaded via
   * dynamic import so it stays out of the initial bundle. Skips localhost via
   * the same `trackingEnabled` guard as everything else. Call once on app boot.
   */
  async reportWebVitals(): Promise<void> {
    if (!this.trackingEnabled) return;

    const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals');

    const send = (metric: Metric): void => {
      // One consolidated `web_vitals` event (metric carried in `metric_name`)
      // instead of five top-level events, so the Events/Realtime/snapshot cards
      // stay readable. Break down by `metric_name` in an Exploration when you
      // need p75 LCP/INP/CLS by device/country/page.
      // GA4 wants an integer `value`; CLS is sub-unit so scale it ×1000.
      this.trackEvent('web_vitals', {
        metric_name: metric.name,
        value: Math.round(metric.name === 'CLS' ? metric.delta * 1000 : metric.delta),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: metric.rating,
        metric_navigation_type: metric.navigationType,
        // Don't let these skew engagement/bounce metrics in GA4.
        non_interaction: true,
      });
    };

    onCLS(send);
    onINP(send);
    onLCP(send);
    onFCP(send);
    onTTFB(send);
  }

  /** Generic event tracker for funnel milestones (lead, view_item, etc). */
  trackEvent(name: string, params: Record<string, unknown> = {}): void {
    if (!this.trackingEnabled || typeof window.gtag !== 'function') return;
    window.gtag('event', name, { send_to: GA_MEASUREMENT_ID, ...params });
  }

  /** view_item — fired on tour detail pages. */
  trackViewItem(params: {
    id: string;
    name: string;
    category?: string;
    value?: number;
    currency?: string;
  }): void {
    this.trackEvent('view_item', {
      currency: params.currency ?? 'EUR',
      value: params.value,
      items: [
        {
          item_id: params.id,
          item_name: params.name,
          item_category: params.category ?? 'Tour',
          price: params.value,
        },
      ],
    });
  }

  /**
   * select_promotion — fired when a rider clicks an on-site promotion such as
   * the top promo banner. Feeds GA4's Promotions report so we can see how much
   * traffic (and downstream booking) each promo drives.
   */
  trackSelectPromotion(params: {
    promotionName: string;
    promotionId?: string;
    creativeSlot?: string;
  }): void {
    this.trackEvent('select_promotion', {
      promotion_name: params.promotionName,
      ...(params.promotionId ? { promotion_id: params.promotionId } : {}),
      ...(params.creativeSlot ? { creative_slot: params.creativeSlot } : {}),
    });
  }

  /**
   * begin_checkout — fired when the rider clicks the deposit (PayPal) button on
   * a tour detail page. Carries the tour in `items` so GA4 funnel exploration
   * can break the checkout-start step down per tour.
   */
  trackBeginCheckout(params: {
    value?: number;
    currency?: string;
    items?: { id: string; name: string; category?: string }[];
  } = {}): void {
    this.trackEvent('begin_checkout', {
      currency: params.currency ?? 'EUR',
      value: params.value,
      ...(params.items
        ? {
            items: params.items.map(i => ({
              item_id: i.id,
              item_name: i.name,
              item_category: i.category ?? 'Tour',
            })),
          }
        : {}),
    });
  }

  /**
   * generate_lead — fired on contact-form submit and WhatsApp / phone clicks.
   * Pass `tour` when the enquiry happened on a tour detail page so the lead is
   * carried in `items` and the GA4 funnel can break leads down per tour.
   */
  trackLead(
    email?: string,
    method?: string,
    tour?: { id: string; name: string; category?: string },
  ): void {
    this.trackEvent('generate_lead', {
      currency: 'EUR',
      ...(method ? { lead_source: method } : {}),
      ...(email ? { user_email: email } : {}),
      ...(tour
        ? {
            items: [
              {
                item_id: tour.id,
                item_name: tour.name,
                item_category: tour.category ?? 'Tour',
              },
            ],
          }
        : {}),
    });
  }

  /** purchase — fired on successful PayPal capture. */
  trackPurchase(params: {
    orderId: string;
    value: number;
    currency: string;
    items: { id: string; name: string }[];
  }): void {
    this.trackEvent('purchase', {
      transaction_id: params.orderId,
      currency: params.currency,
      value: params.value,
      items: params.items.map(i => ({ item_id: i.id, item_name: i.name })),
    });
  }
}
