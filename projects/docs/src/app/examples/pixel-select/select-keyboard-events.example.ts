import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSelectComponent, PixelSelectOption } from 'pixel-ui';

@Component({
  selector: 'docs-select-keyboard-events-example',
  standalone: true,
  imports: [PixelSelectComponent],
  template: `
    <div class="split">
      <pixel-select
        label="Keyboard navigation"
        [options]="countries"
        [searchable]="true"
        helperText="Use arrows, enter, escape, and backspace."
        (focusChange)="log('Focus changed: ' + $event)"
        (blurChange)="log('Blur changed: ' + $event)"
        (openChange)="log('Open changed: ' + $event)"
        (selectionChange)="log('Selection changed')"
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
export class SelectKeyboardEventsExample {
  protected readonly eventLog = signal<string[]>([
    'Focus a select and use Arrow keys + Enter to navigate.',
  ]);

  protected readonly countries: readonly PixelSelectOption[] = [
    { value: 1, label: 'India' },
    { value: 2, label: 'Japan' },
    { value: 3, label: 'Germany' },
    { value: 4, label: 'France' },
  ];

  protected log(message: string): void {
    this.eventLog.update((entries) => [message, ...entries].slice(0, 8));
  }
}
