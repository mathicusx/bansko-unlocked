import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { PhoneService } from '../../shared/services/phone.service';
import { LocaleService } from '../../services/locale.service';
import { ContactApiService } from '../../services/contact-api.service';
import { PixelService } from '../../services/pixel.service';
import { AnalyticsService } from '../../services/analytics.service';
import { FeedbackDialogComponent } from '../../shared/components/feedback-dialog/feedback-dialog.component';
import { t } from '../../i18n';

@Component({
    selector: 'app-floating-help',
    imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatSnackBarModule, FeedbackDialogComponent],
    templateUrl: './floating-help.component.html',
    styleUrl: './floating-help.component.scss'
})
export class FloatingHelpComponent {
  isExpanded = false;
  /** When true, the inline email form replaces the call/WhatsApp/email buttons. */
  showEmailForm = false;
  isSubmitting = false;
  emailForm: FormGroup;

  /** Success / error confirmation dialog state (replaces the snackbar). */
  feedbackVisible = false;
  feedbackType: 'success' | 'error' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  private phoneService = inject(PhoneService);
  private localeService = inject(LocaleService);
  private contactApi = inject(ContactApiService);
  private pixel = inject(PixelService);
  private analytics = inject(AnalyticsService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  /** Locale-aware labels — resolves the active locale from i18n. */
  get copy() {
    return t(this.localeService.current()).chrome.floatingHelp;
  }

  /** Re-uses the contact page's form copy so labels/validation/snackbars are
   *  already translated across all locales — no new i18n keys for the bubble. */
  get formCopy() {
    return t(this.localeService.current()).pages.contact.form;
  }

  constructor() {
    // Register WhatsApp icon
    const whatsappIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
      </svg>
    `;

    this.iconRegistry.addSvgIconLiteral(
      'whatsapp',
      this.sanitizer.bypassSecurityTrustHtml(whatsappIcon)
    );

    this.emailForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  toggleHelp(): void {
    this.isExpanded = !this.isExpanded;
    if (!this.isExpanded) this.showEmailForm = false;
  }

  openWhatsApp(): void {
    this.phoneService.openWhatsApp('Hello! I have a question about Bansko Unlocked activities.');
    this.closeHelp();
  }

  callUs(): void {
    this.phoneService.makeCall();
    this.closeHelp();
  }

  /** Reveal the inline email form instead of opening the user's mail client. */
  openEmail(): void {
    this.showEmailForm = true;
  }

  /** Step back from the form to the call/WhatsApp/email options. */
  backToOptions(): void {
    this.showEmailForm = false;
  }

  getErrorMessage(field: string): string {
    const control = this.emailForm.get(field);
    const f = this.formCopy;
    if (control?.hasError('required')) {
      return field === 'name' ? f.nameRequired
        : field === 'email' ? f.emailRequired
        : f.messageRequired;
    }
    if (control?.hasError('email')) return f.emailInvalid;
    if (control?.hasError('minlength')) {
      return field === 'name' ? f.nameMinLength : f.messageMinLength;
    }
    return '';
  }

  submitEmail(): void {
    if (!this.emailForm.valid) {
      this.emailForm.markAllAsTouched();
      this.snackBar.open(this.formCopy.fillFieldsCorrectly, this.formCopy.snackbarClose, {
        duration: 3000,
      });
      return;
    }

    const formData = this.emailForm.value;
    this.isSubmitting = true;

    this.contactApi
      .submit({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        locale: this.localeService.current(),
        source: 'floating-help',
      })
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;
          if (!result.ok) {
            this.showFeedback('error');
            return;
          }
          // Fire the Lead conversion only once the message is delivered.
          // Pixel's source is a fixed union — use 'Contact Form'; GA4's method
          // is free text so it can carry the more specific 'Floating Help'.
          this.pixel.trackLead(formData.email, 'Contact Form');
          this.analytics.trackLead(formData.email, 'Floating Help');

          this.emailForm.reset();
          // Collapse the bubble back to its closed state, then surface the
          // success dialog on top so it's impossible to miss.
          this.closeHelp();
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
    const f = this.formCopy;
    this.feedbackType = type;
    this.feedbackTitle = type === 'success' ? f.messageSentTitle : f.messageFailedTitle;
    this.feedbackMessage = type === 'success' ? f.messageSent : f.messageFailed;
    this.feedbackVisible = true;
  }

  closeFeedback(): void {
    this.feedbackVisible = false;
  }

  // Close when clicking outside
  closeHelp(): void {
    this.isExpanded = false;
    this.showEmailForm = false;
  }
}
