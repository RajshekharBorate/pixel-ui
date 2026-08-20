import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePixelDateLocale, providePixelTitle } from 'pixel-ui';

import { routes } from './app.routes';
import { provideDocsPixelPushNotifications } from './core/docs-push.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ...providePixelTitle({
      suffix: 'Pixel UI',
      defaultTitle: 'Docs',
      syncRouterTitle: true,
    }),
    // Recommended enterprise locale strategy: explicit LOCALE_ID + pixel date adapter.
    // Picker, grid, query builder, and charts share one locale. Export stays YYYY-MM-DD.
    { provide: LOCALE_ID, useValue: 'en-IN' },
    ...providePixelDateLocale({ strategy: 'localeId' }),
    ...provideDocsPixelPushNotifications(),
  ],
};
