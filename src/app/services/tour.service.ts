import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { FALLBACK_ENDURO_TOURS } from '../data/fallback-tours';
import { LocaleService } from './locale.service';
import { localizeTour, isLanguagePublished } from '../data/tour-translations';

export interface TourDay {
  day: number;
  title: string;
  description: string;
  image: string;
}

export interface Tour {
  id: string;
  slug: string;
  type?: 'enduro' | 'buggy';
  title: string;
  /** Original English title preserved by `localizeTour` when a non-EN
   *  overlay replaces `title`. Used to identify the booking in the
   *  English-speaking staff inbox when a customer sends a reservation
   *  email from a localised route. Absent on EN reads (overlay is a no-op)
   *  and on tours that have no localisation entry. */
  originalTitle?: string;
  promo?: string;
  description: string;
  priceEur: number;
  priceGbp: number;
  promoPriceEur?: number;
  promoPriceGbp?: number;
  promoEndDate?: string;
  promoBookingPeriod?: string;
  image: string;
  duration: string;
  durationDetails: string;
  averageDistance: string;
  difficulty: string[];
  tourDetails: TourDay[];
  published?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TourService {
  private http = inject(HttpClient);
  private localeService = inject(LocaleService);
  private apiUrl = environment.apiUrl;

  // The public read methods localize by the current locale: on /de routes
  // tours are overlaid with their German text (localizeTour) and tours not
  // yet DE-published are filtered out (isLanguagePublished). On EN routes
  // both are no-ops. getTourByIdForAdmin is deliberately NOT localized —
  // admins must always see and edit the English source from the API.

  getTours(): Observable<Tour[]> {
    const locale = this.localeService.current();
    return this.http.get<Tour[]>(`${this.apiUrl}/tours`, {
      params: { type: 'enduro' },
    }).pipe(
      catchError(() => of(FALLBACK_ENDURO_TOURS)),
      map(tours =>
        tours
          .filter(t => isLanguagePublished(t.slug, locale))
          .map(t => localizeTour(t, locale))
      )
    );
  }

  getTourById(id: string): Observable<Tour | undefined> {
    const locale = this.localeService.current();
    return this.http.get<Tour>(`${this.apiUrl}/tours/${id}`).pipe(
      catchError(() => of(FALLBACK_ENDURO_TOURS.find(t => t.id === id))),
      map(tour => (tour ? localizeTour(tour, locale) : tour))
    );
  }

  // Admin variant — bypasses the published filter so just-created drafts can
  // be loaded into the inline edit view. Caller must pass an auth token.
  getTourByIdForAdmin(id: string, token: string): Observable<Tour | undefined> {
    return this.http
      .get<Tour>(`${this.apiUrl}/tours/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(catchError(() => of(undefined)));
  }

  hasActivePromo(tour: Tour): boolean {
    if (!tour.promoPriceEur || !tour.promoEndDate) {
      return false;
    }
    const endDate = new Date(tour.promoEndDate);
    const now = new Date();
    return now < endDate;
  }

  getDiscountPercentage(tour: Tour, currency: 'eur' | 'gbp'): number {
    if (currency === 'eur' && tour.promoPriceEur) {
      const discount =
        ((tour.priceEur - tour.promoPriceEur) / tour.priceEur) * 100;
      return Math.round(discount);
    } else if (currency === 'gbp' && tour.promoPriceGbp) {
      const discount =
        ((tour.priceGbp - tour.promoPriceGbp) / tour.priceGbp) * 100;
      return Math.round(discount);
    }
    return 0;
  }

  /** Effective EUR price: the promo price while a promo is live, otherwise the
   *  regular price. The API delivers prices as numeric strings ("1330.00"), so
   *  everything is coerced through Number(). */
  effectivePriceEur(tour: Tour): number {
    return this.hasActivePromo(tour) && tour.promoPriceEur != null
      ? Number(tour.promoPriceEur)
      : Number(tour.priceEur);
  }

  /** Lowest effective EUR price across a tour list — the live "from €X" figure
   *  used in meta descriptions. Auto-flips promo → regular as each promo
   *  expires, so the number never needs hand-editing. */
  lowestEffectivePriceEur(tours: Tour[]): number {
    const prices = tours.map(t => this.effectivePriceEur(t)).filter(p => p > 0);
    return prices.length ? Math.min(...prices) : 0;
  }
}
