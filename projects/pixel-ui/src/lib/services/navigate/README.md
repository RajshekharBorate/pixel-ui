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

await navigate.go({ route: ['/claims', id], pushContext: true });
await navigate.back(); // return to previous navigate context
```

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
