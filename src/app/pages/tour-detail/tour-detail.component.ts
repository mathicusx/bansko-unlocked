import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { PhoneService } from '../../shared/services/phone.service';
import { SeoService } from '../../services/seo.service';
import { TourService, Tour, TourDay } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { CountdownTimerComponent } from '../../shared/components/countdown-timer/countdown-timer.component';
import { PixelService } from '../../services/pixel.service';
import { AnalyticsService } from '../../services/analytics.service';
import { environment } from '../../../environments/environment';
import { OptimizeImagePipe, CloudinarySrcsetPipe } from '../../pipes/optimize-image.pipe';
import { getReviewsForSchema, getReviewsForTour, REVIEWS, ReviewData } from '../../data/reviews.data';
import { LocaleService } from '../../services/locale.service';
import { TourBookingService, CreateBookingPayload, BookingStats } from '../../services/tour-booking.service';
import { AttributionService } from '../../services/attribution.service';
import { t, translateDifficulty } from '../../i18n';
import { isLanguagePublished } from '../../data/tour-translations';
import { MIN_RIDERS } from '../../shared/booking.constants';

declare var paypal: any;

@Component({
    selector: 'app-tour-detail',
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatTooltipModule,
        MatChipsModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatRadioModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FormsModule,
        RouterLink,
        CountdownTimerComponent,
        OptimizeImagePipe,
        CloudinarySrcsetPipe,
    ],
    templateUrl: './tour-detail.component.html',
    styleUrl: './tour-detail.component.scss'
})
export class TourDetailComponent implements OnInit, AfterViewInit {
  tour: Tour | null = null;
  loading = true;
  editing = false;
  saving = false;
  editData: any = {};
  uploadingImage = '';
  // Reviews attributed to this tour's slug — rendered visibly in the template
  // AND embedded as JSON-LD review[] when ≥3 exist. The two must match
  // (visible + schema) or Google strips the rich result.
  tourReviews: ReviewData[] = [];

  // Booking extras options
  bookingExtras = {
    newTires: false,
  };

  // --- Pre-booking checkout flow (the "Reserve this tour" dialog) ---
  showCheckout = false;
  /** 1 = details form, 2 = PayPal deposit, 3 = success screen. */
  checkoutStep: 1 | 2 | 3 = 1;
  submittingBooking = false;
  /** True when the post-payment booking POST failed — payment still
   *  succeeded, so we show the email-fallback message instead of the
   *  normal confirmation. */
  bookingError = false;
  /** Guards against PayPal rendering its button twice into the container. */
  private paypalRendered = false;
  /** Riding experience is multi-select so mixed-level groups can tick more
   *  than one (e.g. a beginner + an advanced rider travelling together). */
  readonly experienceChoices: Array<'beginner' | 'intermediate' | 'advanced'> = [
    'beginner',
    'intermediate',
    'advanced',
  ];
  checkout = {
    name: '',
    email: '',
    phone: '',
    preferredContact: 'whatsapp' as 'whatsapp' | 'phone' | 'email' | 'other',
    contactOther: '',
    experienceLevels: [] as Array<'beginner' | 'intermediate' | 'advanced'>,
    riders: null as number | null,
    startDate: null as Date | null,
    endDate: null as Date | null,
  };

  /** Min selectable date for the range picker — no past dates. */
  readonly today = new Date();

  /** Minimum riders per booking — gates the checkout + sets the input `min`. */
  readonly minRiders = MIN_RIDERS;

  /** Quota-gated booking stats from /api/bookings/stats. Both fields may be
   *  null — when so, the corresponding line stays hidden so we never render
   *  weak "1 rider booked" social proof. Fetched browser-only (skipped during
   *  SSR/prerender) so the static HTML doesn't bake stale numbers. */
  bookingStats: BookingStats | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private phoneService: PhoneService,
    private seoService: SeoService,
    private tourService: TourService,
    private authService: AuthService,
    private cloudinaryService: CloudinaryService,
    private pixel: PixelService,
    private analytics: AnalyticsService,
    private localeService: LocaleService,
    private tourBooking: TourBookingService,
    private attribution: AttributionService,
  ) {}

  /** Locale-aware page chrome — resolves EN or DE from i18n/{en,de}.ts.
   *  The tour CONTENT itself is localised upstream by TourService. */
  get copy() {
    return t(this.localeService.current()).pages.tourDetail;
  }

  get isAdmin(): boolean {
    return this.authService.isAuthenticated();
  }

  startEditing() {
    if (!this.tour) return;
    this.editData = {
      title: this.tour.title,
      description: this.tour.description,
      promo: this.tour.promo || '',
      priceEur: this.tour.priceEur,
      priceGbp: this.tour.priceGbp,
      promoPriceEur: this.tour.promoPriceEur || null,
      promoPriceGbp: this.tour.promoPriceGbp || null,
      promoEndDate: this.tour.promoEndDate || '',
      promoBookingPeriod: this.tour.promoBookingPeriod || '',
      image: this.tour.image,
      duration: this.tour.duration,
      durationDetails: this.tour.durationDetails,
      averageDistance: this.tour.averageDistance,
      difficulty: this.tour.difficulty.join(', '),
      published: this.tour.published ?? true,
      tourDetails: this.tour.tourDetails.map(d => ({ ...d })),
    };
    this.editing = true;
  }

  cancelEditing() {
    this.editing = false;
    this.editData = {};
    setTimeout(() => this.loadPayPalButton(), 100);
  }

  saveEditing() {
    if (!this.tour) return;
    this.saving = true;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });

    const body = {
      ...this.editData,
      priceEur: Number(this.editData.priceEur),
      priceGbp: Number(this.editData.priceGbp),
      promoPriceEur: this.editData.promoPriceEur ? Number(this.editData.promoPriceEur) : null,
      promoPriceGbp: this.editData.promoPriceGbp ? Number(this.editData.promoPriceGbp) : null,
      difficulty: this.editData.difficulty.split(',').map((d: string) => d.trim()).filter((d: string) => d),
      tourDetails: this.editData.tourDetails.map((d: any, i: number) => ({
        day: i + 1,
        title: d.title,
        description: d.description,
        image: d.image,
      })),
    };

    this.http.patch<Tour>(`${environment.apiUrl}/tours/${this.tour.id}`, body, { headers }).subscribe({
      next: (updated) => {
        this.tour = { ...this.tour!, ...updated };
        this.editing = false;
        this.saving = false;
        setTimeout(() => this.loadPayPalButton(), 100);
      },
      error: () => {
        alert('Failed to save changes. Please try again.');
        this.saving = false;
      },
    });
  }

  deleteTour() {
    if (!this.tour || !confirm(`Are you sure you want to delete "${this.tour.title}"?`)) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`,
    });

    this.http.delete(`${environment.apiUrl}/tours/${this.tour.id}`, { headers }).subscribe({
      next: () => {
        this.router.navigate(this.localeService.localizeLink(['/enduro-tours']));
      },
      error: () => {
        alert('Failed to delete tour. Please try again.');
      },
    });
  }

  onMainImageUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImage = 'main';
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (url) => {
        this.editData.image = url;
        this.uploadingImage = '';
      },
      error: () => {
        alert('Image upload failed. Please try again.');
        this.uploadingImage = '';
      },
    });
  }

  onDayImageUpload(event: Event, dayIndex: number) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingImage = `day-${dayIndex}`;
    this.cloudinaryService.uploadImage(file).subscribe({
      next: (url) => {
        this.editData.tourDetails[dayIndex].image = url;
        this.uploadingImage = '';
      },
      error: () => {
        alert('Image upload failed. Please try again.');
        this.uploadingImage = '';
      },
    });
  }

  addDay() {
    const newDay = this.editData.tourDetails.length + 1;
    this.editData.tourDetails.push({ day: newDay, title: '', description: '', image: '' });
  }

  removeDay(index: number) {
    this.editData.tourDetails.splice(index, 1);
    this.editData.tourDetails.forEach((d: TourDay, i: number) => d.day = i + 1);
  }

  trackByDay(index: number): number {
    return index;
  }

  ngOnInit() {
    // Validate any stored admin token against the server; clears it if stale.
    this.authService.verify().subscribe();

    // Booking stats for the social-proof badge + season-filling line. Browser-
    // only so the prerendered HTML never bakes a number that goes stale. Silent
    // on error — the badge simply doesn't render if the request fails.
    if (isPlatformBrowser(this.platformId)) {
      this.tourBooking.getStats().subscribe({
        next: (stats) => (this.bookingStats = stats),
        error: () => {},
      });
    }

    // Per-tour meta, hreflang and the WebPage/TouristTrip/Product @graph are
    // all set by updateTourSEO() once the tour loads — it owns the single
    // `script[data-dynamic]` slot, so nothing is injected here. (The old
    // hard-coded en/bg/de/pl/ro/ru `seoData` block was dead code — it keyed
    // off `document.location.pathname`, which is `/` during SSR/prerender —
    // and is gone; locale now comes from LocaleService via the URL route.)
    this.route.paramMap.subscribe((params) => {
      const tourId = params.get('id');
      if (tourId) {
        // Admin view hits the auth endpoint so drafts (published=false) load too;
        // public users get the filtered endpoint and 404 on drafts (which is what we want).
        const token = this.authService.getToken();
        const lookup$ = this.isAdmin && token
          ? this.tourService.getTourByIdForAdmin(tourId, token)
          : this.tourService.getTourById(tourId);
        lookup$.subscribe({
          next: (tour) => {
            this.tour = tour || null;
            this.loading = false;
            if (this.tour) {
              this.updateTourSEO(this.tour);
              if (this.route.snapshot.queryParams['edit'] && this.isAdmin) {
                this.startEditing();
              } else {
                setTimeout(() => this.loadPayPalButton(), 100);
              }
            }
          },
          error: () => {
            this.loading = false;
            this.router.navigate(this.localeService.localizeLink(['/enduro-tours']));
          },
        });
      }
    });
  }

  private updateTourSEO(tour: Tour) {
    const locale = this.localeService.current();
    const copy = t(locale).pages.tourDetail;
    const tourPath = `/tour/${tour.slug}`;
    const tourUrl = this.localeService.canonicalFor(tourPath, locale);
    // URL space the schema builders embed — locale-prefixed on /de + /fr.
    const tourPrefix = locale === 'en' ? '/tour' : `/${locale}/tour`;

    const promoActive = this.tourService.hasActivePromo(tour);
    const displayPrice = promoActive && tour.promoPriceEur ? tour.promoPriceEur : tour.priceEur;
    const basePrice = promoActive && tour.promoPriceEur ? tour.priceEur : null;
    const isBeginner = tour.difficulty.includes('Beginner');

    // The SEO <title> leads with the tour's own (distinct) name so each tour
    // page has a UNIQUE title — the old format built from duration+price alone
    // produced byte-identical titles for same-duration/price tours (e.g.
    // weekend-wheels vs two-days), which cannibalised each other in search.
    // Titles are stored ALL-CAPS for the on-page H1; title-case them here so
    // the SERP title doesn't look like shouting. tour.title stays untouched
    // everywhere else (schema, pixel, breadcrumb).
    const seoTitleName = this.titleCaseName(tour.title);

    this.seoService.updateMetaTags({
      title: copy.seo.title(seoTitleName, displayPrice, tour.duration),
      description: copy.seo.description(tour.description, isBeginner, tour.duration, displayPrice, basePrice),
      keywords: copy.seo.keywords(tour.title, tour.duration, displayPrice, tour.difficulty.join(' '), isBeginner),
      url: tourUrl,
      type: 'product',
      image: `https://banskounlocked.com/${tour.image}`,
      locale: this.localeService.ogLocale(),
    });

    // English-only site: no localised tour overlays exist, so no cross-locale
    // hreflang is emitted. (When localisation returns, filter the live locales
    // by isLanguagePublished(tour.slug, loc) here as before.)
    const tourLocales: never[] = [];
    if (tourLocales.length > 0) {
      this.seoService.addHreflangs(this.localeService.hreflangAlternates(tourPath, tourLocales));
    }

    // Fire Pixel + Conversions API ViewContent (deduped by event_id).
    // Use the effective (promo-aware) price so Meta learns the actual basket
    // value when a sale is active — base price would distort ROAS / audiences.
    this.pixel.trackViewContent({
      contentId: tour.id,
      contentName: tour.title,
      category: 'Enduro Tour',
      value: displayPrice,
      currency: 'EUR',
    });
    // Mirror to GA4 view_item so the GA funnel matches the Pixel funnel.
    this.analytics.trackViewItem({
      id: tour.id,
      name: tour.title,
      category: 'Enduro Tour',
      value: displayPrice,
      currency: 'EUR',
    });

    // Step 1 of the GA4 per-tour funnel — view_item. Carries the tour in
    // `items` so funnel exploration can break each step down per tour.
    this.analytics.trackViewItem({
      id: tour.id,
      name: tour.title,
      category: 'Enduro Tour',
      value: displayPrice,
      currency: 'EUR',
    });

    // Register the tour so WhatsApp / phone Lead events fired from the global
    // floating-help widget or footer while on this page attribute to it.
    this.phoneService.setCurrentTour({
      id: tour.id,
      name: tour.title,
      category: 'Enduro Tour',
    });

    // Brand-level rating + supporting reviews share #travel-agency @id with
    // the static node in src/index.html — Google merges them by @id. Powers
    // the Knowledge Panel (but Google strips it from organic SERP stars as
    // self-serving — see CLAUDE.md "self-serving aggregateRating" note).
    const ratingNode = this.seoService.getAggregateRatingSchema(getReviewsForSchema());
    const { '@context': _ctx, ...ratingGraph } = ratingNode;

    // Per-tour reviews — only the subset of REVIEWS attributed to this tour's
    // slug. When ≥3 exist, getTourProductSchema attaches them as
    // aggregateRating + review[] on the Product node (NOT TouristTrip — that
    // type is not on Google's allowed-parent list for review snippets, see
    // CLAUDE.md). The visible "What riders said" section below renders the
    // same set; Google strips the rich result if visible and schema disagree.
    this.tourReviews = REVIEWS.filter((r) => r.tourSlug === tour.slug);
    const tourReviewsForSchema = getReviewsForTour(tour.slug);

    // Single @graph for the tour page — WebPage + TouristTrip + Product +
    // BreadcrumbList + brand TravelAgency (rating + reviews). All share the
    // `script[data-dynamic]` slot.
    this.seoService.addGraphSchemas([
      {
        '@type': 'WebPage',
        '@id': `${tourUrl}#webpage`,
        name: tour.title,
        description: tour.description,
        url: tourUrl,
        inLanguage: this.localeService.htmlLang(),
        isPartOf: { '@id': 'https://banskounlocked.com/#website' },
        about: { '@id': `${tourUrl}#trip` },
      },
      this.seoService.getTouristTripSchema(tour, tourPrefix),
      this.seoService.getTourProductSchema(tour, tourPrefix, tourReviewsForSchema),
      this.seoService.getBreadcrumbSchema([
        { name: t(locale).chrome.nav.home, url: this.localeService.canonicalFor('/', locale) },
        { name: t(locale).chrome.nav.enduroTours, url: this.localeService.canonicalFor('/enduro-tours', locale) },
        { name: tour.title, url: tourUrl }
      ]),
      ratingGraph,
    ]);
  }

  ngAfterViewInit() {
    // PayPal button is loaded after tour data arrives — see ngOnInit
  }

  /** Title-case an ALL-CAPS tour name for the SEO <title> (e.g.
   *  "WEEKEND WHEELS ADVENTURE" → "Weekend Wheels Adventure"). Capitalises the
   *  first letter after a start/space/hyphen/slash so "PRO RIDER'S 3-DAY" →
   *  "Pro Rider's 3-Day". Unicode-aware so accented locale names survive
   *  ("RÄDERN" → "Rädern"). Over-capitalises German function words ("Auf")
   *  rather than dropping noun caps — the safe error direction for a title. */
  private titleCaseName(name: string): string {
    return name
      .toLowerCase()
      .replace(/(^|[\s\-–—/])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
  }

  private loadPayPalButton() {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') return;

    if ((window as any).paypal) {
      this.renderPayPalButton();
    } else {
      const script = document.createElement('script');
      // --- LIVE: takes real deposits.
      script.src =
        'https://www.paypal.com/sdk/js?client-id=AXBWM5OXv2pMa7oauirDStlGvCdIKxGR7x91RwQOIj099ZriAcWpHAPqd0mXmtU9HG5bueZrK42pl2JO&currency=EUR';
      // --- TESTING: real PayPal sandbox app client ID — no real money. Swap
      //     back to this (and comment out the LIVE line above) to test.
      // script.src =
      //   'https://www.paypal.com/sdk/js?client-id=Adb8coxxzlLbBjmDs-24F83OJNJdo8Fml6BmV4QcZYW-GIx_N_7OkOwTTAHIey_UUfHUzaU0oDl-nYQR&currency=EUR';
      script.onload = () => {
        this.renderPayPalButton();
      };
      document.head.appendChild(script);
    }
  }

  private renderPayPalButton() {
    if (typeof document === 'undefined') return;
    // The button lives inside the checkout dialog (step 2) — bail if it isn't
    // mounted yet, and never render twice into the same container.
    const container = document.getElementById('paypal-button-container');
    if (!container || this.paypalRendered) return;
    container.innerHTML = '';
    this.paypalRendered = true;

    (window as any).paypal
      .Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'buynow',
          height: 50,
          tagline: false,
        },
        createOrder: (data: any, actions: any) => {
          // Step 2 of the per-tour funnel — the rider clicked the PayPal deposit
          // button. Fire the matching checkout-start event in BOTH trackers,
          // each carrying this tour so the step is attributable per tour:
          // Meta InitiateCheckout + GA4 begin_checkout.
          if (this.tour) {
            this.pixel.trackInitiateCheckout({
              contentId: this.tour.id,
              contentName: this.tour.title,
              category: 'Enduro Tour',
              value: this.getDepositAmount(),
            });
            this.analytics.trackBeginCheckout({
              value: this.getDepositAmount(),
              items: [{ id: this.tour.id, name: this.tour.title, category: 'Enduro Tour' }],
            });
          }
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: this.getDepositAmount().toFixed(2),
                  currency_code: 'EUR',
                },
                // Tour title (trimmed to PayPal's 127-char limit) so the
                // payment is identifiable in the PayPal dashboard; slug as
                // custom_id for machine lookup.
                description: `Deposit — ${this.tour?.title ?? 'Enduro Brothers Tour'}`.slice(0, 127),
                custom_id: this.tour?.slug ?? undefined,
              },
            ],
          });
        },
        onApprove: (data: any, actions: any) => {
          return actions.order.capture().then((details: any) => {
            this.handlePaymentSuccess(details, 'EUR', this.getDepositAmount());
          });
        },
      })
      .render('#paypal-button-container');
  }

  private getDepositAmount(): number {
    return 100; // €100 deposit per enduro booking (paid now; balance on arrival).
  }

  private handlePaymentSuccess(details: any, currency: string, amount: number) {
    console.log('Payment successful:', details);

    // Simple success handling - no backend needed
    const bookingInfo = {
      tourId: this.tour?.id,
      tourTitle: this.tour?.title,
      paymentId: details.id,
      currency: currency,
      amount: amount,
      payerEmail: details.payer?.email_address,
      timestamp: new Date().toISOString(),
    };

    // Store locally for reference (optional)
    localStorage.setItem(`booking-${details.id}`, JSON.stringify(bookingInfo));

    // Fire Pixel + Conversions API Purchase event (deduped by event_id).
    // This is the highest-value conversion signal we have — Meta optimises
    // ad delivery against it, so don't skip it.
    if (this.tour) {
      this.pixel.trackPurchase({
        orderId: details.id,
        value: amount,
        currency,
        contentIds: [this.tour.id],
        email: details.payer?.email_address,
      });
      this.analytics.trackPurchase({
        orderId: details.id,
        value: amount,
        currency,
        items: [{ id: this.tour.id, name: this.tour.title }],
      });
    }

    // Persist the booking + fire the notification/confirmation emails, then
    // show the in-dialog success screen (step 3). No more alert()/redirect —
    // the dialog owns the confirmation UX now.
    this.submitBooking(details.id, amount, currency);
  }

  private handlePaymentError(currency: string) {
    // Use service for phone number in error message
    const phone = this.phoneService.getDisplayPhone();
    alert(
      `❌ Payment failed for ${currency}.\n\nPlease try again or contact us directly:\n📧 info@banskounlocked.com\n📞 ${phone}`
    );
  }

  translateDifficulty(tier: string): string {
    return translateDifficulty(tier, this.localeService.current());
  }

  /** GBP pricing only renders on the English site — see booking.component.ts. */
  get showGbp(): boolean {
    return this.localeService.current() === 'en';
  }

  /** Locale-aware link to the difficulty-levels page (keeps the /de, /fr, /nl
   *  prefix). The badge below sets a `[fragment]` so the page scrolls to the
   *  matching tier on arrival (anchorScrolling is enabled in app.config). */
  get difficultyLevelsLink(): string {
    return this.localeService.localePath('/difficulty-levels');
  }

  /** Fragment id of the difficulty-levels section for a given tier badge.
   *  Mirrors the `id="level-<key>"` anchors on that page. "Intermediate" has no
   *  dedicated section there (the page calibrates beginner → advanced → pro),
   *  so it folds into Advanced. */
  difficultyFragment(difficulty: string): string {
    const key = difficulty.toLowerCase() === 'intermediate' ? 'advanced' : difficulty.toLowerCase();
    return `level-${key}`;
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
        return '#b45309';
      case 'pro':
        return '#b91c1c';
      default:
        return '#4b5563';
    }
  }

  goBack() {
    this.router.navigate(this.localeService.localizeLink(['/enduro-tours']));
  }

  bookTour() {
    // TODO: Implement booking logic
    console.log('Book tour:', this.tour?.id);
  }

  openWhatsApp() {
    if (!this.tour) return;
    const message = `Hi! I'm interested in the ${this.tour.title} tour. Could you give me more details?`;
    const number = this.phoneService.getWhatsAppPhone('uk');
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    const tourRef = { id: this.tour.id, name: this.tour.title, category: 'Enduro Tour' };
    this.pixel.trackLead(undefined, 'WhatsApp', tourRef);
    this.analytics.trackLead(undefined, 'WhatsApp', tourRef);
    window.open(url, '_blank', 'noopener');
  }

  hasActivePromo(): boolean {
    if (!this.tour) return false;
    return this.tourService.hasActivePromo(this.tour);
  }

  getDiscountPercentage(currency: 'eur' | 'gbp'): number {
    if (!this.tour) return 0;
    return this.tourService.getDiscountPercentage(this.tour, currency);
  }

  /**
   * Generate email with booking details including extras
   */
  sendBookingEmail() {
    if (!this.tour) return;

    // Build extras list
    const extras: string[] = [];

    if (this.bookingExtras.newTires) {
      extras.push('- New tires: +€75 per bike');
    }

    // Format extras for email
    const extrasText = extras.length > 0
      ? `%0D%0A%0D%0AExtras requested:%0D%0A${extras.join('%0D%0A')}`
      : '%0D%0A%0D%0AExtras requested:%0D%0ANone';

    // On non-EN locales the public title is the localised one (e.g. German).
    // Append the original English title in brackets so the (English-speaking)
    // staff inbox can still identify the booking. Skipped on EN where
    // `originalTitle` is absent and the title is already English.
    const titleForEmail = this.tour.originalTitle && this.tour.originalTitle !== this.tour.title
      ? `${this.tour.title} (${this.tour.originalTitle})`
      : this.tour.title;

    // Create email subject and body
    const subject = `Tour Reservation - ${titleForEmail}`;
    const body = `Hello Enduro Brothers,%0D%0A%0D%0A` +
      `I have just reserved my spot and would like to confirm my preferred dates:%0D%0A%0D%0A` +
      `Tour: ${titleForEmail}%0D%0A` +
      `Preferred dates: %0D%0A` +
      `Number of people: ${extrasText}%0D%0A%0D%0A` +
      `Thank you!`;

    // Fire a Lead event before opening the mail client — this reservation
    // email is a high-intent enquiry. trackEmailLead() route-gates the tour
    // via tourForLead() so the Lead is attributed to this tour.
    this.phoneService.trackEmailLead();

    // Open email client
    window.location.href = `mailto:info@banskounlocked.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  }

  // ---------------------------------------------------------------------------
  // Pre-booking checkout flow
  //
  // Opened by clicking the price or the "Reserve this tour" button — this is
  // the fix for the heatmap dead-click where riders tapped the (non-clickable)
  // price expecting to book. Step 1 collects rider details, step 2 takes the
  // PayPal deposit, step 3 confirms. On payment capture we POST the booking to
  // the API, which emails Enduro Brothers + the rider (see TourBookingService).
  // ---------------------------------------------------------------------------

  openCheckout() {
    if (!this.tour) return;
    this.showCheckout = true;
    this.checkoutStep = 1;
    this.bookingError = false;
    this.paypalRendered = false;
    this.setBodyScrollLock(true);
  }

  closeCheckout() {
    this.showCheckout = false;
    this.checkoutStep = 1;
    this.paypalRendered = false;
    this.setBodyScrollLock(false);
  }

  /** Lock/unlock background page scroll while the checkout dialog is open. */
  private setBodyScrollLock(locked: boolean) {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /** Toggle a riding-experience level on/off (multi-select). */
  toggleExperience(level: 'beginner' | 'intermediate' | 'advanced', checked: boolean) {
    const set = new Set(this.checkout.experienceLevels);
    checked ? set.add(level) : set.delete(level);
    this.checkout.experienceLevels = this.experienceChoices.filter((l) =>
      set.has(l),
    );
  }

  isExperienceSelected(level: 'beginner' | 'intermediate' | 'advanced'): boolean {
    return this.checkout.experienceLevels.includes(level);
  }

  private isValidPhone(phone: string): boolean {
    // Lenient: digits, spaces, +, -, (), at least 6 digits.
    return (phone.replace(/\D/g, '').length >= 6);
  }

  /** Localised "X riders booked in the last 30 days" — null when below quota. */
  get socialProofText(): string | null {
    const count = this.bookingStats?.recentBookings;
    if (!count) return null;
    return this.copy.socialProof.bookedRecently(count);
  }

  /** Localised "<Month> is filling up fast — reserve early" — null below quota.
   *  Month name comes from `Intl` so it's correctly translated per locale. */
  get seasonFillingText(): string | null {
    const m = this.bookingStats?.popularMonth;
    if (!m) return null;
    const monthName = new Date(m.year, m.month - 1, 1).toLocaleDateString(
      this.localeService.htmlLang(),
      { month: 'long' },
    );
    return this.copy.socialProof.fillingFast(monthName);
  }

  /** Formats the selected range for the email/booking, e.g. "12 Aug 2026 – 18 Aug 2026". */
  formattedDateRange(): string {
    const { startDate, endDate } = this.checkout;
    if (!startDate || !endDate) return '';
    const fmt = (d: Date) =>
      d.toLocaleDateString(this.localeService.htmlLang(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  }

  /** Step-1 form is valid when every required field is filled correctly. */
  get checkoutValid(): boolean {
    const contactOk =
      this.checkout.preferredContact !== 'other' ||
      this.checkout.contactOther.trim().length > 0;
    return (
      this.checkout.name.trim().length > 0 &&
      this.isValidEmail(this.checkout.email) &&
      this.isValidPhone(this.checkout.phone) &&
      !!this.checkout.preferredContact &&
      contactOk &&
      this.checkout.experienceLevels.length > 0 &&
      (this.checkout.riders ?? 0) >= MIN_RIDERS &&
      !!this.checkout.startDate &&
      !!this.checkout.endDate
    );
  }

  /** Advance to the PayPal step and render the deposit button into the dialog. */
  goToPayment() {
    if (!this.checkoutValid) return;
    this.checkoutStep = 2;
    this.paypalRendered = false;
    // The container only exists once step 2 is in the DOM.
    setTimeout(() => this.loadPayPalButton(), 50);
  }

  backToForm() {
    this.checkoutStep = 1;
    this.paypalRendered = false;
  }

  /** Stable English add-on labels for the staff inbox, regardless of locale. */
  private selectedExtras(): string[] {
    const extras: string[] = [];
    if (this.bookingExtras.newTires) extras.push('New tires (+€75/bike)');
    return extras;
  }

  /**
   * Persist the booking + trigger the transactional emails. Called after
   * PayPal captures the deposit, so payment has already succeeded — a failure
   * here must NOT lose the booking, hence we still show the success screen but
   * surface the email-fallback message.
   */
  private submitBooking(orderId: string, amount: number, currency: string) {
    if (!this.tour) return;
    this.submittingBooking = true;

    const extras = this.selectedExtras();
    const titleForBooking =
      this.tour.originalTitle && this.tour.originalTitle !== this.tour.title
        ? `${this.tour.title} (${this.tour.originalTitle})`
        : this.tour.title;

    const payload: CreateBookingPayload = {
      tourId: this.tour.id,
      tourSlug: this.tour.slug,
      tourTitle: titleForBooking,
      customerName: this.checkout.name.trim(),
      customerEmail: this.checkout.email.trim(),
      customerPhone: this.checkout.phone.trim(),
      preferredContact: this.checkout.preferredContact,
      preferredContactOther:
        this.checkout.preferredContact === 'other'
          ? this.checkout.contactOther.trim()
          : undefined,
      experienceLevels: this.checkout.experienceLevels,
      numberOfRiders: this.checkout.riders ?? MIN_RIDERS,
      preferredDates: this.formattedDateRange(),
      // Structured copies for stats aggregation on the backend (popular month).
      startDate: this.checkout.startDate?.toISOString().slice(0, 10),
      endDate: this.checkout.endDate?.toISOString().slice(0, 10),
      extras: extras.length ? extras : undefined,
      depositAmount: amount,
      currency,
      paypalOrderId: orderId,
      locale: this.localeService.current(),
      attribution: this.attribution.getFirstTouch() ?? undefined,
    };

    this.tourBooking.createBooking(payload).subscribe({
      next: () => {
        this.submittingBooking = false;
        this.bookingError = false;
        this.checkoutStep = 3;
      },
      error: () => {
        // Payment already went through — keep the success screen but tell the
        // rider to email us so we can finalise manually.
        this.submittingBooking = false;
        this.bookingError = true;
        this.checkoutStep = 3;
      },
    });
  }
}
