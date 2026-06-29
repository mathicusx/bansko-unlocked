import { isDevMode } from '@angular/core';
import type { Locale } from '../../services/locale.service';
import type { Tour } from '../../services/tour.service';

/**
 * Tour-content translation overlay.
 *
 * Tours are served from the API in English — the source of truth. For a
 * non-English locale we keep fetching the English tour (so prices, dates,
 * `slug` and every Cloudinary `image` URL stay live) and overlay ONLY the
 * translatable text on top. See `localizeTour`.
 *
 * Adding a language is gated on file existence, exactly like `i18n/`:
 *   1. add the code to `Locale` in services/locale.service.ts
 *   2. create its page dictionary `i18n/<code>.ts`
 *   3. create its tour overlay `tour-translations/<code>.ts`
 *   4. register it in `TOUR_OVERLAYS` below
 * A locale with no overlay file simply has no tour translations — and
 * `isLanguagePublished` returns false for it, so nothing is shown or linked.
 */

/** One translated itinerary day. Positionally matched to the API tour's
 *  `tourDetails[]` (index 0 = day 1). `day` and `image` are deliberately
 *  absent — they always come from the live API object. */
export interface TourDayTranslation {
  title: string;
  description: string;
}

/** Translated text for one tour, keyed by `slug` in the per-locale file.
 *  Text fields only — never `image`, price, date or `slug`. `difficulty`
 *  is omitted on purpose: the tier names (Beginner/Advanced/Pro) are a
 *  fixed enum, mapped via the page dictionary, not free text. */
export interface TourTranslation {
  /** Language publish gate — the per-tour, per-language equivalent of
   *  `Tour.published`. `false` = the translation exists in the repo but the
   *  tour stays English-only on this locale's routes (drafted, not shown).
   *  Flip to `true` to release it. */
  published: boolean;
  title: string;
  description: string;
  promo?: string;
  duration: string;
  durationDetails: string;
  averageDistance: string;
  promoBookingPeriod?: string;
  tourDetails: TourDayTranslation[];
}

/** Per-locale overlays. `en` is intentionally absent — English is the source.
 *  Empty now that the site is English-only (the de/fr/nl overlays were removed);
 *  re-add entries here if a localised tour overlay is reintroduced. */
const TOUR_OVERLAYS: Partial<Record<Locale, Record<string, TourTranslation>>> = {};

/**
 * Is `slug` released in `locale`? `en` is always true (the API source). Any
 * other locale is true when an overlay entry exists AND it is released.
 *
 * DEV PREVIEW: under `ng serve`, `isDevMode()` is true, so an unpublished
 * entry still counts as released — draft translations are visible on
 * localhost. A production `ng build` runs `enableProdMode()` → `isDevMode()`
 * is false → the `published` flag is strictly enforced and drafts never
 * reach the live site. Drives the tour-listing filter, the per-tour route
 * gate and the sitemap / hreflang emission.
 */
export function isLanguagePublished(_slug: string, _locale: Locale): boolean {
  // English-only site — every tour is "published" in the only locale. (When
  // localisation returns, gate non-EN locales on TOUR_OVERLAYS as before.)
  return true;
}

/**
 * Returns `tour` with its text fields overlaid in `locale`. If the locale is
 * `en`, or the tour has no released translation, the tour is returned
 * unchanged (English) — a safe graceful fallback that never throws. Images,
 * prices, dates and `slug` always pass through untouched from the API object.
 * Drafts are overlaid under `ng serve` for preview but not in a prod build —
 * see `isLanguagePublished`.
 */
export function localizeTour(tour: Tour, _locale: Locale): Tour {
  // English-only site — no overlay, the tour is returned unchanged. (When
  // localisation returns, overlay TOUR_OVERLAYS[locale][slug] as before.)
  return tour;
}
