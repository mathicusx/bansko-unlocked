import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { PhoneChoiceDialogComponent } from '../components/phone-choice-dialog/phone-choice-dialog.component';
import { PixelService } from '../../services/pixel.service';
import { AnalyticsService } from '../../services/analytics.service';

@Injectable({
  providedIn: 'root'
})
export class PhoneService {
  private isBrowser: boolean;

  /** The tour the rider is currently viewing, set by the tour-detail pages.
   *  Lets WhatsApp / phone Lead events fired from the global floating-help
   *  widget or footer be attributed to a tour. Read only via tourForLead(),
   *  which route-gates it against stale context. */
  private currentTour: { id: string; name: string; category: string } | null = null;

  constructor(
    private dialog: MatDialog,
    private pixel: PixelService,
    private analytics: AnalyticsService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /** Called by the tour / buggy-tour detail pages when a tour loads, so any
   *  WhatsApp or phone Lead fired while on that page carries the tour. */
  setCurrentTour(tour: { id: string; name: string; category: string }): void {
    this.currentTour = tour;
  }

  /** The current tour — but only when the rider is genuinely on a tour detail
   *  route. Route-gating stops a stale context from wrongly attributing a
   *  home- or contact-page enquiry to the last tour viewed. */
  private tourForLead(): { id: string; name: string; category: string } | undefined {
    const path = this.router.url.split(/[?#]/)[0];
    const onTourPage = /^\/(buggy-)?tour\//.test(path);
    return onTourPage && this.currentTour ? this.currentTour : undefined;
  }

  /**
   * Build complete phone number from parts
   */
  private buildPhoneNumber(phoneConfig: any): string {
    return phoneConfig.countryCode + phoneConfig.part1 + phoneConfig.part2 + phoneConfig.part3;
  }

  /**
   * Build formatted display phone number
   */
  private buildDisplayPhone(phoneConfig: any): string {
    return `${phoneConfig.countryCode} ${phoneConfig.part1} ${phoneConfig.part2} ${phoneConfig.part3}`;
  }

  /**
   * Build WhatsApp-ready phone number (no + symbol)
   */
  private buildWhatsAppPhone(phoneConfig: any): string {
    return phoneConfig.countryCode.substring(1) + phoneConfig.part1 + phoneConfig.part2 + phoneConfig.part3;
  }

  /**
   * Get the complete phone number for tel: links (defaults to UK)
   * @param country - 'uk' or 'bulgaria'
   * @returns Complete phone number (e.g., "+447123456789")
   */
  getTelLink(country: 'uk' | 'bulgaria' = 'uk'): string {
    const phoneConfig = environment.contact.phones[country];
    return this.buildPhoneNumber(phoneConfig);
  }

  /**
   * Get formatted phone number for display (defaults to UK)
   * @param country - 'uk' or 'bulgaria'
   * @returns Formatted phone number (e.g., "+44 7123 456 789")
   */
  getDisplayPhone(country: 'uk' | 'bulgaria' = 'uk'): string {
    const phoneConfig = environment.contact.phones[country];
    return this.buildDisplayPhone(phoneConfig);
  }

  /**
   * Get phone number for WhatsApp (without + symbol, defaults to UK)
   * @param country - 'uk' or 'bulgaria'
   * @returns WhatsApp ready number (e.g., "447123456789")
   */
  getWhatsAppPhone(country: 'uk' | 'bulgaria' = 'uk'): string {
    const phoneConfig = environment.contact.phones[country];
    return this.buildWhatsAppPhone(phoneConfig);
  }

  /**
   * Setup obfuscated phone link that shows country choice
   * @param elementId - ID of the element to setup
   * @param displayText - Optional custom display text
   */
  setupPhoneLink(elementId: string, displayText?: string): void {
    if (!this.isBrowser) return;

    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.addEventListener('click', (e) => {
          e.preventDefault();
          this.showPhoneChoice();
        });
        element.textContent = displayText || 'Click to Call';
        element.style.cursor = 'pointer';
      }
    }, 100);
  }

  /**
   * Show phone choice dialog and make call
   */
  showPhoneChoice(): void {
    const ukPhone = this.getDisplayPhone('uk');
    const bgPhone = this.getDisplayPhone('bulgaria');
    
    const dialogRef = this.dialog.open(PhoneChoiceDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: {
        title: 'Choose Number to Call',
        ukPhone: ukPhone,
        bulgariaPhone: bgPhone,
        type: 'call'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!this.isBrowser) return;

      // Fire the Lead BEFORE navigating to tel:. On mobile the dialer steals
      // focus the instant window.location changes, which can drop a GA/Pixel
      // beacon queued afterwards — the long-standing reason mobile phone leads
      // never landed in GA4. WhatsApp is safe (it opens a new tab) but we keep
      // the same track-then-navigate order here for consistency.
      if (result === 'uk') {
        this.trackPhoneLead();
        window.location.href = `tel:${this.getTelLink('uk')}`;
      } else if (result === 'bulgaria') {
        this.trackPhoneLead();
        window.location.href = `tel:${this.getTelLink('bulgaria')}`;
      }
      // If result is undefined, user cancelled - do nothing
    });
  }

  /** Public hook for templates that open `tel:` links directly (e.g. the footer
   *  raw anchors) instead of going through the dialog. Fires a Lead event in
   *  both Meta Pixel + GA4 so call-button clicks are attributable. */
  trackPhoneLead(): void {
    if (!this.isBrowser) return;
    const tour = this.tourForLead();
    this.pixel.trackLead(undefined, 'Phone Call', tour);
    this.analytics.trackLead(undefined, 'Phone Call', tour);
  }

  /** Public hook for templates / components that open a `mailto:` link. Fires a
   *  Lead event in both Meta Pixel + GA4 so direct-email enquiries are counted
   *  alongside phone and WhatsApp leads — without this, anyone emailing us
   *  directly was an untracked lead. Route-gated tour attribution via
   *  tourForLead() works the same as the phone/WhatsApp hooks. */
  trackEmailLead(): void {
    if (!this.isBrowser) return;
    const tour = this.tourForLead();
    this.pixel.trackLead(undefined, 'Email', tour);
    this.analytics.trackLead(undefined, 'Email', tour);
  }

  /**
   * Open WhatsApp with choice of number
   * @param message - Pre-filled message text
   */
  openWhatsApp(message: string = 'Hello! I have a question about your Bansko activities!'): void {
    const ukPhone = this.getDisplayPhone('uk');
    const bgPhone = this.getDisplayPhone('bulgaria');
    
    const dialogRef = this.dialog.open(PhoneChoiceDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: {
        title: 'Choose WhatsApp Number',
        ukPhone: ukPhone,
        bulgariaPhone: bgPhone,
        type: 'whatsapp'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!this.isBrowser) return;

      const tour = this.tourForLead();
      if (result === 'uk') {
        const whatsappUrl = `https://wa.me/${this.getWhatsAppPhone('uk')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        this.pixel.trackLead(undefined, 'WhatsApp', tour);
        this.analytics.trackLead(undefined, 'WhatsApp', tour);
      } else if (result === 'bulgaria') {
        const whatsappUrl = `https://wa.me/${this.getWhatsAppPhone('bulgaria')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        this.pixel.trackLead(undefined, 'WhatsApp', tour);
        this.analytics.trackLead(undefined, 'WhatsApp', tour);
      }
      // If result is undefined, user cancelled - do nothing
    });
  }

  /**
   * Make a phone call with country choice
   */
  makeCall(): void {
    this.showPhoneChoice();
  }

  /**
   * Get obfuscated phone parts (for custom implementations)
   * @param country - 'uk' or 'bulgaria'
   * @returns Object with phone parts
   */
  getPhoneParts(country: 'uk' | 'bulgaria' = 'uk') {
    return { ...environment.contact.phones[country] };
  }

  /**
   * Get both phone numbers for display purposes
   * @returns Object with both phone configurations
   */
  getAllPhones() {
    return {
      uk: {
        ...environment.contact.phones.uk,
        fullNumber: this.getTelLink('uk'),
        displayNumber: this.getDisplayPhone('uk'),
        whatsappNumber: this.getWhatsAppPhone('uk')
      },
      bulgaria: {
        ...environment.contact.phones.bulgaria,
        fullNumber: this.getTelLink('bulgaria'),
        displayNumber: this.getDisplayPhone('bulgaria'),
        whatsappNumber: this.getWhatsAppPhone('bulgaria')
      }
    };
  }
}