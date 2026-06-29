import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { OptimizeImagePipe } from '../../pipes/optimize-image.pipe';
import { ACTIVITIES } from '../../data/activities.data';

/**
 * Activities listing (/activities) — a card grid linking to each activity
 * landing page. Static content from activities.data.ts.
 */
@Component({
  selector: 'app-activities',
  imports: [CommonModule, RouterLink, MatIconModule, OptimizeImagePipe],
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.scss',
})
export class ActivitiesComponent implements OnInit {
  readonly activities = ACTIVITIES;

  constructor(
    private seoService: SeoService,
    private localeService: LocaleService,
  ) {}

  ngOnInit(): void {
    const url = this.localeService.canonicalFor('/activities');
    this.seoService.updateMetaTags({
      title: 'Bansko Activities | ATV & Buggy Tours, Shooting, Camping, Snow Riding',
      description:
        'Adventure activities in Bansko, Bulgaria — ATV & buggy tours, a shooting range, mountain camping and winter snow riding in the Pirin Mountains. Explore and enquire.',
      keywords:
        'Bansko activities, things to do in Bansko, ATV tours Bansko, buggy tours Bansko, shooting range Bansko, camping Bansko, snow riding Bansko',
      url,
      locale: this.localeService.ogLocale(),
    });
    this.seoService.addHreflangs(this.localeService.hreflangAlternates('/activities'));

    this.seoService.addGraphSchemas([
      {
        '@type': 'CollectionPage',
        '@id': `${url}#webpage`,
        name: 'Bansko Activities',
        url,
        isPartOf: { '@id': 'https://banskounlocked.com/#website' },
      },
      {
        '@type': 'ItemList',
        itemListElement: this.activities.map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: a.name,
          url: this.localeService.canonicalFor(`/activities/${a.slug}`),
        })),
      },
    ]);
  }
}
