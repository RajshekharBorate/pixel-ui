import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelCheckboxStateChangeEvent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-keyboard-events-example',
  imports: [PixelCheckboxComponent],
  template: `
    <div class="split">
      <pixel-checkbox
        label="Keyboard reachable"
        helperText="Tab here, then press Space or Enter."
        [checked]="checked()"
        (stateChange)="handleEvent($event)"
      />
      <aside class="log" aria-label="Interaction log">
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
export class CheckboxKeyboardEventsExample {
  protected readonly checked = signal(false);
  protected readonly eventLog = signal<string[]>([
    'Toggle a checkbox to see emitted events here.',
  ]);

  protected handleEvent(event: PixelCheckboxStateChangeEvent): void {
    this.checked.set(event.checked);
    this.eventLog.update((entries) => [
      `Keyboard demo ${event.state} via ${event.source}`,
      ...entries,
    ].slice(0, 8));
  }
}
