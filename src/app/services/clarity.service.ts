import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { isLocalhost } from './analytics.service';

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/** Microsoft Clarity project tag id (clarity.ms/tag/<id>). */
const CLARITY_PROJECT_ID = 'wupi0k0h4b';

/**
 * Lazily injects the Microsoft Clarity behavioural-analytics tag.
 *
 * Clarity is a fire-and-forget session recorder with no per-event API — once
 * the tag loads it records everything. To keep its data clean we never load it
 * at all on:
 *   - the server (no DOM during SSR / prerender),
 *   - developer machines (localhost — see isLocalhost), or
 *   - /admin/* sessions.
 *
 * Mirrors the localhost guard used by AnalyticsService / PixelService. Because
 * admins land directly on /admin via bookmark, the tag is simply never injected
 * for them; on the rare public→admin navigation it will already be loaded, which
 * is an acceptable edge (those URLs can also be excluded in the Clarity dashboard).
 */
@Injectable({ providedIn: 'root' })
export class ClarityService {
  private readonly isBrowser: boolean;
  /** False on developer machines so localhost traffic never reaches Clarity. */
  private readonly trackingEnabled: boolean;
  private injected = false;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.trackingEnabled = this.isBrowser && !isLocalhost(window.location.hostname);
  }

  /**
   * Inject the Clarity tag once for the given route. Call on each NavigationEnd;
   * it is a no-op after the first successful injection and on /admin/* paths.
   *
   * The `window.clarity` queue stub is set up immediately so any synchronous
   * `clarity(...)` calls land in the buffer, but the actual `clarity.js` fetch
   * (~250 KB, ~150 ms main-thread on benchmark hardware) is deferred to idle
   * so it doesn't compete with hydration / LCP. Clarity is a fire-and-forget
   * session recorder — the few seconds' delay before recording starts has no
   * functional impact, and queued events flush once the tag loads.
   */
  init(path: string): void {
    if (!this.trackingEnabled || this.injected) return;
    if (path.startsWith('/admin')) return;

    this.injected = true;

    // 1. Synchronous queue stub — captures any clarity(...) calls fired before
    //    the real tag arrives.
    const w = window as any;
    w.clarity =
      w.clarity ||
      function (...args: unknown[]) {
        (w.clarity.q = w.clarity.q || []).push(args);
      };

    // 2. Idle-deferred script injection — official clarity.ms/tag/<id> bootstrap.
    const loadClarityTag = () => {
      const t = document.createElement('script');
      t.async = true;
      t.src = 'https://www.clarity.ms/tag/' + CLARITY_PROJECT_ID;
      document.head.appendChild(t);
    };

    if ('requestIdleCallback' in w) {
      w.requestIdleCallback(loadClarityTag, { timeout: 5000 });
    } else {
      setTimeout(loadClarityTag, 2500);
    }
  }
}
