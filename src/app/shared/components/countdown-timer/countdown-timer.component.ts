import { Component, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LocaleService } from '../../../services/locale.service';
import { t } from '../../../i18n';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

@Component({
    selector: 'app-countdown-timer',
    imports: [CommonModule],
    templateUrl: './countdown-timer.component.html',
    styleUrls: ['./countdown-timer.component.scss']
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Input() endDate!: string;
  @Input() compact: boolean = false;

  timeRemaining: TimeRemaining = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  };

  private intervalId: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private localeService: LocaleService,
  ) {}

  /** Locale-aware labels — resolves EN or DE from i18n/{en,de}.ts. */
  get copy() {
    return t(this.localeService.current()).chrome.countdown;
  }

  ngOnInit(): void {
    this.updateCountdown();
    // Only run interval in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = setInterval(() => {
        this.updateCountdown();
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateCountdown(): void {
    if (!this.endDate) {
      return;
    }

    const now = new Date().getTime();
    const end = new Date(this.endDate).getTime();
    const distance = end - now;

    if (distance < 0) {
      this.timeRemaining = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true
      };
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      return;
    }

    this.timeRemaining = {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
      expired: false
    };
  }

  get formattedTime(): string {
    if (this.timeRemaining.expired) {
      return 'Promo Ended';
    }

    const parts: string[] = [];

    if (this.timeRemaining.days > 0) {
      parts.push(`${this.timeRemaining.days}d`);
    }
    if (this.timeRemaining.hours > 0 || this.timeRemaining.days > 0) {
      parts.push(`${this.timeRemaining.hours}h`);
    }
    parts.push(`${this.timeRemaining.minutes}m`);
    parts.push(`${this.timeRemaining.seconds}s`);

    return parts.join(' ');
  }
}
