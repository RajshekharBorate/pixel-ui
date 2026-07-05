import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelCardComponent,
  PixelChipComponent,
  PixelTourAnchorDirective,
  PixelTourService,
} from 'pixel-ui';

const PERSIST_KEY = 'docs-tour-async-v1';

@Component({
  selector: 'docs-tour-async-example',
  imports: [PixelButtonComponent, PixelCardComponent, PixelChipComponent, PixelTourAnchorDirective],
  template: `
    <div class="controls">
      <pixel-button leadingIcon="tour" (click)="startTour()">Start tour</pixel-button>
      <pixel-button appearance="text" leadingIcon="restart_alt" (click)="reset()">
        Reset persistence
      </pixel-button>
      <span class="status">{{ status() }}</span>
    </div>

    <pixel-card appearance="outlined" class="playground" cardTitle="Integrations">
      <pixel-button
        size="sm"
        appearance="tonal"
        pixelTourAnchor="advanced-toggle"
        (click)="advancedOpen.set(!advancedOpen())"
      >
        Advanced settings
      </pixel-button>

      @if (advancedOpen()) {
        <div class="advanced" pixelTourAnchor="webhook-url">
          Webhook URL: <code>https://api.example.dev/hooks</code>
        </div>
      }

      <div class="chips">
        @if (connectionReady()) {
          <pixel-chip id="lazy-connection" semantic="success">Connected: Snowflake</pixel-chip>
        } @else {
          <span class="muted">No connections yet.</span>
        }
      </div>
    </pixel-card>
  `,
  styles: `
    .controls { display: flex; align-items: center; gap: var(--pixel-sys-space-sm, 0.5rem); flex-wrap: wrap; }
    .status { font-size: var(--pixel-sys-label-sm-size, 0.75rem); color: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 65%, transparent); }
    .playground { margin-block-start: var(--pixel-sys-space-md, 1rem); max-inline-size: 28rem; }
    .advanced { margin-block-start: var(--pixel-sys-space-md, 1rem); padding: var(--pixel-sys-space-sm, 0.5rem); border-radius: 0.5rem; background: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 5%, transparent); }
    .chips { margin-block-start: var(--pixel-sys-space-md, 1rem); }
    .muted { color: color-mix(in srgb, var(--pixel-sys-on-surface, #1a1b1f) 55%, transparent); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourAsyncExample {
  private readonly tour = inject(PixelTourService);

  readonly advancedOpen = signal(false);
  readonly connectionReady = signal(false);
  readonly status = signal('Runs once — persisted under "docs-tour-async-v1".');

  reset(): void {
    this.tour.resetPersistence(PERSIST_KEY);
    this.advancedOpen.set(false);
    this.connectionReady.set(false);
    this.status.set('Persistence cleared — the tour will run again.');
  }

  startTour(): void {
    const ref = this.tour.start(
      [
        {
          id: 'intro',
          title: 'Async-aware touring',
          content:
            'This tour opens panels for you, waits for lazy content, and remembers ' +
            'completion. Close it mid-way and start again — it resumes where you left off.',
          buttons: ['skip-tour', 'next'],
        },
        {
          id: 'hidden-panel',
          target: 'webhook-url',
          title: 'Hooks stage the UI',
          content:
            'This row only exists while the panel is open — beforeEnter opened it, and ' +
            'afterLeave will close it again.',
          beforeEnter: () => void this.advancedOpen.set(true),
          afterLeave: () => void this.advancedOpen.set(false),
          waitForTarget: { timeoutMs: 2000, pollMs: 50 },
        },
        {
          id: 'lazy-chip',
          target: '#lazy-connection',
          title: 'Waited for the server',
          content:
            'This chip did not exist when the step began — the tour polled until the ' +
            '(simulated) connection arrived, showing a spinner meanwhile.',
          beforeEnter: () => {
            setTimeout(() => this.connectionReady.set(true), 1200);
          },
          waitForTarget: { timeoutMs: 5000, pollMs: 100 },
        },
        {
          id: 'finale',
          title: 'Persisted!',
          content:
            'Done — with persistKey set, this tour will not show again until you reset it.',
          buttons: ['back', 'done'],
        },
      ],
      { persistKey: PERSIST_KEY, backdropClick: 'skip-tour' },
    );

    if (ref.status() === 'completed') {
      // persistKey short-circuit: the tour already ran to completion on this device.
      this.status.set('Already completed on this device — reset persistence to re-run.');
      return;
    }
    void ref.finished.then((reason) => {
      this.status.set(
        `Tour ${reason}. ${reason === 'aborted' ? 'Start again to resume from the same step.' : 'Reset persistence to re-run.'}`,
      );
    });
  }
}
