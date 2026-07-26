import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-menu-context-example',
  imports: [PixelMenuComponent, PixelMenuItemComponent, PixelMenuTriggerDirective],
  template: `
    <div
      class="surface"
      tabindex="0"
      [pixelMenuTriggerFor]="ctx"
      pixelMenuTrigger="contextmenu"
    >
      Right-click (or focus and press Shift+F10)
    </div>

    <pixel-menu #ctx ariaLabel="Canvas actions">
      <pixel-menu-item icon="content_copy" (selected)="record('Copy')">Copy</pixel-menu-item>
      <pixel-menu-item icon="content_paste" (selected)="record('Paste')">Paste</pixel-menu-item>
      <pixel-menu-item icon="delete" variant="danger" (selected)="record('Delete')">Delete</pixel-menu-item>
    </pixel-menu>

    @if (lastAction()) {
      <p class="log" role="status">{{ lastAction() }}</p>
    }
  `,
  styles: `
    .surface {
      display: grid;
      place-items: center;
      min-block-size: 8rem;
      padding: 1rem;
      border: 1px dashed var(--pixel-sys-outline, #6b7280);
      border-radius: var(--pixel-sys-shape-corner-medium, 0.75rem);
      background: var(--pixel-sys-surface-container-low, #f3f6fc);
      color: var(--pixel-sys-on-surface, #1a1b1f);
      cursor: context-menu;
    }

    .log {
      margin: 0.75rem 0 0;
      font-size: 0.8125rem;
      color: var(--pixel-sys-on-surface-variant, #44474f);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuContextExample {
  protected readonly lastAction = signal('');

  protected record(action: string): void {
    this.lastAction.set(action);
  }
}
