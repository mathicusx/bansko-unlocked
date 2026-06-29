import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { LocaleService, Locale } from '../../services/locale.service';
import { LocaleRouterLink } from '../../directives/locale-router-link.directive';
import { t } from '../../i18n';

/**
 * Locale-invariant data for one difficulty tier. The per-locale copy (titles,
 * prose, terrain/rider bullets, recommended-tour names) lives in
 * `i18n/{en,de,fr}.ts` under `pages.difficultyLevels.levels` and is zipped onto
 * this by array index — keep both lists ordered beginner → advanced → pro.
 */
interface DifficultyLevelStatic {
  key: 'beginner' | 'advanced' | 'pro';
  badgeColor: string;
  image: string;
  /** Recommended-tour slugs, index-aligned with `recommendedTours` in i18n. */
  tourSlugs: string[];
}

@Component({
    selector: 'app-difficulty-levels',
    imports: [CommonModule, RouterLink, LocaleRouterLink],
    templateUrl: './difficulty-levels.component.html',
    styleUrl: './difficulty-levels.component.scss'
})
export class DifficultyLevelsComponent implements OnInit {
  /** Locale-invariant tier data. Order (beginner, advanced, pro) MUST match
   *  `pages.difficultyLevels.levels` in the i18n dictionaries — the `levels`
   *  getter merges the two arrays by index. */
  private readonly levelStatics: DifficultyLevelStatic[] = [
    {
      key: 'beginner',
      badgeColor: '#3fb56b',
      image: 'assets/enduro-gallery/enduro-50.jpg',
      tourSlugs: [
        'new-riders-trail-discovery',
        'weekend-wheels-adventure',
        'weeklong-adventure-retreat',
      ],
    },
    {
      key: 'advanced',
      badgeColor: '#e8a838',
      image: 'assets/enduro-gallery/enduro-22.jpg',
      tourSlugs: [
        'weekend-wheels-adventure',
        'weeklong-adventure-retreat',
        'new-riders-trail-discovery',
      ],
    },
    {
      key: 'pro',
      badgeColor: '#d6453a',
      image: 'assets/enduro-gallery/enduro-15.jpg',
      tourSlugs: ['pro-riders-3-day-expedition', 'weeklong-adventure-retreat'],
    },
  ];

  /** Contextual link to the no-licence landing page. Kept as a local locale map
   *  rather than a global i18n field — it's a single cross-link, not page copy,
   *  so it doesn't justify churning the shared DifficultyLevelsPageCopy type. */
  private static readonly NO_LICENCE_LABEL: Record<Locale, string> = {
    en: 'Complete beginner with no licence? Read our no-licence enduro holidays guide →',
    de: 'Kompletter Anfänger ohne Führerschein? Zum Guide für Enduro ohne Führerschein →',
    fr: 'Débutant complet sans permis ? Lisez notre guide enduro sans permis →',
    nl: 'Complete beginner zonder rijbewijs? Lees onze gids voor enduro zonder rijbewijs →',
  };

  constructor(
    private seoService: SeoService,
    private localeService: LocaleService,
  ) {}

  get noLicenceLabel(): string {
    return DifficultyLevelsComponent.NO_LICENCE_LABEL[this.localeService.current()];
  }

  /** Locale-aware page copy — resolves EN / DE / FR from i18n/{en,de,fr}.ts. */
  get copy() {
    return t(this.localeService.current()).pages.difficultyLevels;
  }

  private _levelsCache?: ReturnType<DifficultyLevelsComponent['buildLevels']>;
  private _levelsLocale?: Locale;

  /** Static tier data merged with the active-locale copy, ready for the
   *  template. Memoised per locale: a plain getter rebuilt the array (and every
   *  object in it) on EVERY change-detection pass, so the template `*ngFor` saw
   *  new identities each time and destroyed/recreated all the level <img>s —
   *  which re-decoded them. On iOS, where touch/scroll fire CD constantly, that
   *  flickered the images and pegged the main thread (page became unusable).
   *  Returning a stable reference per locale stops the churn. */
  get levels() {
    const locale = this.localeService.current();
    if (this._levelsCache && this._levelsLocale === locale) {
      return this._levelsCache;
    }
    this._levelsCache = this.buildLevels();
    this._levelsLocale = locale;
    return this._levelsCache;
  }

  private buildLevels() {
    const copy = this.copy;
    return this.levelStatics.map((stat, i) => {
      const c = copy.levels[i];
      return {
        ...stat,
        ...c,
        recommendedTours: stat.tourSlugs.map((slug, j) => ({
          slug,
          title: c.recommendedTours[j].title,
          duration: c.recommendedTours[j].duration,
        })),
      };
    });
  }

  /** Stable identity for the levels *ngFor so rows are never re-created. */
  trackByLevelKey(_index: number, level: { key: string }): string {
    return level.key;
  }

  /** Locale-aware `routerLink` targets so a click from /de or /fr keeps the
   *  prefix instead of dropping the rider back onto the English route. */
  get links() {
    const p = (path: string) => this.localeService.localePath(path);
    return {
      enduroTours: p('/enduro-tours'),
      contact: p('/contact'),
      noLicence: p('/no-licence-enduro-bulgaria'),
    };
  }

  /** Locale-aware detail link for a recommended tour. */
  tourLink(slug: string): string {
    return this.localeService.localePath(`/tour/${slug}`);
  }

  ngOnInit() {
    const locale = this.localeService.current();
    const meta = t(locale).meta.difficultyLevels;
    const copy = this.copy;
    const url = this.localeService.canonicalFor('/difficulty-levels', locale);
    const homeUrl = this.localeService.canonicalFor('/', locale);
    const toursUrl = this.localeService.canonicalFor('/enduro-tours', locale);

    this.seoService.updateMetaTags({
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      url,
      locale: this.localeService.ogLocale(),
    });
    this.seoService.addHreflangs(
      this.localeService.hreflangAlternates('/difficulty-levels'),
    );

    this.seoService.addGraphSchemas([
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: meta.title,
        description: meta.description,
        url,
        inLanguage: this.localeService.htmlLang(),
        isPartOf: { '@id': 'https://banskounlocked.com/#website' },
        publisher: { '@id': 'https://banskounlocked.com/#organization' },
      },
      this.seoService.getBreadcrumbSchema([
        { name: t(locale).chrome.nav.home, url: homeUrl },
        { name: t(locale).chrome.nav.enduroTours, url: toursUrl },
        { name: copy.breadcrumb, url },
      ]),
      this.seoService.getFAQSchema(copy.faqs),
    ]);
  }
}
