# Pixel Authorization

Headless **RBAC + ABAC** data plane for Pixel UI: decide whether the current **subject** may
perform an **action** / **permission** on a **resource**, then enforce in the UI via PEP
(`[pixelAccess]`, `@if (auth.can()())`, route helpers, grid/dialog hooks).

> **Security:** local decisions are **UX only**. APIs and a remote PDP (when configured) are the
> security authority. Treat DevTools-tampered subject/policies as untrusted.

Preferred import: `import { … } from 'pixel-ui/authorization'` (also re-exported from `pixel-ui`).

## Use cases

- Hide or disable export / approve / admin chrome by permission
- Attribute policies (tenant, SoD, amount limits) on top of roles
- Gate lazy admin routes with `canMatch`
- Filter sidenav models with `filterAllowed`
- Soft-forbid navigate deep-links via `createAuthorizationNavigateGuard`

## Quick start

```ts
import {
  PixelAuthorizationService,
  providePixelAuthorization,
  PixelAccessDirective,
} from 'pixel-ui/authorization';

bootstrapApplication(App, {
  providers: [
    providePixelAuthorization({
      config: { deniedActionMode: 'hide', catalogMode: 'strict' },
    }),
  ],
});

// After identity loads:
auth.setPermissionCatalog(catalog);
auth.setSubject({ id: user.id, roles: user.roles, tenantId: user.tenantId });
// Optional ABAC:
auth.setPolicies(policies);
```

```html
@if (auth.can('claims:export')()) {
  <pixel-button>Export</pixel-button>
}

<pixel-button pixelAccess="claims:export" pixelAccessMode="disable">Export</pixel-button>
```

While `contextStatus` is `unknown` / `loading`, `[pixelAccess]` does **not** hide hosts
(`aria-busy`) — avoids flash-of-empty UI. Use skeletons for gated regions when pending.

## Combining algorithm

1. Tenant mismatch (any two of subject / context / resource tenant disagree, including numeric ids) → deny  
2. Resource-scoped policies are **skipped** when the request has no `resource` (chrome `can()` / `[pixelAccess]` stay RBAC)  
3. Explicit **deny** policies: condition true **or missing attribute** → fail-closed deny (`not` does not invert missing paths)  
4. If `permission` set → RBAC must grant (unknown catalog keys → deny)  
5. Explicit **allow** policies (union + obligations) when an allow policy applies to this request  
6. RBAC grant when no applicable allow policies constrain the request  
7. Else `defaultEffect` (`default-deny` or `default-allow`)

Break-glass / direct `subject.permissions` cannot override explicit deny.

`can(permission)` returns **true** while `contextStatus` is `unknown` / `loading` so `@if (auth.can()())` does not flash-hide chrome. Use `evaluate()` / `access()` for the raw pending decision. Route guards **wait** until context is ready instead of redirecting to forbidden.

### Router / navigate / grid (summary)

- Route helpers: `pixelAuthorizationCanMatch` / `CanActivate` / `CanActivateChild` (`data.access` or `accessRequest`)
- **Guards are entry-only** — Angular does not re-run them when `setSubject` changes. Opt in with `providePixelAuthorizationRouteWatcher({ forbiddenUrl })` so a role/tenant/logout while on a gated page leaves that URL.
- Navigate: `createAuthorizationNavigateGuard(auth)` + optional `request.access` (waits while context is hydrating)
- Grid: `exportAccess`, column/row-action `access`; dialog/drawer `requires`; tab/step `access` — all need `PIXEL_AUTHORIZATION_EVALUATOR` via `providePixelAuthorization()`
- Export: `exportData()` applies `column-allow-list` obligations (intersect columns; empty list → fail-closed)
- Remote: `providePixelAuthorization({ remotePdp, audit })` — timeout → deny on `authorizeAsync` only

## Behavior notes

- **Control plane** (catalog lifecycle, policy admin) is app/IAM — Pixel is data plane + PEP only.
- **Persona ≠ role** — map personas to roles in the app; PDP evaluates roles/permissions/policies.
- **PIP trust:** client `resource.attributes` are UX hints; sensitive allows need trusted PIP or remote PDP. Missing deny-condition attributes fail-closed. Policies that read `resource.*` do not apply to chrome checks with no resource.
- **Time rules:** use `context.now` from PIP — never `Date.now()` in policies.
- **Wildcards:** longest-prefix `claims:*`; bare `*` ignored.
- **`can()` vs `evaluate()`:** `can()` is chrome (true while hydrating). `evaluate()` is silent (no audit); `authorize()` audits. PEPs must call `evaluate()` from `computed()`.
- **Remote PDP:** `providePixelAuthorization({ remotePdp })` wraps a 4s timeout by default. Sync PEPs (`[pixelAccess]`, `can()`, grid, guards) always use the **local** engine; call `authorizeAsync()` when the remote decision is required.
- **Bundle (D9):** `[pixelAccess]` / `pixel-button` use `PIXEL_ACCESS_PEP` so unbound buttons do not import the engine. Grid, dialog, drawer, tabs, and stepper inject `PIXEL_AUTHORIZATION_EVALUATOR` (not the service by name). Call `providePixelAuthorization()` (or `providePixelAuthorizationTesting()` in tests/examples) so native `access` / `requires` / `exportAccess` bind to the PDP; unbound → fail-closed when those inputs are set. Prefer `pixel-ui/authorization` for app code.
- Forms: use `pixelAccessMode="readonly"` on field hosts; submit buttons still need `@if` / disable.
- **`[pixelAccess]` on Pixel components:** host `hidden` is not enough — `pixel-button` `:host { display: inline-flex }` overrides `[hidden]`, and inner native controls ignore host `disabled`/`readonly`. The directive sets inline `display: none` for hide, provides `PIXEL_ACCESS_PEP` so button/input compose deny into their own disabled/readonly, and syncs the host when it is a native control (not nested descendants).
- **Stale gated routes:** `canActivate` / `canMatch` run only on navigation. After `setSubject`, provide `providePixelAuthorizationRouteWatcher` (or call `applyCurrentRouteAuthorization`) so the current URL is re-checked. While `contextStatus` is `unknown` / `loading`, the watcher does **not** bounce (avoids Overview ↔ Settings flash). Eviction needs `forbiddenUrl` or `loginUrl`. Use `replaceUrl` (default) so Back does not return to the denied page.

## Accessibility

- Denied + hide: removed from a11y tree (`hidden` + `aria-hidden` + `inert` + inline `display: none` so custom-element `:host { display }` cannot unhide)
- Pending: `aria-busy`, not hidden
- Denied + disable: `aria-disabled` / native `disabled` on the **inner** control (`pixel-button` via `PIXEL_ACCESS_PEP`)
- Denied + readonly: native `readOnly` on `pixel-input` via `PIXEL_ACCESS_PEP`

## Theme customization

None — headless service. Host chrome uses existing component tokens.

## Breaking changes

None (new surface). Navigate gains optional `access` / `resourceId` on `PixelNavigateRequest`.

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Directive `[pixelAccess]` (`PixelAccessDirective`)

Attribute PEP — prefer with `@if (auth.can()())` for hide, or bind mode for disable/readonly. ```html <pixel-button pixelAccess="claims:export">Export</pixel-button> <pixel-button pixelAccess="claims:edit" pixelAccessMode="disable">Edit</pixel-button> ``` When context is `unknown`/`loading`, host is not hidden (aria-busy) — avoids flash-of-empty UI. Custom elements (`pixel-button`, `pixel-input`, …) ignore host `hidden`/`disabled`/`readonly` because author `:host { display }` overrides `[hidden]`, and inner native controls bind their own inputs. This directive (1) sets inline `display: none` for hide, (2) provides `PIXEL_ACCESS_PEP` for Pixel controls, (3) syncs the host when it is a native `button` / `input` / `textarea` / `select` (does not walk descendants).

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `pixelAccess` | `string | PixelAuthorizationRequest` | `''` | Permission key or full authorization request. Empty → no gating. |
| `pixelAccessMode` | `PixelDeniedActionMode | null` | `null` | Override config `deniedActionMode`. Null → service config. |
| `pixelAccessForceDisable` | `boolean` | `false` | When true, denied controls stay in the a11y tree but are non-interactive (disable). |

### Service `PixelAuthorizationService`

Local authorization data plane (PDP) + signal helpers for PEP. Server / remote PDP remains the security authority — local allow is UX only.

| Method | Signature | Description |
| --- | --- | --- |
| `setConfig` | `setConfig(config: PixelAuthorizationConfig): void` |  |
| `setSubject` | `setSubject(subject: PixelAuthorizationSubject | null): void` |  |
| `setContextStatus` | `setContextStatus(status: PixelAuthorizationContextStatus): void` | Hydration / fetch lifecycle. Prefer `setSubject` for ready/unauthenticated; use this for `loading` / `error` / explicit `unknown`. |
| `setPermissionCatalog` | `setPermissionCatalog(catalog: PixelPermissionCatalog | null): void` |  |
| `setPolicies` | `setPolicies(policies: readonly PixelPolicy[], meta?: { readonly version?: string }): void` |  |
| `authorize` | `authorize(request: PixelAuthorizationRequest): PixelAccessDecision` | Sync local PDP (audited). Prefer `evaluate` inside PEPs / `computed()`. |
| `evaluate` | `evaluate(request: PixelAuthorizationRequest): PixelAccessDecision` | Sync local PDP without audit. Use from directives, templates, and `computed()` so evaluation does not emit SIEM events or churn `requestId` as a side effect. When `request.action` is omitted and `permission` is set, the action is inferred from the catalog / permission key (`claims:export` → `export`). |
| `authorizeAsync` | `authorizeAsync(request: PixelAuthorizationRequest): Promise<PixelAccessDecision>` | Remote PDP when `PIXEL_AUTHORIZATION_REMOTE_PDP` is provided; otherwise local. Failures / timeouts → deny (`remote-unavailable`). Pending emitted via audit while waiting. |
| `can` | `can(permission: string, resource?: PixelAuthorizationResource): Signal<boolean>` | Reactive allow signal for templates. Create **once** per permission (`readonly canExport = auth.can('claims:export')`) — do not call `can()` inside another `computed` or repeatedly in the template. While `contextStatus` is `unknown` / `loading`, returns `true` so `@if (can()())` does not flash-hide chrome (D8). Use `access` when you need the raw pending decision. |
| `access` | `access(request: PixelAuthorizationRequest): Signal<PixelAccessDecision>` | Reactive full decision for a request. |
| `explain` | `explain(request: PixelAuthorizationRequest): PixelAccessExplainResult` | Dev/QA decision trace — do not surface policy ids in end-user UI. |
| `filterAllowed` | `filterAllowed(items: readonly T[], getAccess: (item: T) => string | PixelAuthorizationRequest | undefined | null, options?: { readonly getChildren?: (item: T) => readonly T[] | undefined | null; /** Rebuild a parent with filtered children (required for nested nav trees). */ readonly attachChildren?: (item: T, children: readonly T[]) => T; readonly hideEmptyParents?: boolean; }): readonly T[]` | Filters items by permission / request. Items without access metadata are kept. Optional parent/children: hide parents when all children are denied. |
| `shouldShowWhilePending` | `shouldShowWhilePending(decision?: PixelAccessDecision): boolean` | Whether PEP should keep chrome visible (skeleton / busy) instead of hiding. True for `unknown` / `loading` context, or when decision is `pending`. |
| `isAllowed` | `isAllowed(decision: PixelAccessDecision): boolean` | True when the decision is an actionable allow. |
| `whenContextReady` | `whenContextReady(): Promise<void>` | Resolves when `contextStatus` is no longer `unknown` / `loading`. Route guards and navigate adapters wait so hydration does not bounce to forbidden. |

### Service `PixelAuthorizationRouteWatcher`

Opt-in watcher constructed by `providePixelAuthorizationRouteWatcher`. Apps should not inject this class unless the watcher is provided on a component injector.

| Method | Signature | Description |
| --- | --- | --- |
| `ensureStarted` | `ensureStarted(): void` | Idempotent; invoked by the environment initializer. |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelAccessAction` | `| 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve' | 'navigate' | 'execute' | (string & {})` |
| `PixelAuthorizationContextStatus` | `| 'unknown' | 'loading' | 'ready' | 'error' | 'unauthenticated'` |
| `PixelAccessDecisionStatus` | `'allow' | 'deny' | 'pending'` |
| `PixelAuthorizationReason` | `| 'rbac' | 'abac' | 'tenant' | 'default-deny' | 'default-allow' | 'error' | 'pending' | 'remote-unavailable' | 'unknown-permission' | 'unauthenticated' | 'not-ready'` |
| `PixelAuthorizationCatalogMode` | `'strict' | 'development' | 'legacy-compatible'` |
| `PixelDeniedActionMode` | `'hide' | 'disable' | 'readonly'` |
| `PixelAuthorizationObligationType` | `| 'filter' | 'mask' | 'column-allow-list' | 'watermark' | 'approval-required'` |
| `PixelPolicyStatus` | `'proposed' | 'active' | 'deprecated'` |
| `PixelPolicyCondition` | `| { readonly and: readonly PixelPolicyCondition[] } | { readonly or: readonly PixelPolicyCondition[] } | { readonly not: PixelPolicyCondition } | { readonly eq: readonly [string, unknown] } | { readonly neq: readonly [string, unknown] } | { readonly lt: readonly [string, unknown] } | { readonly lte: readonly [string, unknown] } | { readonly gt: readonly [string, unknown] } | { readonly gte: readonly [string, unknown] } | { readonly in: readonly [string, readonly unknown[]] } | { readonly contains: readonly [string, unknown] }` |
| `PixelRouteAccessData` | `{ /** Permission key (shorthand). */ readonly access?: string; /** Full ABAC request — wins over `access` when both set. */ readonly accessRequest?: PixelAuthorizationRequest; }` |
| `PixelAuthorizationGuardOptions` | `{ readonly loginUrl?: string; readonly forbiddenUrl?: string; }` |
| `PixelAuthorizationRouteEvictReason` | `'unauthenticated' | 'forbidden'` |
| `PixelAuthorizationRouteWatcherOptions` | `PixelAuthorizationGuardOptions & { /** * When true (default), eviction uses `replaceUrl` so Back does not return to the denied page. */ readonly replaceUrl?: boolean; /** Fired after a successful redirect off a now-denied route. Do not pass permission keys. */ readonly onEvicted?: (info: { readonly reason: PixelAuthorizationRouteEvictReason; readonly url: string; }) => void; }` |

### Exported interfaces

**`PixelAuthorizationAuditEvent`** — Optional audit sink (SIEM / analytics). Metadata only — never policy conditions or PII.

```ts
interface PixelAuthorizationAuditEvent {
  readonly name: 'access.denied' | 'access.allowed' | 'access.pending' | 'access.error';
  readonly requestId?: string;
  readonly permission?: string;
  readonly action?: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly reason?: string;
  readonly source?: 'local' | 'remote';
  readonly subjectId?: string;
  readonly actorId?: string;
  readonly impersonatorId?: string;
  readonly tenantId?: string;
}
```

**`PixelAuthorizationAudit`**

```ts
interface PixelAuthorizationAudit {
  track(event: PixelAuthorizationAuditEvent): void;
}
```

**`PixelPolicyDecisionAdapter`** — Remote Policy Decision Point adapter. Local engine remains for UX / offline.

```ts
interface PixelPolicyDecisionAdapter {
  readonly id: string;
  evaluate( request: PixelAuthorizationRequest, subject: PixelAuthorizationSubject, ): Promise<PixelAccessDecision>;
}
```

**`PixelAuthorizationObligation`**

```ts
interface PixelAuthorizationObligation {
  readonly type: PixelAuthorizationObligationType;
  readonly value?: unknown;
}
```

**`PixelAuthorizationSubject`**

```ts
interface PixelAuthorizationSubject {
  readonly id?: string;
  readonly actorId?: string;
  readonly tenantId?: string;
  readonly impersonatorId?: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
  readonly attributes?: Readonly< Record<string, string | number | boolean | readonly string[]> >;
}
```

**`PixelRole`** — Future-compatible role shape; v1 catalog uses flat role→permission map only.

```ts
interface PixelRole {
  readonly id: string;
  readonly permissions: readonly string[];
  readonly inherits?: readonly string[];
}
```

**`PixelPermissionDefinition`**

```ts
interface PixelPermissionDefinition {
  readonly key: string;
  readonly description: string;
  readonly resourceType?: string;
  readonly actions?: readonly string[];
  readonly introducedIn?: string;
  readonly deprecated?: boolean;
  readonly replacement?: string;
  readonly removedIn?: string;
}
```

**`PixelPermissionCatalog`**

```ts
interface PixelPermissionCatalog {
  readonly version: string;
  readonly roles: Readonly<Record<string, readonly string[]>>;
  readonly permissions?: Readonly<Record<string, PixelPermissionDefinition | { description: string }>>;
}
```

**`PixelAuthorizationResource`**

```ts
interface PixelAuthorizationResource {
  readonly type: string;
  readonly id?: string;
  readonly parent?: { readonly type: string; readonly id: string };
  readonly attributes?: Readonly<Record<string, unknown>>;
}
```

**`PixelAuthorizationRequestContext`**

```ts
interface PixelAuthorizationRequestContext {
  readonly tenantId?: string;
  readonly organizationId?: string;
  readonly environment?: string;
  readonly region?: string;
  readonly now?: string;
  readonly [key: string]: unknown;
}
```

**`PixelAuthorizationRequest`**

```ts
interface PixelAuthorizationRequest {
  readonly action?: PixelAccessAction;
  readonly permission?: string;
  readonly resource?: PixelAuthorizationResource;
  readonly context?: PixelAuthorizationRequestContext;
}
```

**`PixelAccessDecision`**

```ts
interface PixelAccessDecision {
  readonly status: PixelAccessDecisionStatus;
  readonly effect: 'allow' | 'deny';
  readonly reason?: PixelAuthorizationReason;
  readonly obligations?: readonly PixelAuthorizationObligation[];
  readonly requestId?: string;
  readonly policyId?: string;
  readonly policyVersion?: string;
  readonly catalogVersion?: string;
  readonly source?: 'local' | 'remote';
}
```

**`PixelPolicy`**

```ts
interface PixelPolicy {
  readonly id: string;
  readonly description?: string;
  readonly version?: string;
  readonly status?: PixelPolicyStatus;
  readonly effect: 'allow' | 'deny';
  readonly target: { readonly actions?: readonly string[]; readonly resourceTypes?: readonly string[]; readonly permissions?: readonly string[]; };
  readonly condition?: PixelPolicyCondition;
  readonly obligations?: readonly PixelAuthorizationObligation[];
}
```

**`PixelAuthorizationConfig`**

```ts
interface PixelAuthorizationConfig {
  readonly defaultEffect?: 'allow' | 'deny';
  readonly deniedActionMode?: PixelDeniedActionMode;
  readonly catalogMode?: PixelAuthorizationCatalogMode;
  readonly debug?: boolean;
}
```

**`PixelAccessExplainStep`**

```ts
interface PixelAccessExplainStep {
  readonly stage: 'tenant' | 'rbac' | 'policy' | 'default';
  readonly outcome: 'allow' | 'deny' | 'skip';
  readonly detail: string;
  readonly policyId?: string;
}
```

**`PixelAccessExplainResult`**

```ts
interface PixelAccessExplainResult {
  readonly decision: PixelAccessDecision;
  readonly steps: readonly PixelAccessExplainStep[];
}
```

**`ProvidePixelAuthorizationOptions`**

```ts
interface ProvidePixelAuthorizationOptions {
  readonly config?: PixelAuthorizationConfig;
  readonly audit?: PixelAuthorizationAudit;
  readonly remotePdp?: PixelPolicyDecisionAdapter;
  readonly remotePdpTimeoutMs?: number;
}
```

<!-- API-CONTRACT:END -->
