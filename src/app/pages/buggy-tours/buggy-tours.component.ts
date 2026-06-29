import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BuggyTourService } from '../../services/buggy-tour.service';
import { Tour } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { t, translateDifficulty } from '../../i18n';
import { environment } from '../../../environments/environment';
import { OptimizeImagePipe, CloudinarySrcsetPipe } from '../../pipes/optimize-image.pipe';

@Component({
    selector: 'app-buggy-tours',
    imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, OptimizeImagePipe, CloudinarySrcsetPipe],
    templateUrl: './buggy-tours.component.html',
    styleUrl: './buggy-tours.component.scss'
})
export class BuggyToursComponent implements OnInit {
  tours: Tour[] = [];
  loading = true;
  // True only when this component is the route owner (/buggy-tours). When the
  // homepage embeds it as a child, this stays false so the template emits an
  // <h2> instead of a second <h1> on the home document.
  isOwnRoute = false;

  // SEO meta for the owner route, captured in ngOnInit and consumed by
  // injectStructuredData() once the real tours have loaded.
  private pageMeta: any;

  /** Tours to render: all on /buggy-tours, else the first 3 for the homepage
   *  embed. (Only one buggy tour exists today, so the embed shows it; this is
   *  future-proof for when more are added.) */
  get displayTours(): Tour[] {
    return this.isOwnRoute ? this.tours : this.tours.slice(0, 3);
  }

  constructor(
    private router: Router,
    private http: HttpClient,
    private buggyTourService: BuggyTourService,
    private authService: AuthService,
    private seoService: SeoService,
    private localeService: LocaleService,
    @Inject(DOCUMENT) private doc: Document,
    private route: ActivatedRoute
  ) {}

  get isAdmin(): boolean {
    return this.authService.isAuthenticated();
  }

  get copy() {
    return t(this.localeService.current()).pages.buggyTours;
  }

  /** Substitutes `{{ period }}` / `{{ date }}` placeholders. Lives in TS instead
   *  of the template because Angular's interpolation parser chokes on nested
   *  `{{ }}` inside a string literal inside an `{{ }}` binding. */
  promoLabel(tour: Tour, formattedDate: string | null): string {
    if (tour.promoBookingPeriod) {
      return this.copy.validForPeriod.replace('{{ period }}', tour.promoBookingPeriod);
    }
    return this.copy.endsDate.replace('{{ date }}', formattedDate ?? '');
  }

  ngOnInit() {
    // Validate any stored admin token against the server; clears it if stale.
    this.authService.verify().subscribe();

    // Language detection from URL
    const url = this.doc.location ? this.doc.location.pathname : window.location.pathname;
    const langMatch = url.match(/^\/(\w{2})(?:\/|$)/);
    const lang = langMatch ? langMatch[1] : 'en';

    // Embedded-mode guard: this component renders both at /buggy-tours (route owner)
    // and as a child of home.component.html. Only inject SEO meta + schema when we're
    // actually the page owner — otherwise we'd overwrite the host page's tags.
    // Use Router.url (not document.location.pathname) — the latter returns '/' for
    // every route during SSR/prerender, which broke an earlier attempt at this guard.
    const currentPath = this.router.url.split(/[?#]/)[0];
    this.isOwnRoute = currentPath === '/buggy-tours' || currentPath === '/buggy-tours/';
    if (!this.isOwnRoute) {
      // Still load the tours data so the embedded preview cards render.
      this.buggyTourService.getTours().subscribe((tours) => {
        this.tours = tours;
        this.loading = false;
      });
      return;
    }

    // SEO data for supported languages
    const seoData: any = {
      en: {
        title: 'Buggy Tours Bansko Bulgaria | Off-Grid Mountain Rides',
        description: "Drive a side-by-side buggy through Bulgaria's wild Pirin & Rila mountains. All-inclusive off-grid tours from Bansko — no licence, no experience needed.",
        keywords: 'buggy tours Bulgaria, Bansko buggy off-road, no license buggy tour, family off-road Pirin, Bulgaria off-road adventures, buggy Pirin Mountains, guided buggy tour Bansko',
        url: 'https://banskounlocked.com/buggy-tours',
        locale: 'en_GB'
      },
      bg: {
        title: 'Бъги турове | Enduro Brothers - Офроуд приключения Банско, България',
        description: 'Открийте нашите бъги турове в Банско, България. Офроуд приключения за семейства и групи в Пирин планина.',
        keywords: 'бъги турове, Банско офроуд, България бъги приключения, Пирин бъги турове',
        url: 'https://banskounlocked.com/bg/buggy-tours',
        locale: 'bg_BG'
      },
      de: {
        title: 'Buggy Touren | Enduro Brothers - Offroad-Abenteuer Bansko, Bulgarien',
        description: 'Entdecken Sie unsere Buggy-Touren in Bansko, Bulgarien. Offroad-Abenteuer für Familien und Gruppen im Pirin-Gebirge.',
        keywords: 'buggy touren, Bansko offroad, Bulgarien buggy abenteuer, Pirin buggy touren',
        url: 'https://banskounlocked.com/de/buggy-tours',
        locale: 'de_DE'
      },
      pl: {
        title: 'Wycieczki Buggy | Enduro Brothers - Off-roadowe przygody Bansko, Bułgaria',
        description: 'Odkryj nasze wycieczki buggy w Bansko, Bułgaria. Off-roadowe przygody dla rodzin i grup w górach Pirin.',
        keywords: 'wycieczki buggy, Bansko off-road, Bułgaria buggy przygody, Pirin buggy wycieczki',
        url: 'https://banskounlocked.com/pl/buggy-tours',
        locale: 'pl_PL'
      },
      ro: {
        title: 'Tururi Buggy | Enduro Brothers - Aventuri off-road Bansko, Bulgaria',
        description: 'Descoperă tururile noastre buggy în Bansko, Bulgaria. Aventuri off-road pentru familii și grupuri în Munții Pirin.',
        keywords: 'tururi buggy, Bansko off-road, Bulgaria buggy aventuri, Pirin buggy tururi',
        url: 'https://banskounlocked.com/ro/buggy-tours',
        locale: 'ro_RO'
      },
      ru: {
        title: 'Багги туры | Enduro Brothers - Оффроуд приключения Банско, Болгария',
        description: 'Откройте для себя наши багги-туры в Банско, Болгария. Оффроуд-приключения для семей и групп в горах Пирин.',
        keywords: 'багги туры, Банско оффроуд, Болгария багги приключения, Пирин багги туры',
        url: 'https://banskounlocked.com/ru/buggy-tours',
        locale: 'ru_RU'
      }
      // Add more languages as needed
    };
    const meta = seoData[lang] || seoData['en'];
    this.seoService.updateMetaTags(meta);

    // Capture meta for the structured-data builder; the CollectionPage +
    // ItemList schema is injected AFTER tours load (see injectStructuredData)
    // so the ItemList reflects the REAL buggy tours, not a hard-coded list.
    this.pageMeta = meta;
    this.loadTours();
  }

  private loadTours() {
    // Admin sees drafts via the auth-gated admin listing; public users get the
    // filtered list (drafts hidden) plus the static fallback if the API is down.
    const token = this.authService.getToken();
    if (this.isAdmin && token) {
      this.http
        .get<Tour[]>(`${environment.apiUrl}/tours/admin/all`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
        })
        .subscribe({
          next: (tours) => this.setTours(tours.filter((t) => t.type === 'buggy')),
          error: () => {
            this.buggyTourService.getTours().subscribe((tours) => this.setTours(tours));
          },
        });
      return;
    }
    this.buggyTourService.getTours().subscribe((tours) => this.setTours(tours));
  }

  /** Sets the tour list and, on the owner route, injects the CollectionPage +
   *  ItemList schema built from the REAL tours — so the ItemList count and
   *  names always match what's actually offered (no hard-coded phantom items). */
  private setTours(tours: Tour[]) {
    this.tours = tours;
    this.loading = false;
    if (this.isOwnRoute) this.injectStructuredData();
  }

  private injectStructuredData() {
    const meta = this.pageMeta;
    if (!meta) return;

    const baseUrl = 'https://banskounlocked.com';
    const itemListElement = this.tours.map((tour, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      // Prefer the English source title (originalTitle) so the canonical schema
      // stays in English even when prerendered on a /de or /fr route.
      name: tour.originalTitle || tour.title,
      url: `${baseUrl}/buggy-tour/${tour.slug}`,
    }));

    const graph: any[] = [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/buggy-tours#webpage`,
        'name': meta.title,
        'description': meta.description,
        'url': `${baseUrl}/buggy-tours`,
        'inLanguage': meta.locale.replace('_', '-'),
        'publisher': {
          '@type': 'Organization',
          'name': 'Enduro Brothers Bulgaria',
          'url': `${baseUrl}/`,
        },
      },
    ];

    // Only emit the ItemList when there's at least one real tour to list.
    if (itemListElement.length) {
      graph.push({
        '@type': 'ItemList',
        'name': 'Buggy Tours - Enduro Brothers Bulgaria',
        'description': 'Off-road buggy tours in Bansko & the Pirin Mountains, Bulgaria',
        'url': `${baseUrl}/buggy-tours`,
        'itemListOrder': 'https://schema.org/ItemListOrderAscending',
        'numberOfItems': itemListElement.length,
        'itemListElement': itemListElement,
      });
    }

    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'Buggy Tours', item: `${baseUrl}/buggy-tours` },
      ],
    });

    this.seoService.addStructuredData({ '@context': 'https://schema.org', '@graph': graph });
  }

  editTour(tour: Tour, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/buggy-tour', tour.slug], { queryParams: { edit: true } });
  }

  deleteTour(tour: Tour, event: Event) {
    event.stopPropagation();
    if (!confirm(this.copy.admin.confirmDelete(tour.title))) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });

    this.http.delete(`${environment.apiUrl}/tours/${tour.id}`, { headers }).subscribe({
      next: () => {
        this.tours = this.tours.filter(t => t.id !== tour.id);
      },
      error: () => {
        alert(this.copy.admin.failedDelete);
      },
    });
  }

  addTour() {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });

    const newTour = {
      title: 'NEW BUGGY TOUR',
      type: 'buggy',
      description: 'Edit this tour description.',
      priceEur: 0,
      priceGbp: 0,
      image: 'assets/enduro-gallery/enduro-1.jpg',
      duration: '0 Days',
      durationDetails: 'Edit duration details',
      averageDistance: 'Edit average distance',
      difficulty: ['Beginner'],
      tourDetails: [{ day: 1, title: 'Day 1', description: 'Edit day description.', image: 'assets/enduro-gallery/enduro-1.jpg' }],
      // Always create new tours as drafts — admin publishes them once content is ready.
      published: false,
    };

    this.http.post<Tour>(`${environment.apiUrl}/tours`, newTour, { headers }).subscribe({
      next: (created) => {
        this.router.navigate(['/buggy-tour', created.slug], { queryParams: { edit: true } });
      },
      error: () => {
        alert(this.copy.admin.failedCreate);
      },
    });
  }

  // Locale-aware detail route — a click from a prefixed listing or home embed
  // stays in that locale (/de/buggy-tour/<slug>, /fr/buggy-tour/<slug>); on the
  // EN /buggy-tours it's /buggy-tour. Every prefixed locale has the route.
  private tourCommands(slug: string): string[] {
    const locale = this.localeService.current();
    return locale === 'en' ? ['/buggy-tour', slug] : [`/${locale}/buggy-tour`, slug];
  }

  selectTour(tour: Tour) {
    this.router.navigate(this.tourCommands(tour.slug)).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  viewTourDetails(tour: Tour, event: Event) {
    event.stopPropagation();
    this.router.navigate(this.tourCommands(tour.slug)).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // "View all" from the homepage teaser → the full /buggy-tours listing,
  // locale-aware so a click from /de or /fr stays in that locale.
  viewAllTours() {
    const locale = this.localeService.current();
    const commands = locale === 'en' ? ['/buggy-tours'] : [`/${locale}/buggy-tours`];
    this.router.navigate(commands).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  translateDifficulty(tier: string): string {
    return translateDifficulty(tier, this.localeService.current());
  }

  /** GBP pricing only renders on the English site — see booking.component.ts. */
  get showGbp(): boolean {
    return this.localeService.current() === 'en';
  }

  getDifficultyColor(difficulty: string): string {
    // Darkened so the white badge text clears WCAG AA (≥4.5:1) — the lighter
    // tints (#22c55e/#f59e0b/#ef4444) failed the Lighthouse contrast audit.
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#15803d';
      case 'beginner':
        return '#15803d';
      case 'moderate':
        return '#b45309';
      case 'intermediate':
        return '#b45309';
      case 'advanced':
        return '#b91c1c';
      case 'pro':
        return '#b91c1c';
      default:
        return '#4b5563';
    }
  }

  hasActivePromo(tour: Tour): boolean {
    return this.buggyTourService.hasActivePromo(tour);
  }

  getDiscountPercentage(tour: Tour, currency: 'eur' | 'gbp'): number {
    return this.buggyTourService.getDiscountPercentage(tour, currency);
  }
}
