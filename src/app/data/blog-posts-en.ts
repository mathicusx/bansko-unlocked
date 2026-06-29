/**
 * English blog posts. Served at /blog and /blog/:slug.
 * Each post is the canonical, indexable copy that lives on our domain.
 *
 * Adding a post: append an entry here, then rerun `npm run generate:sitemap`
 * (the prebuild step reads slugs straight out of this file).
 * Keep `slug` URL-safe (kebab-case, lowercase). Order: most recent first.
 *
 * Empty for the Bansko Unlocked launch — the previous enduro articles were
 * removed during the rebrand. Write Bansko activity / "things to do in Bansko"
 * posts here over time (the blog listing shows an empty-state until then).
 */
import type { BlogPost } from './blog-post.model';

export const BLOG_POSTS_EN: BlogPost[] = [];
