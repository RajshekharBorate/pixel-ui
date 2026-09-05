import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { PixelToastService, providePixelAuthorizationRouteWatcher } from 'pixel-ui';
import { DocsShellComponent } from './layout/docs-shell/docs-shell';
import { HomePageComponent } from './pages/home/home-page';
import { PatternGalleryPageComponent } from './pages/pattern-gallery/pattern-gallery-page';
import { ComponentsCatalogPageComponent } from './pages/components-catalog/components-catalog-page';
import { ComponentDocPageComponent } from './pages/component-doc/component-doc-page';
import { docsComponentTitle } from './core/docs-title';
import { APP_SHELL_PLAYGROUND_CHILDREN } from './pages/playground/app-shell-playground/app-shell-playground.routes';
import { getComponentById } from './registry/component-registry';

/** Preserve old chart links while making `/charts/:id/:tab` canonical. */
const redirectLegacyChartUrl: CanActivateFn = (route) => {
  const componentId = route.paramMap.get('componentId') ?? '';
  const component = getComponentById(componentId);
  if (component?.category !== 'charts') {
    return true;
  }
  const tab = route.paramMap.get('tab') ?? 'overview';
  return inject(Router).createUrlTree(['/charts', componentId, tab]);
};

export const routes: Routes = [
  {
    // Chrome-less full-page demo — deliberately NOT nested under DocsShellComponent.
    path: 'playground/app-shell',
    providers: [
      providePixelAuthorizationRouteWatcher(() => {
        const toast = inject(PixelToastService);
        return {
          forbiddenUrl: '/playground/app-shell/overview',
          onEvicted: () => {
            toast.info('You no longer have access to that page.');
          },
        };
      }),
    ],
    loadComponent: () =>
      import('./pages/playground/app-shell-playground/app-shell-playground').then(
        (m) => m.AppShellPlaygroundComponent,
      ),
    children: APP_SHELL_PLAYGROUND_CHILDREN,
  },
  {
    path: 'playground/products',
    title: 'Products playground',
    loadComponent: () =>
      import('./pages/playground/products-playground/products-playground').then(
        (m) => m.ProductsPlaygroundComponent,
      ),
  },
  {
    path: 'playground/dashboard',
    title: 'Dashboard playground',
    loadComponent: () =>
      import('./pages/playground/dashboard-playground/dashboard-playground').then(
        (m) => m.DashboardPlaygroundComponent,
      ),
  },
  {
    path: 'playground/settings-wizard',
    title: 'Settings wizard playground',
    loadComponent: () =>
      import('./pages/playground/settings-wizard-playground/settings-wizard-playground').then(
        (m) => m.SettingsWizardPlaygroundComponent,
      ),
  },
  {
    path: '',
    component: DocsShellComponent,
    children: [
      {
        path: 'patterns',
        component: PatternGalleryPageComponent,
        title: 'Pattern gallery',
      },
      { path: '', component: HomePageComponent, title: 'Docs' },
      {
        path: 'components',
        component: ComponentsCatalogPageComponent,
        title: 'Components',
        data: { catalog: 'components' },
      },
      {
        path: 'charts',
        component: ComponentsCatalogPageComponent,
        title: 'Charts',
        data: { catalog: 'charts' },
      },
      {
        path: 'components/:componentId',
        redirectTo: 'components/:componentId/overview',
        pathMatch: 'full',
      },
      {
        path: 'components/:componentId/:tab',
        component: ComponentDocPageComponent,
        title: docsComponentTitle,
        canActivate: [redirectLegacyChartUrl],
      },
      {
        path: 'charts/:componentId',
        redirectTo: 'charts/:componentId/overview',
        pathMatch: 'full',
      },
      {
        path: 'charts/:componentId/:tab',
        component: ComponentDocPageComponent,
        title: docsComponentTitle,
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
