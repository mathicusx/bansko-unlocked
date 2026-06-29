import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { LocaleRouterLink } from '../../directives/locale-router-link.directive';

@Component({
    selector: 'app-not-found',
    imports: [CommonModule, RouterLink, LocaleRouterLink],
    templateUrl: './not-found.component.html',
    styleUrl: './not-found.component.scss'
})
export class NotFoundComponent implements OnInit {
  constructor(private seoService: SeoService) {}

  ngOnInit() {
    this.seoService.updateMetaTags({
      title: 'Page Not Found | Bansko Unlocked',
      description: 'The page you were looking for does not exist. Browse our Bansko activities instead.',
      url: 'https://banskounlocked.com/',
      robots: 'noindex, nofollow',
    });
  }
}
