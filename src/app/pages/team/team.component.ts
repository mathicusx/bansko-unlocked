import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { LocaleRouterLink } from '../../directives/locale-router-link.directive';
import { t } from '../../i18n';

@Component({
    selector: 'app-team',
    imports: [CommonModule, RouterLink, LocaleRouterLink],
    templateUrl: './team.component.html',
    styleUrl: './team.component.scss'
})
export class TeamComponent implements OnInit {
  /** Locale-aware page copy — resolves EN, DE or FR from i18n/{en,de,fr}.ts. */
  get copy() {
    return t(this.localeService.current()).pages.team;
  }

  /** Locale-aware `routerLink` targets so the CTAs keep the /de or /fr prefix
   *  instead of bouncing the rider back to the English route. */
  get links() {
    const p = (path: string) => this.localeService.localePath(path);
    return {
      newRidersTour: p('/activities/atv-buggy-tours'),
      proRidersTour: p('/activities/snow-riding'),
      enduroTours: p('/activities'),
      accommodation: p('/contact'),
    };
  }

  constructor(
    private seoService: SeoService,
    private localeService: LocaleService,
  ) {}

  ngOnInit(): void {
    const locale = this.localeService.current();
    const meta = t(locale).meta.team;
    const url = this.localeService.canonicalFor('/team', locale);
    const homeUrl = this.localeService.canonicalFor('/', locale);
    const inLang = this.localeService.htmlLang();

    this.seoService.updateMetaTags({
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      image: 'https://banskounlocked.com/assets/team/ibrahim.jpeg',
      imageAlt: 'Ibrahim, founder of Bansko Unlocked, in the Pirin Mountains near Bansko',
      url,
      locale: this.localeService.ogLocale(),
      type: 'profile',
    });
    this.seoService.addHreflangs(this.localeService.hreflangAlternates('/team'));

    // Person entities use stable @ids that don't carry the locale prefix — the
    // guides are the same humans regardless of which language page references
    // them, and Google merges by @id. Verification debt per CLAUDE.md: credential
    // text in the descriptions below (Ibrahim 15yr, Funi Nice 20yr) needs
    // factual review before relying on rich Knowledge-Graph rendering.
    this.seoService.addGraphSchemas([
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        'name': meta.title,
        'description': 'Meet the team behind Bansko Unlocked: Ibrahim, Medy, Funi and Funi Nice. Every activity is led by our local guides.',
        'url': url,
        'inLanguage': inLang,
        'isPartOf': { '@id': 'https://banskounlocked.com/#website' },
        'about': { '@id': 'https://banskounlocked.com/#organization' }
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': homeUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Our Team', 'item': url }
        ]
      },
      {
        '@type': 'Person',
        '@id': 'https://banskounlocked.com/team#ibrahim',
        'name': 'Ibrahim',
        'jobTitle': 'Founder & Owner',
        'description': 'Ibrahim is the founder of Bansko Unlocked with more than 15 years exploring the Balkan mountains. He looks after the equipment and logistics for every activity.',
        'image': 'https://banskounlocked.com/assets/team/ibrahim.jpeg',
        'worksFor': { '@id': 'https://banskounlocked.com/#organization' },
        'knowsAbout': [
          'Adventure Activities',
          'ATV & Buggy Tours',
          'Pirin Mountains',
          'Mountain Camping',
          'Bansko Tourism'
        ],
        'sameAs': ['https://www.facebook.com/ibrahim.bimbashov'],
        'nationality': { '@type': 'Country', 'name': 'Bulgaria' },
        'workLocation': {
          '@type': 'Place',
          'name': 'Bansko, Pirin Mountains, Bulgaria',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Bansko',
            'addressRegion': 'Blagoevgrad Province',
            'addressCountry': 'BG'
          }
        }
      },
      {
        '@type': 'Person',
        '@id': 'https://banskounlocked.com/team#medy',
        'name': 'Medy',
        'jobTitle': 'Activity Guide',
        'description': 'Medy has over 10 years of experience in the mountains and is known for his calm, safety-first approach. He specialises in helping guests build confidence and have a great time.',
        'image': 'https://banskounlocked.com/assets/team/medy.jpeg',
        'worksFor': { '@id': 'https://banskounlocked.com/#organization' },
        'knowsAbout': [
          'Adventure Activities',
          'Mountain Guiding',
          'Guest Safety',
          'Pirin Mountains'
        ],
        'sameAs': ['https://www.facebook.com/vlubeno.momce'],
        'nationality': { '@type': 'Country', 'name': 'Bulgaria' },
        'workLocation': {
          '@type': 'Place',
          'name': 'Bansko, Pirin Mountains, Bulgaria',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Bansko',
            'addressRegion': 'Blagoevgrad Province',
            'addressCountry': 'BG'
          }
        }
      },
      {
        '@type': 'Person',
        '@id': 'https://banskounlocked.com/team#funi',
        'name': 'Funi',
        'jobTitle': 'Activity Guide',
        'description': 'Funi has more than 10 years in the mountains and brings great energy to every day out. He is known for his positive attitude and his ability to adapt the day to mixed groups.',
        'image': 'https://banskounlocked.com/assets/team/funi.jpeg',
        'worksFor': { '@id': 'https://banskounlocked.com/#organization' },
        'knowsAbout': [
          'Adventure Activities',
          'Forest Trails',
          'Mountain Guiding',
          'Pirin Mountains'
        ],
        'sameAs': ['https://www.facebook.com/abgiovavaide'],
        'nationality': { '@type': 'Country', 'name': 'Bulgaria' },
        'workLocation': {
          '@type': 'Place',
          'name': 'Bansko, Pirin Mountains, Bulgaria',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Bansko',
            'addressRegion': 'Blagoevgrad Province',
            'addressCountry': 'BG'
          }
        }
      },
      {
        '@type': 'Person',
        '@id': 'https://banskounlocked.com/team#funi-nice',
        'name': 'Funi Nice',
        'jobTitle': 'Senior Guide',
        'description': 'With more than 20 years in the mountains, Funi Nice is the guide for guests after a challenge. Remote trails, big terrain and proper mountain days are his natural habitat.',
        'image': 'https://banskounlocked.com/assets/team/funi-nice.jpeg',
        'worksFor': { '@id': 'https://banskounlocked.com/#organization' },
        'knowsAbout': [
          'Adventure Activities',
          'Remote Mountain Trails',
          'Pirin Mountains',
          'Mountain Guiding'
        ],
        'sameAs': ['https://www.facebook.com/mustafa.matanski'],
        'nationality': { '@type': 'Country', 'name': 'Bulgaria' },
        'workLocation': {
          '@type': 'Place',
          'name': 'Bansko, Pirin Mountains, Bulgaria',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Bansko',
            'addressRegion': 'Blagoevgrad Province',
            'addressCountry': 'BG'
          }
        }
      }
    ]);
  }
}
