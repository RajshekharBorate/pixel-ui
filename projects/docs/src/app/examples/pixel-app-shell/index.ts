import { createDocExample } from '../../shared/example-source.util';
import { AppShellDashboardExample } from './app-shell-dashboard.example';
import { AppShellLauncherExample } from './app-shell-launcher.example';

export const APP_SHELL_EXAMPLES = [
  createDocExample({
    id: 'full-page-demo',
    title: 'Full-page demo (opens in a new tab)',
    category: 'Setup',
    description:
      'A chrome-less, full-viewport playground composing every layout-shell component together: ' +
      'sticky header with a user-profile menu, a grouped sidenav, genuinely scrollable content, ' +
      'and a footer.',
    component: AppShellLauncherExample,
    imports: ['PixelAppShellComponent'],
    html: `<pixel-button leadingIcon="open_in_new" (click)="open()">Open full-page demo</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({ /* … */ })
export class AppShellLauncherExample {
  protected open(): void {
    window.open('/playground/app-shell', '_blank', 'noopener');
  }
}`,
  }),
  createDocExample({
    id: 'dashboard',
    title: 'Dashboard shell',
    category: 'Setup',
    description:
      'Header + sidenav + footer + container-wrapped content composed into a full responsive ' +
      'layout. Resize the frame narrower than 900px to see the sidenav auto-collapse to an overlay.',
    component: AppShellDashboardExample,
    imports: [
      'PixelAppShellComponent',
      'PixelHeaderComponent',
      'PixelSidenavComponent',
      'PixelFooterComponent',
      'PixelContainerComponent',
    ],
    html: `<pixel-app-shell>
  <pixel-header sticky>
    <pixel-button appearance="icon" leadingIcon="menu" (click)="sidenavOpen.set(!sidenavOpen())" />
    <h2>Acme Admin</h2>
  </pixel-header>

  <pixel-sidenav [(opened)]="sidenavOpen">
    <nav aria-label="Primary">
      <a>Overview</a>
      <a>Reports</a>
    </nav>
  </pixel-sidenav>

  <pixel-footer>
    <span>© 2026 Acme Inc.</span>
  </pixel-footer>

  <pixel-container maxWidth="xl">
    <h1>Overview</h1>
    <!-- page content -->
  </pixel-container>
</pixel-app-shell>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelAppShellComponent,
  PixelButtonComponent,
  PixelContainerComponent,
  PixelFooterComponent,
  PixelHeaderComponent,
  PixelSidenavComponent,
} from 'pixel-ui';

@Component({ /* … */ })
export class AppShellDashboardExample {
  protected readonly sidenavOpen = signal(true);
}`,
    scss: `pixel-app-shell {
  block-size: 100%;
}`,
  }),
] as const;
