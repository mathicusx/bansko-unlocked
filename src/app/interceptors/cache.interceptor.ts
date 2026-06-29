import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, tap } from 'rxjs';

interface CacheEntry {
  body: unknown;
  expires: number;
}

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

const isCacheable = (req: HttpRequest<unknown>): boolean => {
  if (req.method !== 'GET') return false;
  if (req.headers.get('Cache-Control')?.includes('no-cache')) return false;
  return req.url.includes('/api/tours');
};

export const cacheInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return next(req);
  if (!isCacheable(req)) return next(req);

  const key = req.urlWithParams;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return of(new HttpResponse({ status: 200, body: hit.body }));
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        cache.set(key, { body: event.body, expires: Date.now() + TTL_MS });
      }
    }),
  );
};
