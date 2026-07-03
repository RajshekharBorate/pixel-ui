import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelRadioGroupComponent,
  PixelRadioOption,
} from 'pixel-ui';

@Component({
  selector: 'docs-radio-basic-example',
  standalone: true,
  imports: [PixelRadioGroupComponent],
  template: `
    <pixel-radio-group
      label="Notification channel"
      helperText="Uses value and valueChange without two-way binding."
      [value]="channel()"
      [options]="channelOptions"
      (valueChange)="setChannel($event)"
    />
    <p class="meta">Selected: {{ channel() }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.5rem;
    }

    .meta {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioBasicExample {
  protected readonly channel = signal('email');

  protected setChannel(value: unknown): void {
    this.channel.set(String(value));
  }

  protected readonly channelOptions: readonly PixelRadioOption<string>[] = [
    { value: 'email', label: 'Email', icon: 'mail', description: 'Daily digest' },
    { value: 'sms', label: 'SMS', icon: 'sms', description: 'Transactional only' },
    { value: 'push', label: 'Push', icon: 'notifications', badge: 'Beta' },
  ];
}
