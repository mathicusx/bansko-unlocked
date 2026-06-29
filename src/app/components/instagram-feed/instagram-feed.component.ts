import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LocaleService } from '../../services/locale.service';
import { AnalyticsService } from '../../services/analytics.service';
import {
  INSTAGRAM_FEED,
  INSTAGRAM_FEED_IS_FALLBACK,
  INSTAGRAM_PROFILE_URL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_UI,
  type InstagramPost,
} from '../../data/instagram-feed';

/**
 * "Follow the rides" Instagram strip — fresh social proof rendered as real,
 * indexable HTML (NOT an iframe widget, which CLAUDE.md flags as SEO-dead).
 * The feed data + local thumbnails are produced at build time by
 * scripts/generate-instagram.mjs; this component just renders whatever the
 * committed instagram-feed.ts currently holds (live posts, or the fallback).
 *
 * Reusable: drop `<app-instagram-feed>` on any page. It owns no SEO/meta
 * injection, so it needs no per-route guard.
 */
@Component({
  selector: 'app-instagram-feed',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './instagram-feed.component.html',
  styleUrl: './instagram-feed.component.scss',
})
export class InstagramFeedComponent {
  /** Heading level — `h2` on a standalone section, `h3` when nested under one. */
  @Input() headingLevel: 'h2' | 'h3' = 'h2';

  readonly feed: InstagramPost[] = INSTAGRAM_FEED;
  readonly isFallback = INSTAGRAM_FEED_IS_FALLBACK;
  readonly profileUrl = INSTAGRAM_PROFILE_URL;
  readonly handle = INSTAGRAM_HANDLE;

  constructor(
    private localeService: LocaleService,
    private analytics: AnalyticsService,
  ) {}

  get copy() {
    return INSTAGRAM_UI[this.localeService.current()];
  }

  viewAria(post: InstagramPost): string {
    return this.copy.viewAria.replace('{caption}', post.caption || this.handle);
  }

  trackTileClick(post: InstagramPost, index: number): void {
    this.analytics.trackEvent('instagram_click', {
      link_url: post.permalink,
      index,
      is_fallback: this.isFallback,
    });
  }

  trackFollowClick(): void {
    this.analytics.trackEvent('instagram_follow_click', { link_url: this.profileUrl });
  }
}
