import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * First-touch attribution recorded the first time a visitor lands on the site.
 * Persisted in localStorage so that a return visit who finally books still
 * credits the channel that originally brought them in.
 *
 * This is what travels with every CreateBookingPayload — see [[tour-booking.service]] —
 * so commission against SEO/AI traffic can be reconciled from the bookings table.
 */
export interface AttributionTouch {
  /** Coarse bucket, e.g. 'organic-google', 'ai-chatgpt', 'paid-google', 'direct'. */
  channel: string;
  /** utm_source if present, else referrer hostname, else 'direct'. */
  source: string;
  /** utm_medium if present, else derived ('organic', 'ai-referral', 'cpc', 'none'). */
  medium: string;
  campaign: string | null;
  referrer: string;
  landingPath: string;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  /** ISO timestamp of capture (i.e. of the first visit). */
  capturedAt: string;
}

const STORAGE_KEY = 'eb_attribution_v1';
const OWN_HOST_SUFFIX = 'banskounlocked.com';

@Injectable({ providedIn: 'root' })
export class AttributionService {
  private firstTouch: AttributionTouch | null = null;
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (!this.isBrowser) return;

    const cached = this.readCache();
    if (cached) {
      this.firstTouch = cached;
      return;
    }

    this.firstTouch = this.captureCurrent();
    this.writeCache(this.firstTouch);
  }

  /** Returns the first-touch record, or null on SSR / if storage is unavailable. */
  getFirstTouch(): AttributionTouch | null {
    return this.firstTouch;
  }

  private readCache(): AttributionTouch | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AttributionTouch) : null;
    } catch {
      return null;
    }
  }

  private writeCache(touch: AttributionTouch): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(touch));
    } catch {
      // private mode / quota — fine, we just won't persist across visits.
    }
  }

  private captureCurrent(): AttributionTouch {
    const referrer = document.referrer || '';
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const gclid = params.get('gclid') || params.get('gbraid') || params.get('wbraid');
    const fbclid = params.get('fbclid');
    const msclkid = params.get('msclkid');

    const refHostRaw = this.hostnameOf(referrer);
    const selfReferral = !!refHostRaw && refHostRaw.endsWith(OWN_HOST_SUFFIX);
    const refHost = selfReferral ? '' : refHostRaw;

    const { channel, source, medium } = this.classify({
      utmSource,
      utmMedium,
      gclid,
      msclkid,
      fbclid,
      refHost,
    });

    return {
      channel,
      source,
      medium,
      campaign: utmCampaign,
      referrer: selfReferral ? '' : referrer,
      landingPath: window.location.pathname + window.location.search,
      gclid: gclid || null,
      fbclid: fbclid || null,
      msclkid: msclkid || null,
      capturedAt: new Date().toISOString(),
    };
  }

  private hostnameOf(url: string): string {
    if (!url) return '';
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  private classify(input: {
    utmSource: string | null;
    utmMedium: string | null;
    gclid: string | null;
    msclkid: string | null;
    fbclid: string | null;
    refHost: string;
  }): { channel: string; source: string; medium: string } {
    const { utmSource, utmMedium, gclid, msclkid, fbclid, refHost } = input;

    // Explicit UTM wins — that's the whole point of tagging a campaign.
    if (utmSource || utmMedium) {
      const src = (utmSource || refHost || 'unknown').toLowerCase();
      const med = (utmMedium || 'referral').toLowerCase();
      return { channel: this.channelFromUtm(src, med), source: src, medium: med };
    }

    // Click-IDs are deterministic ad signals — trust them over referrer.
    if (gclid) return { channel: 'paid-google', source: 'google', medium: 'cpc' };
    if (msclkid) return { channel: 'paid-bing', source: 'bing', medium: 'cpc' };

    if (!refHost) return { channel: 'direct', source: 'direct', medium: 'none' };

    const ai = this.matchAi(refHost);
    if (ai) return { channel: ai, source: refHost, medium: 'ai-referral' };

    const search = this.matchSearch(refHost);
    if (search) return { channel: search, source: refHost, medium: 'organic' };

    const social = this.matchSocial(refHost);
    if (social) {
      // fbclid without UTM usually means an FB Ads click that lost its UTM —
      // promote to paid-meta so commission reports don't credit organic social.
      if (fbclid) return { channel: 'paid-meta', source: refHost, medium: 'paid-social' };
      return { channel: social, source: refHost, medium: 'social' };
    }

    return { channel: 'referral', source: refHost, medium: 'referral' };
  }

  private matchAi(host: string): string | null {
    if (host === 'chatgpt.com' || host.endsWith('.chatgpt.com')) return 'ai-chatgpt';
    if (host === 'chat.openai.com') return 'ai-chatgpt';
    if (host === 'perplexity.ai' || host.endsWith('.perplexity.ai')) return 'ai-perplexity';
    if (host === 'gemini.google.com') return 'ai-gemini';
    if (host === 'claude.ai' || host.endsWith('.claude.ai')) return 'ai-claude';
    if (host === 'copilot.microsoft.com') return 'ai-copilot';
    if (host === 'you.com' || host.endsWith('.you.com')) return 'ai-you';
    if (host === 'poe.com') return 'ai-poe';
    if (host === 'phind.com') return 'ai-phind';
    if (host.endsWith('.anthropic.com')) return 'ai-claude';
    return null;
  }

  private matchSearch(host: string): string | null {
    // gemini.google.com is already routed to AI above before reaching here.
    if (/^(www\.)?google\.[a-z.]+$/.test(host)) return 'organic-google';
    if (host === 'bing.com' || host === 'www.bing.com') return 'organic-bing';
    if (host === 'duckduckgo.com') return 'organic-ddg';
    if (host.endsWith('yandex.ru') || host.endsWith('yandex.com')) return 'organic-yandex';
    if (host === 'ecosia.org' || host === 'www.ecosia.org') return 'organic-ecosia';
    if (host === 'search.brave.com') return 'organic-brave';
    if (/^(www\.)?yahoo\.[a-z.]+$/.test(host)) return 'organic-yahoo';
    if (host === 'baidu.com' || host === 'www.baidu.com') return 'organic-baidu';
    if (host === 'seznam.cz') return 'organic-seznam';
    return null;
  }

  private matchSocial(host: string): string | null {
    if (host.endsWith('facebook.com')) return 'social-facebook';
    if (host === 't.co' || host === 'twitter.com' || host === 'x.com' || host.endsWith('.x.com')) return 'social-twitter';
    if (host.endsWith('instagram.com')) return 'social-instagram';
    if (host.endsWith('youtube.com') || host === 'youtu.be') return 'social-youtube';
    if (host.endsWith('linkedin.com') || host === 'lnkd.in') return 'social-linkedin';
    if (host.endsWith('reddit.com')) return 'social-reddit';
    if (host.endsWith('pinterest.com') || host.endsWith('pinterest.co.uk')) return 'social-pinterest';
    if (host.endsWith('tiktok.com')) return 'social-tiktok';
    if (host === 'wa.me' || host.endsWith('whatsapp.com')) return 'social-whatsapp';
    if (host.endsWith('t.me') || host === 'telegram.org') return 'social-telegram';
    return null;
  }

  private channelFromUtm(source: string, medium: string): string {
    // Meta's {{site_source_name}} dynamic param resolves to fb / ig / an / msg —
    // none of which contain 'facebook' or 'meta', so match them explicitly or
    // paid Meta traffic mis-buckets as paid-other.
    const isMeta =
      source.includes('facebook') ||
      source.includes('meta') ||
      source.includes('instagram') ||
      ['fb', 'ig', 'an', 'msg'].includes(source);

    if (medium === 'email' || medium === 'newsletter') return 'email';
    if (medium === 'cpc' || medium === 'ppc' || medium === 'paid' || medium === 'paidsearch') {
      if (source.includes('google')) return 'paid-google';
      if (source.includes('bing')) return 'paid-bing';
      if (isMeta) return 'paid-meta';
      return 'paid-other';
    }
    if (medium === 'paid-social' || medium === 'paidsocial' || medium === 'paid_social')
      return 'paid-meta';
    if (medium === 'social') return `social-${source}`;
    if (medium === 'organic') return `organic-${source}`;
    if (medium === 'affiliate') return 'affiliate';
    return `referral-${source}`;
  }
}
