import { Routes } from '@angular/router';
import { DocsShellComponent } from './layout/docs-shell/docs-shell';
import { HomePageComponent } from './pages/home/home-page';
import { ComponentsCatalogPageComponent } from './pages/components-catalog/components-catalog-page';
import { ComponentDocPageComponent } from './pages/component-doc/component-doc-page';
import { APP_SHELL_PLAYGROUND_CHILDREN } from './pages/playground/app-shell-playground/app-shell-playground.routes';

export const routes: Routes = [
  {
    // Chrome-less full-page demo — deliberately NOT nested under DocsShellComponent.
    path: 'playground/app-shell',
    loadComponent: () =>
      import('./pages/playground/app-shell-playground/app-shell-playground').then(
        (m) => m.AppShellPlaygroundComponent,
      ),
    children: APP_SHELL_PLAYGROUND_CHILDREN,
  },
  {
    path: '',
    component: DocsShellComponent,
    children: [
      { path: '', component: HomePageComponent },
      { path: 'components', component: ComponentsCatalogPageComponent },
      {
        path: 'components/:componentId',
        redirectTo: 'components/:componentId/overview',
        pathMatch: 'full',
      },
      { path: 'components/:componentId/:tab', component: ComponentDocPageComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
