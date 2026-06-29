import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { PhoneService } from '../../shared/services/phone.service';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { t } from '../../i18n';
import { PixelService } from '../../services/pixel.service';
import { AnalyticsService } from '../../services/analytics.service';
import { ContactApiService } from '../../services/contact-api.service';
import { FeedbackDialogComponent } from '../../shared/components/feedback-dialog/feedback-dialog.component';

@Component({
    selector: 'app-contact',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatSnackBarModule,
        FeedbackDialogComponent
    ],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;

  /** Success / error confirmation dialog state (replaces the easy-to-miss
   *  snackbar). Driven by the POST result in onSubmit(). */
  feedbackVisible = false;
  feedbackType: 'success' | 'error' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  /** Locale-aware page copy — resolves EN or DE from i18n/{en,de}.ts. */
  get copy() {
    return t(this.localeService.current()).pages.contact;
  }

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private phoneService: PhoneService,
    private seoService: SeoService,
    private localeService: LocaleService,
    private pixel: PixelService,
    private analytics: AnalyticsService,
    private contactApi: ContactApiService,
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    const locale = this.localeService.current();
    const i18nMeta = t(locale).meta.contact;
    const url = this.localeService.canonicalFor('/contact', locale);
    const homeUrl = this.localeService.canonicalFor('/', locale);

    this.seoService.updateMetaTags({
      title: i18nMeta.title,
      description: i18nMeta.description,
      keywords: i18nMeta.keywords,
      url,
      locale: this.localeService.ogLocale(),
    });
    this.seoService.addHreflangs(this.localeService.hreflangAlternates('/contact'));

    this.seoService.addGraphSchemas([
      {
        '@type': 'ContactPage',
        '@id': `${url}#webpage`,
        name: i18nMeta.title,
        description: i18nMeta.description,
        url,
        inLanguage: this.localeService.htmlLang(),
        publisher: { '@id': 'https://banskounlocked.com/#organization' },
        mainEntity: {
          '@type': 'ContactPoint',
          telephone: '+44-7472362817',
          contactType: 'customer support',
          availableLanguage: ['English', 'Bulgarian', 'German'],
          areaServed: 'BG',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: url },
        ],
      },
    ]);

    // Setup phone link using service. Pass the localized label so the
    // browser-side text PhoneService writes matches the SSR/prerender text
    // (the service otherwise hardcodes English "Click to Call").
    this.phoneService.setupPhoneLink('contact-call-link', this.copy.directContact.clickToCall);
  }

  onSubmit(): void {
    if (!this.contactForm.valid) {
      this.contactForm.markAllAsTouched();
      this.snackBar.open(this.copy.form.fillFieldsCorrectly, this.copy.form.snackbarClose, {
        duration: 3000
      });
      return;
    }

    const formData = this.contactForm.value;
    this.isSubmitting = true;

    // POST to the API, which sends the staff notification + a branded
    // confirmation email back to the visitor via Resend. Replaces the old
    // mailto: flow that just opened the user's mail client.
    this.contactApi
      .submit({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        locale: this.localeService.current(),
        source: 'contact-page',
      })
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;

          // The endpoint returns 200 with { ok: false } if Resend failed to
          // dispatch (it never throws) — treat that as a soft failure so the
          // visitor knows to retry rather than assuming we received it.
          if (!result.ok) {
            this.showFeedback('error');
            return;
          }

          // Only fire the Lead conversion once the message is actually
          // delivered — keeps Pixel/GA4 lead counts honest (the old mailto:
          // flow fired even when no email was ever sent).
          this.pixel.trackLead(formData.email, 'Contact Form');
          this.analytics.trackLead(formData.email, 'Contact Form');

          this.contactForm.reset();
          this.showFeedback('success');
        },
        error: () => {
          this.isSubmitting = false;
          this.showFeedback('error');
        },
      });
  }

  /** Open the success / error confirmation dialog with the localised copy. */
  private showFeedback(type: 'success' | 'error'): void {
    const f = this.copy.form;
    this.feedbackType = type;
    this.feedbackTitle = type === 'success' ? f.messageSentTitle : f.messageFailedTitle;
    this.feedbackMessage = type === 'success' ? f.messageSent : f.messageFailed;
    this.feedbackVisible = true;
  }

  closeFeedback(): void {
    this.feedbackVisible = false;
  }

  openWhatsApp(): void {
    this.phoneService.openWhatsApp('Hi, I have a question about your Bansko activities!');
  }

  /** Direct mailto: link click — fires a Lead event so emails sent without the
   *  contact form are still counted (the form's own submit fires its own Lead). */
  trackEmailClick(): void {
    this.phoneService.trackEmailLead();
  }

  getErrorMessage(field: string): string {
    const control = this.contactForm.get(field);
    const f = this.copy.form;
    if (control?.hasError('required')) {
      return field === 'name' ? f.nameRequired
        : field === 'email' ? f.emailRequired
        : f.messageRequired;
    }
    if (control?.hasError('email')) {
      return f.emailInvalid;
    }
    if (control?.hasError('minlength')) {
      return field === 'name' ? f.nameMinLength : f.messageMinLength;
    }
    return '';
  }
}
