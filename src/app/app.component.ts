import { Component, ViewChild, HostListener, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FooterComponent } from './components/footer/footer.component';
import { FloatingHelpComponent } from './components/floating-help/floating-help.component';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
import { ThemeService, Theme } from './shared/services/theme.service';
import { PhoneService } from './shared/services/phone.service';
import { PromoPopupComponent } from './shared/components/promo-popup/promo-popup.component';
import { PixelService } from './services/pixel.service';
import { AnalyticsService } from './services/analytics.service';
import { ClarityService } from './services/clarity.service';
import { TourService, Tour } from './services/tour.service';
import { BuggyTourService } from './services/buggy-tour.service';
import { LocaleService } from './services/locale.service';
import { LocaleRouterLink } from './directives/locale-router-link.directive';
import { t } from './i18n';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        RouterOutlet,
        RouterLink,
        LocaleRouterLink,
        RouterLinkActive,
        MatToolbarModule,
        MatSidenavModule,
        MatIconModule,
        MatButtonModule,
        MatListModule,
        MatMenuModule,
        FooterComponent,
        FloatingHelpComponent,
        ThemeToggleComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'bansko-unlocked';
  // Promo banner is dormant for the static launch (it was driven by the enduro
  // tour-promo API). Re-enable + repurpose for activity promos later.
  showPromoBanner = false;
  promoSavingsMinEur: number | null = null;
  promoSavingsMaxEur: number | null = null;
  promoSavingsMinGbp: number | null = null;
  promoSavingsMaxGbp: number | null = null;
  isHeaderVisible = true;
  lastScrollTop = 0;
  currentTheme: Theme = 'dark';
  // Reserved for when a real Bansko Unlocked logo image replaces the text
  // wordmark in app.component.html.
  logoUrl: string = 'assets/logo/bansko-unlocked-logo.png';
  private isBrowser: boolean;

  @ViewChild('drawer') drawer!: MatSidenav;

  isMobile = false;

  /** Locale-driven nav/promo/footer strings. Re-evaluated on each navigation
   *  because LocaleService.current() reads from `router.url`. */
  get chrome() {
    return t(this.localeService.current()).chrome;
  }

  /** Path map for routerLinks. */
  get links() {
    const p = (path: string) => this.localeService.localePath(path);
    return {
      home: p('/'),
      activities: p('/activities'),
      about: p('/about'),
      contact: p('/contact'),
      team: p('/team'),
      gallery: p('/gallery'),
      blog: p('/blog'),
      faq: p('/faq'),
    };
  }

  /** Promo banner copy with `{{ maxEur }}` / `{{ maxGbp }}` resolved. Returns
   *  null when there's nothing to show so the template can `*ngIf` cleanly. */
  get promoSavingsHtml(): string | null {
    if (this.promoSavingsMaxEur == null) return null;
    // £ savings show on the English site only — the UK rider segment is 47% of
    // clicks (GSC), so dual EUR/GBP helps there; on /de and /fr it's just noise.
    const showGbp =
      this.localeService.current() === 'en' && this.promoSavingsMaxGbp != null;
    const tpl = showGbp
      ? this.chrome.promo.savingsTemplateEurGbp
      : this.chrome.promo.savingsTemplateEurOnly;
    return tpl
      .replace('{{ maxEur }}', String(this.promoSavingsMaxEur))
      .replace('{{ maxGbp }}', String(this.promoSavingsMaxGbp ?? ''));
  }

  /** True on the home page. The home page manages its own mobile spacing, so
   *  the global `.component-container` mobile padding is suppressed there via
   *  `[class.is-home]`. */
  get isHomeRoute(): boolean {
    const path = this.router.url.split(/[?#]/)[0].replace(/\/$/, '');
    return path === '';
  }

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private themeService: ThemeService,
    private phoneService: PhoneService,
    private dialog: MatDialog,
    private pixel: PixelService,
    private analytics: AnalyticsService,
    private clarity: ClarityService,
    private tourService: TourService,
    private buggyTourService: BuggyTourService,
    public localeService: LocaleService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.breakpointObserver.observe([Breakpoints.HandsetPortrait])
        .subscribe(result => {
          this.isMobile = result.matches;
        });
    }
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Real-user Core Web Vitals → GA4 (own RUM; CrUX has no field data for this
    // origin yet). Fire-and-forget; web-vitals is dynamically imported inside.
    this.analytics.reportWebVitals();

    // Initialize theme service and watch for system theme changes
    this.themeService.watchSystemTheme();

    // Setup phone obfuscation for promo banner using service
    this.phoneService.setupPhoneLink('promo-call-link', 'Call Us');

    // Subscribe to theme changes and update logo accordingly
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      this.updateLogo();
    });

    // Track page views on every client-side route navigation (incl. first paint).
    // Single source of truth — index.html no longer fires PageView, so there's
    // exactly one Pixel + one CAPI event per page, deduped by event_id.
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.pixel.trackPageView();
        this.analytics.trackPageView(event.urlAfterRedirects);
        // Lazily load Clarity once, skipping localhost + /admin/* (no-op after first).
        this.clarity.init(event.urlAfterRedirects);
      }
    });

    // Show promo popup after a short delay (only once per session)
    this.showPromoPopup();

    // Promo savings range is dormant (enduro tour-promo API). See showPromoBanner.
    // this.loadPromoSavingsRange();
  }

  private loadPromoSavingsRange(): void {
    forkJoin({
      enduro: this.tourService.getTours(),
      buggy: this.buggyTourService.getTours(),
    }).subscribe(({ enduro, buggy }) => {
      const all = [...enduro, ...buggy];
      const activePromos = all.filter(t => this.isJulyPromo(t));

      const eurSavings = activePromos
        .map(t => t.priceEur - (t.promoPriceEur as number))
        .filter(s => s > 0);

      if (eurSavings.length === 0) {
        this.showPromoBanner = false;
        return;
      }
      this.promoSavingsMinEur = Math.min(...eurSavings);
      this.promoSavingsMaxEur = Math.max(...eurSavings);

      // GBP is optional — a tour may have an active EUR promo without a GBP
      // promo set. Only surface £-savings when at least one tour has both.
      const gbpSavings = activePromos
        .filter(t => t.priceGbp != null && t.promoPriceGbp != null)
        .map(t => (t.priceGbp as number) - (t.promoPriceGbp as number))
        .filter(s => s > 0);

      if (gbpSavings.length > 0) {
        this.promoSavingsMinGbp = Math.min(...gbpSavings);
        this.promoSavingsMaxGbp = Math.max(...gbpSavings);
      }
    });
  }

  private isJulyPromo(tour: Tour): boolean {
    if (!tour.promoPriceEur || !tour.promoEndDate) return false;
    if (new Date(tour.promoEndDate) <= new Date()) return false;
    return (tour.promoBookingPeriod || '').toLowerCase().includes('july');
  }

  private showPromoPopup(): void {
    if (!this.isBrowser) return;

    // Check if we're past February 28th, 2026
    const currentDate = new Date();
    const promoEndDate = new Date('2026-02-28T23:59:59');

    if (currentDate > promoEndDate) {
      return; // Don't show popup after February 28th
    }

    // Check if popup has been shown in this session
    const hasSeenPromo = sessionStorage.getItem('earlySeasonPromoSeen');

    if (!hasSeenPromo) {
      // Show popup after 2 seconds delay for better UX
      setTimeout(() => {
        const dialogRef = this.dialog.open(PromoPopupComponent, {
          width: '500px',
          maxWidth: '95vw',
          panelClass: 'promo-dialog',
          disableClose: false,
          autoFocus: false
        });

        dialogRef.afterClosed().subscribe(() => {
          // Mark as seen for this session
          sessionStorage.setItem('earlySeasonPromoSeen', 'true');
        });
      }, 2000);
    }
  }

  private updateLogo(): void {
    // The navbar currently renders a text wordmark, so logoUrl is unused. Kept
    // for when a real logo image (with light/dark variants) replaces it.
    this.logoUrl = 'assets/logo/bansko-unlocked-logo.png';
  }

  toggleMenu() {
    this.drawer.toggle();
  }

  closeMenu() {
    if (this.isMobile) {
      this.drawer.close();
    }
  }

  closePromoBanner() {
    this.showPromoBanner = false;
  }

  onPromoClick() {
    // Internal SPA navigation, so no batch-flush timing trap — but fire the
    // event before navigating anyway for consistency with the other trackers.
    this.analytics.trackSelectPromotion({
      promotionName: 'July Special Deal',
      promotionId: 'july-special',
      creativeSlot: 'top_banner',
    });
    this.router.navigateByUrl(this.localeService.localePath('/enduro-tours')).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    this.closePromoBanner();
  }


  @ViewChild('sidenav') sidenav!: MatSidenav;

  navigateAndClose(route: string) {
    this.sidenav.close();
    this.router.navigate([route]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  onSidenavToggle(isOpen: boolean) {
    // No need to prevent scroll anymore
  }

  navigateHome() {
    this.router.navigateByUrl(this.localeService.localePath('/')).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Close sidenav if it's open and user scrolls
    if (this.sidenav && this.sidenav.opened) {
      this.sidenav.close();
      return;
    }
    
    // Show header when scrolling up, hide when scrolling down (both mobile and desktop)
    if (currentScrollTop < this.lastScrollTop || currentScrollTop <= 100) {
      // Scrolling up or near top
      this.isHeaderVisible = true;
    } else {
      // Scrolling down
      this.isHeaderVisible = false;
    }
    
    this.lastScrollTop = currentScrollTop;
  }
}
