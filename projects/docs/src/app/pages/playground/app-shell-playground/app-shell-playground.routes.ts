import { Routes } from '@angular/router';

/** Child routes for `/playground/app-shell`. */
export const APP_SHELL_PLAYGROUND_CHILDREN: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  {
    path: 'overview',
    loadComponent: () =>
      import('./pages/overview.page').then((m) => m.AppShellOverviewPage),
  },
  {
    path: 'claims',
    loadComponent: () =>
      import('./pages/claims.page').then((m) => m.AppShellClaimsPage),
  },
  {
    path: 'billing',
    loadComponent: () =>
      import('./pages/billing.page').then((m) => m.AppShellBillingPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings.page').then((m) => m.AppShellSettingsPage),
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./pages/notifications.page').then((m) => m.AppShellNotificationsPage),
  },
];
