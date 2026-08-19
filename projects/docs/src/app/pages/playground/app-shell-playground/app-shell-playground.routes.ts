import { Routes } from '@angular/router';

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
