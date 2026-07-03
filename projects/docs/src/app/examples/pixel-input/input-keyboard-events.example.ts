import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-keyboard-events-example',
  standalone: true,
  imports: [PixelInputComponent],
  template: `
    <div class="split">
      <pixel-input
        label="Try Enter and Escape"
        placeholder="Type, press Enter, press Escape when clear is on"
        [showClear]="true"
        helperText="Tab into the field, press Enter to log, press Escape to clear."
        (enterPress)="log('Enter pressed')"
        (focusChange)="log('Focus changed: ' + $event)"
        (blurChange)="log('Blur emitted')"
        (clearClick)="log('Clear clicked')"
      />
      <aside class="log" aria-label="Event log">
        <p class="log-title">Events</p>
        @for (entry of eventLog(); track $index) {
          <p>{{ entry }}</p>
        }
      </aside>
    </div>
  `,
  styles: `
    .split {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(14rem, 1fr) minmax(10rem, 14rem);
      align-items: start;
      max-width: 40rem;
    }

    .log {
      margin: 0;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: color-mix(in srgb, var(--pixel-sys-surface-container) 80%, transparent);
      font-size: 0.8125rem;
    }

    .log-title {
      margin: 0 0 0.5rem;
      font-weight: 600;
    }

    .log p {
      margin: 0.25rem 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputKeyboardEventsExample {
  protected readonly eventLog = signal<string[]>([
    'Focus the field and press Enter or Escape.',
  ]);

  protected log(message: string): void {
    this.eventLog.update((entries) => [message, ...entries].slice(0, 8));
  }
}
