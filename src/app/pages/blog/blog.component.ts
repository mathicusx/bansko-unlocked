import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocaleRouterLink } from '../../directives/locale-router-link.directive';
import { BlogService } from '../../services/blog.service';
import { BlogPost } from '../../data/blog-posts';
import { SeoService } from '../../services/seo.service';
import { LocaleService, Locale } from '../../services/locale.service';
import { BLOG_UI, BlogUiCopy } from './blog.i18n';

@Component({
    selector: 'app-blog',
    imports: [CommonModule, RouterLink, LocaleRouterLink],
    templateUrl: './blog.component.html',
    styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  posts: BlogPost[] = [];
  ui: BlogUiCopy = BLOG_UI.en;

  constructor(
    private blogService: BlogService,
    private seoService: SeoService,
    private localeService: LocaleService,
  ) {}

  ngOnInit(): void {
    const locale = this.localeService.current();
    this.ui = BLOG_UI[locale];
    this.posts = this.blogService.getAll(locale);

    // The /blog listing is mirrored in EN/DE/FR/NL (each serves a localised
    // intro + its own post set), so it carries reciprocal hreflang for all four.
    // Individual posts do NOT carry cross-locale hreflang at all — they have
    // independent slugs per market — see blog-detail.component.ts.
    const canonical = this.localeService.canonicalFor('/blog', locale);

    this.seoService.updateMetaTags({
      title: this.ui.metaTitle,
      description: this.ui.metaDescription,
      keywords: this.ui.metaKeywords,
      url: canonical,
      locale: this.localeService.ogLocale(),
    });
    this.seoService.addHreflangs(this.localeService.hreflangAlternates('/blog'));

    this.seoService.addGraphSchemas([
      {
        '@type': 'Blog',
        '@id': `${canonical}#blog`,
        name: this.ui.blogName,
        description: this.ui.blogDescription,
        url: canonical,
        inLanguage: locale,
        publisher: { '@id': 'https://banskounlocked.com/#organization' },
        blogPost: this.posts.map(post => ({
          '@type': 'BlogPosting',
          '@id': `${this.postUrl(post.slug, locale)}#post`,
          headline: post.title,
          description: post.description,
          datePublished: post.publishedDate,
          url: this.postUrl(post.slug, locale),
          image: this.absoluteUrl(post.heroImage),
          author: { '@type': 'Organization', name: post.author ?? 'Enduro Brothers' },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: this.ui.breadcrumbHome, item: this.localeService.canonicalFor('/', locale) },
          { '@type': 'ListItem', position: 2, name: this.ui.breadcrumbBlog, item: canonical },
        ],
      },
    ]);
  }

  readingMinutes(post: BlogPost): number {
    return this.blogService.estimateReadingMinutes(post);
  }

  private postUrl(slug: string, locale: Locale): string {
    return this.localeService.canonicalFor(`/blog/${slug}`, locale);
  }

  private absoluteUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const stripped = path.startsWith('/') ? path.slice(1) : path;
    return `https://banskounlocked.com/${stripped}`;
  }
}
