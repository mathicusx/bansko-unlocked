import { Component } from '@angular/core';
import { SeoService } from '../../services/seo.service';

@Component({
    selector: 'app-enduro-tours',
    imports: [],
    templateUrl: './enduro-tours.component.html',
    styleUrl: './enduro-tours.component.scss'
})
export class EnduroToursComponent {
  constructor(private seoService: SeoService) {}

  ngOnInit() {
    // EN-only. Localised /bg/, /de/, /pl/, /ro/, /ru/ routes don't exist —
    // emitting their SEO data would hreflang to wildcard-404s (see CLAUDE.md).
    const meta = {
      title: 'Enduro Tours Bansko Bulgaria | 2026 GASGAS & Husqvarna, No Licence',
      description: 'Guided enduro tours from Bansko, Bulgaria — Pirin, Rila & Rhodope singletrack, river crossings & forest trails on 2026 GASGAS & Husqvarna bikes. All levels, no licence needed.',
      keywords: 'enduro tours Bulgaria, no licence enduro Bansko, no license enduro Bansko, guided enduro tour Bulgaria, GASGAS enduro Bansko, Husqvarna enduro Pirin, beginner enduro Bulgaria, Pirin Mountains enduro',
      url: 'https://banskounlocked.com/enduro-tours',
      locale: 'en_GB'
    };
    this.seoService.updateMetaTags(meta);

    // CollectionPage + ItemList schema for Google rich results
    this.seoService.addStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': 'https://banskounlocked.com/enduro-tours#webpage',
          'name': meta.title,
          'description': meta.description,
          'url': 'https://banskounlocked.com/enduro-tours',
          'inLanguage': meta.locale.replace('_', '-'),
          'publisher': {
            '@type': 'Organization',
            'name': 'Enduro Brothers Bulgaria',
            'url': 'https://banskounlocked.com/'
          }
        },
        {
          '@type': 'ItemList',
          'name': 'Enduro Tours - Enduro Brothers Bulgaria',
          'description': 'All available guided enduro motorcycle tours in Bansko & Pirin Mountains, Bulgaria',
          'url': 'https://banskounlocked.com/enduro-tours',
          'itemListOrder': 'https://schema.org/ItemListOrderAscending',
          'numberOfItems': 6,
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Weekend Wheels Adventure — 2-Day Bansko Enduro',
              'url': 'https://banskounlocked.com/tour/weekend-wheels-adventure'
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': 'Pro Rider 3-Day Expedition',
              'url': 'https://banskounlocked.com/tour/pro-riders-3-day-expedition'
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': 'New Riders Trail Discovery',
              'url': 'https://banskounlocked.com/tour/new-riders-trail-discovery'
            },
            {
              '@type': 'ListItem',
              'position': 4,
              'name': 'Weeklong Adventure Retreat — 7-Day Tour',
              'url': 'https://banskounlocked.com/tour/weeklong-adventure-retreat'
            },
            {
              '@type': 'ListItem',
              'position': 5,
              'name': 'Four Days Riding Adventure',
              'url': 'https://banskounlocked.com/tour/four-days-riding-adventure'
            },
            {
              '@type': 'ListItem',
              'position': 6,
              'name': 'Two Days Riding Adventure',
              'url': 'https://banskounlocked.com/tour/two-days-riding-adventure'
            }
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://banskounlocked.com/' },
            { '@type': 'ListItem', position: 2, name: 'Enduro Tours', item: 'https://banskounlocked.com/enduro-tours' },
          ]
        }
      ]
    });
  }
}
