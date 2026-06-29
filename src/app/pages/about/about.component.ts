import { Component, OnInit, inject, PendingTasks } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GalleryComponent } from '../gallery/gallery.component';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { LocaleRouterLink } from '../../directives/locale-router-link.directive';
import { t } from '../../i18n';
import type { BlogPost } from '../../data/blog-post.model';
import { loadRecentBlogPosts } from '../../data/blog-posts-lazy';

@Component({
    selector: 'app-about',
    imports: [GalleryComponent, RouterLink, LocaleRouterLink, DatePipe],
    templateUrl: './about.component.html',
    styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit {
  /** Newest 3 posts in the active locale — populated in ngOnInit so the blog
   *  teaser shows German posts on /de/about, French on /fr/about, etc. */
  recentPosts: BlogPost[] = [];

  /** Keeps the app "unstable" until the lazy blog teaser resolves, so the
   *  prerenderer ships the teaser cards in the static HTML. */
  private pendingTasks = inject(PendingTasks);

  /** Locale-aware page copy — resolves EN or DE from i18n/{en,de}.ts. */
  get copy() {
    return t(this.localeService.current()).pages.about;
  }

  constructor(
    private seoService: SeoService,
    private localeService: LocaleService,
  ) {}

  ngOnInit() {
    const locale = this.localeService.current();
    // Lazy per-locale load keeps blog bodies out of the initial bundle;
    // PendingTasks makes the prerenderer await the teaser data.
    this.pendingTasks.run(async () => {
      this.recentPosts = await loadRecentBlogPosts(locale, 3);
    });
    const meta = t(locale).meta.about;
    const url = this.localeService.canonicalFor('/about', locale);
    const homeUrl = this.localeService.canonicalFor('/', locale);

    this.seoService.updateMetaTags({
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      url,
      locale: this.localeService.ogLocale(),
    });
    this.seoService.addHreflangs(this.localeService.hreflangAlternates('/about'));

    this.seoService.addGraphSchemas([
      {
        '@type': 'AboutPage',
        '@id': `${url}#webpage`,
        name: meta.title,
        description: meta.description,
        url,
        inLanguage: this.localeService.htmlLang(),
        isPartOf: { '@id': 'https://banskounlocked.com/#website' },
        publisher: { '@id': 'https://banskounlocked.com/#organization' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: 'About', item: url },
        ],
      },
    ]);
  }
}
