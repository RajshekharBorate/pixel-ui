import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import { PixelRadioGroupComponent, PixelRadioLayout, PixelRadioOption } from 'pixel-ui';

@Component({
  selector: 'docs-radio-layouts-example',
  imports: [PixelButtonComponent, PixelRadioGroupComponent],
  template: `
    <div class="stack">
      <div class="toolbar" role="group" aria-label="Layout">
        @for (item of layouts; track item) {
          <pixel-button
            size="sm"
            [appearance]="layout() === item ? 'tonal' : 'elevated'"
            (click)="layout.set(item)"
          >
            {{ item }}
          </pixel-button>
        }
      </div>
      <pixel-radio-group
        label="Delivery layout demo"
        [layout]="layout()"
        [value]="channel()"
        [options]="channelOptions"
        (valueChange)="setChannel($event)"
      />
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 28rem;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioLayoutsExample {
  protected readonly channel = signal('email');
  protected readonly layout = signal<PixelRadioLayout>('vertical');
  protected readonly layouts: readonly PixelRadioLayout[] = ['vertical', 'horizontal', 'grid'];

  protected readonly channelOptions: readonly PixelRadioOption<string>[] = [
    { value: 'email', label: 'Email', icon: 'mail', description: 'Daily digest' },
    { value: 'sms', label: 'SMS', icon: 'sms', description: 'Transactional only' },
    { value: 'push', label: 'Push', icon: 'notifications', badge: 'Beta' },
  ];

  protected setChannel(value: unknown): void {
    this.channel.set(String(value));
  }
}
