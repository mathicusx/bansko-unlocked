import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { PhoneService } from '../../shared/services/phone.service';
import { OptimizeImagePipe, CloudinarySrcsetPipe } from '../../pipes/optimize-image.pipe';
import { Activity, findActivityBySlug } from '../../data/activities.data';

/**
 * Single activity landing page (/activities/:slug). Static content from
 * activities.data.ts — no API. Renders a photo hero, body, gallery and enquiry
 * CTAs (WhatsApp / email / phone + a link to the contact form). Follows the
 * site page-styling conventions (mixins, themed cards/buttons, one static
 * keyworded <h1>, SeoService meta in ngOnInit).
 */
@Component({
  selector: 'app-activity',
  imports: [CommonModule, MatButtonModule, MatIconModule, RouterLink, OptimizeImagePipe, CloudinarySrcsetPipe],
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.scss',
})
export class ActivityComponent implements OnInit {
  activity?: Activity;
  readonly email = environment.contact.email;

  constructor(
    private route: ActivatedRoute,
    private seoService: SeoService,
    private localeService: LocaleService,
    private phoneService: PhoneService,
    @Inject(DOCUMENT) private doc: Document,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? '';
      this.activity = findActivityBySlug(slug);
      this.applySeo();
    });
  }

  /** mailto: link with a pre-filled subject for the enquiry CTA. */
  get mailtoHref(): string {
    const subject = this.activity ? this.activity.enquirySubject : 'Activity enquiry';
    return `mailto:${this.email}?subject=${encodeURIComponent(subject)}`;
  }

  openWhatsApp(): void {
    const subject = this.activity ? this.activity.enquirySubject : 'Activity enquiry';
    this.phoneService.openWhatsApp(`Hello! I'd like to enquire about: ${subject}`);
  }

  callUs(): void {
    this.phoneService.makeCall();
  }

  trackEmail(): void {
    this.phoneService.trackEmailLead();
  }

  private applySeo(): void {
    if (!this.activity) {
      this.seoService.updateMetaTags({
        title: 'Activity Not Found | Bansko Unlocked',
        description: 'The activity you were looking for does not exist.',
        robots: 'noindex, follow',
      });
      return;
    }

    const path = `/activities/${this.activity.slug}`;
    const url = this.localeService.canonicalFor(path);
    const image = `https://banskounlocked.com/${this.activity.heroImage}`;

    this.seoService.updateMetaTags({
      title: this.activity.seo.title,
      description: this.activity.seo.description,
      keywords: this.activity.seo.keywords,
      url,
      image,
      imageAlt: this.activity.heroAlt,
      locale: this.localeService.ogLocale(),
    });
    this.seoService.addHreflangs(this.localeService.hreflangAlternates(path));

    this.seoService.addGraphSchemas([
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: this.activity.name,
        description: this.activity.seo.description,
        serviceType: this.activity.name,
        url,
        image,
        areaServed: { '@type': 'City', name: 'Bansko', addressCountry: 'BG' },
        provider: { '@id': 'https://banskounlocked.com/#organization' },
      },
      this.seoService.getBreadcrumbSchema([
        { name: 'Home', url: this.localeService.canonicalFor('/') },
        { name: 'Activities', url: this.localeService.canonicalFor('/activities') },
        { name: this.activity.name, url },
      ]),
    ]);
  }
}
