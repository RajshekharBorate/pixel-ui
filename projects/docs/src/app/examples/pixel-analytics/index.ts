import { createDocExample } from '../../shared/example-source.util';
import { AnalyticsBasicExample } from './analytics-basic.example';
import { AnalyticsButtonBridgeExample } from './analytics-button-bridge.example';
import { AnalyticsConsentExample } from './analytics-consent.example';
import { AnalyticsDataExample } from './analytics-data.example';
import { AnalyticsDataGridExample } from './analytics-data-grid.example';
import { AnalyticsDialogExample } from './analytics-dialog.example';
import { AnalyticsDirectiveExample } from './analytics-directive.example';
import { AnalyticsErrorExample } from './analytics-error.example';
import { AnalyticsFormControlsExample } from './analytics-form-controls.example';
import { AnalyticsHttpExample } from './analytics-http.example';
import { AnalyticsNavExample } from './analytics-nav.example';
import { AnalyticsOverlaysExample } from './analytics-overlays.example';
import { AnalyticsPageExample } from './analytics-page.example';
import { AnalyticsPerformanceExample } from './analytics-performance.example';
import { AnalyticsPrivacyExample } from './analytics-privacy.example';

export const ANALYTICS_EXAMPLES = [
  createDocExample({
    id: 'analytics-basic',
    title: 'Core API',
    category: 'Basics',
    description:
      'track, page, identify, and diagnostics with a docs-only capture provider (no network).',
    component: AnalyticsBasicExample,
    packageImportPath: 'pixel-analytics',
    imports: ['PixelAnalyticsService', 'providePixelAnalytics', 'PixelButtonComponent'],
    html: `<pixel-button (click)="trackClick()">Track click</pixel-button>
<pixel-button (click)="trackPage()">Page view</pixel-button>
<pixel-button (click)="identify()">Identify</pixel-button>`,
    typescript: `import { Component, inject } from '@angular/core';
import { PixelAnalyticsService, providePixelAnalytics } from 'pixel-analytics';

bootstrapApplication(App, {
  providers: [
    providePixelAnalytics({
      application: { id: 'app', environment: 'production' },
      http: { endpoint: '/api/analytics/events' },
      consent: { required: true, defaultState: 'granted' },
    }),
  ],
});

@Component({ /* … */ })
export class Demo {
  private readonly analytics = inject(PixelAnalyticsService);

  trackClick(): void {
    this.analytics.track({
      name: 'ui.button.click',
      properties: { action: 'demo' },
    });
  }
}`,
  }),
  createDocExample({
    id: 'analytics-consent',
    title: 'Consent gate',
    category: 'Privacy',
    description:
      'When consent.required is true, events drop until setConsent("granted"). Deny or unknown stops collection.',
    component: AnalyticsConsentExample,
    packageImportPath: 'pixel-analytics',
    imports: ['PixelAnalyticsService', 'providePixelAnalytics'],
    html: `<pixel-button (click)="setConsent('granted')">Grant</pixel-button>
<pixel-button (click)="track()">Track event</pixel-button>`,
    typescript: `providePixelAnalytics({
  application: { id: 'app', environment: 'production' },
  consent: { required: true, defaultState: 'unknown', beforeConsent: 'drop' },
});

analytics.setConsent('granted');
analytics.track({ name: 'ui.button.click' });`,
  }),
  createDocExample({
    id: 'analytics-privacy',
    title: 'PII sanitizer',
    category: 'Privacy',
    description:
      'blockFields removes secrets; maskFields redacts PII before events leave the pipeline.',
    component: AnalyticsPrivacyExample,
    packageImportPath: 'pixel-analytics',
    imports: ['PixelAnalyticsService', 'providePixelAnalytics'],
    html: `<pixel-button (click)="trackUnsafe()">Track unsafe payload</pixel-button>`,
    typescript: `providePixelAnalytics({
  application: { id: 'app', environment: 'production' },
  privacy: {
    enabled: true,
    blockFields: ['password', 'token'],
    maskFields: ['email', 'phone'],
  },
});

analytics.track({
  name: 'form.submit',
  properties: { email: 'ada@example.com', password: 'secret' },
});`,
  }),
  createDocExample({
    id: 'analytics-page',
    title: 'Page & route events',
    category: 'Plugins',
    description:
      'Manual page() / navigation events. Prefer withRouteTracking() for NavigationEnd automation.',
    component: AnalyticsPageExample,
    packageImportPath: 'pixel-analytics',
    imports: ['PixelAnalyticsService', 'withRouteTracking'],
    html: `<pixel-button (click)="pageView()">Emit page view</pixel-button>
<pixel-button (click)="routeChange()">Emit route change</pixel-button>`,
    typescript: `providePixelAnalytics({ /* … */ }),
withRouteTracking({ trackRouteChange: true });

// or manually:
analytics.page();
analytics.track({ name: 'navigation.route.change', properties: { path: '/home' } });`,
  }),
  createDocExample({
    id: 'analytics-http',
    title: 'HTTP interceptor',
    category: 'Plugins',
    description:
      'pixelAnalyticsHttpInterceptor + withHttpTracking emit api.request / api.error without bodies or headers.',
    component: AnalyticsHttpExample,
    packageImportPath: 'pixel-analytics',
    imports: [
      'pixelAnalyticsHttpInterceptor',
      'withHttpTracking',
      'provideHttpClient',
    ],
    html: `<pixel-button (click)="emitSuccess()">Simulate api.request</pixel-button>
<pixel-button (click)="emitError()">Simulate api.error</pixel-button>`,
    typescript: `provideHttpClient(withInterceptors([pixelAnalyticsHttpInterceptor])),
providePixelAnalytics({ http: { endpoint: '/api/analytics/events' }, /* … */ }),
withHttpTracking({ captureSuccess: false, captureErrors: true });

// Interceptor emits api.request / api.error (metadata only).`,
  }),
  createDocExample({
    id: 'analytics-error',
    title: 'Error tracking',
    category: 'Plugins',
    description:
      'trackError for handled failures; withErrorTracking / PixelAnalyticsErrorHandler for unhandled.',
    component: AnalyticsErrorExample,
    packageImportPath: 'pixel-analytics',
    imports: ['PixelAnalyticsService', 'withErrorTracking'],
    html: `<pixel-button (click)="handled()">Track handled error</pixel-button>
<pixel-button (click)="unhandled()">Fire unhandled error</pixel-button>`,
    typescript: `providePixelAnalytics({ /* … */ }),
withErrorTracking({ rethrow: true });

analytics.trackError(new Error('Validation failed'), {
  handled: true,
  component: 'ProfileForm',
});`,
  }),
  createDocExample({
    id: 'analytics-performance',
    title: 'Performance timings',
    category: 'Plugins',
    description:
      'trackPerformance for custom spans; withPerformanceTracking for page load / Web Vitals (sampled).',
    component: AnalyticsPerformanceExample,
    packageImportPath: 'pixel-analytics',
    imports: ['PixelAnalyticsService', 'withPerformanceTracking'],
    html: `<pixel-button (click)="measure()">Measure dashboard load</pixel-button>`,
    typescript: `providePixelAnalytics({
  sampling: { performanceRate: 0.25 },
  /* … */
}),
withPerformanceTracking();

analytics.trackPerformance({
  name: 'dashboard-load',
  durationMs: 312,
});`,
  }),
  createDocExample({
    id: 'analytics-directive',
    title: 'Track directive',
    category: 'UI integration',
    description:
      'Declarative pixelAnalyticsTrack on any host. Prefer analyticsAction on pixel-button when available.',
    component: AnalyticsDirectiveExample,
    packageImportPath: 'pixel-analytics',
    imports: ['PixelAnalyticsTrackDirective'],
    html: `<button
  type="button"
  pixelAnalyticsTrack="ui.button.click"
  [analyticsProperties]="{ action: 'export' }">
  Export
</button>`,
    typescript: `import { PixelAnalyticsTrackDirective } from 'pixel-analytics';

@Component({
  imports: [PixelAnalyticsTrackDirective],
  // …
})
export class Demo {}`,
  }),
  createDocExample({
    id: 'analytics-form-controls',
    title: 'Form control hooks',
    category: 'UI integration',
    description:
      'Wave 1: select / checkbox / radio / toggle emit ui.* events via PIXEL_UI_ANALYTICS without option labels or raw values.',
    component: AnalyticsFormControlsExample,
    packageImportPath: 'pixel-analytics',
    imports: [
      'createPixelUiAnalyticsPort',
      'PIXEL_UI_ANALYTICS',
      'PixelSelectComponent',
      'PixelCheckboxComponent',
      'PixelRadioGroupComponent',
      'PixelToggleComponent',
    ],
    composeWith: ['pixel-select', 'pixel-checkbox', 'pixel-radio', 'pixel-toggle'],
    html: `<pixel-select analyticsId="status" [options]="…" />
<pixel-checkbox analyticsId="terms" label="Accept terms" />
<pixel-radio-group analyticsId="priority" [options]="…" />
<pixel-toggle analyticsId="alerts" label="Alerts" />`,
    typescript: `{
  provide: PIXEL_UI_ANALYTICS,
  useFactory: (a: PixelAnalyticsService) => createPixelUiAnalyticsPort(a),
  deps: [PixelAnalyticsService],
}`,
  }),
  createDocExample({
    id: 'analytics-nav',
    title: 'Navigation hooks',
    category: 'UI integration',
    description:
      'Wave 2: tabs / menu / paginator emit ui.* events via PIXEL_UI_ANALYTICS without labels.',
    component: AnalyticsNavExample,
    packageImportPath: 'pixel-analytics',
    imports: [
      'createPixelUiAnalyticsPort',
      'PIXEL_UI_ANALYTICS',
      'PixelTabsComponent',
      'PixelMenuComponent',
      'PixelPaginatorComponent',
    ],
    composeWith: ['pixel-tabs', 'pixel-menu', 'pixel-paginator'],
    html: `<pixel-tabs analyticsId="detail">…</pixel-tabs>
<pixel-menu analyticsId="row-actions">
  <pixel-menu-item analyticsAction="export">Export</pixel-menu-item>
</pixel-menu>
<pixel-paginator analyticsId="list" [length]="80" />`,
    typescript: `{
  provide: PIXEL_UI_ANALYTICS,
  useFactory: (a: PixelAnalyticsService) => createPixelUiAnalyticsPort(a),
  deps: [PixelAnalyticsService],
}`,
  }),
  createDocExample({
    id: 'analytics-overlays',
    title: 'Overlay & feedback hooks',
    category: 'UI integration',
    description:
      'Wave 3: drawer / popover / toast emit via PIXEL_UI_ANALYTICS without titles or messages.',
    component: AnalyticsOverlaysExample,
    packageImportPath: 'pixel-analytics',
    imports: [
      'createPixelUiAnalyticsPort',
      'PIXEL_UI_ANALYTICS',
      'PixelDrawerComponent',
      'PixelPopoverComponent',
      'PixelToastService',
    ],
    composeWith: ['pixel-drawer', 'pixel-popover', 'pixel-toast'],
    html: `<pixel-drawer analyticsId="filters" [(open)]="open" />
<pixel-popover analyticsId="help-tip">…</pixel-popover>`,
    typescript: `{
  provide: PIXEL_UI_ANALYTICS,
  useFactory: (a: PixelAnalyticsService) => createPixelUiAnalyticsPort(a),
  deps: [PixelAnalyticsService],
}`,
  }),
  createDocExample({
    id: 'analytics-data',
    title: 'Date & file hooks',
    category: 'UI integration',
    description:
      'Waves 4–5: datepicker hasValue-only by default; file upload counts/buckets only (no filenames).',
    component: AnalyticsDataExample,
    packageImportPath: 'pixel-analytics',
    imports: [
      'createPixelUiAnalyticsPort',
      'PIXEL_UI_ANALYTICS',
      'PixelDatepickerComponent',
      'PixelFileUploadComponent',
    ],
    composeWith: ['pixel-datepicker', 'pixel-file-upload'],
    html: `<pixel-datepicker analyticsId="due-date" />
<pixel-file-upload analyticsId="claim-docs" />`,
    typescript: `{
  provide: PIXEL_UI_ANALYTICS,
  useFactory: (a: PixelAnalyticsService) => createPixelUiAnalyticsPort(a),
  deps: [PixelAnalyticsService],
}`,
  }),
  createDocExample({
    id: 'analytics-button-bridge',
    title: 'Button bridge',
    category: 'UI integration',
    description:
      'Bridge PIXEL_UI_ANALYTICS → PixelAnalyticsService, then use analyticsAction / analyticsProperties on pixel-button.',
    component: AnalyticsButtonBridgeExample,
    packageImportPath: 'pixel-analytics',
    imports: [
      'createPixelUiAnalyticsPort',
      'PIXEL_UI_ANALYTICS',
      'PixelButtonComponent',
    ],
    composeWith: ['pixel-button'],
    html: `<pixel-button
  analyticsAction="save"
  [analyticsProperties]="{ feature: 'claims' }">
  Save
</pixel-button>`,
    typescript: `{
  provide: PIXEL_UI_ANALYTICS,
  useFactory: (analytics: PixelAnalyticsService) =>
    createPixelUiAnalyticsPort(analytics),
  deps: [PixelAnalyticsService],
}`,
  }),
  createDocExample({
    id: 'analytics-dialog',
    title: 'Dialog open / close',
    category: 'UI integration',
    description:
      'With the Pixel UI bridge, dialog open/close emit ui.modal.open / ui.modal.close (optional analyticsId).',
    component: AnalyticsDialogExample,
    packageImportPath: 'pixel-analytics',
    imports: ['createPixelUiAnalyticsPort', 'PIXEL_UI_ANALYTICS', 'PixelDialogComponent'],
    composeWith: ['pixel-dialog'],
    html: `<pixel-dialog [(open)]="open" analyticsId="confirm-delete">…</pixel-dialog>`,
    typescript: `// provide PIXEL_UI_ANALYTICS via createPixelUiAnalyticsPort
// open/close emit ui.modal.open / ui.modal.close`,
  }),
  createDocExample({
    id: 'analytics-data-grid',
    title: 'Data grid telemetry',
    category: 'UI integration',
    description:
      'Sort, filter, and export emit data.table.* / data.export events (no raw filter values).',
    component: AnalyticsDataGridExample,
    packageImportPath: 'pixel-analytics',
    imports: [
      'createPixelUiAnalyticsPort',
      'PIXEL_UI_ANALYTICS',
      'PixelDataGridComponent',
    ],
    composeWith: ['pixel-data-grid'],
    html: `<pixel-data-grid [rows]="rows()" [columns]="columns" exportable />`,
    typescript: `// provide PIXEL_UI_ANALYTICS via createPixelUiAnalyticsPort
// sort → data.table.sort · filter → data.table.filter · export → data.export`,
  }),
];
