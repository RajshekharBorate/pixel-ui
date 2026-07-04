import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelMenuComponent,
  PixelMenuItemComponent,
  PixelMenuTriggerDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-menu-icon-trigger-example',
  imports: [PixelButtonComponent, PixelMenuComponent, PixelMenuItemComponent, PixelMenuTriggerDirective],
  template: `
    <pixel-button
      appearance="icon"
      ariaLabel="Row options"
      leadingIcon="more_vert"
      [pixelMenuTriggerFor]="overflowMenu"
    />

    <pixel-menu #overflowMenu ariaLabel="Row options">
      <pixel-menu-item icon="push_pin" (selected)="record('Pin to top')">Pin to top</pixel-menu-item>
      <pixel-menu-item icon="notifications" (selected)="record('Mute')">Mute</pixel-menu-item>
      <pixel-menu-item icon="report" variant="danger" (selected)="record('Report')">Report</pixel-menu-item>
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
export class MenuIconTriggerExample {
  protected readonly lastAction = signal('');

  protected record(action: string): void {
    this.lastAction.set(`Selected: ${action}`);
  }
}
