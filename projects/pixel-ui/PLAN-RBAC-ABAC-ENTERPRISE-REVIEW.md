# Enterprise architecture review — RBAC + ABAC plan

**Status:** ✅ Folded into [PLAN-RBAC-ABAC.md](./PLAN-RBAC-ABAC.md) (Phase 0.2, 2026-09-02)  
**Review date:** 2026-09-02  
**Source:** `RBAC_ABAC_Enterprise_Architecture_Reviewed.md` (external)  
**Verdict:** **APPROVE WITH CHANGES** — architecture direction approved (8/10); enterprise control-plane contracts required before Phase 1.

---

## Executive assessment

The plan is a strong **authorization data plane / PEP** design. The gap was missing **enterprise control plane, governance, lifecycle, trust boundaries, and operational contracts**. Those are now documented in the main plan (Phase 0.2).

**Keep (approved):** headless auth, PDP/PEP split, directive-first PEP, signals, `unknown` state, explicit deny, fail-closed attributes, secondary entry, no per-row remote PDP, `canMatch`, export allow-list, local PDP = UX only.

---

## P0 items — fold status

| P0 area | Resolution in plan |
|---------|-------------------|
| Control plane vs data plane | § Enterprise architecture (D17) |
| Policy lifecycle / versioning | § Policy applicability vs effect; Phase 8 governance |
| Permission catalog governance | § Catalog governance (D26); `PixelPermissionDefinition` |
| Remote PDP timeout/error | § Remote PDP contract (D22) |
| Cache invalidation | § Caching & invalidation (version bumps) |
| PIP trust/freshness | § PIP contract (D21) |
| Tenant isolation invariant | D20 + decision matrix |
| Impersonation semantics | D24; `actorId` vs `subject.id` |
| Decision metadata / correlation | D23; `requestId` on decisions |
| Deterministic policy conflict | D19; deny > allow > default, not array order |

---

## Key recommendations adopted

1. **Persona → Role → Permission → Policy** hierarchy (persona not a PDP primitive).
2. **Service context state** (`unknown`/`loading`/`ready`/`error`/`unauthenticated`) separate from decision `pending`.
3. **Typed obligations** (`mask`, `column-allow-list`, `approval-required`) reserved Phase 1+.
4. **Export ladder** — view → export → bulk → sensitive; UI + server must align.
5. **`explain()` API** — Phase 8 dev/QA only.
6. **Emergency access** — deferred v1.1; do not overload `permissions` as break-glass.
7. **Resource `parent` hierarchy** — optional on type; no eval in v1.
8. **Remote PDP contract in Phase 6b** before adapter in Phase 7.
9. **Authorization decision matrix** — required test suite.
10. **Reordered phases** — ABAC before grid; remote contract before adapter.

---

## Locked decisions added (D17–D26)

See main plan **Locked decisions** table.

---

## Not implemented in v1 (documented non-goals)

- Role hierarchy / permission implication (future `PixelRole.inherits`)
- ReBAC / OpenFGA graphs (remote adapter only)
- Permission scope dimension (`claims:export@project:123`) — ABAC can express; explicit scope type deferred
- Emergency access activation workflow
- Control plane UI / policy editor

---

## Phase gate

| Phase | Status |
|-------|--------|
| 0.1 Implementation review | ✅ |
| 0.2 Enterprise contracts | ✅ Folded |
| 1 RBAC implementation | ⏳ Ready when you approve |

**Next step:** Approve Phase 1 or request further plan edits.
