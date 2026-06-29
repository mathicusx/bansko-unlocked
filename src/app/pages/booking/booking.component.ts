import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TourService, Tour } from '../../services/tour.service';
import { TourBookingService, BookingStats } from '../../services/tour-booking.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { t, translateDifficulty } from '../../i18n';
import { OptimizeImagePipe, CloudinarySrcsetPipe } from '../../pipes/optimize-image.pipe';
import { getReviewsForSchema } from '../../data/reviews.data';

@Component({
    selector: 'app-booking',
    imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, OptimizeImagePipe, CloudinarySrcsetPipe],
    templateUrl: './booking.component.html',
    styleUrl: './booking.component.scss'
})
export class BookingComponent implements OnInit {
  tours: Tour[] = [];
  loading = true;
  /** Quota-gated booking stats — both fields may be null below threshold so
   *  the social-proof pills stay hidden. Browser-only fetch (skipped at SSR
   *  so the prerendered listing never bakes a stale number). */
  bookingStats: BookingStats | null = null;
  // True only when this component is the route owner (/enduro-tours). When the
  // homepage embeds it as a child, this stays false so the template emits an
  // <h2> instead of a second <h1> on the home document.
  isOwnRoute = false;

  /** Tours to render: all of them on the owner route (/enduro-tours), else a
   *  cheap → mid → premium teaser for the homepage embed, derived LIVE from the
   *  API tour prices (so it self-maintains as tours/prices change) instead of a
   *  hard-coded list. */
  get displayTours(): Tour[] {
    if (this.isOwnRoute) return this.tours;
    return this.priceSpread(this.tours);
  }

  /** Cheapest + median-priced + most-premium tour, in ascending price order, so
   *  the homepage shows the full price range and a premium anchor rather than
   *  just the cheapest tours. Returns whatever's available below 3 tours. */
  private priceSpread(tours: Tour[]): Tour[] {
    const sorted = [...tours].sort((a, b) => this.priceOf(a) - this.priceOf(b));
    if (sorted.length <= 3) return sorted;
    const cheapest = sorted[0];
    const premium = sorted[sorted.length - 1];
    const mid = sorted[Math.floor((sorted.length - 1) / 2)];
    return [cheapest, mid, premium];
  }

  /** priceEur can arrive from the API as a numeric string ("1330.00"); coerce. */
  private priceOf(tour: Tour): number {
    return Number(tour.priceEur) || 0;
  }

  constructor(
    private router: Router,
    private http: HttpClient,
    private tourService: TourService,
    private authService: AuthService,
    private seoService: SeoService,
    private localeService: LocaleService,
    private route: ActivatedRoute,
    private tourBooking: TourBookingService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  /** Localised "X riders booked in the last 30 days" — null below quota. */
  get socialProofText(): string | null {
    const count = this.bookingStats?.recentBookings;
    if (!count) return null;
    return t(this.localeService.current()).pages.tourDetail.socialProof.bookedRecently(count);
  }

  /** Localised "<Month> is filling up fast — reserve early" — null below quota. */
  get seasonFillingText(): string | null {
    const m = this.bookingStats?.popularMonth;
    if (!m) return null;
    const monthName = new Date(m.year, m.month - 1, 1).toLocaleDateString(
      this.localeService.htmlLang(),
      { month: 'long' },
    );
    return t(this.localeService.current()).pages.tourDetail.socialProof.fillingFast(monthName);
  }

  get isAdmin(): boolean {
    return this.authService.isAuthenticated();
  }

  get copy() {
    return t(this.localeService.current()).pages.enduroTours;
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

    // Booking stats power the social-proof + season-filling pills. Browser-
    // only so the prerendered HTML never carries a stale number. Silent on
    // error — the pills simply don't render if the request fails.
    if (isPlatformBrowser(this.platformId)) {
      this.tourBooking.getStats().subscribe({
        next: (stats) => (this.bookingStats = stats),
        error: () => {},
      });
    }

    // Embedded-mode guard: BookingComponent is rendered both at /enduro-tours (route
    // owner) and as a child of home.component.html. Only inject SEO meta + canonical
    // + schema + fire conversion pixels when we're actually the page owner.
    // Past bug: this overwrote the homepage's title and pointed its canonical at
    // /booking, plus fired a phantom InitiateCheckout on every home-page visit.
    // Use Router.url (not document.location.pathname) — the latter returns '/' for
    // every route during SSR/prerender, which broke an earlier attempt at this guard.
    const currentPath = this.router.url.split(/[?#]/)[0];
    this.isOwnRoute =
      currentPath === '/enduro-tours' || currentPath === '/enduro-tours/' ||
      currentPath === '/de/enduro-tours' || currentPath === '/de/enduro-tours/' ||
      currentPath === '/fr/enduro-tours' || currentPath === '/fr/enduro-tours/' ||
      currentPath === '/nl/enduro-tours' || currentPath === '/nl/enduro-tours/';
    if (!this.isOwnRoute) {
      // Still load the tours data so the embedded preview cards render.
      this.tourService.getTours().subscribe((tours) => {
        this.tours = tours;
        this.loading = false;
      });
      return;
    }

    this.seoService.addHreflangs(this.localeService.hreflangAlternates('/enduro-tours'));

    // NOTE: no InitiateCheckout / begin_checkout is fired here. Viewing the
    // /enduro-tours listing is not a checkout-start — firing it on page load
    // inflated the funnel with a step nobody actually took. The real
    // checkout-start events fire from the PayPal `createOrder` callback in
    // tour-detail / buggy-tour-detail, which is a genuine button click.

    // Meta description + hero Product price embed live, promo-aware prices,
    // so the rest of the SEO is injected by applyOwnerSeo() once the tour
    // list resolves. loadTours() drives that.
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
          next: (tours) => {
            this.setOwnerTours(tours.filter((t: any) => t.type === 'enduro'));
          },
          error: () => {
            this.tourService.getTours().subscribe((tours) => {
              this.setOwnerTours(tours);
            });
          },
        });
      return;
    }
    this.tourService.getTours().subscribe((tours) => {
      this.setOwnerTours(tours);
    });
  }

  /** Stores the owner-route tour list, then injects the price-dependent SEO
   *  (meta description + @graph) now that live prices are known. */
  private setOwnerTours(tours: Tour[]) {
    this.tours = tours;
    this.loading = false;
    this.applyOwnerSeo();
  }

  /** /enduro-tours meta tags + @graph. Runs after the tour list loads so the
   *  meta description's "from €X" and the hero Product price reflect live,
   *  promo-aware prices instead of hard-coded figures that silently rot. */
  private applyOwnerSeo() {
    const locale = this.localeService.current();
    const i18nMeta = t(locale).meta.enduroTours;
    const url = this.localeService.canonicalFor('/enduro-tours', locale);
    const homeUrl = this.localeService.canonicalFor('/', locale);
    const inLang = this.localeService.htmlLang();
    const description = i18nMeta.description.replace(
      '{{ fromPrice }}',
      String(this.tourService.lowestEffectivePriceEur(this.tours)),
    );

    const meta = {
      title: i18nMeta.title,
      description,
      keywords: i18nMeta.keywords,
      url,
      locale: this.localeService.ogLocale(),
    };
    this.seoService.updateMetaTags(meta);

    // Single @graph for the booking page: WebPage + BreadcrumbList + hero
    // Product + brand TravelAgency (rating + reviews) + top-3 FAQ. All in one
    // addGraphSchemas call so they share the `script[data-dynamic]` slot —
    // calling addStructuredData() after would overwrite everything here.
    const ratingNode = this.seoService.getAggregateRatingSchema(getReviewsForSchema());
    const { '@context': _ctx, ...ratingGraph } = ratingNode;
    // Top-3 FAQ block — shared with the homepage @graph (same dictionary slice).
    const faqNode = this.seoService.getFAQSchema(t(locale).pages.home.faqSchema);
    const { '@context': _faqCtx, ...faqGraph } = faqNode;

    // Hero Product price tracks the live pro-rider tour (promo-aware) instead
    // of a hard-coded figure that diverges from the real tour-detail Product
    // schema (same @id) whenever the admin changes prices.
    const proRider = this.tours.find(
      (tr) => tr.slug === 'pro-riders-3-day-expedition',
    );
    const proRiderPrice = proRider
      ? this.tourService.effectivePriceEur(proRider)
      : 950;
    const proRiderValidUntil =
      proRider && this.tourService.hasActivePromo(proRider) && proRider.promoEndDate
        ? proRider.promoEndDate.split('T')[0]
        : '2026-12-31';

    this.seoService.addGraphSchemas([
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        'name': meta.title,
        'description': description,
        'url': url,
        'inLanguage': inLang,
        'isPartOf': { '@id': 'https://banskounlocked.com/#website' }
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': homeUrl },
          { '@type': 'ListItem', 'position': 2, 'name': 'Book a Tour', 'item': url }
        ]
      },
      {
        '@type': 'Product',
        '@id': 'https://banskounlocked.com/tour/pro-riders-3-day-expedition#product',
        name: "3-Day Enduro Tour Bulgaria — Pro Rider's Expedition",
        description:
          '5-day all-inclusive premium enduro holiday in Bansko, Bulgaria — 3 full riding days on 2026 GASGAS/Husqvarna bikes, 4 nights in a 5-star SPA hotel, all meals, airport transfers from Sofia or Plovdiv, expert local guide. No motorcycle licence required.',
        image: [
          'https://banskounlocked.com/assets/enduro-gallery/enduro-25.jpg',
          'https://banskounlocked.com/assets/enduro-gallery/enduro-30.jpg',
        ],
        brand: { '@type': 'Brand', name: 'Enduro Brothers Bulgaria' },
        category: 'Enduro Motorcycle Tour',
        offers: {
          '@type': 'Offer',
          url: 'https://banskounlocked.com/tour/pro-riders-3-day-expedition',
          priceCurrency: 'EUR',
          price: String(proRiderPrice),
          priceValidUntil: proRiderValidUntil,
          availability: 'https://schema.org/InStock',
          validFrom: '2026-04-01',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': 'https://banskounlocked.com/#travel-agency' },
        },
      },
      ratingGraph,
      faqGraph,
    ]);
  }

  editTour(tour: Tour, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/tour', tour.slug], { queryParams: { edit: true } });
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
      title: 'NEW ENDURO TOUR',
      type: 'enduro',
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
        this.router.navigate(['/tour', created.slug], { queryParams: { edit: true } });
      },
      error: () => {
        alert(this.copy.admin.failedCreate);
      },
    });
  }

  // Public detail-page route — locale-aware so a click from a prefixed listing
  // (/de, /fr, or a home embed) stays in that locale. Every prefixed locale has
  // a `<locale>/tour/:id` route in app.routes.ts, so the URL always resolves.
  private tourCommands(slug: string): string[] {
    const locale = this.localeService.current();
    return locale === 'en' ? ['/tour', slug] : [`/${locale}/tour`, slug];
  }

  selectTour(tour: Tour) {
    this.router.navigate(this.tourCommands(tour.slug)).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  viewTourDetails(tour: Tour, event: Event) {
    event.stopPropagation(); // Prevent card click from firing
    this.router.navigate(this.tourCommands(tour.slug)).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // "View all" from the homepage teaser → the full /enduro-tours listing,
  // locale-aware so a click from /de or /fr stays in that locale.
  viewAllTours() {
    const locale = this.localeService.current();
    const commands = locale === 'en' ? ['/enduro-tours'] : [`/${locale}/enduro-tours`];
    this.router.navigate(commands).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  translateDifficulty(tier: string): string {
    return translateDifficulty(tier, this.localeService.current());
  }

  /** GBP pricing renders on the English site only. EN visitors include the
   *  UK rider segment (47% of clicks per GSC) so dual EUR/GBP helps; on /de
   *  GBP is just noise. */
  get showGbp(): boolean {
    return this.localeService.current() === 'en';
  }

  getDifficultyColor(difficulty: string): string {
    // Darkened so the white badge text clears WCAG AA (≥4.5:1) — the lighter
    // tints (#22c55e/#f59e0b/#ef4444) failed the Lighthouse contrast audit.
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return '#15803d';
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
    return this.tourService.hasActivePromo(tour);
  }

  getDiscountPercentage(tour: Tour, currency: 'eur' | 'gbp'): number {
    return this.tourService.getDiscountPercentage(tour, currency);
  }
}
