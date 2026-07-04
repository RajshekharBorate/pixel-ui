import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelRadioComponent,
  PixelRadioGroupComponent,
  PixelRadioSelectionChangeEvent,
} from 'pixel-ui';

@Component({
  selector: 'docs-radio-keyboard-events-example',
  imports: [PixelRadioGroupComponent, PixelRadioComponent],
  template: `
    <div class="split">
      <div class="stack">
        <p class="meta">Focus the group and use arrow keys or Space.</p>
        <pixel-radio-group
          label="Keyboard demo"
          [value]="value()"
          (valueChange)="setValue($event)"
          (keyboardSelection)="handleSelection($event)"
        >
          <pixel-radio value="standard" label="Standard" />
          <pixel-radio value="priority" label="Priority" />
        </pixel-radio-group>
      </div>
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

    .stack {
      display: grid;
      gap: 0.5rem;
    }

    .meta {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
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
export class RadioKeyboardEventsExample {
  protected readonly value = signal('standard');
  protected readonly eventLog = signal<string[]>([
    'Interact with a radio group to see events here.',
  ]);

  protected setValue(value: unknown): void {
    this.value.set(String(value));
  }

  protected handleSelection(event: PixelRadioSelectionChangeEvent): void {
    this.eventLog.update((entries) => [
      `Selected ${String(event.value)} via ${event.source}`,
      ...entries,
    ].slice(0, 8));
  }
}
