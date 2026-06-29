/**
 * Instagram feed data — the static, build-time snapshot rendered by
 * InstagramFeedComponent on the home and about pages.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * HOW THIS FILE IS MAINTAINED
 * ──────────────────────────────────────────────────────────────────────────
 * `scripts/generate-instagram.mjs` (a `prebuild` step, like generate-sitemap)
 * REGENERATES the `INSTAGRAM_FEED` array below at build time when an
 * `IG_ACCESS_TOKEN` env var is present. It pulls the latest posts from the
 * Instagram Graph API, downloads + compresses each thumbnail into the
 * gitignored `src/assets/instagram/` folder, and rewrites the array so every
 * `image` points at a LOCAL asset (never an fbcdn URL — those are signed with
 * expiring tokens and 403 after a few weeks; CLAUDE.md "Never hotlink Facebook
 * CDN URLs").
 *
 * The hand-authored array below is the COMMITTED FALLBACK: it ships in git so
 * local dev and any build without a token still render a real, on-brand feed.
 * It deliberately uses existing optimised gallery images and links to the
 * profile (not individual posts) because we don't have permalinks offline.
 *
 * Do not paste fbcdn / scontent.*.fbcdn.net URLs into `image` by hand.
 */
import type { Locale } from '../services/locale.service';

export type InstagramMediaType = 'image' | 'video' | 'carousel';

export interface InstagramPost {
  /** Local thumbnail path under /assets (generated at build OR committed fallback). */
  image: string;
  /** Alt text — describes the shot; the generator derives it from the caption. */
  alt: string;
  /** Link out to the original Instagram post (or the profile, for fallbacks). */
  permalink: string;
  /** Short caption excerpt, used for the hover/focus overlay. Optional. */
  caption?: string;
  /** Media kind — drives the little play / carousel glyph. */
  type?: InstagramMediaType;
}

/** Public profile URL — the "Follow" CTA target and the fallback permalink.
 *  TODO(deploy): set the Bansko Unlocked Instagram once it exists. */
export const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/';
export const INSTAGRAM_HANDLE = '@banskounlocked';

/**
 * Committed fallback feed. Six authentic ride photos already in the optimised
 * gallery (the `-md.webp` medium variant keeps the grid light). Overwritten by
 * the generator on a tokened build.
 *
 * Everything between the BEGIN/END markers below is rewritten in place by
 * `scripts/generate-instagram.mjs` — do not reformat the markers.
 */
// <<INSTAGRAM_FEED:BEGIN>>
export const INSTAGRAM_FEED: InstagramPost[] = [
  {
    image: 'assets/enduro-gallery/enduro-30-md.webp',
    alt: 'Enduro rider on forest singletrack in the Pirin Mountains, Bulgaria',
    permalink: INSTAGRAM_PROFILE_URL,
    caption: 'Pirin singletrack',
    type: 'image',
  },
  {
    image: 'assets/enduro-gallery/enduro-12-md.webp',
    alt: 'Group of enduro riders pausing on a mountain trail above Bansko',
    permalink: INSTAGRAM_PROFILE_URL,
    caption: 'Trail break above Bansko',
    type: 'image',
  },
  {
    image: 'assets/enduro-gallery/enduro-45-md.webp',
    alt: 'GASGAS enduro bike on a rocky climb in the Bulgarian mountains',
    permalink: INSTAGRAM_PROFILE_URL,
    caption: 'Rocky climb',
    type: 'image',
  },
  {
    image: 'assets/enduro-gallery/enduro-7-md.webp',
    alt: 'Enduro rider crossing a mountain stream on a guided tour in Bulgaria',
    permalink: INSTAGRAM_PROFILE_URL,
    caption: 'Stream crossing',
    type: 'image',
  },
  {
    image: 'assets/enduro-gallery/enduro-60-md.webp',
    alt: 'Panoramic ridge view with enduro bikes in the Pirin range',
    permalink: INSTAGRAM_PROFILE_URL,
    caption: 'Ridge views',
    type: 'image',
  },
  {
    image: 'assets/enduro-gallery/enduro-22-md.webp',
    alt: 'Riders on Husqvarna and GASGAS enduros on a forest track in Bulgaria',
    permalink: INSTAGRAM_PROFILE_URL,
    caption: 'Forest track',
    type: 'image',
  },
];

/** `true` when the feed above is the hand-authored fallback (no live build yet).
 *  The generator flips this to `false` so the component can hide per-post
 *  permalink clicks that all point at the profile. */
export const INSTAGRAM_FEED_IS_FALLBACK = true;
// <<INSTAGRAM_FEED:END>>

/** Feature-local UI copy, per locale — kept out of the global i18n dict, same
 *  rationale as blog.i18n.ts (it's only used by InstagramFeedComponent). */
export interface InstagramUiCopy {
  heading: string;
  lede: string;
  follow: string;
  /** Aria label for a tile link. `{caption}` is replaced at runtime. */
  viewAria: string;
}

export const INSTAGRAM_UI: Record<Locale, InstagramUiCopy> = {
  en: {
    heading: 'Follow the adventures',
    lede: 'Fresh from the mountains — recent shots from our activities around Bansko.',
    follow: 'Follow on Instagram',
    viewAria: 'View “{caption}” on Instagram',
  },
};
