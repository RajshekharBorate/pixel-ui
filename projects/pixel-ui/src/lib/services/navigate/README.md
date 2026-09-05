# Pixel Navigate

Enterprise **contextual navigation / deep-link** service. Angular Router owns pages;
`PixelNavigateService` owns **targets inside routes** — sections, accordion panels,
stepper/tabs, grid rows, and **opt-in** URL-backed wizards — with scroll, focus,
highlight, and shareable `?nav=` URLs.

> **Docs IA:** registered under the **Services** category (`pixel-navigate`) — headless,
> not a `pixel-*` UI folder (CONVENTIONS §3e).

This is **not** a second router and **not** a product tour (`pixel-tour`).

## Overview

- `go(request)` → optional route change → wait for target → activate → scroll / focus /
  highlight → optional URL sync
- Discovery: registered adapters → `[pixelNavAnchor]` → CSS selector (escape hatch)
- Canonical shareable contract: **`?nav=`**; simple sections may also use `#id` (`nav` wins)
- Soft failures by default (`ok: false` + optional toast); missing DOM never crashes handlers
- Notifications carry `data.nav` / `action.nav`; helpers open targets — **no auto-navigate**

## Use cases

- Notification / search / email → claim page → section or grid row
- Same-page “jump to payments”
- Accordion / stepper / tabs activation then scroll
- Client-paged grid: go to page containing row + highlight
- Opt-in KYC wizard resume after refresh / shared step link

## Setup

```ts
import { PIXEL_NAVIGATE_CONFIG, PixelNavigateService } from 'pixel-ui';

providers: [
  {
    provide: PIXEL_NAVIGATE_CONFIG,
    useValue: {
      stickyOffset: 80,
      onFailure: 'toast',
      timeoutMs: 8_000,
      multiTab: true, // optional cross-tab focus
    },
  },
]
```

Permission + context:

```ts
navigate.setPermissionGuard((req) => canView(req)); // false → forbidden
// Or: navigate.setPermissionGuard(createAuthorizationNavigateGuard(auth));

await navigate.go({ route: ['/claims', id], pushContext: true, access: 'claims:read' });
await navigate.back(); // return to previous navigate context
```

Optional `access` / `resourceId` on the request feed authorization adapters. Guard precedence:
`request.canActivate` → global `setPermissionGuard` → default allow.
`createAuthorizationNavigateGuard` waits while `contextStatus` is `unknown` / `loading` instead of soft-forbidding.

`PixelNavigateService` is `providedIn: 'root'`.

Mark targets:

```html
<section pixelNavAnchor="payments">…</section>
```

## Usage

```ts
private readonly navigate = inject(PixelNavigateService);

goToPayments(): void {
  void this.navigate.go({
    route: ['/billing'],
    target: { type: 'section', id: 'payments' },
    syncUrl: true,
    announce: 'Navigated to payments',
  });
}

// Cold open / bootstrap
ngOnInit(): void {
  void this.navigate.goFromUrl();
}
```

### Adapters

```ts
// Stepper / tabs / accordion
navigate.registerAdapter({
  id: 'onboarding',
  kind: 'stepper',
  activate: async (target) => {
    if (target.type !== 'stepper') return false;
    await this.stepper.jumpTo(Number(target.step));
    return true;
  },
});

// Grid (after ViewChild ready)
navigate.registerGrid('claims', {
  revealRow: (rowId, opts) => this.grid.revealRow(rowId, opts),
});

// Opt-in wizard (required for wizard: URL targets)
navigate.registerWizard({
  id: 'claim-filing',
  syncUrl: true,
  open: async () => { this.dialog.open(ClaimWizardComponent); },
  setStep: async (step) => { this.stepper.jumpTo(Number(step)); },
});
```

### Notifications

```ts
notifications.publish({
  title: 'Approval required',
  data: {
    nav: {
      route: ['/claims', 'TR-104'],
      target: { type: 'grid-row', gridId: 'claims', rowId: 'TR-104' },
    },
  },
  actions: [
    { id: 'review', label: 'Review', nav: { route: ['/claims', 'TR-104'], target: { type: 'wizard', id: 'claim-filing', step: 'documents' } } },
  ],
});

// Panel handler
(notificationActivated)="open($event.notification)"

open(n: PixelNotification): void {
  void this.navigate.openFromNotification(n, { notifications: this.notifications });
}
```

Resolve order: `action.nav` → `data.nav` → `action.href`.

## `?nav=` contract

| Blob | Meaning |
| --- | --- |
| `section:payments` | Section / anchor id |
| `stepper:onboarding;step:2` | Stepper adapter |
| `tabs:settings;tab:security` | Tabs adapter |
| `accordion:help;panel:billing` | Accordion panel |
| `grid:claims;row:TR-104;page:2` | Grid row |
| `wizard:claim-filing;step:documents` | Opt-in wizard |
| Pipe `\|` | Chain multiple targets |

`parseUrl` / `toUrl` / `copyLink` / `goFromUrl` round-trip these shapes. History:
`push` for opening an entity; `replace` for transient highlight / wizard step sync.

First-class companions (default on): `?row=` / `?step=` / `?grid=` / `?wizard=` are also
written and read so analytics and simple links can avoid opaque `nav` blobs. When only
first-class params are present, targets are derived (`grid`+`row` → `grid-row`,
`wizard`+`step` → wizard).

## Behavior notes

- **Sticky offset:** default `72`; insets the visible scrollport (for “already in view”
  checks and centering). Override via config or per-call `offset`.
- **Highlight:** in-element absolute overlay for sections (stays aligned inside transformed
  tab panels); fixed overlay + soft fill for table rows. Ring matches input focus chrome.
  Respects `prefers-reduced-motion`.
- **Scroll:** finds the nearest scrollable ancestor (docs content panels, grid scrollers).
  Skips scrolling when the target is already fully visible; otherwise smooth-scrolls so
  the target is centered in the scrollport.
- **Adapters:** activate only; scroll/highlight when the adapter returns an `Element`.
  Intermediate chain steps (tabs/accordion) do not highlight the host.
- **Wizards:** never auto-opened. Unregistered `wizard:` → `adapter-missing`. Confirm
  dialogs must not register. Navigate restores **where** in the wizard, not form drafts
  (apps own draft persistence — store form values separately and rehydrate on wizard open).
- **Failure:** `onFailure: 'toast' | 'silent' | 'throw'` (default toast when
  `PixelToastService` is present). Permission denials return `reason: 'forbidden'` via
  `setPermissionGuard` and/or `request.canActivate`.
- **Context stack:** successful `go` pushes a snapshot (`pushContext: false` to skip).
  `back()` pops and re-navigates; `peekContext()` / `clearContext()` for inspection.
- **Multi-tab:** opt-in (`PIXEL_NAVIGATE_CONFIG.multiTab` or `enableMultiTab()`). Uses
  `BroadcastChannel` when available; SSR-safe no-op otherwise. Other tabs replay with
  `source: 'multi-tab'`.
- **SSR:** `document` / `window` / `BroadcastChannel` / `location` are guarded; `goFromUrl`
  without a URL is a no-op on the server.
- **Tour:** keep teaching walkthroughs in `pixel-tour`; use navigate for operational arrival.
- **Playground:** `/playground/app-shell` composes shell + routes + notification deep links
  (claims grid, billing chain, claim-amendment dialog wizard, settings permission gate).

## Accessibility

- Optional focus move (transient `tabindex="-1"` when needed)
- Optional polite live announcement via `announce`
- Highlight is not the only cue — prefer focus + announcement for SR users

## Theme customization

Overlay uses `--pixel-nav-highlight-color`, `--pixel-nav-highlight-radius`,
`--pixel-nav-highlight-duration` with system token fallbacks. Border/ring match
`pixel-input` focus (`1px` + `0.1875rem` / 32% mix). Radius follows the target's
computed `border-radius` when set.

## Breaking changes

- None — new API family.
- Notification `PixelNotificationAction.nav` is additive (optional).
- Data grid gains public `revealRow()` and `data-pixel-row-id` attributes.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Directive `[pixelNavAnchor]` (`PixelNavAnchorDirective`)

Marks an element as a navigate / deep-link target. Prefer this over CSS selectors.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `pixelNavAnchor` | `string` | *required* | Anchor id referenced from section / composite targets. |

### Service `PixelNavAnchorRegistry`

| Method | Signature | Description |
| --- | --- | --- |
| `register` | `register(id: string, element: Element): void` |  |
| `unregister` | `unregister(id: string, element: Element): void` |  |
| `resolve` | `resolve(id: string): Element | null` |  |

### Service `PixelNavigateService`

Contextual navigation / deep-link orchestrator. Angular Router owns pages; this service owns targets inside routes (section, accordion, stepper, tabs, grid row, opt-in wizard).

| Method | Signature | Description |
| --- | --- | --- |
| `registerAdapter` | `registerAdapter(adapter: PixelNavActivationAdapter): () => void` | Register an accordion / stepper / tabs / custom activation adapter. |
| `registerGrid` | `registerGrid(id: string, api: PixelNavGridRevealApi): () => void` | Register a grid reveal API for `grid-row` targets. |
| `registerWizard` | `registerWizard(adapter: PixelNavWizardAdapter): () => void` | Opt-in wizard registration. Without this, `wizard:` targets never open a dialog. |
| `setPermissionGuard` | `setPermissionGuard(guard: PixelNavigatePermissionGuard | null): void` | Global permission gate (runs before per-request `canActivate`). Return `false` → soft `forbidden`. Pass `null` to clear. |
| `enableMultiTab` | `enableMultiTab(channelName = this.config.multiTabChannel): void` | Opt-in multi-tab focus fan-out. Safe no-op when BroadcastChannel is unavailable (SSR). |
| `disableMultiTab` | `disableMultiTab(): void` | Tear down the multi-tab channel. |
| `parseUrl` | `parseUrl(url: string): PixelNavigateRequest | null` | Parse a URL into a navigate request (`?nav=` wins over `#fragment` for targets). |
| `toUrl` | `toUrl(request: PixelNavigateRequest, basePath?: string): string` | Serialize a request to a relative URL string. |
| `copyLink` | `copyLink(request: PixelNavigateRequest): Promise<void>` | Copy a shareable link for `request` (current origin + serialized path). |
| `goFromUrl` | `goFromUrl(url?: string): Promise<PixelNavigateResult>` | Bootstrap helper: parse the current location and `go`. |
| `syncWizardStep` | `syncWizardStep(wizardId: string, step: string | number): void` | While an opt-in wizard with `syncUrl` is open, write the current step into `?nav=` (and first-class `step` / `wizard` when enabled) using `replaceUrl`. |
| `peekContext` | `peekContext(): PixelNavigateContextEntry | null` | Peek the newest context stack entry without removing it. |
| `clearContext` | `clearContext(): void` | Clear the return-context stack. |
| `back` | `back(): Promise<PixelNavigateResult>` | Pop the previous context and `go` there. Soft-fails with `not-found` when empty. |
| `openFromNotification` | `openFromNotification(notification: import('../../pixel-notification/pixel-notification.types').PixelNotification, options?: import('./notification-nav').OpenNotificationTargetOptions): Promise<import('./navigate.types').PixelNavigateResult | null>` | Convenience: `openNotificationTarget` bound to this service. |
| `go` | `go(request: PixelNavigateRequest = {}): Promise<PixelNavigateResult>` | Navigate to a route and/or in-page target chain. Soft-fails by default. |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelNavigateFailureMode` | `'toast' | 'silent' | 'throw'` |
| `PixelNavigateFailureReason` | `| 'not-found' | 'timeout' | 'navigation-failed' | 'adapter-missing' | 'activation-failed' | 'invalid-request' | 'cancelled' | 'forbidden'` |
| `PixelNavigateScrollBehavior` | `'smooth' | 'instant'` |
| `PixelNavigateHistoryMode` | `'push' | 'replace' | 'none'` |
| `PixelNavTarget` | `| { readonly type: 'section'; readonly id: string; readonly offset?: number; } | { readonly type: 'selector'; readonly selector: string; readonly offset?: number; } | { readonly type: 'accordion'; readonly id: string; readonly panelId: string; } | { readonly type: 'stepper'; readonly id: string; readonly step: number | string; } | { readonly type: 'tabs'; readonly id: string; readonly tab: number | string; } | { readonly type: 'grid-row'; readonly gridId: string; readonly rowId: string | number; readonly page?: number; readonly select?: boolean; } | { readonly type: 'wizard'; readonly id: string; readonly step?: number | string; }` |
| `PixelNavigatePermissionGuard` | `( request: PixelNavigateRequest, ) => boolean | Promise<boolean>` |
| `ResolvedPixelNavigateConfig` | `PixelNavigateConfig` |

### Exported interfaces

**`PixelNavigateRequest`** — Primary request passed to `PixelNavigateService.go`.

```ts
interface PixelNavigateRequest {
  readonly route?: readonly unknown[];
  readonly queryParams?: Readonly<Record<string, string | number | boolean | null | undefined>>;
  readonly fragment?: string;
  readonly access?: string;
  readonly resourceId?: string;
  readonly target?: PixelNavTarget | readonly PixelNavTarget[];
  readonly nav?: string;
  readonly row?: string | number;
  readonly step?: string | number;
  readonly grid?: string;
  readonly wizard?: string;
  readonly highlight?: boolean;
  readonly focus?: boolean;
  readonly announce?: string | boolean;
  readonly behavior?: PixelNavigateScrollBehavior;
  readonly offset?: number;
  readonly timeoutMs?: number;
  readonly onFailure?: PixelNavigateFailureMode;
  readonly history?: PixelNavigateHistoryMode;
  readonly syncUrl?: boolean;
  readonly pushContext?: boolean;
  readonly broadcast?: boolean;
  readonly canActivate?: ( request: PixelNavigateRequest, ) => boolean | Promise<boolean>;
  readonly source?: | 'user' | 'notification' | 'search' | 'email' | 'api' | 'bootstrap' | 'multi-tab' | 'context-back' | string;
}
```

**`PixelNavigateContextEntry`** — Snapshot stored on the return-to-previous-context stack.

```ts
interface PixelNavigateContextEntry {
  readonly request: PixelNavigateRequest;
  readonly at: number;
}
```

**`PixelNavigateResult`**

```ts
interface PixelNavigateResult {
  readonly ok: boolean;
  readonly reason?: PixelNavigateFailureReason;
  readonly message?: string;
  readonly partial?: boolean;
  readonly completedTargets?: number;
  readonly element?: Element | null;
}
```

**`PixelNavigateConfig`**

```ts
interface PixelNavigateConfig {
  readonly stickyOffset: number;
  readonly timeoutMs: number;
  readonly highlightMs: number;
  readonly onFailure: PixelNavigateFailureMode;
  readonly behavior: PixelNavigateScrollBehavior;
  readonly highlight: boolean;
  readonly focus: boolean;
  readonly navParam: string;
  readonly contextStackLimit: number;
  readonly multiTab: boolean;
  readonly multiTabChannel: string;
  readonly firstClassParams: boolean;
}
```

**`PixelNavWizardContext`** — Context passed to wizard adapters on open.

```ts
interface PixelNavWizardContext {
  readonly step?: number | string;
  readonly request: PixelNavigateRequest;
}
```

**`PixelNavWizardAdapter`** — Opt-in wizard surface. Without registration, `wizard:` URL targets soft-fail and never open a dialog.

```ts
interface PixelNavWizardAdapter {
  readonly id: string;
  open(ctx: PixelNavWizardContext): void | Promise<void>;
  setStep(step: string | number): void | Promise<void>;
  getStep?(): string | number | null;
  close?(): void | Promise<void>;
  readonly syncUrl?: boolean;
}
```

**`PixelNavActivationAdapter`** — Generic activation adapter for accordion / stepper / tabs / custom surfaces.

```ts
interface PixelNavActivationAdapter {
  readonly id: string;
  readonly kind: 'accordion' | 'stepper' | 'tabs' | 'custom';
  activate(target: PixelNavTarget): void | Promise<void | boolean | Element | null>;
}
```

**`PixelNavGridRevealApi`** — Grid reveal contract registered with the navigate service (grid itself stays decoupled).

```ts
interface PixelNavGridRevealApi {
  revealRow( rowId: string | number, options?: { readonly page?: number; readonly select?: boolean; readonly highlightMs?: number; }, ): boolean | Promise<boolean>;
}
```

**`PixelNavigateAnalyticsEvent`**

```ts
interface PixelNavigateAnalyticsEvent {
  readonly name: | 'navigated' | 'target_missing' | 'timeout' | 'navigation_failed' | 'from_notification' | 'wizard_opened' | 'adapter_missing' | 'forbidden' | 'context_back' | 'multi_tab_focus';
  readonly request?: PixelNavigateRequest;
  readonly result?: PixelNavigateResult;
  readonly data?: Readonly<Record<string, unknown>>;
}
```

**`PixelNavigateAnalytics`**

```ts
interface PixelNavigateAnalytics {
  track(event: PixelNavigateAnalyticsEvent): void;
}
```

**`OpenNotificationTargetOptions`**

```ts
interface OpenNotificationTargetOptions {
  readonly action?: PixelNotificationAction;
  readonly markRead?: boolean;
  readonly notifications?: PixelNotificationService | null;
}
```

<!-- API-CONTRACT:END -->
