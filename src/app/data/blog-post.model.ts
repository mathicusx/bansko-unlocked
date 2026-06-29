/**
 * Shared shape for a static blog post. The actual post arrays live in
 * per-locale files (`blog-posts-en.ts`, `blog-posts-de.ts`, `blog-posts-fr.ts`)
 * and are aggregated by `blog-posts.ts`. The interface lives here on its own so
 * the locale data files can `import type` it without a runtime import cycle.
 */
export interface BlogPost {
  /** URL slug. Must match the path segment after /blog/ (or /de/blog/, /fr/blog/). */
  slug: string;
  /** Page <title> and <h1>. Keep under 65 chars for SERP display. */
  title: string;
  /** Meta description + listing-card excerpt. 150-160 chars ideal. */
  description: string;
  /** Hero image URL — relative path under /assets or full Cloudinary URL. */
  heroImage: string;
  /** Alt text for hero image. Describe the scene, include keywords naturally. */
  heroAlt: string;
  /** ISO 8601 publish date, e.g. '2026-04-15'. Used for sort + Article schema. */
  publishedDate: string;
  /** Main body — HTML string. Use <h2>, <h3>, <p>, <ul>, <a>, <img> as needed.
   *  Internal links author neutral paths (`/enduro-tours`, `/blog/<slug>`); the
   *  blog-detail click handler localises them to the active locale at runtime. */
  body: string;
  /** Optional: original Facebook post URL — shown as "Originally posted on Facebook" footer. */
  facebookUrl?: string;
  /** Optional: tour IDs to surface as "related tours" at the bottom of the post. */
  relatedTourIds?: string[];
  /** Optional: author display name. Defaults to "Enduro Brothers". */
  author?: string;
}
