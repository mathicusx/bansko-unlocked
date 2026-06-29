import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { BuggyTourService } from '../../services/buggy-tour.service';
import { Tour, TourDay } from '../../services/tour.service';
import { AuthService } from '../../services/auth.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { CountdownTimerComponent } from '../../shared/components/countdown-timer/countdown-timer.component';
import { PixelService } from '../../services/pixel.service';
import { AnalyticsService } from '../../services/analytics.service';
import { environment } from '../../../environments/environment';
import { getReviewsForSchema, getReviewsForTour } from '../../data/reviews.data';
import { LocaleService } from '../../services/locale.service';
import { TourBookingService, CreateBookingPayload } from '../../services/tour-booking.service';
import { AttributionService } from '../../services/attribution.service';
import { t, translateDifficulty } from '../../i18n';
import { isLanguagePublished } from '../../data/tour-translations';
import { OptimizeImagePipe, CloudinarySrcsetPipe } from '../../pipes/optimize-image.pipe';
import { MIN_RIDERS } from '../../shared/booking.constants';

declare var paypal: any;

@Component({
    selector: 'app-buggy-tour-detail',
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
        CountdownTimerComponent,
        OptimizeImagePipe,
        CloudinarySrcsetPipe,
    ],
    templateUrl: './buggy-tour-detail.component.html',
    styleUrl: './buggy-tour-detail.component.scss'
})
export class BuggyTourDetailComponent implements OnInit, AfterViewInit {
  tour: Tour | null = null;
  loading = true;
  editing = false;
  saving = false;
  editData: any = {};
  uploadingImage = '';

  // --- Pre-booking checkout flow (the "Reserve this tour" dialog) ---
  // Ported from tour-detail so buggy bookings collect rider details and POST to
  // the backend (DB + Resend emails) instead of the old localStorage + alert().
  showCheckout = false;
  /** 1 = details form, 2 = PayPal deposit, 3 = success screen. */
  checkoutStep: 1 | 2 | 3 = 1;
  submittingBooking = false;
  /** True when the post-payment booking POST failed — payment still succeeded,
   *  so we show the email-fallback message instead of the normal confirmation. */
  bookingError = false;
  /** Guards against PayPal rendering its button twice into the container. */
  private paypalRendered = false;
  /** Experience is multi-select so mixed-level groups can tick more than one. */
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private phoneService: PhoneService,
    private seoService: SeoService,
    private buggyTourService: BuggyTourService,
    private authService: AuthService,
    private cloudinaryService: CloudinaryService,
    private pixel: PixelService,
    private analytics: AnalyticsService,
    private localeService: LocaleService,
    private tourBooking: TourBookingService,
    private attribution: AttributionService,
  ) {}

  /** Locale-aware page chrome — resolves EN or DE from i18n/{en,de}.ts.
   *  The tour CONTENT is localised upstream by BuggyTourService. */
  get copy() {
    return t(this.localeService.current()).pages.buggyTourDetail;
  }

  /** The checkout dialog reuses the shared tour-detail checkout copy (generic
   *  rider-details strings) so we don't duplicate ~35 keys across every locale. */
  get checkoutCopy() {
    return t(this.localeService.current()).pages.tourDetail.checkout;
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
        this.router.navigate(this.localeService.localizeLink(['/buggy-tours']));
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

  /** Loads the PayPal SDK (once) and renders the deposit button. Safe to call
   *  before the dialog is open — renderPayPalButton bails if its container
   *  (checkout step 2) isn't mounted yet, so this doubles as an SDK preload. */
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

  ngOnInit() {
    // Validate any stored admin token against the server; clears it if stale.
    this.authService.verify().subscribe();

    // Load tour from route params. When authed, hit the admin endpoint so drafts
    // (published=false) can be loaded into the inline edit view.
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;
      const token = this.authService.getToken();
      const load$ = this.isAdmin && token
        ? this.http.get<Tour>(`${environment.apiUrl}/tours/admin/${id}`, {
            headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
          })
        : this.buggyTourService.getTourById(id);
      load$.subscribe({
        next: tour => {
          this.tour = (tour as Tour) ?? null;
          this.loading = false;
          // Preload the PayPal SDK so the deposit button renders instantly when
          // the rider reaches step 2 of the checkout dialog.
          setTimeout(() => this.loadPayPalButton(), 100);
          if (this.tour) {
            this.injectTourSchemas(this.tour);
          } else {
            // Non-existent tour — keep the soft-404 view out of the index.
            this.seoService.setNoIndex();
          }
        },
        error: () => {
          this.loading = false;
        },
      });
    });
    // Per-tour meta, hreflang and the @graph are set by injectTourSchemas()
    // once the tour loads — it owns the data-dynamic slot. The old hard-coded
    // en/bg/de/pl/ro/ru `seoData` block was dead code (it keyed off
    // document.location.pathname, which is `/` during SSR/prerender) and is
    // gone; locale now comes from LocaleService via the URL route.
  }

  // Injected once the tour loads so per-tour TouristTrip + Product schemas
  // (with price + aggregateRating) and the BreadcrumbList carry the real tour
  // data. Mirrors tour-detail.updateTourSEO, but binds to the /buggy-tour URL
  // space via the pathPrefix argument.
  private injectTourSchemas(tour: Tour) {
    const locale = this.localeService.current();
    const copy = t(locale).pages.buggyTourDetail;
    const tourPath = `/buggy-tour/${tour.slug}`;
    const tourUrl = this.localeService.canonicalFor(tourPath, locale);
    // URL space the schema builders embed — locale-prefixed on /de + /fr.
    const tourPrefix = locale === 'en' ? '/buggy-tour' : `/${locale}/buggy-tour`;

    // Step 1 of the GA4 per-tour funnel — view_item — plus the matching Pixel
    // ViewContent the buggy detail page was missing entirely. Promo-aware price
    // so both trackers learn the real basket value.
    const promoActive = this.buggyTourService.hasActivePromo(tour);
    const displayPrice =
      promoActive && tour.promoPriceEur ? tour.promoPriceEur : tour.priceEur;
    const basePrice = promoActive && tour.promoPriceEur ? tour.priceEur : null;

    // Per-tour meta (locale-aware). Replaces the old generic, hard-coded
    // canonical (/buggy-tour-detail — which never existed).
    this.seoService.updateMetaTags({
      title: copy.seo.title(tour.title, displayPrice, tour.duration),
      description: copy.seo.description(tour.description, tour.duration, displayPrice, basePrice),
      keywords: copy.seo.keywords(tour.title, tour.duration, displayPrice),
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

    this.pixel.trackViewContent({
      contentId: tour.id,
      contentName: tour.title,
      category: 'Buggy Tour',
      value: displayPrice,
      currency: 'EUR',
    });
    this.analytics.trackViewItem({
      id: tour.id,
      name: tour.title,
      category: 'Buggy Tour',
      value: displayPrice,
      currency: 'EUR',
    });

    // Register the tour so WhatsApp / phone Lead events fired from the global
    // floating-help widget or footer while on this page attribute to it.
    this.phoneService.setCurrentTour({
      id: tour.id,
      name: tour.title,
      category: 'Buggy Tour',
    });

    // Brand-level rating + supporting reviews (same #travel-agency @id as the
    // static node in src/index.html). TouristTrip/Product no longer claim
    // per-tour aggregateRating, so the brand rating is the only star signal.
    const ratingNode = this.seoService.getAggregateRatingSchema(getReviewsForSchema());
    const { '@context': _ctx, ...ratingGraph } = ratingNode;
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
      this.seoService.getTourProductSchema(tour, tourPrefix, getReviewsForTour(tour.slug)),
      this.seoService.getBreadcrumbSchema([
        { name: t(locale).chrome.nav.home, url: this.localeService.canonicalFor('/', locale) },
        // /de has no buggy-tours listing mirror — this crumb points at the EN listing.
        { name: t(locale).chrome.nav.buggyTours, url: 'https://banskounlocked.com/buggy-tours' },
        { name: tour.title, url: tourUrl },
      ]),
      ratingGraph,
    ]);
  }

  ngAfterViewInit() {
    // PayPal button is loaded after tour data arrives (ngOnInit) and re-rendered
    // into the dialog when the rider reaches step 2 — see loadPayPalButton.
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
          // each carrying this tour: Meta InitiateCheckout + GA4 begin_checkout.
          if (this.tour) {
            this.pixel.trackInitiateCheckout({
              contentId: this.tour.id,
              contentName: this.tour.title,
              category: 'Buggy Tour',
              value: this.getDepositAmount(),
            });
            this.analytics.trackBeginCheckout({
              value: this.getDepositAmount(),
              items: [{ id: this.tour.id, name: this.tour.title, category: 'Buggy Tour' }],
            });
          }
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: this.getDepositAmount().toFixed(2),
                  currency_code: 'EUR',
                },
                description: 'Enduro Brothers Buggy Tour Deposit',
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
    return 200; // €200 deposit per buggy booking (paid now; balance on arrival).
  }

  private handlePaymentSuccess(details: any, currency: string, amount: number) {
    console.log('Payment successful:', details);

    const bookingInfo = {
      tourId: this.tour?.id,
      tourTitle: this.tour?.title,
      paymentId: details.id,
      currency: currency,
      amount: amount,
      payerEmail: details.payer?.email_address,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(`booking-${details.id}`, JSON.stringify(bookingInfo));

    // Fire Pixel + Conversions API Purchase event (deduped by event_id) — the
    // highest-value conversion signal we have, so don't skip it.
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

    // Persist the booking + fire the notification/confirmation emails, then show
    // the in-dialog success screen (step 3). No more alert()/redirect — the
    // dialog owns the confirmation UX now (matches the enduro flow).
    this.submitBooking(details.id, amount, currency);
  }

  // ---------------------------------------------------------------------------
  // Pre-booking checkout flow — opened by the "Reserve this tour" button.
  // Step 1 collects rider details, step 2 takes the PayPal deposit, step 3
  // confirms. On capture we POST the booking to the API (DB + emails).
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

  private isValidPhone(phone: string): boolean {
    // Lenient: digits, spaces, +, -, (), at least 6 digits.
    return phone.replace(/\D/g, '').length >= 6;
  }

  /** Toggle a riding-experience level on/off (multi-select). */
  toggleExperience(level: 'beginner' | 'intermediate' | 'advanced', checked: boolean) {
    const set = new Set(this.checkout.experienceLevels);
    checked ? set.add(level) : set.delete(level);
    this.checkout.experienceLevels = this.experienceChoices.filter((l) => set.has(l));
  }

  isExperienceSelected(level: 'beginner' | 'intermediate' | 'advanced'): boolean {
    return this.checkout.experienceLevels.includes(level);
  }

  /** Formats the selected range, e.g. "12 Aug 2026 – 18 Aug 2026". */
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

  /**
   * Persist the booking + trigger the transactional emails. Called after PayPal
   * captures the deposit, so payment has already succeeded — a failure here must
   * NOT lose the booking, hence we still show the success screen but surface the
   * email-fallback message.
   */
  private submitBooking(orderId: string, amount: number, currency: string) {
    if (!this.tour) return;
    this.submittingBooking = true;

    const payload: CreateBookingPayload = {
      tourId: this.tour.id,
      tourSlug: this.tour.slug,
      tourTitle:
        this.tour.originalTitle && this.tour.originalTitle !== this.tour.title
          ? `${this.tour.title} (${this.tour.originalTitle})`
          : this.tour.title,
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
      startDate: this.checkout.startDate?.toISOString().slice(0, 10),
      endDate: this.checkout.endDate?.toISOString().slice(0, 10),
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

  private handlePaymentError(currency: string) {
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
        return '#b45309';
      case 'pro':
        return '#b91c1c';
      default:
        return '#4b5563';
    }
  }

  goBack() {
    this.router.navigate(this.localeService.localizeLink(['/buggy-tours']));
  }

  openWhatsApp() {
    if (!this.tour) return;
    const message = `Hi! I'm interested in the ${this.tour.title} tour. Could you give me more details?`;
    const number = this.phoneService.getWhatsAppPhone('uk');
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    const tourRef = { id: this.tour.id, name: this.tour.title, category: 'Buggy Tour' };
    this.pixel.trackLead(undefined, 'WhatsApp', tourRef);
    this.analytics.trackLead(undefined, 'WhatsApp', tourRef);
    window.open(url, '_blank', 'noopener');
  }

  hasActivePromo(): boolean {
    if (!this.tour) return false;
    return this.buggyTourService.hasActivePromo(this.tour);
  }

  getDiscountPercentage(currency: 'eur' | 'gbp'): number {
    if (!this.tour) return 0;
    return this.buggyTourService.getDiscountPercentage(this.tour, currency);
  }

  sendBookingEmail() {
    if (!this.tour) return;

    // On non-EN locales append the original English title in brackets so the
    // staff inbox (which is read in English) can still identify the booking.
    // No-op on EN — `originalTitle` is absent and `title` is already English.
    const titleForEmail = this.tour.originalTitle && this.tour.originalTitle !== this.tour.title
      ? `${this.tour.title} (${this.tour.originalTitle})`
      : this.tour.title;

    const subject = `Buggy Tour Reservation - ${titleForEmail}`;
    const body = `Hello Enduro Brothers,%0D%0A%0D%0A` +
      `I have just reserved my spot and would like to confirm my preferred dates:%0D%0A%0D%0A` +
      `Tour: ${titleForEmail}%0D%0A` +
      `Preferred dates: %0D%0A` +
      `Number of people: %0D%0A%0D%0A` +
      `Thank you!`;

    // Fire a Lead event before opening the mail client — this reservation
    // email is a high-intent enquiry. trackEmailLead() route-gates the tour
    // via tourForLead() so the Lead is attributed to this buggy tour.
    this.phoneService.trackEmailLead();

    window.location.href = `mailto:info@banskounlocked.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  }
}
