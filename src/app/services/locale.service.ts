import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Bansko Unlocked ships English only. The de/fr/nl localisation machinery was
 * removed, but this service is kept (with its full method surface) so the many
 * components that inject it still compile — every method now collapses to the
 * English identity. Re-introducing a locale (e.g. Bulgarian) later means
 * widening `Locale`/`PrefixedLocale` and restoring the prefix logic here plus
 * the locale route blocks in app.routes.ts.
 */
export type Locale = 'en';

/** No URL-prefixed locales exist today. */
export type PrefixedLocale = never;

const SITE_ORIGIN = 'https://banskounlocked.com';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  constructor(private router: Router) {}

  current(): Locale {
    return 'en';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  localeFor(_url: string): Locale {
    return 'en';
  }

  htmlLang(): 'en-GB' {
    return 'en-GB';
  }

  ogLocale(): 'en_GB' {
    return 'en_GB';
  }

  /** No locale prefixes to strip — the path passes through unchanged. */
  stripLocale(pathOrUrl: string): string {
    return pathOrUrl.split(/[?#]/)[0];
  }

  /** Absolute canonical URL for a neutral path (English-only site). */
  canonicalFor(neutralPath: string, _locale: Locale = 'en'): string {
    const path = neutralPath.startsWith('/') ? neutralPath : `/${neutralPath}`;
    return `${SITE_ORIGIN}${path === '/' ? '/' : path}`;
  }

  /** Path-only — identity now that there are no prefixed mirrors. */
  localePath(neutralPath: string, _locale: Locale = 'en'): string {
    return neutralPath.startsWith('/') ? neutralPath : `/${neutralPath}`;
  }

  /** Identity — kept so existing `routerLink`/`navigate` call sites compile. */
  localizeLink<T extends string | any[] | null | undefined>(
    commands: T,
    _locale: Locale = 'en',
  ): T {
    return commands;
  }

  pathInLocale(_locale: Locale): string {
    return this.stripLocale(this.router.url);
  }

  togglePath(): string {
    return this.stripLocale(this.router.url);
  }

  /**
   * Hreflang set for a page: English self-reference + x-default (also English).
   * No alternate locales exist, so we never point at a route that 404s.
   */
  hreflangAlternates(
    neutralPath: string,
    _locales: ReadonlyArray<PrefixedLocale> = [],
  ): Array<{ hreflang: 'en' | 'x-default'; href: string }> {
    const en = this.canonicalFor(neutralPath, 'en');
    return [
      { hreflang: 'en', href: en },
      { hreflang: 'x-default', href: en },
    ];
  }
}
