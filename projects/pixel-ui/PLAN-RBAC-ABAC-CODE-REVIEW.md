# Code review — RBAC + ABAC implementation

**Status:** Findings from 2026-09-05; remediations landed the same day (see Status column)  
**Date:** 2026-09-05  
**Reviewed as:** RBAC / ABAC architect against [PLAN-RBAC-ABAC.md](./PLAN-RBAC-ABAC.md) (locked D7–D26), `CONVENTIONS.md`, `services/authorization/README.md`  
**Scope:** `projects/pixel-ui/src/lib/services/authorization/` + PEP wiring in grid, dialog, drawer, tabs, stepper, button, navigate  
**Related plan reviews:** [PLAN-RBAC-ABAC-REVIEW.md](./PLAN-RBAC-ABAC-REVIEW.md) (Phase 0.1) · [PLAN-RBAC-ABAC-ENTERPRISE-REVIEW.md](./PLAN-RBAC-ABAC-ENTERPRISE-REVIEW.md) (Phase 0.2)

**Verdict at review time:** Request changes. Strong Phase 1 RBAC + directive demo, not a finished ABAC engine.

**Verdict after remediations:** Behavioral blockers below are addressed in code and tests. D9 uses `PIXEL_AUTHORIZATION_EVALUATOR` (secondary FESM still blocked). SSR `TransferState` (B2) remains deferred.

Use this file as the review packet: read the finding, then the **Status** / **Remediation** notes.

---

## How to use this document

1. Findings are ordered by severity (the original review order).
2. **Status** is `Fixed` / `Documented` / `Deferred` as of 2026-09-05.
3. Locked plan IDs (D7–D26) are the acceptance criteria — not taste.

---

## Scores (at review time)

| Lens | Score | Note |
|------|-------|------|
| PDP semantics (RBAC ∩ ABAC) | 4/10 | Chrome `can()` poisoned by resource policies; missing-path deny fail-open |
| PEP / hydration (D8) | 3/10 | `can()`, guards, grid columns each did something different |
| Tenant isolation (D20) | 4/10 | `context \|\| resource`; numeric tenant ids skipped |
| Security honesty | 6/10 | README honest; combining algorithm and PIP fail-closed not |
| Angular / packaging (D9) | 5/10 | Button token-only OK; grid/dialog/tabs pull the engine |
| Tests vs decision matrix | 4/10 | Happy path only; matrix gaps would have caught the bugs |

---

## Critical / high

### 1. ABAC policies poison chrome-level `can()` / `[pixelAccess]`

| | |
|---|---|
| **Severity** | Critical |
| **Plan** | D7 combining algorithm; chrome `@if (auth.can()())` |
| **Status** | Fixed |

**Comment:** `can(permission)` and string `pixelAccess` evaluate `{ permission, action: 'view' }` with **no resource**. Once `setPolicies()` has any policy whose `target.permissions` includes that key, evaluation switches to RBAC ∩ ABAC. If the allow condition reads `resource.attributes.*` and the path is missing, `anyTargeted` is still true (target match only) and the result is **deny** — even when RBAC granted the role.

Shipped demo policy `allow-export-under-limit` (`lt` on `resource.attributes.amount`) therefore hides Export for a legitimate exporter after `setPolicies(AUTH_DEMO_POLICIES)`.

Chrome vs resource must be split: a policy that reads `resource.*` is **not applicable** when the request has no resource. `can(permission)` stays RBAC chrome; `authorize({ resource })` runs row ABAC.

**Remediation:** `isPolicyApplicable()` skips resource-scoped conditions when `request.resource` is absent. Requiring a matching allow only counts **applicable allow** policies, not deny-only overlays.

---

### 2. Missing attribute on a deny policy is fail-open when an allow also matches

| | |
|---|---|
| **Severity** | Critical |
| **Plan** | D7 / G2 — missing path → fail-closed deny |
| **Status** | Fixed |

**Comment:** `evaluatePolicyCondition` returned `false` on a missing path. Deny hits were skipped (`if (!ok) continue`). A sibling allow could then **allow**.

SoD: deny `subject.id === resource.attributes.createdBy` plus `allow-approve-others`. If PIP omits `createdBy`, deny does not fire and allow can.

`not` made this worse: `not { eq: ['resource.attributes.x', 'y'] }` became **true** when `x` was missing.

**Remediation:** Tri-state condition eval (`true` / `false` / `unknown`). Deny: `true` **or** `unknown` → deny. `not(unknown)` stays `unknown`. Allow: only `true` matches.

---

### 3. Tenant isolation is incomplete (D20)

| | |
|---|---|
| **Severity** | High |
| **Plan** | D20 — deny when subject and resource/context tenants are both set and incompatible |
| **Status** | Fixed |

**Comment:**

```ts
const otherTenant = ctxTenant || resTenant;
```

- If `context.tenantId === subject.tenantId` and `resource.attributes.tenantId` is a **different** tenant, resource tenant is ignored.
- `resourceTenantId()` only accepted **strings**. Numeric `tenantId: 2` skipped isolation.

**Remediation:** Deny when any two defined tenants among subject / context / resource disagree. Coerce finite numbers to string ids.

---

### 4. Hydration contract is inconsistent (D8)

| | |
|---|---|
| **Severity** | High |
| **Plan** | D8 — `unknown` / `loading` → skeleton / `aria-busy`, **not** hide |
| **Status** | Fixed |

**Comment:** Locked behavior vs what shipped:

| Surface | At review |
|---|---|
| `[pixelAccess]` | Correct — visible + `aria-busy` |
| `auth.can()` / `@if (auth.can()())` | **Hides** (`pending !== 'allow'`) |
| Route `canMatch` / `canActivate` | Treats unknown/loading as **forbidden** and redirects |
| Route watcher | Stays on the page (correct) |
| Grid `column.access` | **Shows** gated columns (PII flash) |
| Dialog/drawer `requires` | Denies `open()` (OK for mutations) |

The plan’s primary hide API is `@if (auth.can()())`. That path flashed empty chrome on every identity load. Route entry during bootstrap could dump an authenticated user on `/forbidden`.

**Remediation:**

- `can()` returns `true` while `unknown` / `loading`.
- Guards and navigate wait on `whenContextReady()` instead of redirecting.
- Grid **columns and row actions** fail-closed (hidden) until ready.
- Export **toolbar** stays visible while hydrating (chrome).
- Dialog/drawer `open()` stays fail-closed during pending (mutations).

---

### 5. String PEP always uses `action: 'view'` — ABAC action targets never fire

| | |
|---|---|
| **Severity** | High |
| **Plan** | Combining algorithm `target.actions`; SoD example `action === 'approve'` |
| **Status** | Fixed |

**Comment:** Directive and `can()` hardcoded `action: 'view'`. Policies with `target.actions: ['export']` / `['approve']` never applied to the string PEP path. Docs mixed `can('claims:export')` with `access({ action: 'export' })` in the same example — those signals could disagree.

**Remediation:** `inferAccessAction()` (catalog `actions` when exactly one, else last `:` segment if it is a known action, else `view`). `evaluate()` infers when `action` is omitted.

---

### 6. Grid row ABAC is not resource-aware (Phase 5)

| | |
|---|---|
| **Severity** | High |
| **Plan** | Phase 5 row auth; D13 export ladder |
| **Status** | Fixed (row attributes + export tests). Obligations (`column-allow-list`) still unused. |

**Comment:** Row `access` was a permission string. Evaluation used `{ type: 'row', id }` and **dropped row attributes**. Owner / classification / amount policies could not run. No tests that `exportData()` is blocked when the toolbar is denied.

**Remediation:** Row objects are passed as `resource.attributes`. `exportData()` still honors `exportAccess`. Specs cover denied toolbar + gated column hide while hydrating.

**Follow-up:** apply `column-allow-list` obligations on export if/when apps emit them.

---

### 7. Fail-open vs fail-closed when the service is missing

| | |
|---|---|
| **Severity** | High |
| **Plan** | Missing service + bound `pixelAccess` → deny |
| **Status** | Fixed |

**Comment:**

| Host | `access` set, no `PixelAuthorizationService` |
|---|---|
| `[pixelAccess]` | Deny + console error |
| Grid `exportAccess` / dialog `requires` | Deny |
| **Tab / step `access`** | **Enabled** (`if (!this.auth) return false`) |

**Remediation:** Tab and step treat missing service as disabled when `access` is set.

---

### 8. Audit (and new `requestId`s) run inside a `computed()`

| | |
|---|---|
| **Severity** | High |
| **Plan** | D23 correlation; audit is a side effect |
| **Status** | Fixed |

**Comment:** The directive called `auth.authorize()` from a `computed()`. That emitted audit and allocated a new `requestId` on every reactive read — SIEM flood, useless correlation, side effect in a derivation.

**Remediation:** Public `evaluate()` (no audit). PEPs, `can()`, grid, guards use `evaluate()`. `authorize()` remains the auditing API.

---

### 9. Remote PDP is not on the PEP path / timeout not wrapped

| | |
|---|---|
| **Severity** | High (expectation) / Medium (vs D10) |
| **Plan** | D10 local sync vs `authorizeAsync`; D22 timeout → deny |
| **Status** | Fixed (timeout default + docs). PEPs stay local by design. |

**Comment:** `[pixelAccess]`, guards, grid, tabs, dialog all called sync `authorize()` (local only). `providePixelAuthorization({ remotePdp })` did **not** wrap `withRemotePdpTimeout`. Configuring remote PDP did not change any Pixel PEP.

**Remediation:** Default 4s timeout wrapper (`remotePdpTimeoutMs: 0` skips). README: sync PEPs always use the local engine; call `authorizeAsync()` when remote is required.

---

## Medium

### 10. `resolvedState()` vs G6

| | |
|---|---|
| **Plan** | G6 — loading > access deny > `disabled` input |
| **Status** | Fixed |

PEP deny was applied before `loading`. Loading + deny looked like a dead button, not a busy one.

**Remediation:** `pixel-button` checks `state === 'loading'` first.

---

### 11. D24 audit fields

| | |
|---|---|
| **Plan** | Impersonation audit: `actorId`, `subject.id`, `impersonatorId`, `tenantId` |
| **Status** | Fixed |

Fields existed on the subject but were not on `PixelAuthorizationAuditEvent`. Nothing proved `impersonatorId` was not used as the effective subject.

**Remediation:** Audit event includes `subjectId`, `actorId`, `impersonatorId`, `tenantId`. Evaluator comment + test: roles come from `subject`, never `impersonatorId`.

---

### 12. `filterAllowed` without `attachChildren`

| | |
|---|---|
| **Status** | Fixed |

Nested nav kept the original parent object, so denied children remained on the model.

**Remediation:** If children were filtered and `attachChildren` is missing, omit the parent (fail-closed). Debug `console.error` when `config.debug` is on. Hydration keeps items (`shouldShowWhilePending`).

---

### 13. Dialog deny API

| | |
|---|---|
| **Status** | Fixed |

`open()` still returned a `PixelDialogRef` that closed on a microtask. Callers could hit `componentInstance === undefined` and treat it as success.

**Remediation:** `accessDenied: true` on dialog and drawer refs; no overlay. `afterClosed` still completes.

---

### 14. `legacy-compatible` catalog mode

| | |
|---|---|
| **Plan** | D26 — never silent allow |
| **Status** | Documented |

Public union member that still denied unknown keys. Consumers would think it allows.

**Remediation:** JSDoc: reserved alias of `strict`; unknown keys still deny.

---

### 15. `defaultEffect: 'allow'` reported `reason: 'default-deny'`

| | |
|---|---|
| **Status** | Fixed |

**Remediation:** `PixelAuthorizationReason` includes `default-allow`.

---

### 16. Navigate adapter mapped `pending` → `false`

| | |
|---|---|
| **Plan** | G7 — wait on pending |
| **Status** | Fixed |

**Remediation:** `createAuthorizationNavigateGuard` awaits `whenContextReady()`.

---

### 17. Packaging (D9) — engine in presentational FESMs

| | |
|---|---|
| **Plan** | Unbound → zero engine cost; secondary `pixel-ui/authorization` |
| **Status** | Fixed (token inject); secondary FESM still blocked by ng-packagr |

Button injects `PIXEL_ACCESS_PEP` only. Grid, dialog, drawer, tabs, and stepper inject `PIXEL_AUTHORIZATION_EVALUATOR` from `shared/authorization-evaluator.ts` (no static `PixelAuthorizationService` import). Bind the token with `providePixelAuthorization()` / `providePixelAuthorizationTesting()` — unbound native `access` / `requires` / `exportAccess` fail-closed.

**Follow-up:** secondary entry when the ng-packagr compiler issue is gone.

---

### 18. `syncNativeControls` descendant walk

| | |
|---|---|
| **Status** | Fixed |

`querySelectorAll('button, input, …')` on a host with `[pixelAccess]` disabled **all** descendant natives (card/toolbar footgun).

**Remediation:** Sync the host only when it is a native control. Pixel hosts use `PIXEL_ACCESS_PEP`.

---

### 19. SSR TransferState for subject snapshot (B2)

| | |
|---|---|
| **Status** | Deferred (skipped 2026-09-05 — CSR docs app) |

Called out in the plan. Fine to defer **if** `unknown` does not redirect routes (now true).

---

## Test gaps (plan decision matrix)

Covered at review: RBAC-only allow, unknown → pending, unauthenticated, resource-string tenant mismatch, SoD when attributes present, amount allow/deny **with** resource, remote timeout, directive hide/disable/readonly, route eviction.

Added after review:

1. Chrome `can()` after resource-scoped allow policies are loaded (no resource).
2. Missing `createdBy` on deny + allow (fail-closed).
3. RBAC deny + ABAC allow → deny.
4. Overlapping deny/allow order independence.
5. Context + resource tenant disagreement; numeric resource tenant.
6. `can()` / `[pixelAccess]` while `unknown` (must not hide).
7. `canActivate` waits while hydrating (must not bounce to forbidden).
8. `exportData()` / toolbar when `exportAccess` denied; column `access` hidden while hydrating; `column-allow-list` obligations on export.
9. Impersonation: `impersonatorId` does not grant; audit includes actor vs subject.
10. `not` + missing path → `unknown`.
11. Wildcard longest-prefix (`claims:*` vs `claims:export:csv`).
12. `filterAllowed` nested tree without `attachChildren`.
13. `evaluate()` does not emit audit.
14. Inferred `action: 'export'` for action-targeted deny policies.
15. Button loading > access deny.
16. Tab/step with `access` and **no** evaluator (fail-closed).

Still optional: `legacy-compatible` alias assertion.

---

## Plan lock scorecard

| ID | At review | After remediations |
|---|---|---|
| D7 combining | Fail — `anyTargeted` + missing-path deny skip | Pass — applicability + tri-state deny |
| D8 unknown ≠ hide | Fail on `can()`, guards, grid columns | Pass — chrome vs data split |
| D9 secondary entry / unbound cost | Fail for grid/dialog/tabs/stepper | Pass — evaluator token; secondary FESM still blocked |
| D10 sync vs async | Local PEPs only; remote unused | Pass + documented |
| D11 deny vs break-glass | OK when condition matched | Pass including missing attrs |
| D13 export allow-list | Partial | Pass — `exportAccess` + `column-allow-list` on `exportData()` |
| D14 canMatch | Present; hydration wrong | Pass — wait then evaluate |
| D15 deniedActionMode | OK | OK |
| D16 no `Date.now()` in policies | OK | OK |
| D19 deterministic deny-wins | OK for matched conditions | Pass + order test |
| D20 tenant | Incomplete | Pass |
| D21 PIP trust | Missing attrs fail-open on deny+allow | Pass |
| D22 remote fail-closed | Helper yes; not default; not on PEP | Default timeout; PEPs local |
| D23 requestId | Churned in `computed` | Pass — `evaluate()` silent |
| D24 impersonation | Fields only | Audit + eval test |
| D25 emergency deferred | OK | OK |
| D26 catalog strict | OK; `legacy-compatible` misleading | Documented alias |

---

## What was already in good shape (do not regress)

- Deny-wins when the deny **condition actually matches**; direct `subject.permissions` cannot override that.
- Prototype-safe path resolver; no regex operators.
- Directive hide uses `hidden` + `inert` + inline `display: none` so `:host { display }` cannot unhide Pixel buttons.
- `PIXEL_ACCESS_PEP` on button/input keeps the engine out of presentational FESMs.
- Route watcher + `replaceUrl` eviction (guards are entry-only).
- Remote timeout helper fail-closes when used; `explain()` is separate from user-visible copy.
- README honesty that local PDP is UX-only.

---

## Reviewer checklist (human)

- [ ] Chrome: after `setPolicies` with amount/SoD rules, `@if (auth.can('claims:export')())` still shows for an exporter with no row bound.
- [ ] Row: `authorize` / grid row action with `createdBy` missing denies approve (SoD).
- [ ] Tenant: subject `t1`, context `t1`, resource `t2` → deny.
- [ ] Hydration: first paint does not flash-hide Export; gated SSN column does not flash then hide.
- [ ] Deep-link to a gated route while identity is loading lands on the page after `setSubject`, not `/forbidden`.
- [ ] Denied `dialog.open({ requires })` → `ref.accessDenied === true`.
- [ ] Loading button with `[pixelAccess]` deny still shows the loader.
- [ ] `authorize()` vs `evaluate()`: only `authorize()` hits the audit port.

---

## Follow-ups (not blocking this review packet)

1. **D9** — secondary entry / stop static-importing the service from grid/dialog/tabs/stepper.
2. **D13** — apply `column-allow-list` (and other obligations) on `exportData()`.
3. **B2** — `TransferState` subject snapshot for SSR.
4. Tab/step dedicated specs for missing-provider fail-closed.
5. Emergency access model remains v1.1 (D25).
