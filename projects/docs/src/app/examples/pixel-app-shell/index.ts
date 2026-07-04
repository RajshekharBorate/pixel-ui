import { createDocExample } from '../../shared/example-source.util';
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
] as const;
