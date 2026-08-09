import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter } from 'pixel-ui';

import { routes } from './app.routes';
import { provideDocsPixelPushNotifications } from './core/docs-push.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ...provideNativeDateAdapter(),
    ...provideDocsPixelPushNotifications(),
  ],
};
