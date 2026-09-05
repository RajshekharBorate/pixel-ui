import { Routes } from '@angular/router';
import { pixelAuthorizationCanActivate } from 'pixel-ui';

const PLAYGROUND_OVERVIEW = '/playground/app-shell/overview';

/** Child routes for `/playground/app-shell`. */
export const APP_SHELL_PLAYGROUND_CHILDREN: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  {
    path: 'overview',
    title: 'App shell · Overview',
    loadComponent: () =>
      import('./pages/overview.page').then((m) => m.AppShellOverviewPage),
  },
  {
    path: 'claims',
    title: 'App shell · Claims',
    loadComponent: () =>
      import('./pages/claims.page').then((m) => m.AppShellClaimsPage),
  },
  {
    path: 'billing',
    title: 'App shell · Billing',
    loadComponent: () =>
      import('./pages/billing.page').then((m) => m.AppShellBillingPage),
  },
  {
    path: 'settings',
    title: 'App shell · Settings',
    canActivate: [pixelAuthorizationCanActivate({ forbiddenUrl: PLAYGROUND_OVERVIEW })],
    data: { access: 'settings:view' },
    loadComponent: () =>
      import('./pages/settings.page').then((m) => m.AppShellSettingsPage),
  },
  {
    path: 'notifications',
    title: 'App shell · Notifications',
    loadComponent: () =>
      import('./pages/notifications.page').then((m) => m.AppShellNotificationsPage),
  },
];
