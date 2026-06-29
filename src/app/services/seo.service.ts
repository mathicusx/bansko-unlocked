import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: string;
  author?: string;
  locale?: string;
  robots?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private defaultConfig: SEOConfig = {
    title:
      'Bansko Unlocked — Adventure Activities in Bansko, Bulgaria',
    description:
      "Bansko Unlocked — adventure activities in Bansko, Bulgaria. ATV & buggy tours, a shooting range, mountain camping and winter snow riding in the Pirin Mountains.",
    keywords:
      'Bansko activities, Bansko ATV tours, buggy tours Bansko, shooting range Bansko, camping Bansko, snow riding Bansko, Pirin Mountains adventures, things to do in Bansko, Bansko Bulgaria adventure',
    image: 'https://banskounlocked.com/assets/og/og-image.jpg',
    url: 'https://banskounlocked.com/',
    type: 'website',
    author: 'Bansko Unlocked',
    locale: 'en_GB',
  };

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private doc: Document,
  ) {}

  /**
   * Update page meta tags and title
   */
  updateMetaTags(config: Partial<SEOConfig>): void {
    const seoConfig = { ...this.defaultConfig, ...config };

    // Update title
    this.titleService.setTitle(seoConfig.title);

    // Update standard meta tags
    this.metaService.updateTag({
      name: 'description',
      content: seoConfig.description,
    });

    if (seoConfig.keywords) {
      this.metaService.updateTag({
        name: 'keywords',
        content: seoConfig.keywords,
      });
    }

    if (seoConfig.author) {
      this.metaService.updateTag({ name: 'author', content: seoConfig.author });
    }

    // Update Open Graph tags for social media
    this.metaService.updateTag({
      property: 'og:title',
      content: seoConfig.title,
    });
    this.metaService.updateTag({
      property: 'og:description',
      content: seoConfig.description,
    });
    this.metaService.updateTag({
      property: 'og:type',
      content: seoConfig.type || 'website',
    });

    if (seoConfig.image) {
      this.metaService.updateTag({
        property: 'og:image',
        content: seoConfig.image,
      });
    }

    if (seoConfig.url) {
      this.metaService.updateTag({
        property: 'og:url',
        content: seoConfig.url,
      });
    }

    if (seoConfig.locale) {
      this.metaService.updateTag({
        property: 'og:locale',
        content: seoConfig.locale,
      });
      // Keep <html lang> in sync with the page locale. Runs during SSR/prerender
      // too (same DOCUMENT path as canonical/hreflang), so the static HTML Google
      // crawls declares the right language — a /de or /fr page must not ship
      // `lang="en"`. og:locale `de_DE` → html lang `de-DE`.
      this.doc.documentElement.setAttribute(
        'lang',
        seoConfig.locale.replace('_', '-'),
      );
    }

    // Update Twitter Card tags
    this.metaService.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.metaService.updateTag({
      name: 'twitter:title',
      content: seoConfig.title,
    });
    this.metaService.updateTag({
      name: 'twitter:description',
      content: seoConfig.description,
    });

    if (seoConfig.image) {
      this.metaService.updateTag({
        name: 'twitter:image',
        content: seoConfig.image,
      });
    }

    // OG image dimensions for richer social previews (1200x630 is optimal)
    this.metaService.updateTag({ property: 'og:image:width', content: '1200' });
    this.metaService.updateTag({ property: 'og:image:height', content: '630' });
    if (seoConfig.image) {
      this.metaService.updateTag({
        property: 'og:image:alt',
        content: seoConfig.imageAlt || seoConfig.title,
      });
    }

    // robots meta (only override default when explicitly set, e.g. noindex for admin)
    if (seoConfig.robots) {
      this.metaService.updateTag({ name: 'robots', content: seoConfig.robots });
    }

    // Update canonical URL
    this.updateCanonicalUrl(seoConfig.url || this.defaultConfig.url!);
  }

  /**
   * Replace the page's hreflang `<link>` set. Pass exactly the alternates that
   * are LIVE — never a locale that doesn't have a real route, because then
   * Google follows the link, hits the wildcard 404, and demotes both pages'
   * hreflang signal (the past `/bg/` bug — see CLAUDE.md).
   *
   * Clears prior `link[rel=alternate][hreflang]` first so navigating between
   * pages doesn't accumulate stale entries from previous routes.
   */
  addHreflangs(alternates: Array<{ hreflang: string; href: string }>): void {
    this.doc
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((el) => el.remove());

    for (const alt of alternates) {
      const link = this.doc.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', alt.hreflang);
      link.setAttribute('href', alt.href);
      this.doc.head.appendChild(link);
    }
  }

  /**
   * Update canonical URL
   */
  private updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.doc.querySelector(
      'link[rel="canonical"]',
    );

    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  /**
   * Add structured data (JSON-LD) to page — replaces the single dynamic slot.
   * For multiple schemas on one page, use addGraphSchemas() instead.
   */
  addStructuredData(schema: any): void {
    let script: HTMLScriptElement | null = this.doc.querySelector(
      'script[type="application/ld+json"][data-dynamic]',
    );

    if (!script) {
      script = this.doc.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-dynamic', 'true');
      this.doc.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);
  }

  /**
   * Add multiple schemas in a single @graph block.
   * Replaces the dynamic script — prevents the overwrite bug when called multiple times.
   */
  addGraphSchemas(schemas: any[]): void {
    let script: HTMLScriptElement | null = this.doc.querySelector(
      'script[type="application/ld+json"][data-dynamic]',
    );

    if (!script) {
      script = this.doc.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-dynamic', 'true');
      this.doc.head.appendChild(script);
    }

    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': schemas,
    });
  }

  /**
   * Remove dynamic structured data
   */
  removeStructuredData(): void {
    const script = this.doc.querySelector(
      'script[type="application/ld+json"][data-dynamic]',
    );
    if (script) {
      script.remove();
    }
  }

  /**
   * Base Organization schema node (use inside @graph)
   */
  getOrganizationSchema(): any {
    return {
      '@type': 'Organization',
      '@id': 'https://banskounlocked.com/#organization',
      name: 'Bansko Unlocked',
      url: 'https://banskounlocked.com',
      logo: {
        '@type': 'ImageObject',
        '@id': 'https://banskounlocked.com/#logo',
        url: 'https://banskounlocked.com/assets/logo/bansko-unlocked-logo.png',
        width: 400,
        height: 120,
        caption: 'Bansko Unlocked',
      },
      image: { '@id': 'https://banskounlocked.com/#logo' },
      description:
        'Adventure activities in Bansko, Bulgaria — ATV & buggy tours, a shooting range, mountain camping and winter snow riding in the Pirin Mountains.',
      email: 'info@banskounlocked.com',
      telephone: ['+44-7472362817', '+359-894494126'],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Pirin Mountains Region',
        addressLocality: 'Bansko',
        addressRegion: 'Blagoevgrad Province',
        postalCode: '2770',
        addressCountry: 'BG',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '41.8358',
        longitude: '23.4875',
      },
      sameAs: [],
    };
  }

  /**
   * WebSite schema with SearchAction (enables Google Sitelinks Search Box)
   */
  getWebSiteSchema(): any {
    return {
      '@type': 'WebSite',
      '@id': 'https://banskounlocked.com/#website',
      name: 'Bansko Unlocked',
      url: 'https://banskounlocked.com',
      description:
        'Adventure activities in Bansko, Bulgaria — ATV & buggy tours, shooting range, camping and snow riding in the Pirin Mountains.',
      inLanguage: 'en',
      publisher: { '@id': 'https://banskounlocked.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate:
            'https://banskounlocked.com/activities?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  /**
   * TouristTrip schema for individual tour pages. `pathPrefix` switches between
   * the enduro (`/tour`) and buggy (`/buggy-tour`) URL spaces so the same
   * schema builder works for both detail pages.
   *
   * Note: TouristTrip is NOT on Google's allowed-parent list for review
   * snippets (Rich Results Test flag "Invalid object type for field
   * <parent_node>" — confirmed 2026-05-19). Per-tour aggregateRating + review[]
   * lives on the Product node emitted by getTourProductSchema instead; Product
   * IS supported. The TouristTrip node intentionally carries no rating fields.
   */
  getTouristTripSchema(
    tour: {
      id: string;
      slug: string;
      title: string;
      description: string;
      priceEur: number;
      duration: string;
      difficulty: string[];
      image: string;
      promoPriceEur?: number;
      promoEndDate?: string;
      promo?: string;
      promoBookingPeriod?: string;
    },
    // Plain `string` so locale-prefixed spaces work too: '/tour',
    // '/buggy-tour', '/de/tour', '/de/buggy-tour'.
    pathPrefix: string = '/tour',
  ): any {
    const tourUrl = `https://banskounlocked.com${pathPrefix}/${tour.slug}`;
    const promoActive = !!(tour.promoPriceEur && tour.promoEndDate && new Date(tour.promoEndDate) > new Date());
    const effectivePrice = promoActive ? tour.promoPriceEur! : tour.priceEur;
    const priceValidUntil = promoActive ? tour.promoEndDate!.split('T')[0] : `${new Date().getFullYear() + 1}-12-31`;
    const offer: any = {
      '@type': 'Offer',
      price: effectivePrice,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: tourUrl,
      validFrom: new Date().toISOString().split('T')[0],
      priceValidUntil,
      seller: { '@id': 'https://banskounlocked.com/#organization' },
    };
    if (promoActive && tour.promo) {
      offer.name = tour.promoBookingPeriod
        ? `${tour.promo} – Valid for ${tour.promoBookingPeriod} bookings`
        : tour.promo;
    }
    const schema: any = {
      '@type': 'TouristTrip',
      '@id': `${tourUrl}#trip`,
      name: this.buildSeoTourName(tour, pathPrefix),
      description: tour.description,
      url: tourUrl,
      image: `https://banskounlocked.com/${tour.image}`,
      touristType: [
        'Adventure',
        'Sport',
        tour.difficulty.includes('Beginner')
          ? 'Beginner Friendly'
          : 'Experienced Riders',
      ],
      isAccessibleForFree: false,
      offers: offer,
      provider: { '@id': 'https://banskounlocked.com/#organization' },
      organizer: { '@id': 'https://banskounlocked.com/#organization' },
      location: {
        '@type': 'Place',
        name: 'Pirin Mountains, Bansko, Bulgaria',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Bansko',
          addressRegion: 'Blagoevgrad Province',
          addressCountry: 'BG',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '41.8358',
          longitude: '23.4875',
        },
      },
      availableLanguage: [
        { '@type': 'Language', name: 'English' },
        { '@type': 'Language', name: 'Bulgarian' },
        { '@type': 'Language', name: 'German' },
      ],
    };

    return schema;
  }

  /**
   * Set page as noindex/nofollow (admin and private pages)
   */
  setNoIndex(): void {
    this.metaService.updateTag({
      name: 'robots',
      content: 'noindex, nofollow',
    });
  }

  /**
   * Generate LocalBusiness schema for Bansko location with enhanced Bulgaria-specific content
   */
  getLocalBusinessSchema(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      '@id': 'https://banskounlocked.com/#organization',
      name: 'Enduro Brothers',
      alternateName: 'Enduro Brothers Bulgaria',
      description:
        "Enduro motorcycle tours across Bulgaria's stunning Pirin, Rila & Rhodope Mountains. Expert-guided off-road adventures through Bansko, Razlog, and Blagoevgrad region. Experience authentic Bulgarian mountain culture, world-class trails, and UNESCO-protected natural landscapes. No motorcycle license required for beginners!",
      url: 'https://banskounlocked.com',
      logo: 'https://banskounlocked.com/assets/logo/enduro-brothers-white-transparent.png',
      image: 'https://banskounlocked.com/assets/og/og-image.jpg',
      email: 'info@banskounlocked.com',
      telephone: ['+44-7472362817', '+359-894494126'],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Pirin Mountains Region',
        addressLocality: 'Bansko',
        addressRegion: 'Blagoevgrad Province',
        postalCode: '2770',
        addressCountry: 'BG',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '41.8358',
        longitude: '23.4875',
      },
      areaServed: [
        {
          '@type': 'City',
          name: 'Bansko',
          description:
            'Famous Bulgarian ski resort and enduro destination in Pirin Mountains',
          containedInPlace: {
            '@type': 'AdministrativeArea',
            name: 'Blagoevgrad Province',
          },
        },
        {
          '@type': 'City',
          name: 'Razlog',
          description:
            'Traditional Bulgarian town, gateway to Pirin National Park',
        },
        {
          '@type': 'City',
          name: 'Blagoevgrad',
          description: 'Regional capital of southwestern Bulgaria',
        },
        {
          '@type': 'Place',
          name: 'Pirin Mountains',
          description:
            'UNESCO World Heritage Site with spectacular enduro trails',
        },
        {
          '@type': 'Place',
          name: 'Pirin National Park',
          description:
            'Protected Bulgarian mountain wilderness, perfect for off-road adventures',
        },
        {
          '@type': 'Country',
          name: 'Bulgaria',
          description:
            'European destination for affordable, premium motorcycle tours',
        },
      ],
      serviceType: 'Adventure Tourism',
      priceRange: '€€€',
      currenciesAccepted: 'EUR, GBP',
      paymentAccepted: 'PayPal, Bank Transfer',
      knowsAbout: [
        'Enduro Riding',
        'Motorcycle Tours',
        'Mountain Adventures',
        'Off-road Biking',
        'Pirin Mountains Trails',
        'Bulgarian Mountain Culture',
        'European Adventure Tourism',
        'GASGAS Motorcycles',
        'Husqvarna Motorcycles',
        'Beginner Enduro Training',
        'Professional Enduro Guiding',
        'Bansko Tourism',
        'Bulgarian Hospitality',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Enduro Tour Packages',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Product',
              name: 'Weekend Wheels Adventure - 2 Day Enduro Tour',
              description:
                'Perfect introduction to Bulgarian mountain enduro riding in Bansko',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Product',
              name: "Pro Rider's 3-Day Expedition",
              description:
                'Advanced enduro challenge through Pirin Mountains technical trails',
            },
          },
        ],
      },
      sameAs: [
        'https://www.facebook.com/profile.php?id=100089495893811',
        'https://www.instagram.com/endurobrothersbulgaria/',
      ],
      keywords:
        'Bansko enduro tours, Bulgaria motorcycle adventures, Pirin Rila Rhodope Mountains off-road, Razlog enduro, Blagoevgrad motorcycle tours, Bulgarian mountain biking, European enduro destination, no license motorcycle tours Bulgaria, GASGAS tours Bansko, Husqvarna enduro Bulgaria, UNESCO Pirin trails',
    };
  }

  /**
   * Generate Product schema for tour packages. `pathPrefix` switches between
   * the enduro (`/tour`) and buggy (`/buggy-tour`) URL spaces.
   *
   * When `tourReviews` has 3+ entries, embeds `aggregateRating` + nested
   * `review[]` here on the Product node — Product IS on Google's allowed-parent
   * list for review snippets (TouristTrip is not; Rich Results Test rejects
   * it as "Invalid object type for field <parent_node>"). The visible review
   * list rendered on the tour-detail page must match this set, otherwise
   * Google strips the rich result.
   */
  getTourProductSchema(
    tour: {
      id: string;
      slug: string;
      title: string;
      description: string;
      priceEur: number;
      duration: string;
      difficulty: string[];
      image: string;
      startDate?: Date;
      endDate?: Date;
      promoPriceEur?: number;
      promoEndDate?: string;
      promo?: string;
      promoBookingPeriod?: string;
    },
    pathPrefix: string = '/tour',
    tourReviews: {
      rating: number;
      author: string;
      reviewBody: string;
      date: Date;
    }[] = [],
  ): any {
    const promoActive = !!(tour.promoPriceEur && tour.promoEndDate && new Date(tour.promoEndDate) > new Date());
    const effectivePrice = promoActive ? tour.promoPriceEur! : tour.priceEur;
    const priceValidUntil = promoActive
      ? tour.promoEndDate!.split('T')[0]
      : new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0];
    const offers: any = {
      '@type': 'Offer',
      price: effectivePrice,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `https://banskounlocked.com${pathPrefix}/${tour.slug}`,
      priceValidUntil,
    };
    if (promoActive && tour.promo) {
      offers.name = tour.promoBookingPeriod
        ? `${tour.promo} – Valid for ${tour.promoBookingPeriod} bookings`
        : tour.promo;
    }

    if (tour.startDate && tour.endDate) {
      offers.validFrom = tour.startDate.toISOString().split('T')[0];
      offers.validThrough = tour.endDate.toISOString().split('T')[0];
    }

    const product: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: this.buildSeoTourName(tour, pathPrefix),
      description: tour.description,
      image: `https://banskounlocked.com/${tour.image}`,
      brand: {
        '@type': 'Brand',
        name: 'Enduro Brothers',
      },
      offers: offers,
      category: 'Motorcycle Tour',
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Duration',
          value: tour.duration,
        },
        {
          '@type': 'PropertyValue',
          name: 'Location',
          value:
            'Bansko, Razlog, Blagoevgrad - Pirin Mountains UNESCO World Heritage Site, Bulgaria',
        },
        {
          '@type': 'PropertyValue',
          name: 'Difficulty Level',
          value: tour.difficulty.join(', '),
        },
        {
          '@type': 'PropertyValue',
          name: 'Region',
          value: 'Pirin Mountains, Southwestern Bulgaria, Balkans',
        },
        {
          '@type': 'PropertyValue',
          name: 'Starting Point',
          value: 'Bansko, Bulgaria (transfers from Sofia & Plovdiv available)',
        },
        {
          '@type': 'PropertyValue',
          name: 'Terrain',
          value:
            'Bulgarian mountain trails, forest paths, UNESCO-protected Pirin National Park',
        },
        {
          '@type': 'PropertyValue',
          name: 'License Required',
          value: tour.difficulty.includes('Beginner')
            ? 'No motorcycle license required'
            : 'Motorcycle experience recommended',
        },
        {
          '@type': 'PropertyValue',
          name: 'Includes',
          value:
            'Luxury hotel in Bansko area, all meals with Bulgarian cuisine, brand-new bikes, expert local guides',
        },
      ],
    };

    // Per-tour aggregateRating + review[] on the Product node — only when 3+
    // attributable reviews exist (Google's empirical threshold for reliable ★
    // rendering). Reviews referenced here MUST match the visible "What riders
    // said" section on tour-detail.component.html, otherwise Google strips the
    // rich result. Product (unlike TouristTrip) is on Google's allowed-parent
    // list for review snippets.
    if (tourReviews.length >= 3) {
      const avg = tourReviews.reduce((acc, r) => acc + r.rating, 0) / tourReviews.length;
      product.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avg.toFixed(1).replace(/\.0$/, ''),
        reviewCount: String(tourReviews.length),
        bestRating: '5',
        worstRating: '1',
      };
      product.review = tourReviews.map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        datePublished: r.date.toISOString().split('T')[0],
        reviewBody: r.reviewBody,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: '5',
          worstRating: '1',
        },
      }));
    }

    return product;
  }

  /**
   * Generate BreadcrumbList schema
   */
  getBreadcrumbSchema(breadcrumbs: { name: string; url: string }[]): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  /**
   * Generate FAQPage schema for better rich snippets in search results
   */
  getFAQSchema(faqs: { question: string; answer: string }[]): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer.replace(/<br>/g, '\n').replace(/<[^>]*>/g, ''),
        },
      })),
    };
  }

  /**
   * Build the SEO-leaning schema `name` for a tour. Frontloads the keyword
   * cluster ("<N>-Day Enduro Tour Bulgaria") and appends the brand title so
   * Google's rich-result snippet leads with the search query rather than the
   * internal product name. See the SEO master plan §3 item 11.
   *
   * Falls back to plain `tour.title` only if the duration can't be parsed —
   * never want to ship a malformed schema name.
   */
  private buildSeoTourName(
    tour: { title: string; duration: string },
    pathPrefix: string,
  ): string {
    const type = pathPrefix.includes('buggy') ? 'Buggy' : 'Enduro';
    // "2 Days" / "3 Day" / "7 days" → "2-Day" / "3-Day" / "7-Day".
    const match = (tour.duration || '').match(/(\d+)\s*Days?/i);
    if (!match) return tour.title;
    const prefix = `${match[1]}-Day ${type} Tour Bulgaria`;
    return `${prefix} — ${tour.title}`;
  }

  /**
   * Canonical brand-level aggregate-rating + per-Review schema. Carries the
   * same `@id` as the static TravelAgency node in `src/index.html`, so Google
   * merges this graph node with the static one rather than treating it as a
   * duplicate entity.
   *
   * Google's rich-result policy requires that `aggregateRating` be backed by
   * individual `Review` entities on the same page. To satisfy that, the static
   * TravelAgency in `src/index.html` no longer declares `aggregateRating` —
   * it's emitted from here, paired with the supporting `review[]`.
   *
   * Notes:
   *   - omits `name` — owned by the static node; emitting it here produces a
   *     "duplicate name field" warning when the two nodes merge.
   *   - omits `itemReviewed` on each nested `Review` — Google flags nested
   *     reviews with explicit `itemReviewed` as a reference conflict
   *     ("nested objects of <parent_node> cannot contain itemReviewed").
   *     The relationship is already implicit from being inside `review[]`.
   */
  getAggregateRatingSchema(
    reviews: {
      rating: number;
      author: string;
      reviewBody: string;
      date: Date;
    }[],
  ): any {
    const avg =
      reviews.reduce((acc, r) => acc + r.rating, 0) / Math.max(reviews.length, 1);
    const ratingValue = avg.toFixed(1).replace(/\.0$/, '');
    return {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      '@id': 'https://banskounlocked.com/#travel-agency',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue,
        reviewCount: String(reviews.length),
        bestRating: '5',
        worstRating: '1',
      },
      review: reviews.map((review) => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.author,
        },
        datePublished: review.date.toISOString().split('T')[0],
        reviewBody: review.reviewBody,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: '5',
          worstRating: '1',
        },
      })),
    };
  }
}
