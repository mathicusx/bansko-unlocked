import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PhoneService } from '../../shared/services/phone.service';
import { LocaleService } from '../../services/locale.service';
import { t } from '../../i18n';

@Component({
    selector: 'app-footer',
    imports: [
        CommonModule,
        MatIconModule
    ],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})
export class FooterComponent {
  constructor(private phoneService: PhoneService,
    private localeService: LocaleService
  ) {}

  trackCallClick(): void {
    this.phoneService.trackPhoneLead();
  }

  trackEmailClick(): void {
    this.phoneService.trackEmailLead();
  }
  get copy() {
    return t(this.localeService.current()).chrome.footer;
  
  }
  openSocialLink(platform: string): void {
    // TODO(deploy): set the Bansko Unlocked social URLs once the accounts exist.
    const urls: Record<string, string> = {
      facebook: '',
      instagram: '',
      youtube: ''
    };

    const url = urls[platform];
    if (url) {
      window.open(url, '_blank');
    }
  }
}
