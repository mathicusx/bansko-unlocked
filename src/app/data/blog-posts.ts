/**
 * Blog post aggregator. Posts live in per-locale files; this module exposes a
 * locale → posts map plus the lookup helpers the BlogService and the blog
 * components use. The site is English-only today, so there is a single EN set.
 *
 * Adding a post: append to blog-posts-en.ts, then rerun
 * `npm run generate:sitemap`.
 */
import type { Locale } from '../services/locale.service';
import type { BlogPost } from './blog-post.model';
import { BLOG_POSTS_EN } from './blog-posts-en';

export type { BlogPost } from './blog-post.model';

/** All posts keyed by locale. English-only for now. */
export const BLOG_POSTS_BY_LOCALE: Record<Locale, BlogPost[]> = {
  en: BLOG_POSTS_EN,
};

/** Posts for the given locale, falling back to EN if a locale is ever empty. */
export function getBlogPosts(locale: Locale): BlogPost[] {
  const posts = BLOG_POSTS_BY_LOCALE[locale];
  return posts && posts.length > 0 ? posts : BLOG_POSTS_EN;
}

/** Fast lookup by slug, scoped to a locale's post set. */
export function findBlogPostBySlug(slug: string, locale: Locale): BlogPost | undefined {
  return getBlogPosts(locale).find(post => post.slug === slug);
}
