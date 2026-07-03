import { createDocExample } from '../../shared/example-source.util';
import { SidenavBasicExample } from './sidenav-basic.example';

export const SIDENAV_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Docked, toggleable',
    category: 'Setup',
    description:
      'A docked sidenav with a toggle button. See the app-shell "Dashboard shell" example for the ' +
      'live responsive auto-collapse-to-overlay behavior.',
    component: SidenavBasicExample,
    imports: ['PixelSidenavComponent'],
    html: `<pixel-sidenav mode="side" autoCollapseBreakpoint="none" [(opened)]="open">
  <nav>
    <a>Overview</a>
    <a>Reports</a>
    <a>Settings</a>
  </nav>
</pixel-sidenav>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSidenavComponent } from 'pixel-ui';

@Component({ /* … */ })
export class SidenavBasicExample {
  protected readonly open = signal(true);
}`,
  }),
] as const;
