import { createDocExample } from '../../shared/example-source.util';
import { DrawerBasicExample } from './drawer-basic.example';
import { DrawerBlockingExample } from './drawer-blocking.example';
import { DrawerPositionsExample } from './drawer-positions.example';
import { DrawerServiceExample } from './drawer-service.example';
import { DrawerSizesExample } from './drawer-sizes.example';
import { DrawerWizardExample } from './drawer-wizard.example';

const DRAWER_IMPORTS = ['PixelDrawerComponent'] as const;

export const DRAWER_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic drawer',
    category: 'Setup',
    description: 'Two-way bind open on an end-aligned filter panel with footer actions.',
    component: DrawerBasicExample,
    imports: [...DRAWER_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-button (click)="open.set(true)">Open</pixel-button>

<pixel-drawer [(open)]="open" title="Filters" position="end" size="md">
  …content…
  <pixel-button pixelDrawerFooter appearance="solid" (click)="apply()">Apply</pixel-button>
</pixel-drawer>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDrawerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DrawerBasicExample {
  protected readonly open = signal(false);
}`,
  }),
  createDocExample({
    id: 'positions',
    title: 'Positions',
    category: 'Layout',
    description: 'position sets the entry edge: start, end (default), top, or bottom.',
    component: DrawerPositionsExample,
    imports: [...DRAWER_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-drawer position="start" title="Navigation" />
<pixel-drawer position="bottom" title="Quick actions" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDrawerComponent, type PixelDrawerPosition } from 'pixel-ui';

@Component({ /* … */ })
export class DrawerPositionsExample {
  protected readonly activePosition = signal<PixelDrawerPosition>('end');
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'wizard',
    title: 'Header & footer slots',
    category: 'Layout',
    description: 'pixelDrawerHeader and pixelDrawerFooter wrap scrollable wizard content.',
    component: DrawerWizardExample,
    imports: [...DRAWER_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-drawer position="end" size="lg">
  <div pixelDrawerHeader>…step indicator…</div>
  <form>…fields…</form>
  <pixel-button pixelDrawerFooter appearance="solid" (click)="save()">Save & continue</pixel-button>
</pixel-drawer>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDrawerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DrawerWizardExample {
  protected readonly open = signal(false);
}`,
    scss: `.form {
  display: grid;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'blocking',
    title: 'Non-dismissable',
    category: 'Behavior',
    description: 'dismissable="false" removes scrim, Escape, and close-button dismissal.',
    component: DrawerBlockingExample,
    imports: [...DRAWER_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-drawer
  [(open)]="open"
  title="Confirm exit"
  [dismissable]="false"
>
  <p>You have unsaved changes.</p>
  <pixel-button pixelDrawerFooter appearance="solid" (click)="save()">Save</pixel-button>
</pixel-drawer>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDrawerComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DrawerBlockingExample {
  protected readonly open = signal(false);
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'size controls width for start/end and height for top/bottom: sm, md, lg, xl.',
    component: DrawerSizesExample,
    imports: [...DRAWER_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-drawer [(open)]="open" position="end" [size]="activeSize()" title="Filters">
  …
</pixel-drawer>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDrawerComponent, type PixelDrawerSize } from 'pixel-ui';

@Component({ /* … */ })
export class DrawerSizesExample {
  protected readonly activeSize = signal<PixelDrawerSize>('md');
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'service',
    title: 'Imperative service',
    category: 'Service & configuration',
    description:
      'PixelDrawerService.open(Component, config) opens any component in a drawer. Inject PixelDrawerRef and PIXEL_DRAWER_DATA in the opened component.',
    component: DrawerServiceExample,
    imports: ['PixelDrawerService', 'PixelButtonComponent', 'PixelDrawerRef', 'PIXEL_DRAWER_DATA'],
    html: `<pixel-button (click)="openViaService()">Open via service</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelDrawerService } from 'pixel-ui';

@Component({ /* … */ })
export class DrawerServiceExample {
  private readonly drawer = inject(PixelDrawerService);

  protected openViaService(): void {
    const ref = this.drawer.open(CreatePolicyWizard, {
      title: 'Create policy',
      position: 'end',
      size: 'lg',
      data: { owner: 'Ada Lovelace' },
    });
    ref.afterClosed().subscribe(result => { /* … */ });
  }
}`,
    scss: `.log {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
}`,
  }),
] as const;
