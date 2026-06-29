# Bansko Unlocked — project instructions for Claude

Angular 19 SSR-prerendered **static** site for **Bansko Unlocked** — adventure activities in
Bansko, Bulgaria (Pirin Mountains): **ATV & Buggy Tours, Shooting Range, Mountain Camping,
Snow Riding**. English-only. Deployed as static files to **Cloudflare Pages**.

This is a fork of the former "Enduro Brothers Bulgaria" enduro-tours site, transformed in 2026.
A lot of the original infrastructure is reused; some is intentionally **dormant** (see below).

---

## What this site is (and isn't)

- **Static brochure site.** No live API, no database, no booking engine at runtime. All content
  is hand-authored in TypeScript data files and prerendered to static HTML.
- **English only.** The previous de/fr/nl localisation was stripped. `LocaleService` still exists
  (so components compile) but every method is the English identity; `Locale = 'en'`.
- **Lead capture** = Resend-backed contact form + WhatsApp/email/phone links. The contact form
  POSTs to `environment.apiUrl` (a placeholder until a backend is wired — expect a 404 until then).

### Dormant — present but not wired (do NOT delete; may revive)
- **`server/`** — the NestJS backend (tours API, bookings, contact/Resend). Kept for a future
  backend; not used by the static build.
- **Enduro/Buggy itinerary system** — `pages/booking` (enduro-tours), `pages/buggy-tours`,
  `pages/tour-detail`, `pages/buggy-tour-detail`, `pages/difficulty-levels`, `pages/no-licence`,
  `pages/accommodation`, plus `tour.service`, `buggy-tour.service`, `fallback-tours`,
  `tour-translations`, admin pages. **Commented out of `app.routes.ts`**, removed from the nav
  and sitemap. The files still compile. Revive by uncommenting the route + re-adding the nav link
  + sitemap entry. (We may bring back multi-day itinerary packages later.)

---

## Core content model

- **Activities** live in [src/app/data/activities.data.ts](src/app/data/activities.data.ts)
  (`ACTIVITIES: Activity[]`). Each renders a card on Home + `/activities`, and a full landing
  page at `/activities/:slug` via [ActivityComponent](src/app/pages/activity/activity.component.ts).
  **Add an activity** = append an entry, then `npm run generate:sitemap`.
- **Reviews** — [src/app/data/reviews.data.ts](src/app/data/reviews.data.ts). Currently empty
  (the old enduro testimonials were removed). Add real Bansko Unlocked reviews here; the
  aggregateRating schema + /reviews page + home embed all key off this array and gracefully
  handle empty.
- **Blog** — [src/app/data/blog-posts-en.ts](src/app/data/blog-posts-en.ts). Currently empty.
  Add posts here, then `npm run generate:sitemap`. The /blog system + home/about teasers handle
  empty (they hide when there are no posts).
- **i18n copy** — even though the site is English-only, page/chrome copy still lives in
  [src/app/i18n/en.ts](src/app/i18n/en.ts) behind `t('en')`. Edit copy there.

---

## Branding

- Name: **Bansko Unlocked**. Domain placeholder: `https://banskounlocked.com` —
  **confirm + replace before deploy** (appears in `index.html`, `seo.service.ts`,
  `generate-sitemap.mjs` `SITE`, `robots.txt`, `llms.txt`, component schemas).
- Palette: **Glacier Teal + Navy** — brand tokens in
  [src/app/shared/styles/_themes.scss](src/app/shared/styles/_themes.scss) (`--brand-primary`
  `#0fb5b5` etc.). Light/dark theme switch preserved. **Primary buttons = teal background with
  fixed dark-navy text** (`#0b1f2a`) — never a theme-flipping `--text-inverse` (white-on-teal
  fails contrast). See `themed-button` in `_mixins.scss`.
- Logo: a **text wordmark** in the navbar (`app.component.html`). Swap for a real logo image
  (`app.component.ts` `logoUrl`) when one exists.

---

## Standing rules

- **Routes:** every public route must be prerendered. Routes are in `app.routes.ts`; the
  prerender list + sitemap are **auto-generated** by
  [scripts/generate-sitemap.mjs](scripts/generate-sitemap.mjs) (reads activity + blog slugs from
  the data files). Never hand-edit `src/sitemap.xml` / `prerender-routes.txt` — rerun
  `npm run generate:sitemap`. The `**` wildcard route serves `NotFoundComponent` (`noindex`).
- **Meta/SEO:** every page sets title + description via `SeoService.updateMetaTags()` in
  `ngOnInit`, with a single static keyworded `<h1>`. Components embedded in another page
  (`FaqComponent` on home, `GalleryComponent` on about, `ReviewsComponent`) guard their SEO
  injection with `this.router.url.split(/[?#]/)[0]` (NOT `document.location.pathname`, which is
  `/` during prerender).
- **Schema:** use `seoService.addGraphSchemas([...])` to stack JSON-LD (calling
  `addStructuredData` twice clobbers the slot). The static `@graph` in `src/index.html` carries
  the Organization/WebSite/TravelAgency nodes under `https://banskounlocked.com/#…` `@id`s;
  dynamic nodes merge by `@id`. Only emit `aggregateRating` when reviews actually exist.
- **Images:** descriptive `alt` on every `<img>`; `loading="lazy"` + `decoding="async"`
  below-the-fold. Cloudinary pipeline via `optimize` / `srcset` pipes
  ([pipes/optimize-image.pipe.ts](src/app/pipes/optimize-image.pipe.ts)). **Many images are still
  placeholders reused from `assets/enduro-gallery/` — replace with real Bansko photos** (the
  asset folder name is cosmetic; alt text has been genericised).
- **Page styling:** import `../../shared/styles/mixins`; use the mixins (`bg-primary`,
  `themed-card`, `themed-button`, `text-secondary`, `mobile`, `tablet`) rather than hand-rolling
  theme variables. Activity pages follow the photo-hero + themed-card convention.

---

## Deploy (Cloudflare Pages)

- Build: `npm run build` → output dir **`dist/bansko-unlocked/browser`** (deploy this folder).
- `public/_redirects` (admin SPA handoff + `/* → /404.html 404`) and `public/_headers`
  (asset caching) are copied to the output root for Cloudflare Pages.
- The SSR server bundle and `server/` (NestJS) are not deployed for the static site.
- `netlify.toml` is legacy (previous host) — harmless, ignored by Cloudflare.

### Pre-launch checklist
- [ ] Replace the `banskounlocked.com` placeholder domain everywhere if the real domain differs.
- [ ] Add a real logo asset + real activity/hero photos (esp. shooting-range & snow-riding).
- [ ] Fill in real activity copy/prices in `activities.data.ts`.
- [ ] Wire the contact form endpoint (Resend) via `environment.prod.ts` `apiUrl`.
- [ ] Set GA4 / Meta Pixel IDs in `src/index.html` (currently the old enduro IDs — replace or remove).
- [ ] Set real GSC verification token (`index.html`), social URLs (`footer.component.ts`),
      and Instagram handle (`instagram-feed.ts`) once they exist.
