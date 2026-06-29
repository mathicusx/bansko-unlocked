import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { t } from '../../i18n';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { REVIEWS, ReviewData, getReviewsForSchema } from '../../data/reviews.data';

@Component({
    selector: 'app-reviews',
    imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
    templateUrl: './reviews.component.html',
    styleUrl: './reviews.component.scss'
})
export class ReviewsComponent implements OnInit {
  @ViewChild('carouselTrack') carouselTrack!: ElementRef<HTMLElement>;

  private currentOffset = 0;
  private touchStartX = 0;
  private touchStartY = 0;

  private visibleCount(): number {
    const w = window.innerWidth;
    if (w > 900) return 3;
    if (w > 560) return 2;
    return 1;
  }

  scrollByCard(direction: 1 | -1) {
    const track = this.carouselTrack.nativeElement;
    const card = track.querySelector('.review-card') as HTMLElement;
    if (!card) return;
    const gap = 24;
    const step = card.offsetWidth + gap;
    const maxOffset = Math.max(0, (this.reviews.length - this.visibleCount()) * step);
    this.currentOffset = Math.max(0, Math.min(this.currentOffset + direction * step, maxOffset));
    track.style.transform = `translateX(-${this.currentOffset}px)`;
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent) {
    const dx = event.changedTouches[0].clientX - this.touchStartX;
    const dy = event.changedTouches[0].clientY - this.touchStartY;
    // Only treat as horizontal swipe if horizontal movement dominates
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    this.scrollByCard(dx < 0 ? 1 : -1);
  }

  get isMobile(): boolean {
    return window.innerWidth <= 480;
  }

  reviews: ReviewData[] = REVIEWS;

  // Reviews longer than this character count are clamped to a fixed height in
  // the carousel with a "Read more" toggle. Picked empirically — at our card
  // width and font size, ~360 chars is roughly 6 lines, after which short
  // reviews on the same row would otherwise sit in a sea of whitespace.
  private readonly CLAMP_THRESHOLD = 360;

  private expanded = new Set<number>();

  needsClamp(review: ReviewData): boolean {
    return review.text.length > this.CLAMP_THRESHOLD;
  }

  isExpanded(index: number): boolean {
    return this.expanded.has(index);
  }

  toggleExpand(index: number): void {
    if (this.expanded.has(index)) this.expanded.delete(index);
    else this.expanded.add(index);
  }

  get copy() {
    return t(this.localeService.current()).pages.reviews;
  }

  constructor(
    private seoService: SeoService,
    private localeService: LocaleService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Embedded-mode guard: ReviewsComponent renders both at /reviews (route owner)
    // and as a child of home.component.html. Only inject SEO meta + canonical + schema
    // when we're actually the page owner — otherwise we'd overwrite the host page's tags.
    // Use Router.url (not document.location.pathname) — the latter returns '/' for
    // every route during SSR/prerender, which broke an earlier attempt at this guard.
    const currentPath = this.router.url.split(/[?#]/)[0];
    const isOwnRoute = currentPath === '/reviews' || currentPath === '/reviews/';
    if (!isOwnRoute) return;

    const locale = this.localeService.current();
    const i18nMeta = t(locale).meta.reviews;
    const url = this.localeService.canonicalFor('/reviews', locale);
    const homeUrl = this.localeService.canonicalFor('/', locale);
    const inLang = this.localeService.htmlLang();

    this.seoService.updateMetaTags({
      title: i18nMeta.title,
      description: i18nMeta.description,
      keywords: i18nMeta.keywords,
      url,
      locale: this.localeService.ogLocale(),
    });
    this.seoService.addHreflangs(this.localeService.hreflangAlternates('/reviews'));

    // @graph: WebPage + Breadcrumb, plus the brand AggregateRating ONLY when
    // there are reviews (an empty aggregateRating with reviewCount 0 is invalid
    // and Google rejects it). The rating node shares the canonical
    // #travel-agency @id so it merges with the static schema in index.html.
    const reviewsForSchema = getReviewsForSchema();
    const graph: any[] = [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: i18nMeta.title,
        description: i18nMeta.description,
        url,
        inLanguage: inLang,
        about: { '@id': 'https://banskounlocked.com/#travel-agency' },
        publisher: { '@id': 'https://banskounlocked.com/#organization' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: 'Reviews', item: url },
        ],
      },
    ];
    if (reviewsForSchema.length > 0) {
      const { '@context': _ctx, ...ratingGraph } = this.seoService.getAggregateRatingSchema(reviewsForSchema);
      graph.unshift(ratingGraph);
    }

    this.seoService.addGraphSchemas(graph);
  }

  getStarArray(rating: number): number[] {
    return Array(rating).fill(0);
  }
}