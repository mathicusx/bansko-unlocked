import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { Tour } from './tour.service';
import { environment } from '../../environments/environment';
import { FALLBACK_BUGGY_TOURS } from '../data/fallback-tours';
import { LocaleService } from './locale.service';
import { localizeTour, isLanguagePublished } from '../data/tour-translations';

@Injectable({
  providedIn: 'root',
})
export class BuggyTourService {
  private http = inject(HttpClient);
  private localeService = inject(LocaleService);
  private apiUrl = environment.apiUrl;

  // See TourService — public reads localize + filter by locale; EN is a
  // no-op. Buggy tours share the same /tours endpoint and Tour shape.

  getTours(): Observable<Tour[]> {
    const locale = this.localeService.current();
    return this.http.get<Tour[]>(`${this.apiUrl}/tours`, {
      params: { type: 'buggy' },
    }).pipe(
      catchError(() => of(FALLBACK_BUGGY_TOURS)),
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
      catchError(() => of(FALLBACK_BUGGY_TOURS.find(t => t.id === id))),
      map(tour => (tour ? localizeTour(tour, locale) : tour))
    );
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
}
