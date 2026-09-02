# Review — RBAC + ABAC authorization plan

**Status:** ✅ Folded into [PLAN-RBAC-ABAC.md](./PLAN-RBAC-ABAC.md) (Phase 0.1)  
**Also see:** [PLAN-RBAC-ABAC-ENTERPRISE-REVIEW.md](./PLAN-RBAC-ABAC-ENTERPRISE-REVIEW.md) (Phase 0.2 governance)  
**Date:** 2026-09-02  
**Plan under review:** [PLAN-RBAC-ABAC.md](./PLAN-RBAC-ABAC.md)  
**Reviewed as:** RBAC / ABAC architect against `CONVENTIONS.md` §3e/§10, `AGENTS.md`, `PERFORMANCE.md`, `services/navigate`, `pixel-button` `resolvedState()`, `pixel-data-grid` export/row actions, `ANALYTICS-GUIDELINES.md` (audit-port parallel)

**Verdict (original):** Direction is sound. Phase 0 was **not** ready to lock until blockers B1–B5 and D7–D10 were written into the plan.

**Verdict (current):** Blockers **B1–B5**, gaps **G1–G7**, medium **M1–M9**, and decisions **D7–D16** are incorporated in the main plan (Phase 0.1). **Phase 1 may start** when you approve implementation.

---

## Scores (at review time — for history)

| Lens | Score | Note |
|------|-------|------|
| PDP semantics (RBAC∩ABAC) | 4/10 → addressed | Combining algorithm locked in plan |
| PEP / native UX | 7/10 → addressed | Directive-first; native inputs Phase 7 |
| Angular / pixel-ui fit | 5/10 → addressed | Secondary entry, no `@defer`, sync/async split |
| Enterprise completeness | 6/10 → partial | SoD, tenant, PIP documented; hierarchy deferred v1.1 |
| Security honesty | 8/10 → addressed | Local engine tamper + export allow-list added |
| Operability | 6/10 → addressed | Async navigate alias, pending status |

---

## Fold status

| Section | Folded into plan |
|---------|------------------|
| Keep — do not regress | ✅ Executive summary + goals |
| **B1** Combining algorithm | ✅ § Combining algorithm (D7) |
| **B2** Subject `unknown` | ✅ § Subject lifecycle (D8) |
| **B3** Sync vs async | ✅ § Core API (D10) |
| **B4** Directive not native inputs | ✅ § PEP directive-first (D9) + secondary entry |
| **B5** No `@defer` / no `*pixelAccess` | ✅ § PEP mechanisms |
| **G1** Flat RBAC / SoD / wildcards | ✅ ABAC + locked decisions D4, D12 |
| **G2** Condition contract + PIP | ✅ § ABAC condition contract |
| **G3** PDP vs PEP effects | ✅ Terminology + decision type |
| **G4** Grid cache | ✅ § Caching & performance |
| **G5** Router `canMatch` | ✅ § Router helpers |
| **G6** `resolvedState()` | ✅ § PEP precedence (D15) |
| **G7** Navigate async | ✅ § Navigate migration |
| **M1–M9** | ✅ Naming, components, tests, docs lifecycle |
| Phase sequencing 0.1–7 | ✅ Replaces old Phase 1–6 table |
| D7–D16 | ✅ Locked decisions table |
| Phase 0 exit criteria | ✅ All checkboxes satisfied in plan |

---

## Blockers — resolution summary

### B1. Combining algorithm ✅

- RBAC-only when `policies.length === 0` — Phase 1 `can()` works.
- RBAC ∩ ABAC when policies loaded.
- Deny always wins; break-glass cannot override deny.
- Single service surface (`authorize`, `can`, `access`).

### B2. Subject bootstrap ✅

- `PixelAuthorizationStatus`: `unknown` | `unauthenticated` | `ready`.
- PEP: skeleton for `unknown`, deny for `unauthenticated`.
- SSR TransferState noted; cache clear on `setSubject(null)`.

### B3. Sync vs async ✅

- `authorize()` / `can()` sync; `authorizeAsync()` for remote.
- `pending` status; no per-row remote.
- README tamper honesty.

### B4. Native inputs deferred ✅

- Phase 1–2: directive + `@if` only.
- `pixel-ui/authorization` secondary entry.
- Native `hostDirectives` Phase 7.

### B5. `@defer` / structural directive ✅

- Examples removed from plan.
- hide = `@if` / `hidden`; disable = attribute directive.

---

## Open decisions — locked in main plan

| ID | Locked in plan |
|----|----------------|
| D7 | ✅ |
| D8 | ✅ |
| D9 | ✅ |
| D10 | ✅ |
| D11–D16 | ✅ |
| D1–D6 | ✅ Updated per review comments |

---

## Remaining follow-ups (implementation time, not plan blockers)

- [ ] Implement combining algorithm unit tests (empty policies case).
- [ ] Bundle test: unbound button does not import engine.
- [ ] `AUTHORIZATION-GUIDELINES.md` at Phase 2 (not Phase 0).
- [ ] Role hierarchy / implication — v1.1 catalog expander (documented non-goal).
- [ ] ReBAC — remote adapter only (documented).

---

## Phase 0 revised exit criteria — plan status

All items from original review are satisfied in `PLAN-RBAC-ABAC.md` § Phase 0 / 0.1 exit criteria.

**Next step:** Approve Phase 1 implementation (service + RBAC + directive + tests).
