import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonChangeEvent, PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-controlled-toggle-example',
  standalone: true,
  imports: [PixelButtonComponent],
  template: `
    <pixel-button
      appearance="tonal"
      leadingIcon="notifications"
      [toggleable]="true"
      [pressed]="notificationsEnabled()"
      ariaLabel="Push notifications"
      ariaDescribedBy="notifications-help"
      (change)="handleToggleChange($event)"
    >
      {{ notificationsEnabled() ? 'Enabled' : 'Disabled' }}
    </pixel-button>
    <p id="notifications-help" class="helper">
      <code>change</code> carries <code>pressed</code>, <code>source</code>, and the original event.
    </p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
    }

    .helper {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }

    .helper code {
      font-size: 0.84em;
      padding: 0.1em 0.35em;
      border-radius: 0.25rem;
      background: var(--pixel-sys-surface-container);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonControlledToggleExample {
  protected readonly notificationsEnabled = signal(false);

  protected handleToggleChange(event: PixelButtonChangeEvent): void {
    this.notificationsEnabled.set(event.pressed);
  }
}
