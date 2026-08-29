import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PIXEL_ANALYTICS_EXTRA_PROVIDERS,
  PixelAnalyticsService,
  PixelAnalyticsTrackDirective,
  createPixelAnalyticsProviders,
} from 'pixel-analytics';
import {
  DOCS_ANALYTICS_LOG_STYLES,
  DocsAnalyticsCaptureStore,
  createDocsCaptureProvider,
} from './docs-analytics-harness';

@Component({
  selector: 'docs-analytics-directive-example',
  imports: [PixelButtonComponent, PixelAnalyticsTrackDirective, JsonPipe],
  providers: [
    DocsAnalyticsCaptureStore,
    {
      provide: PIXEL_ANALYTICS_EXTRA_PROVIDERS,
      useFactory: (store: DocsAnalyticsCaptureStore) => [createDocsCaptureProvider(store)],
      deps: [DocsAnalyticsCaptureStore],
    },
    ...createPixelAnalyticsProviders({
      application: { id: 'docs-demo', environment: 'docs' },
      consent: { required: false },
      validateRegistry: false,
      queue: { flushIntervalMs: 60_000 },
    }),
  ],
  template: `
    <p class="hint">
      Declarative tracking for any host via <code>pixelAnalyticsTrack</code>. Prefer
      <code>analyticsAction</code> on <code>pixel-button</code> (it stops click bubbling).
    </p>
    <div class="actions">
      <button
        type="button"
        class="native"
        pixelAnalyticsTrack="ui.button.click"
        [analyticsProperties]="{ action: 'native-save', surface: 'directive' }"
        analyticsComponent="docs-native-button"
      >
        Native button
      </button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <div class="log" aria-live="polite">
      @if (capture.events().length === 0) {
        <p class="log__empty">Click the native button.</p>
      } @else {
        @for (event of capture.events(); track event.id) {
          <pre class="log__item">{{ event.name }} {{ event.properties | json }}</pre>
        }
      }
    </div>
  `,
  styles: [
    DOCS_ANALYTICS_LOG_STYLES,
    `
      .native {
        padding: 0.5rem 0.875rem;
        border: 1px solid var(--pixel-sys-outline, #74777f);
        border-radius: var(--pixel-sys-shape-corner-small, 0.625rem);
        background: var(--pixel-sys-surface, #fff);
        color: var(--pixel-sys-on-surface, #1a1b1f);
        cursor: pointer;
        font: inherit;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDirectiveExample {
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  /** Keep service alive so the directive can inject it. */
  private readonly _analytics = inject(PixelAnalyticsService);
}
