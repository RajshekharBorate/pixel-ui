# RBAC + ABAC — enterprise authorization plan for pixel-ui

**Status:** Phases 1–8 implemented (data plane + PEP integrations)  
**Date:** 2026-09-04 (implementation complete; Phase 0.2 contracts remain locked)  
**Scope:** Headless authorization in `pixel-ui` + PEP (directive-first; native inputs deferred)  
**Related:** `CONVENTIONS.md` §3e/§10 · `PERFORMANCE.md` · `services/navigate` · `AGENTS.md` · `ANALYTICS-GUIDELINES.md`  
**Reviews:** [PLAN-RBAC-ABAC-REVIEW.md](./PLAN-RBAC-ABAC-REVIEW.md) (implementation) · [PLAN-RBAC-ABAC-ENTERPRISE-REVIEW.md](./PLAN-RBAC-ABAC-ENTERPRISE-REVIEW.md) (governance)

---

## Executive summary

| Question | Answer |
|----------|--------|
| What are we building? | A **vendor-neutral authorization layer**: evaluate whether the current **subject** may perform an **action** on a **resource** in a **context** (RBAC + ABAC hybrid). |
| What is “native” component support? | **PEP enforcement** via attribute directive + `@if` / `resolvedState()` composition — **not** mandatory `access*` inputs on presentational components in MVP. |
| What is out of scope? | Authentication, IdP integration, IAM admin UI, server enforcement, ReBAC graphs (Zanzibar/OpenFGA → remote adapter only). |
| Router? | App owns routes. Library supplies **`canMatch`** (lazy chunks) + `canActivate` / `canActivateChild` helpers reading `route.data.access`. |
| Precedent? | `PixelNavigateService.setPermissionGuard()` → thin async-compatible alias over `PixelAuthorizationService`. |

**Recommendation:** Headless service under `src/lib/services/authorization/`; export via **`pixel-ui/authorization`** secondary entry so button-only apps do not pull the policy engine. Phase 1 = RBAC + directive + signals only.

---

## Locked decisions (review D1–D16)

| ID | Decision | Status |
|----|----------|--------|
| **D7** | **Combining algorithm:** RBAC-only when `policies.length === 0`; RBAC ∩ ABAC when `setPolicies()` has been called; **explicit deny policy always wins** (break-glass cannot override deny). | ✅ Locked |
| **D8** | **`unknown` vs deny:** `PixelAuthorizationStatus = 'unknown' \| 'unauthenticated' \| 'ready'`. `unknown` → skeleton / `aria-busy`, **not** hide. `unauthenticated` → deny. | ✅ Locked |
| **D9** | **PEP packaging:** Directive + `@if` first. Native `access*` inputs on `pixel-button` / menu **deferred** to Phase 7 with `hostDirectives` + secondary entry. Unbound → zero engine cost. | ✅ Locked |
| **D10** | **Sync vs async:** Local `authorize()` / `can()` / `access(): Signal`. Remote `authorizeAsync()` updates same signals. Decision may be `pending` (fail-closed for actions). | ✅ Locked |
| **D11** | Break-glass `subject.permissions` **cannot** override explicit deny policy. | ✅ Locked |
| **D12** | v1: **no** role hierarchy, **no** permission implication (`edit` ⇒ `read`). Document as non-goals; catalog expander in v1.1. SoD = ABAC example. | ✅ Locked |
| **D13** | Export honors same column allow-list as UI (`exportable: false` + access). `exportData()` denied when toolbar hidden. | ✅ Locked |
| **D14** | Ship **`canMatch`** first for lazy admin routes; also `canActivateChild`. | ✅ Locked |
| **D15** | Denied action default = **config** `deniedActionMode: 'hide' \| 'disable'`, not hardcoded hide on every button. | ✅ Locked |
| **D16** | ABAC time policies use **`context` / PIP time only** — never `Date.now()` on client. | ✅ Locked |
| D1 | Service in `pixel-ui` (not separate package) **if** D9 secondary entry is used. | ✅ Locked |
| D2 | Policy v1 = JSON conditions only; OPA/Cedar via remote adapter. | ✅ Locked |
| D3 | Superseded by **D15** (config-level hide vs disable). | ✅ Locked |
| D4 | Wildcards `claims:*` with longest-prefix rules; **forbid `*` in production catalogs**; prefer explicit `superuser` role. | ✅ Locked |
| D5 | Optional audit port Phase 7; metadata only. | ✅ Locked |
| D6 | i18n via labels map; default copy generic (“You don’t have access”) — never permission key or policy id. | ✅ Locked |

### Enterprise review — additional locked decisions (D17–D26)

| ID | Decision | Status |
|----|----------|--------|
| **D17** | **Control plane vs data plane:** Pixel UI implements **data plane + PEP only**. Control plane (catalog/policy lifecycle, approval, deployment) is app/IAM — documented, not implemented. | ✅ Locked |
| **D18** | **Persona ≠ PDP primitive.** Persona maps to roles in app layer; PDP evaluates roles, permissions, policies only. | ✅ Locked |
| **D19** | **Policy evaluation is deterministic** — never depends on array declaration order; deny > allow > default. | ✅ Locked |
| **D20** | **Tenant isolation invariant:** decision **must deny** when `subject.tenantId` and resource/context tenant are both set and incompatible (before other rules). | ✅ Locked |
| **D21** | **PIP trust:** client-derived `resource.attributes` are **UX hints only**; security-sensitive allow requires trusted PIP/backend attributes or remote PDP. | ✅ Locked |
| **D22** | **Remote PDP failure:** timeout/5xx → **fail-closed** for mutations, export, approval, sensitive reads; never timeout→allow. | ✅ Locked |
| **D23** | **Correlation:** every `authorize` / `authorizeAsync` emits `requestId` on decision (debug/audit); optional wire to analytics `correlation.traceId`. | ✅ Locked |
| **D24** | **Impersonation:** `actorId` (real user) ≠ `subject.id` (effective subject); `impersonatorId` audited; impersonator never becomes effective subject. | ✅ Locked |
| **D25** | **Direct grants vs emergency:** `subject.permissions` = JIT/direct grants (v1); `emergencyAccess` object deferred v1.1 (reason, expiry, audit). | ✅ Locked |
| **D26** | **Catalog strict mode (default):** unknown permission key → deny; `development` mode → dev error + deny; never silent allow. | ✅ Locked |

---

## Enterprise architecture — control plane vs data plane (D17)

Pixel UI is an **authorization client and UX enforcement layer**, not the security authority.

```text
ENTERPRISE IAM (control plane — app/backend, out of scope for pixel-ui)
  roles · permissions · policies · versions · lifecycle · governance · audit config
                              │
                              ▼ policy snapshot + catalog
PIXEL UI AUTHORIZATION (data plane — in scope)
  consumes: subject · catalog · policy snapshot · resource/context (from PIP)
  produces: decision · obligations · PEP state (hide/disable/readonly)
                              │
                              ▼
                         PEP (directive · guards · grid)
```

**Fundamental rule:** `local ALLOW ≠ server ALLOW` and `local DENY ≠ server DENY`. Backend / remote PDP is authoritative for security; local PDP is for rendering, navigation, and optimistic UX.

---

## Persona → role → permission → policy (D18)

```text
Persona (business archetype — app docs only, not evaluated by PDP)
   ↓ mapped by app
Role → Permissions (RBAC catalog)
   ↓ constrained by
ABAC Policy (attributes, SoD, tenant, classification)
   ↓
Authorization Decision → PEP
```

Example: Persona “Data Administrator” → roles `datastore-admin`, `data-exporter` → permissions `datastore:export` → ABAC `subject.tenantId == resource.tenantId`.

---

## Goals

1. Single PDP combining RBAC + ABAC with **locked algorithm** (§ Combining algorithm).
2. **Directive-first PEP** — attribute `[pixelAccess]` + signal `can()` in templates; no structural `*pixelAccess`.
3. Resource-aware decisions with **PIP** documented (who supplies attributes).
4. Signal-native, OnPush-safe; `pending` + `unknown` status for hydration.
5. Fail-safe defaults; **missing attribute paths fail-closed**.
6. No new runtime deps in core; remote PDP as adapter.
7. **Tamper honesty:** local JSON engine = UX only; enterprise ABAC = remote PDP.

## Non-goals (v1)

- Authentication, token refresh, IAM UI.
- Role hierarchy, permission implication, production `*` wildcard.
- ReBAC / relationship graphs (defer to remote adapter).
- Regex in policy conditions (ReDoS).
- HTTP 403 interceptor (document app recipe only).
- Per-row remote PDP evaluation.
- `@defer` as a security gate.

---

## Terminology

| Term | Meaning |
|------|---------|
| **Subject** | Actor — id, roles, `tenantId`, `impersonatorId`, attributes (app-supplied). |
| **Resource** | Target — type, id, attributes (from PIP / server projection). |
| **Action** | Verb — prefer `PixelAccessAction` union + `string` escape hatch. |
| **Permission** | RBAC key — `claims:export` (catalog-defined; agents must not invent keys). |
| **Policy** | ABAC rule — JSON condition tree. |
| **PDP** | Decision engine — returns `allow` \| `deny` + optional `obligations`. |
| **PEP** | UI enforcement — `hide` \| `disable` \| `readonly` \| future `mask`. |
| **PIP** | Policy Information Point — supplies resource/context attributes (app/backend). |
| **Persona** | Business user archetype — **not** a PDP input; app maps persona → roles. |
| **Control plane** | IAM/catalog/policy management — **out of scope**; documented for enterprise context. |

**PDP vs PEP:** `PixelAccessDecision.effect` is **`allow` \| `deny` only**. PEP modes: `hide` \| `disable` \| `readonly` \| future `mask`. Reserve typed **`obligations`** from Phase 1 (see § Obligations).

---

## Combining algorithm (B1 / D7) — LOCKED

### Three evaluation modes

| Mode | When | Behavior |
|------|------|----------|
| **RBAC-only** | `policies.length === 0` | If `permission` on request: grant → **allow**; missing → **deny**. No `permission` → **defaultEffect** (deny). |
| **RBAC ∩ ABAC** | `setPolicies()` called with ≥1 policy | RBAC grant is **necessary** but not sufficient; policies constrain. |
| **ABAC-only** | Request has no `permission` | Policies only; roles may appear as `subject.attributes` / `subject.roles`. |

### Order (all modes)

1. **Explicit deny** policy matches target + condition (missing path → **fail-closed deny**).
2. If `permission` present and RBAC denies → **deny** (`reason: 'rbac'`).
3. **Explicit allow** policies: **union** — any matching allow with true condition → allow; collect **obligations** merge (dedupe).
4. If RBAC-only mode and RBAC granted → **allow**.
5. Else **defaultEffect** (deny).

**Invariants:**

- Break-glass / direct `subject.permissions` **cannot** override step 1 (D11 / D25).
- Empty policy list + `auth.can('claims:export')` with role grant → **allow** (Phase 1 MVP works).
- Overlapping allows: union; obligations: merge unique list.
- **Deterministic (D19):** evaluation collects all matching policies, then applies deny > allow > default — **never** first-match-wins by array order.
- **Tenant check (D20):** if both sides have tenant ids and they differ → deny before policy walk.

### Policy applicability vs effect

Each policy has separate concerns:

| Field | Purpose |
|-------|---------|
| `target` | Does this policy apply? (actions, resourceTypes, permissions) |
| `effect` | `allow` or `deny` if condition true |
| `condition` | Attribute predicate |
| `version` | Policy document version (metadata) |
| `status` | `proposed` \| `active` \| `deprecated` — only `active` evaluated in v1 |
| `priority` | Reserved for future tie-break; v1 uses deny-wins, not priority ordering |

---

## Subject lifecycle (B2 / D8 / D24) — LOCKED

### Service context state (hydration)

```ts
type PixelAuthorizationContextStatus =
  | 'unknown'      // identity not loaded yet
  | 'loading'      // subject/catalog/policy fetch in flight
  | 'ready'        // evaluation allowed
  | 'error'        // context load failed — fail-closed for actions
  | 'unauthenticated';
```

Distinct from **decision** status (`allow` \| `deny` \| `pending`) on a single request.

```ts
interface PixelAuthorizationSubject {
  readonly id?: string;              // effective subject (authorization identity)
  readonly actorId?: string;         // real user when impersonating (D24)
  readonly tenantId?: string;
  readonly impersonatorId?: string;  // audited; never used as effective subject
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[]; // direct/JIT grants — not emergency (D25)
  readonly attributes?: Readonly<Record<string, string | number | boolean | readonly string[]>>;
  // v1.1: emergencyAccess?: PixelEmergencyAccess;
}

/** Future-compatible role model (v1: flat catalog only — D12) */
interface PixelRole {
  readonly id: string;
  readonly permissions: readonly string[];
  readonly inherits?: readonly string[]; // v1.1 — not evaluated in v1
}
```

| Context status | PEP behavior |
|----------------|--------------|
| `unknown` / `loading` | Skeleton / `aria-busy` — **do not hide** gated chrome |
| `error` | Fail-closed for mutations; skeleton or unavailable for sensitive chrome |
| `unauthenticated` | Deny |
| `ready` | Full PDP evaluation |

- `setSubject(null)` → `unauthenticated`; **invalidate all caches** (subject/catalog/policy versions).
- **SSR:** subject snapshot via `TransferState`, or skeleton on server.
- **Tenant invariant (D20):** deny when `subject.tenantId` ≠ `resource.attributes.tenantId` or `context.tenantId` when both defined.

### Impersonation audit fields (D24)

When impersonating, audit captures: `actorId`, `subject.id`, `impersonatorId`, `tenantId`, `action`, `resource`, `decision`, `requestId`, timestamp.

---

## Core API — single surface (B1)

```ts
type PixelAccessAction =
  | 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve' | 'navigate'
  | string;

type PixelAccessDecisionStatus = 'allow' | 'deny' | 'pending';

interface PixelAuthorizationObligation {
  readonly type:
    | 'filter'
    | 'mask'
    | 'column-allow-list'
    | 'watermark'
    | 'approval-required';
  readonly value?: unknown;
}

interface PixelAccessDecision {
  readonly status: PixelAccessDecisionStatus;
  readonly effect: 'allow' | 'deny';
  readonly reason?: 'rbac' | 'abac' | 'tenant' | 'default-deny' | 'error' | 'pending' | 'remote-unavailable';
  readonly obligations?: readonly PixelAuthorizationObligation[];

  /** Diagnostic metadata — never shown to end users (D23) */
  readonly requestId?: string;
  readonly policyId?: string;
  readonly policyVersion?: string;
  readonly catalogVersion?: string;
  readonly source?: 'local' | 'remote';
}

interface PixelAuthorizationResource {
  readonly type: string;
  readonly id?: string;
  readonly parent?: { readonly type: string; readonly id: string }; // hierarchy — v1 optional
  readonly attributes?: Readonly<Record<string, unknown>>;
}

interface PixelAuthorizationContext {
  readonly tenantId?: string;
  readonly organizationId?: string;
  readonly environment?: string;
  readonly region?: string;
  readonly now?: string; // ISO from PIP — D16
}

class PixelAuthorizationService {
  readonly contextStatus: Signal<PixelAuthorizationContextStatus>;

  setSubject(subject: PixelAuthorizationSubject | null): void;
  setPolicies(policies: readonly PixelPolicy[], meta?: { version?: string }): void;
  setPermissionCatalog(catalog: PixelPermissionCatalog): void;

  authorize(req: PixelAuthorizationRequest): PixelAccessDecision;
  authorizeAsync(req: PixelAuthorizationRequest): Promise<PixelAccessDecision>;
  can(permission: string, resource?: PixelAuthorizationResource): Signal<boolean>;
  access(req: PixelAuthorizationRequest): Signal<PixelAccessDecision>;

  /** Dev/QA only — explains decision without exposing policy to UI (Phase 8) */
  explain?(req: PixelAuthorizationRequest): PixelAccessExplainResult;

  filterAllowed<T>(...): readonly T[];
}
```

**Correlation (D23):** `requestId` generated per evaluation; apps may forward to API `Authorization-Request-Id` header and analytics correlation.

---

## ABAC condition contract (G2) — lock before `policy.engine.ts`

**Operators v1:** `eq`, `neq`, `lt`, `lte`, `gte`, `gt`, `in`, `contains` — **no regex**.

- Path resolver: safe lookup (no `Object.prototype` traversal).
- **Missing path → fail-closed deny.**
- Type coercion table documented (`"50000"` vs `50000`).
- Nested `and` / `or` / `not`.
- `subject.roles` supports `in` / `contains`.
- Time: **`context.now` / PIP only** (D16).

**PIP contract (D21) — lock before ABAC Phase 3**

| Question | Answer |
|----------|--------|
| Who supplies attributes? | **Trusted:** backend/API, authorization service, route resolver. **Untrusted:** client row objects — UX only. |
| Who owns them? | App/backend; PIP adapter interface (optional) fetches fresh attributes for sensitive resources. |
| Freshness | Document TTL per resource type; stale trusted attrs → fail-closed for sensitive actions. |
| Unavailable PIP | Sensitive mutation/export → deny; read-only chrome → skeleton/unavailable. |
| Security rule | `resource.attributes.role = 'admin'` set in browser **must not** grant access locally for sensitive actions without remote PDP. |

```text
Backend / Resource API → PIP → PDP (pixel-ui local or remote)
```

**SoD example (G1):** deny when `subject.id === resource.attributes.createdBy` and `action === 'approve'`.

**Catalog governance (D26):**

```ts
interface PixelPermissionDefinition {
  readonly key: string;
  readonly description: string;
  readonly resourceType: string;
  readonly actions: readonly string[];
  readonly introducedIn: string;
  readonly deprecated?: boolean;
  readonly replacement?: string;
  readonly removedIn?: string;
}
```

Lifecycle: `proposed → active → deprecated → removed`. Strict mode: unknown key → deny.

**Catalog version skew:** client v2 / server v3 → unknown permissions deny in `strict` (default); `development` logs error + deny.

**Wildcards (D4):** longest-prefix; production forbids bare `*`.

---

## PEP — directive-first (B4 / B5 / D9)

### Do not use

- `@defer (when auth.can())` — defer is download gate, not security (PERFORMANCE.md).
- `*pixelAccess` structural micro-syntax — use `@if` + attribute directive.
- Impure `pixelCan` pipe as primary API — prefer `auth.can()()` signal. Pipe only if signal-backed (optional, Phase 2+).

### Mechanisms

| Mode | Mechanism |
|------|-----------|
| **hide** | `@if (auth.can('claims:export')()) { … }` or directive sets `hidden` + removes from a11y tree |
| **disable** | `[pixelAccess]` attribute directive composes into host `disabled` / `aria-disabled` |
| **readonly** | attribute directive + CVA `setDisabledState` / `readonly` — document submit behavior |

```html
@if (auth.can('claims:export')()) {
  <pixel-button>Export</pixel-button>
}

<pixel-button
  pixelAccess="claims:export"
  [pixelAccessMode]="config.deniedActionMode()"
>Export</pixel-button>
```

- If `pixelAccess` bound and service missing: **dev error + deny**.
- If unbound: **zero cost** — no engine import in component FESM.

### Packaging (B4)

- **`pixel-ui/authorization`** secondary entry — engine + directive + service.
- Main `pixel-ui` barrel re-exports types only until secondary stabilizes.
- Phase 7: optional `hostDirectives` on button/menu **inside secondary entry**.

### `resolvedState()` precedence (G6)

**loading > access deny > `disabled` input** (document in button README when native wave lands).

Default denied mode = **`deniedActionMode` config** (D15), per-control override via `pixelAccessMode`.

---

## Caching & invalidation (G4 / enterprise) — revised

### What to cache

| Cache | Key includes |
|-------|----------------|
| Expanded role → permissions | `catalogVersion` |
| Compiled policies | `policyVersion` |
| Remote PDP responses (Phase 7) | `requestId`, subject version — **not** full attribute blobs |

### Invalidate on

```text
logout · tenant switch · role change · permission change
policy change · catalog change · impersonation start/end
setSubject(null) · remote PDP version change
```

Bump monotonic `subjectVersion` / `catalogVersion` / `policyVersion` signals — never TTL-only for security-sensitive paths.

### What NOT to cache

- Per-row decision LRU (10k rows)
- Keys hashing full `resource.attributes` (PII risk)

**Row ABAC:** sync eval over compiled policies — **< 0.1ms** per visible row.

### Export authorization model (D13 + enterprise)

```text
view → export → bulk-export → download-sensitive-data
```

All must agree: toolbar visibility · column visibility · `exportable: false` · row auth · `exportData()` · **server export**. Obligations may include `column-allow-list` on allow.

---

## Remote PDP contract (D22 — define in Phase 6, implement Phase 7)

| Operation | PDP timeout / 5xx / unavailable |
|-----------|-----------------------------------|
| Read-only UI chrome | Skeleton / unavailable state |
| Mutation | **Deny** |
| Export | **Deny** |
| Approval | **Deny** |
| Sensitive data display | **Deny** |
| Navigation | App-configurable; **security-first default = deny** |

Never: `PDP timeout → allow`. `authorizeAsync` sets decision `pending` then `deny` on failure.

Remote adapter interface + timeout/retry config locked in Phase **6** before adapter implementation in Phase **7**.

---

## Router helpers (G5 / D14)

```ts
// route data — string or full request

export function pixelAuthorizationCanMatch(): CanMatchFn;      // lazy chunks — ship first
export function pixelAuthorizationCanActivate(): CanActivateFn;
export function pixelAuthorizationCanActivateChild(): CanActivateChildFn;
```

- Guards read `route.data.access` (string → permission) or `data.accessRequest` (full ABAC).
- Return `UrlTree` to `/forbidden` vs `/login` — **app-configurable** (`forbiddenUrl`, `loginUrl`).
- Align 403 UX with `PixelTitleService.setError()` for forbidden page titles.
- **Drift detection (dev):** nav visible but `canMatch` denies; route allows but sole CTA hidden.
- **Nav trees:** `filterAllowed` — parent with all children denied → hide parent (configurable: empty group vs non-link header).
- **Versioned permission catalog** = single key list for routes, sidenav, buttons.

---

## Authorization decision matrix (required tests)

| RBAC | ABAC | Explicit deny | Tenant mismatch | Result |
|------|------|---------------|-----------------|--------|
| Allow | — | No | No | Allow (RBAC-only) |
| Allow | Allow | No | No | Allow |
| Allow | Deny | No | No | Deny |
| Allow | Allow | Yes | No | Deny |
| Deny | Allow | No | No | Deny |
| — | Allow | No | No | Allow (ABAC-only) |
| Any | Any | Any | Yes | Deny |

Also: missing attributes, PDP timeout, catalog skew, impersonation, `exportData()` when toolbar hidden, deterministic conflicting policies.

---

## Navigate migration (G7)

**Today:** `setPermissionGuard((req) => boolean | Promise<boolean>)`.

**Target:**

- Alias **still accepts async** guards OR waits on `pending` status.
- Precedence: `request.canActivate` → global `setPermissionGuard` → default allow (document three layers).
- Resource id: prefer app route tokens / `Router.url` — not lossy `req.route.join('/')`.
- Real deprecation version + **Breaking changes** in navigate README.

```ts
// internal delegation (sync path when local PDP)
const decision = auth.authorize({
  action: 'navigate',
  permission: req.access,
  resource: { type: 'route', id: req.resourceId ?? req.route.join('/') },
});
```

---

## Component matrix (revised — directive / grid-first)

| Phase | Components | Integration |
|-------|------------|-------------|
| **1–3** | Any host | `[pixelAccess]`, `@if (auth.can()())` |
| **5** | `pixel-data-grid` | export toolbar, columns, row actions, `exportData()` guard |
| **4** | Router + sidenav models | `canMatch`, `filterAllowed` |
| **6** | tabs, stepper, dialog/drawer | hide steps/tabs; `open()` config `requires` |
| **7** | button, menu (optional) | `hostDirectives` in secondary entry |
| **Deferred** | `pixel-button-group`, `pixel-tree`, `pixel-chip`, charts, tour | M6 |

**Additional components (M6):** document in service README — tree permission patterns, button-group mixed visibility, app-shell rail toggle (playground precedent).

---

## Security & compliance

1. UI is not security — APIs must enforce.
2. Default deny; `unknown` ≠ deny (skeleton).
3. No policy leakage in tooltips / analytics / console.
4. Local engine **tamperable in DevTools** — document in README (B3).
5. Export column allow-list (D13).
6. Audit: `impersonatorId` always logged when present (M3).
7. Optional `PIXEL_UI_ACCESS_AUDIT` port (Phase 7) — permission + resource type only.

---

## Testing strategy (M7 additions)

- `unknown` status → skeleton, not hidden DOM
- Hydration / TransferState subject
- Wildcard longest-prefix parsing
- SoD deny policy
- Missing attribute → fail-closed
- Cache does not store PII attribute blobs
- `exportData()` blocked when toolbar denied
- `canMatch` lazy route
- Directive disable vs hide matrix
- Decision matrix (§ Authorization decision matrix)
- Impersonation actor vs effective subject
- PDP timeout / remote unavailable → deny
- Catalog strict mode unknown permission
- Tenant switch invalidates cache

---

## Documentation & governance (M8 / M9)

| Artifact | When |
|----------|------|
| `services/authorization/README.md` | Phase 1 |
| `AUTHORIZATION-GUIDELINES.md` | Phase 2 |
| `npm run readme:api` + AI manifest | After public API |
| Per-component README `Breaking changes` | Navigate alias, any native wave |
| Short `services/authorization/PLAN.md` | Phase 2+ implementation; delete when done |

---

## Phased implementation (enterprise-adjusted)

| Phase | Scope | Exit criteria |
|-------|--------|---------------|
| **0** | Architecture plan | This document |
| **0.1** | Implementation review (B1–B5, D7–D16) | ✅ Done |
| **0.2** | Enterprise contracts (D17–D26, control plane, PIP, tenant, correlation, remote failure) | ✅ Done (this revision) |
| **1** | RBAC: types, catalog governance, combining algorithm, `contextStatus`, sync `authorize` / `can()`, directive, `requestId`, tenant invariant, testing controller, README | ✅ DONE (2026-09-04) |
| **2** | Local ABAC engine + condition contract + PIP trust docs + deterministic deny-wins | ✅ DONE (2026-09-04) |
| **3** | PEP docs demo + navigate read-only adapter | ✅ DONE (2026-09-04) |
| **4** | Router `canMatch` / `canActivate` / `canActivateChild` + `filterAllowed` | ✅ DONE (2026-09-04) |
| **5** | Grid export/columns/row actions + `exportData()` + obligations hook | ✅ DONE (2026-09-04) |
| **6** | Tabs, stepper, dialog/drawer, form readonly | ✅ DONE (2026-09-04) |
| **6b** | **Remote PDP contract** (adapter interface, timeout, failure table) — no adapter yet | ✅ DONE (2026-09-04) |
| **7** | Remote PDP adapter + `authorizeAsync` + audit port + optional `hostDirectives` | ✅ DONE (2026-09-04) — hostDirectives deferred (directive-first sufficient) |
| **8** | `explain()` API, emergency access model, permission scope notes, governance docs | ✅ DONE (2026-09-04) — emergency access remains v1.1 |

**Phase 1 may start** after Phase 0.2 approval.

---

## Phase 0 / 0.1 / 0.2 exit criteria

**0.1 (implementation review):**

- [x] Combining algorithm, hydration, sync/async split, directive-first, D7–D16

**0.2 (enterprise review):**

- [x] Control plane vs data plane documented (D17)
- [x] Persona vs role vs permission (D18)
- [x] Deterministic policy conflict (D19)
- [x] Tenant isolation invariant (D20)
- [x] PIP trust contract (D21)
- [x] Remote PDP failure semantics (D22)
- [x] Decision `requestId` / correlation (D23)
- [x] Impersonation actor vs effective subject (D24)
- [x] Direct grants vs emergency access deferred (D25)
- [x] Catalog strict mode (D26)
- [x] Policy lifecycle fields + permission catalog governance
- [x] Cache invalidation dimensions
- [x] Obligations model + export ladder
- [x] Decision matrix test requirements
- [x] Phase table updated (remote contract before adapter)

---

## Phase 0 / 0.1 exit criteria (superseded by above)

<details>
<summary>Previous 0.1 checklist (folded into 0.2)</summary>

- [x] Locked combining algorithm (B1 / D7)
- [x] `unknown` status + SSR/hydration (B2 / D8)
- [x] Split sync local vs async remote + `pending` (B3 / D10)
- [x] Directive-first PEP; native inputs deferred; secondary entry (B4 / D9)
- [x] `@defer` removed; hide vs disable split (B5)
</details>

**Phase 1 may start** per `AGENTS.md` definition of done.

---

## Package layout

```text
projects/pixel-ui/src/lib/services/authorization/
  authorization.service.ts
  authorization.types.ts
  authorization.tokens.ts
  rbac.evaluator.ts
  policy.engine.ts
  policy.adapter.ts
  pixel-access.directive.ts      # attribute, not structural *
  route.helpers.ts
  authorization.spec.ts
  README.md
  public-api.ts                  # secondary: pixel-ui/authorization
```

---

## Success metrics (revised)

| Metric | Target |
|--------|--------|
| Phase 1 `can()` with empty policies + role grant | allow (regression test) |
| Route vs button permission drift | 0 in dev strict mode |
| Row eval (local) | < 0.1ms sync, no LRU |
| a11y | denied not focusable; `unknown` uses busy/skeleton |
| Bundle | RBAC + directive in **secondary entry** only; button FESM unchanged when unbound |

---

## Summary for stakeholders

- **RBAC** = fast permission keys; **ABAC** = attribute policies when loaded.
- **Combining algorithm is locked** — Phase 1 RBAC works with zero policies.
- **PEP is directive-first** — no engine in every button bundle.
- **`unknown` hydration** — skeleton, not flash-of-hidden UI.
- **Grid + export** — same allow-list; programmatic export denied consistently.
- **Enterprise contracts (0.2)** — control plane vs data plane, PIP trust, tenant invariant, correlation ID, remote PDP fail-closed.
- **Pixel UI = authorization client** — UX/PEP only; server/remote PDP is security authority.
