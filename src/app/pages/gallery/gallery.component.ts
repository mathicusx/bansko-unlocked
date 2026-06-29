import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, Input } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
    selector: 'app-gallery',
    imports: [CommonModule],
    templateUrl: './gallery.component.html',
    styleUrl: './gallery.component.scss'
})
export class GalleryComponent implements OnInit, OnDestroy {
  private touchStartX = 0;
  private touchEndX = 0;
  private minSwipeDistance = 50;
  private isAnimating = false;
  private isBrowser: boolean;
  swipeDirection = '';

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private seoService: SeoService,
    @Inject(DOCUMENT) private document: Document,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Full gallery: every available shot (enduro-1..62, #4 missing). Each image
  // has responsive webp variants from the compress-images pipeline — the grid
  // uses the smaller `-md.webp` thumbnail (lazy-loaded), the lightbox the
  // larger `-lg.webp`, so the page stays light despite 60+ photos.
  images = GalleryComponent.buildGallery();

  /** When embedded (e.g. in /about), cap the grid to a preview of N photos.
   *  Unset on the standalone /gallery route, which shows the full set. */
  @Input() limit?: number;

  /** The images actually rendered — full set, or the first `limit` as a preview. */
  get displayImages(): { thumb: string; full: string; alt: string }[] {
    return this.limit ? this.images.slice(0, this.limit) : this.images;
  }

  private static buildGallery(): { thumb: string; full: string; alt: string }[] {
    const ids = Array.from({ length: 62 }, (_, i) => i + 1).filter(n => n !== 4);
    // Varied, natural alt copy (no keyword stuffing, no competitor names) —
    // cycled across the set so each photo has a descriptive, keyword-relevant alt.
    const alts = [
      'Adventure on a Pirin Mountains trail near Bansko',
      'Guided group crossing a forest trail in the Pirin Mountains',
      'Off-road riding on a rocky mountain climb above Bansko',
      'Crossing a mountain river on a Bansko adventure',
      'Open mountain ridge views in the Pirin near Bansko',
      'Riding through Bulgarian pine forest near Bansko',
      'Group resting with Pirin Mountains scenery behind',
      'A technical mountain section on a Bansko trail',
      'A scenic trail through green Bulgarian valleys',
      'Sunset over a Pirin Mountains trail near Bansko',
      'Trail action on a guided Bansko adventure',
      'Mountain panorama from a Bansko viewpoint',
    ];
    return ids.map((n, i) => ({
      thumb: `assets/enduro-gallery/enduro-${n}-md.webp`,
      full: `assets/enduro-gallery/enduro-${n}-lg.webp`,
      alt: alts[i % alts.length],
    }));
  }

  isModalOpen = false;
  currentImageIndex = 0;

  openModal(index: number) {
    this.currentImageIndex = index;
    this.isModalOpen = true;
    if (this.isBrowser && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  }

  closeModal() {
    this.isModalOpen = false;
    if (this.isBrowser && typeof document !== 'undefined') {
      document.body.style.overflow = 'auto'; // Restore scrolling
    }
  }

  previousImage() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    this.currentImageIndex = this.currentImageIndex > 0
      ? this.currentImageIndex - 1
      : this.displayImages.length - 1;
    
    setTimeout(() => {
      this.isAnimating = false;
      this.swipeDirection = '';
    }, 300);
  }

  nextImage() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    this.currentImageIndex = this.currentImageIndex < this.displayImages.length - 1
      ? this.currentImageIndex + 1
      : 0;
    
    setTimeout(() => {
      this.isAnimating = false;
      this.swipeDirection = '';
    }, 300);
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.isModalOpen) return;
    
    switch(event.key) {
      case 'Escape':
        this.closeModal();
        break;
      case 'ArrowLeft':
        this.previousImage();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
    }
  }

  onTouchStart(event: TouchEvent) {
    if (!this.isModalOpen) return;
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isModalOpen) return;
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const swipeDistance = this.touchStartX - this.touchEndX;
    
    if (Math.abs(swipeDistance) > this.minSwipeDistance && !this.isAnimating) {
      if (swipeDistance > 0) {
        // Swiped left - go to next image
        this.swipeDirection = 'next';
        this.nextImage();
      } else {
        // Swiped right - go to previous image
        this.swipeDirection = 'prev';
        this.previousImage();
      }
    }
  }

  ngOnInit() {
    if (this.isBrowser && typeof document !== 'undefined') {
      document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    // Embedded inside <app-about> too — guard so we don't overwrite the host
    // page's meta. Router.url, not document.location.pathname: the latter is
    // '/' during SSR/prerender, which is exactly when this guard matters.
    const currentPath = this.router.url.split(/[?#]/)[0];
    const isOwnRoute = currentPath === '/gallery' || currentPath === '/gallery/';
    if (!isOwnRoute) return;

    // SEO meta (English-only site).
    const meta = {
      title: 'Photo Gallery | Bansko Unlocked — Adventure Activities in Bansko',
      description: 'Photos from our Bansko adventures — ATV & buggy tours, the shooting range, mountain camping and snow riding in the Pirin Mountains.',
      keywords: 'Bansko gallery, Bansko activities photos, ATV buggy Bansko photos, Pirin Mountains pictures, things to do in Bansko',
      url: 'https://banskounlocked.com/gallery',
      locale: 'en_GB',
    };
    this.seoService.updateMetaTags(meta);

    // Structured data for WebPage + Organization
    this.seoService.addStructuredData({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          'name': meta.title,
          'description': meta.description,
          'url': meta.url,
          'inLanguage': meta.locale.replace('_', '-'),
          'publisher': { '@id': 'https://banskounlocked.com/#organization' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://banskounlocked.com/' },
            { '@type': 'ListItem', position: 2, name: 'Gallery', item: 'https://banskounlocked.com/gallery' },
          ]
        }
      ]
    });
  }

  ngOnDestroy() {
    if (this.isBrowser && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.onKeyDown.bind(this));
    }
  }
}
