/**
 * Lazy blog-post loaders for the home + about teasers.
 *
 * Those two pages only render 3 recent-post cards (metadata: title, date,
 * excerpt, image). A dynamic import() keeps the full article bodies off the
 * initial critical path — the data loads in its own on-demand chunk. The site
 * is English-only, so there is a single loader. Only type imports here (erased
 * at build), so importing this module pulls in zero post data eagerly.
 */
import type { Locale } from '../services/locale.service';
import type { BlogPost } from './blog-post.model';

const LOADERS: Record<Locale, () => Promise<BlogPost[]>> = {
  en: () => import('./blog-posts-en').then(m => m.BLOG_POSTS_EN),
};

/** Newest `count` posts for `locale`, newest first, falling back to EN if a
 *  locale's set is ever empty. */
export async function loadRecentBlogPosts(locale: Locale, count: number): Promise<BlogPost[]> {
  let posts = await LOADERS[locale]();
  if (!posts || posts.length === 0) posts = await LOADERS.en();
  return [...posts]
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, count);
}
