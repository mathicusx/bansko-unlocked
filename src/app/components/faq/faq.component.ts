import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { LocaleService } from '../../services/locale.service';
import { t } from '../../i18n';

interface FAQ {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
    selector: 'app-faq',
    imports: [
        CommonModule,
        MatIconModule,
    ],
    templateUrl: './faq.component.html',
    styleUrl: './faq.component.scss'
})
export class FaqComponent implements OnInit {
  constructor(
    private seoService: SeoService,
    private router: Router,
    private localeService: LocaleService,
    @Inject(DOCUMENT) private document: Document
  ) {}
  // Open/closed state lives separately from the locale-driven Q/A content so a
  // language switch never collapses the user's currently-expanded answer.
  private openStates: boolean[] = [];

  get copy() {
    return t(this.localeService.current()).pages.faq;
  }

  get faqs(): FAQ[] {
    return this.copy.items.map((item, i) => ({
      question: item.question,
      answer: item.answer,
      isOpen: this.openStates[i] ?? false,
    }));
  }

  ngOnInit() {
    // Embedded-mode guard: FAQ is rendered both at /faq (route owner) and as a child
    // of home.component.html. Only inject SEO meta + canonical + schema when we're
    // actually the page owner — otherwise we'd overwrite the host page's tags.
    // Past bug: this overwrote the homepage's title and pointed its canonical at /faq.
    // Use Router.url (not document.location.pathname) — the latter returns '/' for
    // every route during SSR/prerender, which broke an earlier attempt at this guard.
    const currentPath = this.router.url.split(/[?#]/)[0];
    const isOwnRoute =
      currentPath === '/faq' || currentPath === '/faq/' ||
      currentPath === '/de/faq' || currentPath === '/de/faq/' ||
      currentPath === '/fr/faq' || currentPath === '/fr/faq/' ||
      currentPath === '/nl/faq' || currentPath === '/nl/faq/';
    if (!isOwnRoute) return;

    const locale = this.localeService.current();
    const meta = t(locale).meta.faq;
    const url = this.localeService.canonicalFor('/faq', locale);
    const homeUrl = this.localeService.canonicalFor('/', locale);

    this.seoService.updateMetaTags({
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      url,
      locale: this.localeService.ogLocale(),
    });
    this.seoService.addHreflangs(this.localeService.hreflangAlternates('/faq'));

    // FAQPage + BreadcrumbList in a single @graph for richer SERP signals.
    // FAQ answers stay English in Phase 1 — Phase 2 translates the Q/A array.
    const faqNode = this.seoService.getFAQSchema(
      this.faqs.map(faq => ({ question: faq.question, answer: faq.answer })),
    );
    // Strip the outer @context — addGraphSchemas adds it at the @graph root.
    const { '@context': _ctx, ...faqGraph } = faqNode;
    this.seoService.addGraphSchemas([
      faqGraph,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: 'FAQ', item: url },
        ],
      },
    ]);
  }

  toggleFaq(index: number) {
    this.openStates[index] = !(this.openStates[index] ?? false);
  }

  // The faqs getter rebuilds a fresh array of new objects on every change-detection
  // tick (it maps over locale copy each call). Without trackBy, *ngFor sees new object
  // identities every CD pass — fired by each mousemove/click — and tears down + rebuilds
  // the whole list DOM, which shows up as flickering. Tracking by index keeps the DOM
  // nodes stable so only bindings update. (Index is stable: list length/order is fixed
  // within a locale, and a language switch just swaps the text in place.)
  trackByIndex(index: number): number {
    return index;
  }

  // FAQ answers render via [innerHTML], so embedded <a href="/internal"> links
  // would trigger a full page reload. Intercept clicks on same-origin anchors
  // and hand them to the Router instead. External and mailto links fall through.
  onAnswerClick(event: MouseEvent) {
    const target = (event.target as HTMLElement | null)?.closest('a');
    if (!target) return;
    const href = target.getAttribute('href') || '';
    if (!href.startsWith('/')) return;
    event.preventDefault();
    this.router.navigateByUrl(href);
  }
}