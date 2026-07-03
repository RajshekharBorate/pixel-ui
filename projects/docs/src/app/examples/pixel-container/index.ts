import { createDocExample } from '../../shared/example-source.util';
import { ContainerBasicExample } from './container-basic.example';

export const CONTAINER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic',
    category: 'Setup',
    description: 'Caps content width per breakpoint and centers it, with responsive inline padding.',
    component: ContainerBasicExample,
    imports: ['PixelContainerComponent'],
    html: `<pixel-container maxWidth="sm">
  <p>Capped at sm (40rem) and centered.</p>
</pixel-container>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelContainerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class ContainerBasicExample {}`,
  }),
] as const;
