import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  PLATFORM_ID,
  Inject,
  inject,
  PendingTasks,
  NgZone,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { FaqComponent } from '../../components/faq/faq.component';
import { PhoneService } from '../../shared/services/phone.service';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { LocaleRouterLink } from '../../directives/locale-router-link.directive';
import { t } from '../../i18n';
import { DOCUMENT } from '@angular/common';
import { getReviewsForSchema } from '../../data/reviews.data';
import { ACTIVITIES, ACTIVITIES_SECTION_COPY } from '../../data/activities.data';
import type { BlogPost } from '../../data/blog-post.model';
import { loadRecentBlogPosts } from '../../data/blog-posts-lazy';

/** A single hero slide. `video` slide 0 is the SSR-painted, autoplaying hero;
 *  `promo` is the art-directed July-sale poster (`<picture>` chooses the crop);
 *  `image` slides are the rotating gallery stills. */
interface HeroSlide {
  type: 'video' | 'promo' | 'image';
  src: string;
  /** Portrait crop for the `promo` slide on narrow viewports. */
  srcMobile?: string;
  /** Poster frame for the `video` slide — this is the LCP candidate. */
  poster?: string;
}

@Component({
    selector: 'app-home',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        FaqComponent,
        RouterLink,
        LocaleRouterLink,
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private isBrowser: boolean;
  /** Keeps the app "unstable" until the lazy blog teaser data resolves, so the
   *  prerenderer waits and the teaser cards ship in the static HTML. */
  private pendingTasks = inject(PendingTasks);
  /** requestIdleCallback is NOT patched by Zone.js, so its callback runs
   *  outside Angular's zone — state changes there don't trigger change
   *  detection. We re-enter the zone when mounting the hero video. */
  private ngZone = inject(NgZone);

  /** Newest 3 posts in the active locale — populated in ngOnInit so the "From
   *  the Trail" teaser shows German posts on /de, French on /fr, etc. */
  recentPosts: BlogPost[] = [];

  /** Home "Activities" overview grid. */
  readonly activities = ACTIVITIES;
  readonly activitiesCopy = ACTIVITIES_SECTION_COPY;

  constructor(
    private router: Router,
    private phoneService: PhoneService,
    private seoService: SeoService,
    private localeService: LocaleService,
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) private doc: Document,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  @ViewChild('phoneSection') phoneSection!: ElementRef;
  @ViewChild('heroVideo') heroVideo?: ElementRef<HTMLVideoElement>;

  // ─── Hero slider ──────────────────────────────────────────────────────────
  // Declarative crossfade: every slide is rendered in the template and the
  // active one is flagged with `.is-active`; CSS does the fade. A single timer
  // advances `currentMediaIndex`. No manual DOM mutation, no layer juggling.
  //
  // Slide 0 is the enduro video — SSR-painted and autoplaying so the first
  // thing a visitor sees is real riding. Its <video poster> (the 95KB
  // enduro-hero-fallback.webp) is the actual LCP candidate and paints instantly
  // while the ~1.8MB MP4 streams in behind it — without it the hero flashes
  // blank before the first frame decodes. Slide 1 is the July-sale promo
  // poster, art-directed per viewport via <picture> (portrait crop on mobile,
  // wide on desktop).
  // Placeholder hero media reused from the existing gallery — swap for real
  // Bansko Unlocked activity footage before launch. The enduro July-sale promo
  // slide was removed (enduro-specific). Slide 0 (video) is the LCP candidate;
  // its poster is preloaded in index.html.
  readonly slides: HeroSlide[] = [
    {
      type: 'video',
      src: 'assets/home-videos-compressed/enduro-video-1.mp4',
      poster: 'assets/home-videos-compressed/enduro-hero-fallback.webp',
    },
    { type: 'image', src: 'assets/home-videos-compressed/enduro-image-2.jpg' },
    { type: 'image', src: 'assets/home-videos-compressed/enduro-image-1.jpg' },
    { type: 'image', src: 'assets/home-videos-compressed/enduro-image-3.jpg' },
    { type: 'image', src: 'assets/enduro-gallery/enduro-22.jpg' },
  ];

  currentMediaIndex = 0;

  // The visible hero caption tracks a *delayed* index so its text swaps at the
  // midpoint of the fade — keeping it in lockstep with the background media
  // rather than swapping the instant currentMediaIndex changes. heroTextHidden
  // drives the CSS caption fade-out/in.
  displayMessageIndex = 0;
  heroTextHidden = false;

  // The hero <video> is mounted only after hydration on idle so its ~1.8MB MP4
  // never competes with the LCP poster <img> during first paint. Stays false
  // through SSR/prerender, so the eager video request is absent from the HTML.
  showHeroVideo = false;

  // Flips true on the video's first `playing` event so CSS can crossfade it in
  // over the poster <img> — avoids a hard pop and never reveals a blank frame.
  heroVideoReady = false;

  // Only slides that have been (or are about to be) shown get a real `src`, so
  // the gallery stills don't compete with the LCP video poster on first paint.
  // Seeded with 0 (video) + 1 (the promo we crossfade to first). SSR renders
  // exactly this set, so there's no hydration mismatch.
  private loadedSlides = new Set<number>([0, 1]);

  readonly slideDuration = 6000; // each slide is on screen ~6s
  readonly transitionDuration = 800; // crossfade length — keep in sync with CSS

  private slideTimer: any;
  private textSwapTimeout: any;
  private intersectionObserver?: IntersectionObserver;

  // Cached DOM elements for better performance
  private featuresSection?: Element;

  // Locale-aware home copy. Hero rotator, buttons, Why-Choose-Us cards all
  // resolve from i18n/{en,de,fr,nl}.ts via LocaleService. The blank entry in
  // heroMessages is intentional — it pairs (by index) with the July-sale promo
  // slide, which already has all its copy baked into the image.
  get homeCopy() {
    return t(this.localeService.current()).pages.home;
  }
  get heroMessages() {
    return this.homeCopy.heroMessages;
  }

  ngOnInit() {
    // Snippet leans into the July promo for CTR — GSC pre-fix baseline shows
    // homepage at pos ~5 but CTR 3.59% vs ~6% expected (snippet underperforming).
    // EN copy below comes from i18n/en.ts; if the July promo ends, swap the EN
    // description back to the durable copy:
    //   'Enduro tours Bulgaria — Pirin singletrack on 2026 GASGAS & Husqvarna bikes from Bansko. No licence needed, all levels welcome.'
    // Past bug: hreflang to non-existent /bg/, /pl/, /ro/, /ru/ routed to the
    // wildcard 404 and weakened our SEO signal. addHreflangs() below only emits
    // locales with live routes.
    const locale = this.localeService.current();

    // Newest 3 posts for the "From the Trail" teaser, in the active locale.
    // Loaded lazily (per-locale dynamic import) so blog bodies stay out of the
    // initial bundle; PendingTasks makes the prerenderer await it.
    this.pendingTasks.run(async () => {
      this.recentPosts = await loadRecentBlogPosts(locale, 3);
    });

    this.applyHomeSeo();
    this.seoService.addHreflangs(this.localeService.hreflangAlternates('/'));

    if (!this.isBrowser) return;

    this.setupScrollAnimation();

    // Setup phone obfuscation for commented-out phone section
    // These will work if you uncomment the phone section
    this.phoneService.setupPhoneLink(
      'home-call-link-uk',
      this.phoneService.getDisplayPhone(),
    );
    // For Bulgaria number, you'd need to add it to the service or create a separate method
    // this.phoneService.setupPhoneLink('home-call-link-bg', '+359 XXX XXX XXX');

    // Cache DOM elements after a brief delay to ensure they're rendered
    setTimeout(() => {
      this.cacheElements();
    }, 100);
  }

  /** Homepage meta tags + @graph. */
  private applyHomeSeo(): void {
    const locale = this.localeService.current();
    const i18nMeta = t(locale).meta.home;
    const url = this.localeService.canonicalFor('/', locale);
    const inLang = this.localeService.htmlLang();
    const description = i18nMeta.description;

    this.seoService.updateMetaTags({
      title: i18nMeta.title,
      description,
      keywords: i18nMeta.keywords,
      url,
      locale: this.localeService.ogLocale(),
    });

    // Homepage @graph: WebPage + brand TravelAgency (AggregateRating +
    // supporting Review entities, merged with #travel-agency from index.html)
    // + a top-3 FAQ block. All in a single addGraphSchemas call so they share
    // the `script[data-dynamic]` slot — calling addStructuredData() after
    // would overwrite everything in there.
    // Top-3 FAQ for the homepage @graph.
    const faqNode = this.seoService.getFAQSchema(t(locale).pages.home.faqSchema);
    const { '@context': _faqCtx, ...faqGraph } = faqNode;

    const graph: any[] = [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: i18nMeta.title,
        description,
        url,
        inLanguage: inLang,
        about: { '@id': 'https://banskounlocked.com/#travel-agency' },
        publisher: { '@id': 'https://banskounlocked.com/#organization' },
      },
      faqGraph,
    ];
    // Brand AggregateRating only when reviews exist (empty rating is invalid).
    const reviewsForSchema = getReviewsForSchema();
    if (reviewsForSchema.length > 0) {
      const { '@context': _ctx, ...ratingGraph } = this.seoService.getAggregateRatingSchema(reviewsForSchema);
      graph.splice(1, 0, ratingGraph);
    }

    this.seoService.addGraphSchemas(graph);
  }

  private cacheElements() {
    this.featuresSection =
      document.querySelector('.why-choose-us-section') || undefined;
  }

  ngAfterViewInit() {
    // SSR/prerender runs this hook too, but nativeElement is a Domino mock with
    // no .play() — calling it throws and aborts the prerendered home page.
    // Everything here is browser-only DOM work, so bail on the server.
    if (!this.isBrowser) return;

    // The hero <video> isn't in the DOM yet — it's mounted on idle so the MP4
    // stays out of the LCP window. play() is kicked once it mounts.
    this.mountHeroVideoWhenIdle();

    this.scheduleNext();
  }

  /** Mount the hero <video> after the page has settled (idle), then re-assert
   *  muted/playsInline and kick autoplay for iOS Safari. Until then the
   *  preloaded poster <img> is the visible (and LCP) hero. If autoplay is
   *  blocked the poster simply remains. */
  private mountHeroVideoWhenIdle() {
    const mount = () => {
      // Re-enter Angular's zone: requestIdleCallback fires outside it, so a bare
      // assignment wouldn't schedule change detection and the @if would never
      // render the <video> (poster stays forever — the prod bug).
      this.ngZone.run(() => {
        this.showHeroVideo = true;
        // Let Angular render the <video>, then grab it via @ViewChild and play.
        setTimeout(() => {
          const video = this.heroVideo?.nativeElement;
          if (!video) return;
          video.muted = true;
          video.playsInline = true;
          video.play().catch(() => {
            /* autoplay blocked — poster <img> remains visible */
          });
        });
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(mount, { timeout: 3000 });
    } else {
      setTimeout(mount, 1500);
    }
  }

  // ─── Slider mechanics ───────────────────────────────────────────────────────

  /** True for the slide currently flagged active (used by the template/CSS). */
  isActive(index: number): boolean {
    return index === this.currentMediaIndex;
  }

  /** Gate the real `src` so off-screen gallery stills don't fetch until needed. */
  shouldLoad(index: number): boolean {
    return this.loadedSlides.has(index);
  }

  /** Choose the desktop vs portrait crop for the promo slide's <picture>. */
  // (handled in the template via <source media>; kept declarative — no JS.)

  private scheduleNext() {
    if (!this.isBrowser) return;
    if (this.slideTimer) clearTimeout(this.slideTimer);
    this.slideTimer = setTimeout(() => this.go(1), this.slideDuration);
  }

  /** Advance the slider by `step` (+1 next, -1 previous), wrapping around. */
  private go(step: number) {
    const len = this.slides.length;
    this.currentMediaIndex = (this.currentMediaIndex + step + len) % len;

    // Make sure the new slide and the one after it have a src ready, so the
    // current image is painted and the next crossfade has nothing to wait for.
    this.loadedSlides.add(this.currentMediaIndex);
    this.loadedSlides.add((this.currentMediaIndex + 1) % len);

    this.swapCaption();
    this.updateVideoPlayback();
    this.scheduleNext();
  }

  /** Crossfade the hero caption in lockstep with the media: fade out, swap the
   *  text at the hidden midpoint (via displayMessageIndex, never the live
   *  currentMediaIndex — that's what stops the caption swapping instantly
   *  mid-fade), then fade back in. Midpoint = half the crossfade duration. */
  private swapCaption() {
    this.heroTextHidden = true;
    if (this.textSwapTimeout) clearTimeout(this.textSwapTimeout);
    this.textSwapTimeout = setTimeout(() => {
      this.displayMessageIndex = this.currentMediaIndex;
      this.heroTextHidden = false;
    }, this.transitionDuration / 2);
  }

  /** Play the hero video only while its slide is active; pause it otherwise so
   *  it isn't decoding off-screen. Only slide 0 is a video. */
  private updateVideoPlayback() {
    const video = this.heroVideo?.nativeElement;
    if (!video) return;
    if (this.currentMediaIndex === 0) {
      video.play().catch(() => {/* autoplay blocked; rotation continues */});
    } else {
      video.pause();
    }
  }

  private setupScrollAnimation() {
    if (!this.isBrowser || typeof window === 'undefined') return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-up');
          }
        });
      },
      { threshold: 0.1 },
    );

    setTimeout(() => {
      if (this.phoneSection?.nativeElement) {
        this.intersectionObserver?.observe(this.phoneSection.nativeElement);
      }
    }, 100);
  }

  // ─── Manual navigation (wired to the optional prev/next controls) ───────────
  nextMedia() {
    this.go(1);
  }

  previousMedia() {
    this.go(-1);
  }

  getCurrentMessage() {
    return this.heroMessages[this.displayMessageIndex % this.heroMessages.length];
  }

  onBookNow() {
    // Navigate to the activities listing.
    this.router.navigate(['/activities']).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  scrollToFeatures() {
    // Use cached element if available
    if (this.featuresSection) {
      this.featuresSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      // Fallback if not cached
      const featuresSection = document.querySelector('.why-choose-us-section');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  ngOnDestroy() {
    if (!this.isBrowser) return;

    // Clean up timers to prevent memory leaks
    if (this.slideTimer) clearTimeout(this.slideTimer);
    if (this.textSwapTimeout) clearTimeout(this.textSwapTimeout);

    // Disconnect intersection observer
    this.intersectionObserver?.disconnect();

    // Pause and release the hero video
    const video = this.heroVideo?.nativeElement;
    if (video && typeof video.pause === 'function') {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }
}
