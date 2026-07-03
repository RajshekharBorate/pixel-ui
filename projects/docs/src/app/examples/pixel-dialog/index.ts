import { createDocExample } from '../../shared/example-source.util';
import { DialogBasicExample } from './dialog-basic.example';
import { DialogBottomSheetExample } from './dialog-bottom-sheet.example';
import { DialogConfirmExample } from './dialog-confirm.example';
import { DialogNondismissableExample } from './dialog-nondismissable.example';
import { DialogScrollableExample } from './dialog-scrollable.example';
import { DialogServiceExample } from './dialog-service.example';
import { DialogSizesExample } from './dialog-sizes.example';
import { DialogSlotsExample } from './dialog-slots.example';

const DIALOG_IMPORTS = ['PixelDialogComponent'] as const;

export const DIALOG_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic dialog',
    category: 'Setup',
    description: 'Two-way bind open. Project footer actions with the pixelDialogFooter attribute.',
    component: DialogBasicExample,
    imports: [...DIALOG_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-button (click)="open.set(true)">Open</pixel-button>

<pixel-dialog [(open)]="open" title="Policy details" size="md">
  <p>…body…</p>
  <pixel-button pixelDialogFooter appearance="text" (click)="open.set(false)">Close</pixel-button>
  <pixel-button pixelDialogFooter appearance="solid" (click)="save()">Save</pixel-button>
</pixel-dialog>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelDialogComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DialogBasicExample {
  protected readonly open = signal(false);
}`,
  }),
  createDocExample({
    id: 'confirm',
    title: 'Confirm dialog',
    category: 'Behavior',
    description:
      'pixel-confirm-dialog emits confirmed and cancelled. Use danger for destructive actions.',
    component: DialogConfirmExample,
    imports: ['PixelConfirmDialogComponent', 'PixelButtonComponent'],
    html: `<pixel-confirm-dialog
  [(open)]="confirmDelete"
  title="Delete policy"
  message="This cannot be undone."
  confirmLabel="Delete"
  [danger]="true"
  (confirmed)="deleteNow()"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelConfirmDialogComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DialogConfirmExample {
  protected readonly dangerOpen = signal(false);
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'slots',
    title: 'Custom header & footer',
    category: 'Layout',
    description: 'Project rich markup into pixelDialogHeader and pixelDialogFooter slots.',
    component: DialogSlotsExample,
    imports: [...DIALOG_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-dialog [(open)]="open">
  <div pixelDialogHeader>…custom header…</div>
  <p>…body…</p>
  <pixel-button pixelDialogFooter appearance="solid" (click)="upgrade()">Upgrade</pixel-button>
</pixel-dialog>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDialogComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DialogSlotsExample {
  protected readonly open = signal(false);
}`,
    scss: `.header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'bottom-sheet',
    title: 'Bottom-sheet',
    category: 'Variants',
    description: 'position="bottom-sheet" anchors the surface to the bottom and slides it up.',
    component: DialogBottomSheetExample,
    imports: [...DIALOG_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-dialog [(open)]="open" position="bottom-sheet" title="Filters">
  …content slides up from the bottom edge…
  <pixel-button pixelDialogFooter appearance="solid" (click)="apply()">Apply filters</pixel-button>
</pixel-dialog>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDialogComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DialogBottomSheetExample {
  protected readonly open = signal(false);
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'Presets sm, md (default), lg, and fullscreen control the dialog surface width.',
    component: DialogSizesExample,
    imports: [...DIALOG_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-button (click)="openSize('lg')">Open large</pixel-button>

<pixel-dialog [(open)]="open" [size]="activeSize()" [title]="activeSize() + ' dialog'">
  …
</pixel-dialog>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PixelDialogComponent, type PixelDialogSize } from 'pixel-ui';

@Component({ /* … */ })
export class DialogSizesExample {
  protected readonly activeSize = signal<PixelDialogSize>('md');
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'nondismissable',
    title: 'Non-dismissable',
    category: 'Behavior',
    description:
      'dismissable="false" disables scrim click, Escape, and the close button — the user must choose an explicit action.',
    component: DialogNondismissableExample,
    imports: [...DIALOG_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-dialog [(open)]="open" title="Action required" [dismissable]="false">
  <p>You must accept the updated terms before continuing.</p>
  <pixel-button pixelDialogFooter appearance="solid" (click)="open.set(false)">Accept</pixel-button>
</pixel-dialog>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDialogComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DialogNondismissableExample {
  protected readonly open = signal(false);
}`,
  }),
  createDocExample({
    id: 'scrollable',
    title: 'Scrollable content',
    category: 'Layout',
    description:
      'When the body overflows it scrolls independently; header and footer grow subtle dividers to signal more content.',
    component: DialogScrollableExample,
    imports: [...DIALOG_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-dialog [(open)]="open" title="Terms of service" size="md">
  @for (para of longContent; track $index) { <p>{{ para }}</p> }
  <pixel-button pixelDialogFooter appearance="solid" (click)="open.set(false)">Accept</pixel-button>
</pixel-dialog>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelDialogComponent } from 'pixel-ui';

@Component({ /* … */ })
export class DialogScrollableExample {
  protected readonly longContent: readonly string[] = [ /* … */ ];
}`,
    scss: `.body {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
}`,
  }),
  createDocExample({
    id: 'service',
    title: 'Imperative service',
    category: 'Service & configuration',
    description:
      'PixelDialogService.open(Component, config) opens any component without a template binding. Inject PixelDialogRef and PIXEL_DIALOG_DATA in the opened component.',
    component: DialogServiceExample,
    imports: ['PixelDialogService', 'PixelButtonComponent', 'PixelDialogRef', 'PIXEL_DIALOG_DATA'],
    html: `<pixel-button (click)="openViaService()">Open via service</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelDialogService } from 'pixel-ui';

@Component({ /* … */ })
export class DialogServiceExample {
  private readonly dialog = inject(PixelDialogService);

  protected openViaService(): void {
    const ref = this.dialog.open(RenameDialog, {
      title: 'Rename policy',
      size: 'sm',
      data: { currentName: 'Q3 renewal' },
    });
    ref.afterClosed().subscribe(name => { /* … */ });
  }
}`,
    scss: `.log {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
}`,
  }),
] as const;
