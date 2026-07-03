import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-menu-basic-example',
  standalone: true,
  imports: [
    PixelButtonComponent,
    PixelMenuComponent,
    PixelMenuItemComponent,
    PixelMenuTriggerDirective,
  ],
  template: `
    <pixel-button appearance="tonal" [pixelMenuTriggerFor]="actions">Policy actions</pixel-button>

    <pixel-menu #actions ariaLabel="Policy actions">
      <pixel-menu-item icon="visibility" iconColor="primary" (selected)="record('View')">View</pixel-menu-item>
      <pixel-menu-item icon="edit" (selected)="record('Edit')">Edit</pixel-menu-item>
      <pixel-menu-item icon="content_copy" (selected)="record('Duplicate')">Duplicate</pixel-menu-item>
      <pixel-menu-item icon="lock" [disabled]="true">Locked (disabled)</pixel-menu-item>
      <pixel-menu-item icon="delete" variant="danger" (selected)="record('Delete')">Delete</pixel-menu-item>
    </pixel-menu>

    @if (lastAction()) {
      <p class="log" role="status">{{ lastAction() }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
    }

    .log {
      margin: 0;
      font-size: 0.8125rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuBasicExample {
  protected readonly lastAction = signal('');

  protected record(action: string): void {
    this.lastAction.set(`Selected: ${action}`);
  }
}
