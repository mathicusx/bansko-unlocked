import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { PhoneService } from '../../services/phone.service';

@Component({
    selector: 'app-promo-popup',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
    ],
    template: `
    <div class="promo-popup">
      <button
        mat-icon-button
        class="close-btn"
        (click)="onClose()"
        aria-label="Close">
        <mat-icon>close</mat-icon>
      </button>

      <div class="promo-content">
        <div class="promo-icon">
          <mat-icon class="gift-icon">card_giftcard</mat-icon>
        </div>

        <h2 class="promo-title">
          🎯 Early Season Kick Off
        </h2>

        <p class="promo-message">
          Fresh bikes. Empty mountains.<br>
          <span class="highlight">Everything Included</span>
        </p>

        <div class="promo-details">
          <div class="included-list">
            <div class="included-item">
              <mat-icon>check_circle</mat-icon>
              <span>Brand-new bikes & gear</span>
            </div>
            <div class="included-item">
              <mat-icon>check_circle</mat-icon>
              <span>Hotel & all meals</span>
            </div>
            <div class="included-item">
              <mat-icon>check_circle</mat-icon>
              <span>Transfers & guides</span>
            </div>
          </div>
          <p class="promo-subtext">
            <strong>€100 deposit</strong> — pay the rest on arrival
          </p>
          <p class="promo-dates">
            Available: <strong>Feb 20 - Mar 20</strong><br>
            🎯 Season Kickoff Bonus until <strong>Feb 28</strong>
          </p>
        </div>

        <div class="cta-buttons">
          <button
            mat-raised-button
            class="whatsapp-btn"
            (click)="onWhatsApp()">
            <mat-icon svgIcon="whatsapp"></mat-icon>
            <span>WhatsApp Us</span>
          </button>

          <button
            mat-raised-button
            class="call-btn"
            (click)="onCall()">
            <mat-icon>phone</mat-icon>
            <span>Call Us</span>
          </button>
        </div>

        <!-- <div class="promo-footer">
          <p class="footer-text">Limited spots available for 2025!</p>
        </div> -->
      </div>
    </div>
  `,
    styles: [`
    .promo-popup {
      position: relative;
      max-width: 500px;
      width: 100%;
      background: var(--bg-primary);
      color: var(--text-primary);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px var(--shadow);
      animation: slideInScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    .close-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 10;
      color: var(--text-primary);
      opacity: 0.7;
      transition: all 0.3s ease;

      &:hover {
        opacity: 1;
        background: var(--brand-accent);
        color: var(--brand-primary);
        transform: rotate(90deg);
      }
    }

    .promo-content {
      padding: 2rem 1.5rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .promo-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px var(--brand-accent-strong);
      animation: pulse 2s ease-in-out infinite;

      .gift-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: white;
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 4px 20px var(--brand-accent-strong);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 6px 30px var(--brand-accent-strong);
      }
    }

    .promo-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--brand-primary);
      margin: 0;
      text-shadow: 0 2px 10px var(--brand-accent);
      line-height: 1.3;

      @media (max-width: 600px) {
        font-size: 1.5rem;
      }
    }

    .promo-message {
      font-size: 1.1rem;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.6;
      max-width: 400px;

      @media (max-width: 600px) {
        font-size: 1rem;
      }

      strong {
        color: var(--brand-primary);
        font-weight: 700;
      }

      .highlight {
        color: var(--brand-primary);
        font-weight: 700;
        position: relative;
        display: inline-block;

        &::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
          border-radius: 2px;
        }
      }
    }

    .promo-details {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid var(--brand-accent);
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .included-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .included-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-primary);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #22c55e;
      }

      span {
        font-weight: 500;
      }

      @media (max-width: 600px) {
        font-size: 0.85rem;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .promo-subtext {
      font-size: 0.95rem;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.5;
      text-align: center;
      padding-top: 0.5rem;
      border-top: 1px solid var(--brand-accent);

      strong {
        color: var(--brand-primary);
        font-size: 1.1rem;
      }

      @media (max-width: 600px) {
        font-size: 0.85rem;

        strong {
          font-size: 1rem;
        }
      }
    }

    .promo-dates {
      font-size: 0.85rem;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.6;
      text-align: center;
      opacity: 0.9;

      strong {
        color: var(--brand-primary);
        font-weight: 600;
      }

      @media (max-width: 600px) {
        font-size: 0.8rem;
      }
    }

    .cta-buttons {
      display: flex;
      gap: 1rem;
      width: 100%;
      max-width: 400px;
      margin-top: 0.5rem;

      @media (max-width: 600px) {
        flex-direction: column;
        gap: 0.75rem;
      }
    }

    .whatsapp-btn,
    .call-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 28px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px var(--shadow-medium);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px var(--shadow);
      }

      @media (max-width: 600px) {
        width: 100%;
        padding: 0.875rem 1.5rem;
      }
    }

    .whatsapp-btn {
      background: #25d366;
      color: white;

      &:hover {
        background: #20bd5a;
      }
    }

    .call-btn {
      background: var(--brand-primary);
      color: white;

      &:hover {
        background: var(--brand-secondary);
      }
    }

    .promo-footer {
      margin-top: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--brand-accent);
      width: 100%;
    }

    .footer-text {
      font-size: 0.85rem;
      color: var(--text-primary);
      opacity: 0.8;
      margin: 0;
      font-style: italic;

      @media (max-width: 600px) {
        font-size: 0.8rem;
      }
    }

    @keyframes slideInScale {
      from {
        opacity: 0;
        transform: scale(0.8) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* Material Dialog Override */
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      background: transparent !important;
      box-shadow: none !important;
    }

    @media (max-width: 600px) {
      .promo-popup {
        max-width: 95vw;
        margin: 1rem;
      }

      .promo-content {
        padding: 1.5rem 1rem 1rem;
        gap: 0.75rem;
      }

      .promo-icon {
        width: 60px;
        height: 60px;

        .gift-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
        }
      }
    }
  `]
})
export class PromoPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<PromoPopupComponent>,
    private phoneService: PhoneService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) {
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
  }

  onWhatsApp(): void {
    const message = 'Hello! I\'m interested in the Early Season Kick Off tours (Feb 20 - Mar 20). Can you provide more details about the Season Kickoff Bonus?';
    this.phoneService.openWhatsApp(message);
    this.dialogRef.close('whatsapp');
  }

  onCall(): void {
    this.phoneService.makeCall();
    this.dialogRef.close('call');
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
