import { createDocExample } from '../../shared/example-source.util';
import { FooterBasicExample } from './footer-basic.example';

export const FOOTER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic',
    category: 'Setup',
    description: 'A minimal app-level footer with a top divider.',
    component: FooterBasicExample,
    imports: ['PixelFooterComponent'],
    html: `<pixel-footer>
  <span>© 2026 Acme Inc.</span>
  <span>v1.0.0</span>
</pixel-footer>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelFooterComponent } from 'pixel-ui';

@Component({ /* … */ })
export class FooterBasicExample {}`,
  }),
] as const;
