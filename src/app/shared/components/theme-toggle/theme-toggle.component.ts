import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { ThemeService, Theme } from '../../services/theme.service';
import { LocaleService } from '../../../services/locale.service';
import { t } from '../../../i18n';

@Component({
    selector: 'app-theme-toggle',
    imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
    template: `
    <button
      mat-icon-button
      (click)="toggleTheme()"
      class="theme-toggle-button"
      [matTooltip]="currentTheme === 'light' ? copy.switchToDark : copy.switchToLight"
      [attr.aria-label]="copy.ariaLabel"
    >
      <mat-icon>{{ currentTheme === 'light' ? 'dark_mode' : 'light_mode' }}</mat-icon>
    </button>
  `,
    styleUrls: ['./theme-toggle.component.scss']
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  currentTheme: Theme = 'dark';
  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private localeService: LocaleService,
  ) {}

  /** Locale-aware copy — resolves on every change-detection so the tooltip
   *  text follows route-driven locale changes without needing a subscription. */
  get copy() {
    return t(this.localeService.current()).chrome.themeToggle;
  }

  ngOnInit(): void {
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
      });

    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
