import { Directive, Input, OnChanges, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../services/locale.service';

/**
 * Keeps every `routerLink` in-locale automatically.
 *
 * It shares the `[routerLink]` selector with Angular's own `RouterLink`, so it
 * sits on the same element. It reads the locale-neutral path the template
 * authored, then feeds the active locale's prefixed equivalent into the real
 * `RouterLink` — so a click from `/de/*` or `/fr/*` never drops the rider back
 * onto the English route. Templates author plain neutral paths
 * (`routerLink="/team"`); this directive does the prefixing.
 *
 * It is idempotent: `LocaleService.localizeLink` strips any existing prefix
 * before re-applying, so it is safe on links that already pass a localised
 * value (e.g. AppComponent / TeamComponent `links` maps).
 *
 * Import it wherever `RouterLink` is imported — in a standalone app there is no
 * global directive registration, so each component using `routerLink` must
 * list this in its `imports`.
 */
@Directive({
  selector: '[routerLink]',
  standalone: true,
})
export class LocaleRouterLink implements OnChanges {
  /** The sibling `RouterLink` on this element. Optional so the directive is a
   *  harmless no-op if a template ever carries it without the real RouterLink. */
  private readonly link = inject(RouterLink, { optional: true });
  private readonly localeService = inject(LocaleService);

  /** Locale-neutral commands authored in the template. Shares RouterLink's
   *  input name — Angular delivers the binding value to both directives. */
  @Input() routerLink: string | any[] | null | undefined;

  ngOnChanges(): void {
    if (!this.link) return;
    this.link.routerLink = this.localeService.localizeLink(this.routerLink);
    // Directive `ngOnChanges` order on a shared element is not guaranteed, so
    // RouterLink may have already computed its href from the neutral value.
    // Re-run its change hook to recompute the href from the localised value.
    this.link.ngOnChanges();
  }
}
