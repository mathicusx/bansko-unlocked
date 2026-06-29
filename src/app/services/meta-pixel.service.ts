import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type MetaPixelPrimitive = string | number | boolean;

export type MetaPixelParameters = Record<
  string,
  MetaPixelPrimitive | MetaPixelPrimitive[] | undefined | null
>;

export type MetaPixelStandardEvent =
  | 'PageView'
  | 'AddPaymentInfo'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'InitiateCheckout'
  | 'Lead'
  | 'Purchase'
  | 'Schedule'
  | 'Search'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'
  | 'ViewContent';

declare global {
  interface Window {
    fbq?: (
      command: 'track',
      eventName: MetaPixelStandardEvent,
      parameters?: Record<string, MetaPixelPrimitive | MetaPixelPrimitive[]>
    ) => void;
  }
}

@Injectable({
  providedIn: 'root',
})
export class MetaPixelService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  trackPageView(): void {
    this.track('PageView');
  }

  trackViewContent(parameters: MetaPixelParameters = {}): void {
    this.track('ViewContent', parameters);
  }

  trackInitiateCheckout(parameters: MetaPixelParameters = {}): void {
    this.track('InitiateCheckout', parameters);
  }

  trackLead(parameters: MetaPixelParameters = {}): void {
    this.track('Lead', this.withAnalyticsContext(parameters));
  }

  trackContact(parameters: MetaPixelParameters = {}): void {
    this.track('Contact', this.withAnalyticsContext(parameters));
  }

  trackPurchase(parameters: MetaPixelParameters = {}): void {
    this.track('Purchase', parameters);
  }

  private withAnalyticsContext(
    parameters: MetaPixelParameters = {}
  ): MetaPixelParameters {
    if (!this.isBrowser) {
      return parameters;
    }

    return {
      source_page: this.getCurrentPath(),
      language: this.getCurrentLanguage(),
      ...parameters,
    };
  }

  private getCurrentPath(): string {
    if (!this.isBrowser) {
      return 'server';
    }

    return window.location.pathname || '/';
  }

  private getCurrentLanguage(): string {
    if (!this.isBrowser) {
      return 'en';
    }

    const [, maybeLanguage] = window.location.pathname.match(/^\/(\w{2})(?:\/|$)/) ?? [];
    return maybeLanguage || 'en';
  }

  track(
    eventName: MetaPixelStandardEvent,
    parameters: MetaPixelParameters = {}
  ): void {
    if (!this.isBrowser || typeof window.fbq !== 'function') {
      return;
    }

    const sanitizedParameters = Object.entries(parameters).reduce<
      Record<string, MetaPixelPrimitive | MetaPixelPrimitive[]>
    >((accumulator, [key, value]) => {
      if (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return accumulator;
      }

      accumulator[key] = value;
      return accumulator;
    }, {});

    if (Object.keys(sanitizedParameters).length > 0) {
      window.fbq('track', eventName, sanitizedParameters);
      return;
    }

    window.fbq('track', eventName);
  }
}