import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { t } from '../../i18n';

@Component({
    selector: 'app-accommodation',
    imports: [CommonModule],
    templateUrl: './accommodation.component.html',
    styleUrl: './accommodation.component.scss'
})
export class AccommodationComponent implements OnInit {
  private loadedImages = new Set<string>();

  constructor(
    private seoService: SeoService,
    private localeService: LocaleService,
  ) {}

  /** Locale-aware page copy — resolves EN / DE / FR from i18n/{en,de,fr}.ts. */
  get copy() {
    return t(this.localeService.current()).pages.accommodation;
  }

  ngOnInit() {
    const locale = this.localeService.current();
    const meta = t(locale).meta.accommodation;
    const url = this.localeService.canonicalFor('/accommodation', locale);
    const homeUrl = this.localeService.canonicalFor('/', locale);

    this.seoService.updateMetaTags({
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      url,
      locale: this.localeService.ogLocale(),
    });
    this.seoService.addHreflangs(
      this.localeService.hreflangAlternates('/accommodation'),
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
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t(locale).chrome.nav.home, item: homeUrl },
          { '@type': 'ListItem', position: 2, name: t(locale).chrome.nav.accommodation, item: url },
        ],
      },
    ]);
  }

  onImageLoad(imageId: string): void {
    this.loadedImages.add(imageId);
  }

  onImageError(imageId: string): void {
    console.error(`Failed to load image: ${imageId}`);
  }

  isImageLoaded(imageId: string): boolean {
    return this.loadedImages.has(imageId);
  }
}
