import { createDocExample } from '../../shared/example-source.util';
import { HeaderBasicExample } from './header-basic.example';

export const HEADER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic',
    category: 'Setup',
    description: 'A title plus trailing actions, automatically pushed to the end of the row.',
    component: HeaderBasicExample,
    imports: ['PixelHeaderComponent'],
    html: `<pixel-header>
  <h2>Dashboard</h2>
  <pixel-button pixelHeaderActions appearance="icon" leadingIcon="notifications" ariaLabel="Notifications" />
  <pixel-button pixelHeaderActions appearance="icon" leadingIcon="account_circle" ariaLabel="Account" />
</pixel-header>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent, PixelHeaderComponent } from 'pixel-ui';

@Component({ /* … */ })
export class HeaderBasicExample {}`,
  }),
] as const;
