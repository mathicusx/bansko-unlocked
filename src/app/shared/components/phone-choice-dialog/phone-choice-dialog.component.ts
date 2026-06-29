import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

export interface PhoneChoiceData {
  title: string;
  ukPhone: string;
  bulgariaPhone: string;
  type: 'call' | 'whatsapp';
}

@Component({
    selector: 'app-phone-choice-dialog',
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule
    ],
    template: `
    <div class="phone-choice-dialog">
      <h2 mat-dialog-title>
        <mat-icon>{{ data.type === 'call' ? 'phone' : 'chat' }}</mat-icon>
        {{ data.title }}
      </h2>
      
      <mat-dialog-content>
        <p class="dialog-subtitle">Choose your preferred contact number:</p>
        
        <div class="phone-options">
          <mat-card class="phone-option uk-option" (click)="selectPhone('uk')">
            <mat-card-content>
              <div class="option-header">
                <mat-icon>phone</mat-icon>
                <span class="country-label">UK Number</span>
              </div>
              <div class="phone-number">{{ data.ukPhone }}</div>
              <div class="option-description">English speaking support</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="phone-option bulgaria-option" (click)="selectPhone('bulgaria')">
            <mat-card-content>
              <div class="option-header">
                <mat-icon>phone</mat-icon>
                <span class="country-label">Bulgarian Number</span>
              </div>
              <div class="phone-number">{{ data.bulgariaPhone }}</div>
              <div class="option-description">Local Bulgarian support</div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button mat-stroked-button (click)="onClose()">Cancel</button>
      </mat-dialog-actions>
    </div>
  `,
    styles: [`
    .phone-choice-dialog {
      min-width: 320px;
      max-width: 500px;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      color: var(--brand-primary);
      font-weight: 700;
      text-shadow: 0 0 10px var(--brand-accent-strong);
      font-size: 1.8rem;
    }

    .dialog-subtitle {
      margin-bottom: 20px;
      color: var(--text-primary);
      text-align: center;
      opacity: 0.8;
    }

    .phone-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .phone-option {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid var(--bg-tertiary);
      background: var(--bg-secondary);
      border-radius: 12px;
      overflow: hidden;
    }

    .phone-option:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px var(--shadow-medium);
      border-color: var(--text-primary);
      opacity: 0.9;
    }

    .phone-option mat-card-content {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .option-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .option-header mat-icon {
      color: var(--text-primary);
      opacity: 0.8;
    }

    .country-label {
      font-weight: 600;
      font-size: 16px;
      color: var(--text-primary);
    }

    .phone-number {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .option-description {
      font-size: 14px;
      color: var(--text-primary);
      opacity: 0.7;
    }

    mat-dialog-actions {
      justify-content: center;
      padding-top: 16px;
      background: var(--bg-primary);
    }

    mat-dialog-actions button {
      color: var(--text-primary);
      border-color: var(--text-primary);
      transition: all 0.3s ease;
    }

    mat-dialog-actions button:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      transform: translateY(-1px);
    }

    /* Material Dialog Override */
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      background: var(--bg-primary) !important;
      color: var(--text-primary) !important;
    }

    /* Material Card Override for theme */
    ::ng-deep .mat-mdc-card {
      background: var(--bg-secondary) !important;
      color: var(--text-primary) !important;
      border: 1px solid var(--bg-tertiary) !important;
    }

    @media (max-width: 600px) {
      .phone-choice-dialog {
        min-width: 280px;
      }
      
      .phone-options {
        gap: 10px;
      }

      h2[mat-dialog-title] {
        font-size: 1.5rem;
      }
    }
  `]
})
export class PhoneChoiceDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PhoneChoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PhoneChoiceData
  ) {}

  selectPhone(country: 'uk' | 'bulgaria'): void {
    this.dialogRef.close(country);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}