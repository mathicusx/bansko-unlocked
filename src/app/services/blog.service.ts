import { Injectable } from '@angular/core';
import { BlogPost, getBlogPosts, findBlogPostBySlug } from '../data/blog-posts';
import { Locale } from './locale.service';

@Injectable({ providedIn: 'root' })
export class BlogService {
  /** All posts for `locale`, newest first by publishedDate. */
  getAll(locale: Locale): BlogPost[] {
    return [...getBlogPosts(locale)].sort(
      (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(),
    );
  }

  getBySlug(slug: string, locale: Locale): BlogPost | undefined {
    return findBlogPostBySlug(slug, locale);
  }

  /** Reading time estimate based on body length. Cheap approximation. */
  estimateReadingMinutes(post: BlogPost): number {
    const wordCount = post.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(wordCount / 220));
  }
}
