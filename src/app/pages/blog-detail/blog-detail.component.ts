import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LocaleService, Locale } from '../../services/locale.service';
import { LocaleRouterLink } from '../../directives/locale-router-link.directive';
import { BlogService } from '../../services/blog.service';
import { BlogPost } from '../../data/blog-posts';
import { SeoService } from '../../services/seo.service';
import { BLOG_UI, BlogUiCopy } from '../blog/blog.i18n';

@Component({
    selector: 'app-blog-detail',
    imports: [CommonModule, RouterLink, LocaleRouterLink],
    templateUrl: './blog-detail.component.html',
    styleUrl: './blog-detail.component.scss'
})
export class BlogDetailComponent implements OnInit {
  post?: BlogPost;
  bodyHtml: SafeHtml = '';
  readingMinutes = 0;
  notFound = false;
  ui: BlogUiCopy = BLOG_UI.en;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private seoService: SeoService,
    private sanitizer: DomSanitizer,
    private localeService: LocaleService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const locale = this.localeService.current();
      this.ui = BLOG_UI[locale];
      const slug = params.get('slug') ?? '';
      const post = this.blogService.getBySlug(slug, locale);
      if (!post) {
        this.notFound = true;
        this.seoService.updateMetaTags({
          title: this.ui.notFoundMetaTitle,
          description: this.ui.notFoundMetaDescription,
          url: this.localeService.canonicalFor('/blog', locale),
          robots: 'noindex, nofollow',
        });
        return;
      }

      this.post = post;
      this.bodyHtml = this.sanitizer.bypassSecurityTrustHtml(post.body);
      this.readingMinutes = this.blogService.estimateReadingMinutes(post);
      this.applySeo(post, locale);

      // Scroll to top on navigation between posts (browser only).
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    });
  }

  private applySeo(post: BlogPost, locale: Locale): void {
    const canonical = this.localeService.canonicalFor(`/blog/${post.slug}`, locale);
    const heroImageUrl = this.absoluteUrl(post.heroImage);
    const author = post.author ?? 'Enduro Brothers';

    this.seoService.updateMetaTags({
      title: `${post.title} | Bansko Unlocked`,
      description: post.description,
      url: canonical,
      image: heroImageUrl,
      imageAlt: post.heroAlt,
      type: 'article',
      locale: this.localeService.ogLocale(),
    });

    // Per-locale blogs are SEPARATE, not translations — a /de or /fr post has
    // no EN equivalent slug. So we emit NO cross-locale hreflang here (only the
    // /blog listing is mirrored). Pass [] purely to clear any stale hreflang
    // links left over from a previous route (the listing emits a full set).
    this.seoService.addHreflangs([]);

    this.seoService.addGraphSchemas([
      {
        '@type': 'BlogPosting',
        '@id': `${canonical}#post`,
        headline: post.title,
        description: post.description,
        datePublished: post.publishedDate,
        dateModified: post.publishedDate,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        image: { '@type': 'ImageObject', url: heroImageUrl, caption: post.heroAlt },
        author: { '@type': 'Organization', name: author, url: 'https://banskounlocked.com/' },
        publisher: { '@id': 'https://banskounlocked.com/#organization' },
        inLanguage: locale,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: this.ui.breadcrumbHome, item: this.localeService.canonicalFor('/', locale) },
          { '@type': 'ListItem', position: 2, name: this.ui.breadcrumbBlog, item: this.localeService.canonicalFor('/blog', locale) },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
        ],
      },
    ]);
  }

  private absoluteUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const stripped = path.startsWith('/') ? path.slice(1) : path;
    return `https://banskounlocked.com/${stripped}`;
  }

  // Post bodies render via [innerHTML], so embedded <a href="/internal"> links
  // would trigger a full page reload. Intercept same-origin anchor clicks and
  // route via the Router. External (http/https) and mailto links fall through.
  onBodyClick(event: MouseEvent) {
    const target = (event.target as HTMLElement | null)?.closest('a');
    if (!target) return;
    const href = target.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    event.preventDefault();
    // Keep the rider in their locale — a body link authored as `/enduro-tours`
    // becomes `/de/enduro-tours` when read from a /de post (and `/blog/<slug>`
    // becomes `/de/blog/<slug>` — see LocaleService.MIRRORED_DYNAMIC_PREFIXES).
    this.router.navigateByUrl(this.localeService.localizeLink(href));
  }
}
