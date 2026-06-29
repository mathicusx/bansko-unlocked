import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { cacheInterceptor } from './interceptors/cache.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Incremental hydration: SSR renders all content as before (SEO-safe), but
    // @defer (hydrate on …) blocks stay un-hydrated on the client until their
    // trigger fires. withEventReplay is auto-enabled by withIncrementalHydration
    // so user clicks before hydration aren't lost.
    provideClientHydration(withIncrementalHydration()),
    provideRouter(
      routes,
      // Preloading deliberately disabled: PreloadAllModules pulled ~1 MB of
      // lazy chunks (accommodation alone is 800 KB) in the background after
      // the homepage paints, contending for mobile CPU + bandwidth. Inbound
      // SEO traffic mostly stays on one page, so the preload was wasted.
      // First inter-page navigation is now ~200 ms slower; acceptable trade.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptors([cacheInterceptor]))
  ]
};
