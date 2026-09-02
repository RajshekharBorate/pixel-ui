# Review — Data grid telemetry plan

**Status:** Incorporated into [PLAN-EXPORT-ANALYTICS.md](./PLAN-EXPORT-ANALYTICS.md) (2026-09-02) — pending **code** implementation  
**Date:** 2026-09-02  
**Plan under review:** [PLAN-EXPORT-ANALYTICS.md](./PLAN-EXPORT-ANALYTICS.md)  
**Reviewed against:** `pixel-data-grid.ts` / `.html`, `pixel-menu-item.ts`, `pixel-paginator.ts`, `pixel-drawer.ts`, `pixel-ui-bridge.ts`, `event-registry.ts`, `ANALYTICS-GUIDELINES.md`

**Verdict:** Approve the architecture. Review findings are **valid** and folded into the plan as **A0 → A** (defer B/C). Implement A0 before grid wiring.

---

## Scores (revised)

| Lens | Plan | Review | Note |
|------|------|--------|------|
| Telemetry schema | 8/10 | **7/10** | Envelope is strong; attempt vs success and registry schemas lag. |
| UX analytics | 6/10 | **6/10** | Journeys exist; `menuId` inheritance and mute policy are missing. |
| Privacy / security | 9/10 | **8/10** | No payloads/labels. Field names and row-checkbox volume need policy. |
| Data warehouse | 6/10 | **6/10** | `data.export` models well. Entity-as-grid would pollute dimensions. |
| Design system | 7/10 | **6/10** | No `analyticsDisabled`. Select does not inherit `menuId`. Port is too thin. |

---

## Keep — do not regress

- Canonical envelope, consent, sampling, SDK meta
- No row values, labels, clipboard payload, or filter query text
- `data.export` / `data.table.*` as warehouse primaries
- Export as the template for filter / sort / page
- Menu `action` as semantic ids (`export-clipboard`), not visible labels
- Dual-layer model: business facts vs UI chrome

---

## Blockers

Fix these in the plan (and then in code) before calling Phase A done.

### B1. A12 is incorrect — omitting `analyticsId` does not stop nested events

- [x] Document that `pixel-paginator`, `pixel-checkbox`, `pixel-menu`, `pixel-select`, and `pixel-drawer` emit whenever `PIXEL_UI_ANALYTICS` is provided. *(plan updated)*
- [x] `analyticsId` only adds `paginatorId` / `menuId` / etc. It is **not** an emit gate. *(plan updated)*
- [x] Embedded paginator **already** double-emits `ui.paginator.page` **and** `data.table.page`. *(plan updated)*
- [x] Row checkboxes **already** emit `ui.checkbox.toggle` per click with no id. *(plan updated)*
- [x] Add a first-class mute, e.g. `analyticsDisabled`, and use it on the embedded paginator and row selection controls. *(A0.1, A9, A11)*
- [x] Remove “leave `analyticsId` off” as the paginator dedup strategy (A12 / A13). *(plan updated)*

### B2. UI chrome is not optional today

- [x] Rewrite the executive summary: nested `ui.*` events already fire for every grid with the port provided. *(plan updated)*
- [x] Phase A adds **ids**, not volume. Do not describe chrome as “optional diagnostics you can ship later.” *(plan updated)*

### B3. `data.export` is an attempt, not a completion — A16 order guarantee fails for async export

- [x] `writeExport()` tracks **before** serialize/save. Excel is `void buildXlsxBlob(...).then(saveAs)`. *(plan A4/A4c)*
- [x] Clipboard `copyText` is not awaited/caught. *(plan A4c)*
- [x] `exportAllFromDataSource` has no error path; `data.export` runs **after** fetch, so the menu can already be closed. *(plan export order table)*
- [x] Server-side grids without a `dataSource` export `store.data()` as `"all"` — `rowCount` can be the current page. *(plan A4)*
- [x] Add `outcome` (`success` | `failure` | `empty`). *(plan A4)*
- [x] Emit after success (or started + completed). *(plan A4c)*
- [x] Add truncated/partial flag when fetch returns fewer rows than requested. *(plan A4 `partial`)*
- [x] Qualify A16: open → select → close → **later** `data.export` is valid for DataSource export-all. *(plan updated)*

### B4. Do not hardcode `source: 'toolbar'` in `writeExport()`

- [x] `exportData(format, scope?)` is public. *(plan A4b)*
- [x] `source` must be a parameter: `toolbar` | `api` | `row-action` (and similar). *(plan A4b)*

### B5. Phase B cannot work through the current port

- [x] `PIXEL_UI_ANALYTICS` / `createPixelUiAnalyticsPort` only forwards `name`, `properties`, and `component.name`. *(plan A0.5, B deferred)*
- [x] No `traceId`, `parentSpanId`, `instanceId`, or `runInInteraction`. *(plan updated)*
- [x] `pixel-ui` must not import `pixel-analytics`. *(plan updated)*
- [x] Extend the duck-typed port **before** interaction correlation. *(A0.5)*
- [x] Remove `context.component.instanceId` from Phase A sample JSON (it will not appear today). *(plan JSON updated)*

### B6. Empty `analyticsId` produces broken chrome ids

- [x] Grid `analyticsId` is optional. `{gridId}-export` becomes `-export`. *(plan guard)*
- [x] Only compose nested ids when the grid id is set; otherwise skip chrome ids. *(plan A guard)*

---

## High

### H1. `ui.menu.select` does not inherit parent `menuId`

- [x] Items emit `action` / `itemId` / `variant` only. *(plan documents)*
- [x] A1+A2 will **not** produce the proposed select JSON. *(plan A0.2)*
- [x] Inherit `menu.analyticsId` onto items (library change), or pass it via `analyticsProperties`. *(A0.2)*

### H2. Do not stamp `{gridId}-row-select` on every row checkbox

- [x] A shared checkbox id still emits N events per selection pass. *(plan A11 mute)*
- [x] Mute row chrome (`analyticsDisabled`). *(A0.1, A11)*
- [x] Add `data.table.selection` later with counts/mode only — never row ids. *(A12 defer)*

### H3. `context.entity` as grid/menu identity collides with real entities

- [x] `type: "grid", id: "docs-claims-grid"` duplicates `gridId` / `component.instanceId`. *(plan Phase C redefined)*
- [x] Reserve `entity` for app objects (claim, policy) supplied by the host. *(plan Phase C)*
- [x] Defer or redefine Phase C C1. *(done)*

### H4. Privacy section contradicts live `data.table.filter`

- [x] Filter events already emit `field`. *(plan privacy updated)*
- [x] Treat `field` as a **schema id**; warn that `column.field` values like `email` / `ssn` leak. *(plan privacy)*
- [x] Do not claim “never field names” while filter events include them. *(plan privacy)*

### H5. Registry property schemas belong in Phase A, not C

- [x] `validateRegistry` only type-checks properties that exist on the definition. *(plan A14)*
- [x] Add **optional** schemas for new fields in Phase A. *(A14)*
- [x] Do not mark them required until consumers migrate. *(A14)*
- [x] Bump or document `eventVersion` for additive properties. *(A14 note)*

### H6. Naming drift

- [x] Guidelines show `data.table.filter.apply`; registry/grid emit `data.table.filter`. *(plan A15)*
- [x] Decide `data.export` vs `data.table.export` and align `ANALYTICS-GUIDELINES.md`. *(plan A15)*

### H7. A15 / A16 are library-wide menu changes

- [x] Close `reason` already exists on drawer — mirror it on `pixel-menu`. *(A0.3)*
- [x] Call A15/A16 out as library-wide, not grid-only. *(A0)*
- [x] Expand specs beyond the grid. *(A0.6, A19)*

---

## Medium

- [x] **M1.** C3 ingest dedup of export `ui.menu.select` is lossy. Keep both layers; KPI in warehouse views, not by dropping chrome. *(removed from plan)*
- [x] **M2.** Phase B “auto-wrap menu open→close” is too simple. Filter menus nest selects; DataSource export is async. Need overlapping scopes, not one wrap. *(plan B2)*
- [x] **M3.** Pin / hide / reorder / layout / edit have no business events. Add `data.table.column.*` in A or explicitly defer. *(A13b defer)*
- [x] **M4.** Document `columnCount`: exportable visible columns vs all columns. *(plan A4)*
- [x] **M5.** Pick one of `hasActiveFilters` / `activeFilterCount` as the fact; the other optional. *(plan)*
- [x] **M6.** `scope: 'page'` exists on the public API but not in the toolbar — document programmatic-only. *(A17)*
- [x] **M7.** `setColumnSort` vs header sort: menu path omits `additive`; align properties when adding `source`. *(A8)*
- [x] **M8.** `direction: null` on sort-clear: if you later schema `direction` as `string`, `null` will fail `validateRegistry`. *(A8b)*
- [x] **M9.** Effort: A1–A18 is not 1–2 days once mute, menuId inheritance, outcome, and registry are in scope. Plan **A0 + A** as ~3–5 days. *(plan updated)*
- [x] **M10.** Sample JSON `instanceId` vs `menuId` mismatch — align after B5. *(instanceId removed from samples)*
- [x] **M11.** Join key: document mapping `action: export-clipboard` ↔ `format: clipboard`. *(A18)*

---

## Review checklist — recommended votes

Use these when updating the plan’s “Review checklist” section.

| Decision | Vote | Notes |
|----------|------|-------|
| Dual-layer model (`data.*` vs `ui.*`) | **Approve** | Keep |
| Phase A chrome ids | **Approve after mute API + gridId guard** | B1, B6 |
| Id pattern `{gridId}-export` / `-filter-{field}` / `-column-{field}` | **Approve when gridId is set** | B6 |
| New `data.export` fields | **Approve**; `source` must be parametric | B4 |
| Embedded paginator = only `data.table.page` | **Reject as written** | Needs `analyticsDisabled` (B1) |
| Phase B `parentSpanId` / interaction API now | **Defer** | Until the port can carry correlation (B5) |
| Phase C `context.entity` as grid/menu | **Defer / redefine** | H3 |
| Ingest dedup of export `ui.menu.select` | **Reject** | M1 |
| Docs samples split by scenario | **Approve** | Keep A17 |
| `data.table.selection` / `group.*` | **Defer** | Mute row chrome now (H2) |

---

## Revised slice (replace Phase A → D order)

### A0 — Library prerequisites (do first)

1. `analyticsDisabled` (or equivalent) on nested chrome: paginator, checkbox, select, menu, drawer.
2. Menu items inherit parent `menuId`.
3. Menu close `reason` (`select` \| `escape` \| `outside` \| `tab` \| `programmatic`) — mirror drawer.

### A — Grid (after A0)

1. Chrome ids, guarded by grid `analyticsId`.
2. `data.export` enrichment: `scope`, `columnCount`, `hasActiveFilters`, parametric `source`, honest `rowCount` / `outcome`.
3. `filterType` on `data.table.filter`; `source` on `data.table.sort`.
4. Optional registry property schemas (not required).
5. Docs samples split by scenario; specs for mute, ids, outcome, sort `source`.

### B — Correlation (defer)

Only after the duck-typed port can accept a shared `traceId`. Nested overlays need overlapping scopes, not a single menu wrap.

### C — Entity (defer / redefine)

`context.entity` = product object from the app (claim, policy), not a clone of `gridId`.

### D — Governance (keep)

Contract tests, `validateRegistry: true` in staging, privacy checklist per new `data.*` property.

---

## Facts to correct in PLAN-EXPORT-ANALYTICS.md

| Plan claim | Actual |
|------------|--------|
| Embedded paginator without `analyticsId` → only `data.table.page` | `ui.paginator.page` still fires |
| UI chrome is optional / ship later | Chrome already emits when the port is provided |
| Event order after A16: select → export → close | DataSource export-all: select → close → later export |
| `source: 'toolbar'` in `writeExport()` | Public `exportData()` is programmatic too |
| Phase A JSON includes `context.component.instanceId` | Port does not populate `instanceId` |
| `{gridId}-export` always valid | Empty `analyticsId` → `-export` |
| A1+A2 yield `menuId` on `ui.menu.select` | Items do not inherit parent `menuId` |
| Phase B interaction API in `pixel-analytics` only | Must extend `PIXEL_UI_ANALYTICS` port first |

---

## Lifecycle

When a finding is addressed in **code** (plan updates are checked above):

1. Check the implementation box or note the PR.
2. When A0 + A land, close this review file.
3. Lasting decisions live in the plan / READMEs / `ANALYTICS-GUIDELINES.md`.
