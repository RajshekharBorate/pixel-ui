# pixel-analytics

Vendor-neutral analytics foundation for Pixel UI and enterprise Angular applications.

**Default integration:** batched HTTP POST to your analytics backend (composable CDP / warehouse
ingest). No Google, Adobe, or Segment SDKs in this package.

## Quick start

```ts
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  providePixelAnalytics,
  withRouteTracking,
  withHttpTracking,
  withErrorTracking,
  withPerformanceTracking,
  pixelAnalyticsHttpInterceptor,
} from 'pixel-analytics';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([pixelAnalyticsHttpInterceptor])),
    providePixelAnalytics({
      application: {
        id: 'platform-ui',
        version: '1.0.0',
        environment: 'production',
      },
      http: { endpoint: '/api/analytics/events' },
      consent: { required: true },
      debug: false,
    }),
    withRouteTracking({ trackQuery: false }),
    withHttpTracking({ captureSuccess: false, captureErrors: true }),
    withErrorTracking(),
    withPerformanceTracking({ webVitals: true }),
  ],
};
```

```ts
import { inject } from '@angular/core';
import { PixelAnalyticsService } from 'pixel-analytics';

const analytics = inject(PixelAnalyticsService);

analytics.setConsent('granted');
analytics.page();
analytics.track({
  name: 'ui.button.click',
  properties: { action: 'save', feature: 'claims' },
});
```

## Pixel UI integration (Phase 9)

`pixel-ui` stays vendor-neutral via an optional port:

```ts
import { PIXEL_UI_ANALYTICS } from 'pixel-ui';
import {
  providePixelAnalytics,
  PixelAnalyticsService,
  createPixelUiAnalyticsPort,
  PixelAnalyticsTrackDirective,
} from 'pixel-analytics';

providers: [
  providePixelAnalytics({ /* … */ }),
  {
    provide: PIXEL_UI_ANALYTICS,
    useFactory: (analytics: PixelAnalyticsService) => createPixelUiAnalyticsPort(analytics),
    deps: [PixelAnalyticsService],
  },
]
```

| Surface | How to track | Properties |
|---------|----------------|------------|
| Any host | `pixelAnalyticsTrack` directive | `analyticsProperties`, `analyticsComponent` |
| `pixel-button` / `pixel-split-button` | `analyticsAction` (+ optional `analyticsProperties`) | `action` (frozen last); split primary click |
| `pixel-dialog` | auto open/close when port provided | `dialogId`, `size`, `position`, close `reason` |
| `pixel-drawer` | auto open/close | `drawerId`, `position`, `size`, close `reason` |
| `pixel-popover` | auto open/close | `popoverId`, `position`, `align` |
| `pixel-toast` | service show/dismiss | `toastId`, `type`, `variant`, dismiss `reason` — never title/message |
| `pixel-notification` | dual-emit from notification service | `notificationId`, `severity`, `actionId?` — never title/message |
| `pixel-tour` | dual-emit from tour service | `stepId`, `stepIndex`, `total` — never titles/content |
| `pixel-data-grid` | sort / filter / filter.clear / search / page / export | `gridId`; search never includes query text |
| `pixel-select` | auto open/close/change | `selectId`, `multiple`, `hasValue`, `selectedCount` |
| `pixel-autocomplete` | auto open/close/select/clear | `autocompleteId`, `multiple`; never raw query/label text |
| `pixel-checkbox` | auto toggle | `checkboxId`, `name`, `checked` |
| `pixel-radio-group` | auto select | `groupId`, `hasValue`; `value` only if `analyticsEmitValue` |
| `pixel-toggle` | auto change | `toggleId`, `mode`, `checked` |
| `pixel-tabs` | auto change | `tabsId`, `index`, optional `tabId` (never label) |
| `pixel-menu` | auto open/close/select | `menuId`; item `action` / `itemId` (never label) |
| `pixel-sidenav` | auto open/close | `sidenavId`, `mode`, `position` |
| `pixel-breadcrumb` | auto navigate | `breadcrumbId`, `index`, optional path-only `href` |
| `pixel-stepper` | auto next/back/goto | `stepperId`, `from`, `to`, optional `stepId` |
| `pixel-paginator` | auto page | `paginatorId`, `pageIndex`, `pageSize` |
| `pixel-expansion-panel` | auto expand/collapse | `panelId` (never title) |
| Date / time pickers + calendar | auto open/close/select/clear | `hasValue`; ISO / time only if `analyticsEmitValue` |
| `pixel-file-upload` | select / reject / remove | counts + mime/size buckets — never filenames |
| `pixel-query-builder` | rule/group add/remove | ids/counts — never rule values |
| `pixel-editor` | command / find_open | `commandId` — never document content |
| Charts (`pixel-chart-shell` + facades) | legend toggle / point click | `chartId`, `seriesId`, `categoryIndex` — never labels |

Presentational surfaces (loader, skeleton, divider, …) stay directive-only by design.

### Correlation and entity context

- **Interaction scopes:** `analytics.beginInteraction(name)` / `runInInteraction()` share
  `context.correlation.traceId` across related events. `createPixelUiAnalyticsPort` forwards
  `beginInteraction`; root `pixel-menu` opens a scope automatically.
- **App domain entity:** `analytics.setEntity({ type: 'claim', id: 'CLM-42' })` merges
  `context.entity` into subsequent events. Do not use entity for grid/menu chrome — use
  `properties.gridId` / `menuId` instead.

## Opt-in instrumentation (Phase 8)

| Feature | Provider | Events |
|---------|----------|--------|
| Router | `withRouteTracking()` | `navigation.page.view`, `navigation.route.change`, `performance.route.transition` |
| HTTP | `withHttpTracking()` + `pixelAnalyticsHttpInterceptor` | `api.request` (opt-in), `api.error` |
| Errors | `withErrorTracking()` | `application.error` |
| Performance | `withPerformanceTracking()` | `performance.page.load`, `performance.web_vitals` |

HTTP defaults are privacy-safe: **no bodies, no headers, errors only**. The analytics ingest
endpoint is always excluded to prevent recursive telemetry.

## HTTP batch payload

```json
{
  "schemaVersion": "1",
  "sentAt": "2026-08-29T06:00:00.000Z",
  "events": [ { "id": "…", "name": "ui.button.click", "schemaVersion": "1", … } ]
}
```

Your backend owns routing to GA4, Adobe, warehouse tables, or real-time streams.

## Event naming

Use `domain.object.action` (snake_case segments): `navigation.page.view`, `data.table.filter`.

See `ANALYTICS-GUIDELINES.md` at the repo root and `src/lib/events/event-registry.ts`.

## Architecture

```text
track/page → consent → sample → sanitize → validate → queue → batch → providers (HTTP…)
```

Failures are recorded in `analytics.diagnostics()` and **never thrown** to application code.

## Configuration highlights

| Area | Default |
|------|---------|
| Batch size | 20 |
| Flush interval | 5s |
| Consent required | true |
| Registry validation | false (enable in production governance) |
| Performance sampling | 25% |
| Session idle timeout | 30m |
| HTTP property keys | `camelCase` (set `propertyKeyCase: 'snake_case'` for wire mapping) |

## Status

Phases 0–11 hardening and Pixel UI analytics Waves 1–6 are complete. **Future:** optional vendor
adapter packages (GA4 / Segment / Adobe) stay out of core — see `PLAN.md` Remaining section.
