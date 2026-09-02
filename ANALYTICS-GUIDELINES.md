# ANALYTICS-GUIDELINES.md — AI coding agent contract for Pixel Analytics

Mandatory whenever you add or modify analytics in this repository. Core package:
`projects/pixel-analytics` (`import { … } from 'pixel-analytics'`).

## When to add analytics

- User-visible actions with product meaning (save, export, filter, navigate to workflow)
- Form lifecycle (start, submit, validation error) when the product team owns the funnel
- Application errors and performance signals (via provided plugins, opt-in)
- Pixel UI component semantic events documented in component READMEs

## When NOT to add analytics

- Every click without a defined event in the registry
- Password fields, auth tokens, payment data, or raw form values
- High-frequency events without sampling (scroll, mousemove, input keystrokes)
- Analytics about analytics (unless `debug` diagnostics explicitly enabled)
- Vendor-specific event names in application code — use canonical names only

## Naming

Use **`domain.object.action`** with snake_case segments:

```text
DO:   navigation.page.view
DO:   ui.button.click
DO:   data.table.filter
DON'T: clicked something
DON'T: buttonClick
DON'T: ga4_form_submit
```

Register new events in `event-registry.ts` (or product extension registry) before use in production.

## Properties

- Use `camelCase` keys in TypeScript; set `http.propertyKeyCase: 'snake_case'` to map property keys on the wire
- Primitive values only (string, number, boolean, null) — no DOM nodes, functions, or class instances
- Max depth 4; strings truncated at 256 chars unless configured otherwise
- Never pass email, phone, name, address unless explicitly approved and masked

## PII rules

Blocked by default: `password`, `token`, `authorization`, `cookie`, `ssn`, `creditCard`, `cvv`, `secret`.

Use `analytics.track()` — never send raw `Error` objects or HTTP bodies to providers.

## Component integration

1. **Directive** (`pixelAnalyticsTrack`) for generic host activation
2. **Thin Pixel UI hooks** via optional `PIXEL_UI_ANALYTICS` — bridge with
   `createPixelUiAnalyticsPort`. Coverage spans form controls, navigation, overlays
   (dialog/drawer/popover/toast/notification/tour), dates (opt-in values), files,
   query builder, editor commands, and charts. Prefer `analyticsId` /
   `analyticsAction` / `analyticsProperties`; use `analyticsEmitValue` only when
   product policy allows raw values (radio, dates). Use `analyticsDisabled` on nested
   chrome when a parent surface already emits the business fact (e.g. embedded
   `pixel-paginator` inside `pixel-data-grid` → only `data.table.page`).
3. **Opt-in plugins** for route / HTTP / errors / performance (`withRouteTracking`, etc.)
4. **Never** embed vendor SDKs or hard-depend `pixel-ui` ↔ `pixel-analytics` in either core package

### Privacy defaults for Pixel UI hooks

| Category | Emit | Never emit (unless opt-in) |
|----------|------|----------------------------|
| Forms / menus / tabs | ids, indexes, booleans | labels, option text, filter query |
| Data grid filters | `field` (column schema id), operator, `filterType` | filter values; avoid sensitive `field` keys (`email`, `ssn`) |
| Data grid export | `format`, `scope`, `outcome`, counts | row payloads, filenames |
| Overlays / toast / notification / tour | ids, size/position, reason | titles, messages, step copy |
| Dates | `hasValue` | ISO / time strings (`analyticsEmitValue`) |
| Files | counts, mime/size buckets | filenames, paths |
| Query / editor | field/op/command ids | rule values, document HTML |
| Charts | `seriesId`, `categoryIndex` | category / series display names |

See the coverage matrix in `projects/pixel-analytics/README.md`.

```html
<pixel-button analyticsAction="save" [analyticsProperties]="{ feature: 'claims' }" />

<button
  pixelAnalyticsTrack="ui.button.click"
  [analyticsProperties]="{ action: 'save' }"
>
  Save
</button>
```

```ts
// app.config.ts — bridge packages
{
  provide: PIXEL_UI_ANALYTICS,
  useFactory: (a: PixelAnalyticsService) => createPixelUiAnalyticsPort(a),
  deps: [PixelAnalyticsService],
},
providePixelAnalytics({ … }),
withRouteTracking(),
withHttpTracking({ captureErrors: true }),
withErrorTracking(),
withPerformanceTracking(),
provideHttpClient(withInterceptors([pixelAnalyticsHttpInterceptor])),
```

## Correlation and interaction scopes

Related UI events (menu open → item select → `data.export`) can share a `context.correlation.traceId`
when the host or Pixel UI opens an interaction scope:

```ts
const handle = analytics.beginInteraction('export-menu');
// … or rely on pixel-menu root open via createPixelUiAnalyticsPort().beginInteraction
handle.end();
```

`pixel-menu` opens a root-menu scope automatically when `PIXEL_UI_ANALYTICS` is bridged with
`createPixelUiAnalyticsPort`. Nested overlays (filter menu + select + async export) may use
overlapping scopes — each `beginInteraction` nests on the stack and shares the root `traceId`.

Async exports that complete after the menu closes will not share the menu trace unless the app
keeps the interaction open until the export finishes.

## App domain entity context

Use `context.entity` for **host-supplied business objects** (claim, policy, account) — not for
grid/menu chrome (`gridId` / `menuId` stay in `properties`):

```ts
analytics.setEntity({ type: 'claim', id: 'CLM-42' });
analytics.track({ name: 'data.export', properties: { format: 'clipboard', outcome: 'success' } });
analytics.clearEntity();
```

## Testing

- Use `createAnalyticsTestingController()` to capture events in unit tests
- Assert no PII in captured payloads for security-sensitive flows
- Verify analytics failures do not break component tests (mock provider throws)

## Documentation

- New public events: add to registry + README behavior notes if emitted by a Pixel UI component
- Breaking event renames: registry `deprecated` + migration note

## Anti-patterns

- Importing GA4/Adobe/Segment in `pixel-analytics` core
- `analytics.track` inside hot loops without sampling
- Throwing from custom providers
- Storing analytics queue in NgRx without going through `PixelAnalyticsService`
