import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import {
  PIXEL_ANALYTICS_EXTRA_PROVIDERS,
  PixelAnalyticsService,
  createPixelAnalyticsProviders,
} from 'pixel-analytics';
import {
  DOCS_ANALYTICS_LOG_STYLES,
  DocsAnalyticsCaptureStore,
  createDocsCaptureProvider,
} from './docs-analytics-harness';
import { DOCS_ANALYTICS_EVENT_SAMPLES } from './docs-analytics-event-samples';
import DocsAnalyticsLogComponent from './docs-analytics-log.component';

@Component({
  selector: 'docs-analytics-privacy-example',
  imports: [PixelButtonComponent, DocsAnalyticsLogComponent],
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
      privacy: {
        enabled: true,
        blockFields: ['password', 'token'],
        maskFields: ['email', 'phone'],
      },
      validateRegistry: false,
      queue: { flushIntervalMs: 60_000 },
    }),
  ],
  template: `
    <div class="docs-analytics-example">
    <p class="hint">
      Sanitizer blocks secrets and masks PII before events leave the pipeline. Try tracking with a
      password + email payload — only safe fields survive.
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="shield" (click)="trackUnsafe()">
        Track unsafe payload
      </pixel-button>
      <pixel-button appearance="text" leadingIcon="delete" (click)="capture.clear()">
        Clear log
      </pixel-button>
    </div>
    <docs-analytics-log [expected]="expected" emptyMessage="No events yet." />
    </div>
  `,
  styles: [DOCS_ANALYTICS_LOG_STYLES],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPrivacyExample {
  private readonly analytics = inject(PixelAnalyticsService);
  protected readonly capture = inject(DocsAnalyticsCaptureStore);
  protected readonly expected = DOCS_ANALYTICS_EVENT_SAMPLES['analytics-privacy'];

  protected trackUnsafe(): void {
    this.analytics.track({
      name: 'form.submit',
      properties: {
        formId: 'profile',
        email: 'ada@example.com',
        phone: '555-0100',
        password: 'super-secret',
        token: 'abc.def.ghi',
        action: 'save',
      },
    });
  }
}
