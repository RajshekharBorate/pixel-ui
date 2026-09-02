# Data grid telemetry — improvement plan

**Status:** ✅ All phases complete (A0 → D, B, C) — 2026-09-02  
**Date:** 2026-09-02  
**Scope:** Full `pixel-data-grid` analytics — export, filter, sort, search, pagination, column menus, nested UI chrome  
**Pilot scenario:** Export menu (detailed JSON below); same patterns apply to all grid-owned surfaces  
**Related:** `ANALYTICS-GUIDELINES.md` · `projects/pixel-ui/src/lib/pixel-data-grid/README.md` · `projects/pixel-ui/src/lib/pixel-menu/README.md` · [PLAN-EXPORT-ANALYTICS-REVIEW.md](./PLAN-EXPORT-ANALYTICS-REVIEW.md)

---

## Executive summary

| Question | Answer |
|----------|--------|
| Does this plan cover filter, pagination, sort, etc.? | **Yes (see inventory below).** Export is the **reference implementation**; other journeys share the same gaps and fixes. |
| Is current export JSON good? | **`data.export` is a strong attempt event** — needs `outcome`, honest `rowCount`, and post-success timing for async paths. |
| Are nested UI events sufficient? | **No today** — chrome **already fires** when `PIXEL_UI_ANALYTICS` is provided; most instances lack ids. Phase A adds **ids and mute policy**, not optional volume. |
| Safe for production? | **Mostly** — no row payloads or labels. `data.table.filter.field` is a schema id; avoid sensitive column keys (`email`, `ssn`). |
| Must-fix before enterprise rollout? | **A0** (`analyticsDisabled`, menu `menuId` inheritance) then **A** (guarded chrome ids, export outcome, mute paginator/row checkboxes). |
| Nice-to-have? | ~~Correlation~~ **done (B)**, ~~app-supplied `context.entity`~~ **done (C)**, `data.table.selection`. |

**Recommendation:** Model the grid as **two layers**:

1. **Business facts (`data.table.*`, `data.export`)** — primary warehouse tables; emitted by `pixel-data-grid` with `gridId`.
2. **UI chrome (`ui.menu.*`, `ui.select.*`, `ui.paginator.page`, `ui.checkbox.toggle`, …)** — **already emitted** when the port is provided. Phase A adds stable ids where useful and **mutes** chrome that duplicates business facts or creates noise (embedded paginator, row selection checkboxes).

**Phases A0–D, B, and C are implemented.** Root `pixel-menu` scopes share `traceId` via `beginInteraction`; apps set `context.entity` with `setEntity()` for domain objects (not grid/menu ids).

---

## Full grid telemetry inventory

### Business events (emitted by `pixel-data-grid` today)

These are the **primary** events for BI. All support optional `gridId` from the grid `analyticsId` input.

| User journey | Business event | Current properties | Gaps / improvements |
|--------------|----------------|-------------------|---------------------|
| Header click sort | `data.table.sort` | `gridId`, `field`, `direction`, `columnCount`, `additive` | Add `source: 'header'` vs `'column-menu'` |
| Column menu sort | `data.table.sort` | same (via `setColumnSort`) | Menu items lack `analyticsAction`; no `source` |
| Column filter apply | `data.table.filter` | `gridId`, `field`, `operator` | Never emits filter **value** (correct). Add `filterType` (`select` \| `text` \| `number` \| `date` \| `boolean`) |
| Clear filter | `data.table.filter.clear` | `gridId`, `field` | OK |
| Quick search | `data.table.search` | `gridId`, `hasQuery` | Never emits query text (correct). Debounced 400ms |
| Paginator change | `data.table.page` | `gridId`, `pageIndex`, `pageSize` | OK. See paginator dedup below |
| Export | `data.export` | `gridId`, `format`, `rowCount` | Add `scope`, `columnCount`, `hasActiveFilters`, parametric `source`, `outcome`, async honesty |

### Nested UI chrome (emitted by child components inside the grid)

These fire **in addition to** business events whenever `PIXEL_UI_ANALYTICS` is provided — **`analyticsId` enriches properties; it is not an emit gate.** Today most grid-embedded instances omit ids or should be muted.

| Grid surface | Nested components | UI events (typical) | Today | Phase A policy |
|--------------|-------------------|---------------------|-------|----------------|
| **Export toolbar** | `pixel-menu`, `pixel-menu-item`, `pixel-checkbox` (export selected only) | `ui.menu.*`, `ui.checkbox.toggle` | Emits; **no ids** | Wire ids when `gridId` set; mute N/A |
| **Column filter** | `pixel-menu`, `pixel-select`, `pixel-input`, `pixel-datepicker` | `ui.menu.*`, `ui.select.*`, datepicker events | Emits; **no ids** | Wire ids when `gridId` set |
| **Column header menu** | `pixel-menu`, `pixel-menu-item` | `ui.menu.*` | Emits; **no ids** | Wire ids + `analyticsAction` when `gridId` set |
| **Quick search** | `pixel-input` | *(none — input has no built-in analytics)* | N/A | Business event only: `data.table.search` |
| **Pagination** | `pixel-paginator` | `ui.paginator.page` **always** (paginatorId optional) | **Double emit** with `data.table.page` | **`analyticsDisabled`** on embedded paginator; business fact only |
| **Manage columns** | `pixel-drawer` | `ui.drawer.open/close` | Emits; **no drawerId** | `drawerId` when `gridId` set |
| **Row selection** | `pixel-checkbox` per row | `ui.checkbox.toggle` per click | **Noisy, no ids** | **`analyticsDisabled`** on row checkboxes; defer `data.table.selection` |
| **Grouped rows** | expand/collapse | *(no business event)* | Gap | Defer `data.table.group.*` |

### Example: filter journey (expected event stack)

When a user filters **Status = Open** on the docs grid:

| Order | Event | Layer | Notes |
|-------|--------|-------|-------|
| 1 | `ui.menu.open` | UI chrome | Filter funnel icon → filter panel menu |
| 2 | `ui.select.open` | UI chrome | Operator or value dropdown |
| 3 | `ui.select.change` | UI chrome | `hasValue`, `selectedCount` — never label |
| 4 | `data.table.filter` | **Business** | `field: status`, `operator: equals` — never value `"Open"` |

Same structural gap as export: steps 1–3 lack `menuId` / `selectId`; step 4 is warehouse-ready.

### Example: pagination journey

| Order | Event | Layer | Notes |
|-------|--------|-------|-------|
| 1 | `data.table.page` | **Business** | Grid bridges `pixel-paginator` `(page)` → `onPaginatorPage()` |
| *(today also)* | `ui.paginator.page` | UI chrome | Fires even without `paginatorId` — **must mute** embedded paginator in A0 |

### Example: export journey — event order (revised)

| Path | Order | Notes |
|------|--------|-------|
| Sync (in-memory / client rows) | open → select → `data.export` → close | After A0 menu reorder: select before `selected` handler |
| DataSource export-all | open → select → close → **later** `data.export` | Fetch is async; menu closes before export completes |
| Excel / clipboard | `data.export` may fire **before** file save or clipboard success | Add `outcome`; emit success/failure after async work where possible |

### Example: sort journey (header click)

| Order | Event | Layer | Notes |
|-------|--------|-------|-------|
| 1 | `data.table.sort` | **Business** | `field`, `direction`, `additive` |

No nested menu events when sorting via header icon (direct click). Column menu sort adds `ui.menu.*` stack (same gap as export menu).

### Docs reference samples gap

`DOCS_ANALYTICS_EVENT_SAMPLES['analytics-data-grid']` mixes filter + sort + export in **one** flat list. Review should split into **scenarios** (filter, sort, export, page) or document that live capture is scenario-specific.

---

## Scenario under review

**User action:** Open export menu on the docs data-grid example → choose **Copy to clipboard**.

**Grid:** `analyticsId="docs-claims-grid"` · 3 rows · toolbar export.

**Events captured (live, 2026-09-01):**

1. `ui.menu.open`
2. `data.export` (`format: "clipboard"`, `rowCount: 3`)
3. `ui.menu.select` (`variant: "default"` only)
4. `ui.menu.close`

---

## Current state assessment

### Event-by-event

| Event | Verdict | Notes |
|-------|---------|-------|
| `ui.menu.open` | Acceptable | Envelope OK. `properties: {}` — missing `menuId`. |
| `data.export` | **Strong** | `gridId`, `format`, `rowCount` — correct and privacy-safe. |
| `ui.menu.select` | **Weak** | Only `variant`. Missing `action` / `itemId` — cannot identify which export option. |
| `ui.menu.close` | Acceptable | Same as open — no `menuId`. |

### What is already enterprise-grade

1. **Canonical envelope** — `schemaVersion`, `application`, `identity`, `context`, `meta.consent` / `meta.sampled` / `meta.sdk`.
2. **Privacy** — No raw data, labels, or PII in properties (matches grid README and event registry).
3. **Semantic naming** — `domain.object.action` (`data.export`, `ui.menu.*`).
4. **`data.export` properties** — Right granularity: *which grid*, *which format*, *how many rows*.

### Gaps

#### 1. Menu instrumentation gap (library)

Export menu in `pixel-data-grid.html` is built without analytics ids:

```html
<pixel-menu #exportMenu …>
  @for (format of exportFormats(); track format) {
    <pixel-menu-item (selected)="exportData(format)">…</pixel-menu-item>
  }
</pixel-menu>
```

Per `pixel-menu` README contract:

- `ui.menu.open` / `close` → `menuId` (from menu `analyticsId`)
- `ui.menu.select` → `action` (from item `analyticsAction`) and/or `itemId`

Today **`data.export` carries the real intent**; menu events are low-signal without semantic properties.

#### 2. Event ordering

`pixel-menu-item` emits `selected` **before** `ui.menu.select`:

```ts
this.selected.emit(event);      // → triggers exportData() → data.export
this.emitSelectAnalytics();     // → ui.menu.select
```

Result: **`data.export` timestamp precedes `ui.menu.select`**. Valid but confusing for funnels that assume *select → action*.

#### 3. No shared correlation

Each event gets a **new `traceId`** when unset. Session stitching works via `sessionId`; single-click reconstruction requires timestamp proximity heuristics.

#### 4. Missing export context on `data.export`

| Property | Purpose |
|----------|---------|
| `scope` | `"all"` \| `"selected"` \| `"page"` (`page` = programmatic API only, not toolbar) |
| `columnCount` | Exportable **visible** columns (not hidden / `exportable: false`) |
| `hasActiveFilters` | Boolean — prefer this as primary filter flag; `activeFilterCount` optional |
| `source` | Parametric: `toolbar` \| `api` \| `row-action` (not hardcoded in `writeExport`) |
| `outcome` | `success` \| `failure` \| `empty` — export is currently an **attempt** before async work completes |
| `partial` | Optional — fetch returned fewer rows than requested |

#### 5. Docs reference sample mismatch

`DOCS_ANALYTICS_EVENT_SAMPLES['analytics-data-grid']` mixes filter/sort samples and shows `format: "csv"`, not the clipboard export path exercised in live capture.

---

## Architecture scores (review lens)

| Lens | Score | Comment |
|------|-------|---------|
| Telemetry schema | 7/10 | Envelope strong; `data.export` is attempt-not-success today; registry schemas lag. |
| UX analytics | 6/10 | Journeys exist; need `menuId` inheritance, mute policy, honest ordering. |
| Privacy / security | 8/10 | No payloads/labels; `filter.field` is a schema id — warn on sensitive keys; row checkbox volume. |
| Data warehouse | 6/10 | `data.export` models well; do not duplicate grid as `context.entity`. |
| Design system | 6/10 | No `analyticsDisabled`; port too thin for correlation / `instanceId`. |

---

## Incorporated review findings

Source: [PLAN-EXPORT-ANALYTICS-REVIEW.md](./PLAN-EXPORT-ANALYTICS-REVIEW.md). All blockers below are **valid** against current code.

| ID | Finding | Plan response |
|----|---------|---------------|
| **B1** | Omitting `analyticsId` does not stop emits; paginator double-fires | **A0:** `analyticsDisabled` on embedded paginator + row checkboxes |
| **B2** | UI chrome is not optional | Executive summary rewritten; Phase A adds ids/mute, not volume |
| **B3** | `data.export` fires before async success; DataSource ordering | Add `outcome`; emit after success where possible; document async order |
| **B4** | `source: 'toolbar'` wrong for public `exportData()` | Parametric `source`: `toolbar` \| `api` \| `row-action` |
| **B5** | Port cannot carry correlation / `instanceId` | Defer Phase B; remove `instanceId` from sample JSON |
| **B6** | Empty `analyticsId` → `-export` | Only compose nested ids when grid id is non-empty |
| **H1** | `ui.menu.select` does not inherit `menuId` | **A0:** menu items inherit parent `menu.analyticsId` |
| **H2** | Row checkbox id still N events | Mute row chrome; defer `data.table.selection` |
| **H3** | `context.entity` as grid duplicates `gridId` | **Phase C redefined:** app objects (claim, policy) from host |
| **H4** | Privacy vs `filter.field` | Document `field` as schema id; sensitive column warning |
| **H5** | Registry schemas belong in Phase A | Optional property schemas in A; not required until migration |
| **H6** | `data.table.filter.apply` vs `data.table.filter` | Align `ANALYTICS-GUIDELINES.md` with registry (`data.table.filter`) |
| **H7** | A15/A16 are library-wide | Called out under A0; specs beyond grid |

### Facts corrected (was wrong in earlier draft)

| Earlier plan claim | Actual |
|--------------------|--------|
| Embedded paginator without `analyticsId` → only `data.table.page` | `ui.paginator.page` **still fires** (without `paginatorId`) |
| UI chrome is optional / ship later | Chrome **already emits** when port is provided |
| Event order after reorder: select → export → close always | DataSource export-all: select → close → **later** export |
| `source: 'toolbar'` in `writeExport()` | `exportData()` is public — `source` must be a parameter |
| Sample JSON `context.component.instanceId` | Port does not populate `instanceId` today |
| `{gridId}-export` always valid | Empty `analyticsId` → `-export` |
| A1+A2 alone yield `menuId` on `ui.menu.select` | Items do not inherit parent `menuId` without A0 |
| Phase B in `pixel-analytics` only | Must extend `PIXEL_UI_ANALYTICS` port first (`pixel-ui` cannot import `pixel-analytics`) |

---

## Phased implementation plan

Suggested order: **A0 → A → B → C → D** (all complete).

| Phase B correlation | **Done** | Port + menu interaction scopes |
| Phase C `context.entity` | **Done** | App domain objects via `setEntity()` |

**Effort:** A0 + A ≈ **3–5 days** (not 1–2) once mute API, menu inheritance, export outcome, and registry schemas are in scope.

---

### Phase A0 — Library prerequisites (do first)

**Goal:** Grid plan is implementable without broken ids, double emits, or missing `menuId` on select.

| # | Task | Location |
|---|------|----------|
| A0.1 | Add `analyticsDisabled` input (boolean) on `pixel-paginator`, `pixel-checkbox`, `pixel-menu`, `pixel-select`, `pixel-drawer` — when true, skip all analytics emits | respective components |
| A0.2 | `pixel-menu-item`: inherit parent menu `analyticsId` onto `ui.menu.select` as `menuId` (library change) | `pixel-menu-item.ts` + menu DI/context |
| A0.3 | `pixel-menu`: close `reason` — `select` \| `escape` \| `outside` \| `tab` \| `programmatic` (mirror `pixel-drawer`) | `pixel-menu.ts` |
| A0.4 | `pixel-menu-item`: emit `ui.menu.select` **before** `selected.emit()` | `pixel-menu-item.ts` |
| A0.5 | Extend `PIXEL_UI_ANALYTICS` port shape (optional fields only) for future correlation — **no** `pixel-ui` → `pixel-analytics` import | `pixel-ui-analytics.ts` + `pixel-ui-bridge.ts` |
| A0.6 | Specs for mute, menuId inheritance, close reason (library-wide, not grid-only) | component specs |

**Exit criteria:** Mute works; select includes inherited `menuId`; menu close includes `reason`; port extension documented but correlation still deferred.

---

### Phase A — Grid wiring (after A0)

**Goal:** Guarded chrome ids + enriched business events + registry optional schemas.

**Guard:** `const gid = analyticsId().trim(); if (!gid) { /* skip nested analyticsId bindings */ }`

#### A-export — Export menu (pilot)

| # | Task | Location |
|---|------|----------|
| A1 | Export `pixel-menu` → `[analyticsId]="gid + '-export'"` when `gid` set | `pixel-data-grid.html` |
| A2 | Export items → `[analyticsAction]="'export-' + format"` | `pixel-data-grid.html` |
| A3 | Export scope checkbox → `[analyticsId]="gid + '-export-selected-only'"` when `gid` set | `pixel-data-grid.html` |
| A4 | `writeExport(format, rows, options)` — add `scope`, `columnCount` (exportable visible columns), `hasActiveFilters`, parametric `source`, `outcome` (`success` \| `failure` \| `empty`), optional `partial` when fetch returns fewer rows than requested | `pixel-data-grid.ts` |
| A4b | `exportData(format, scope?, source?)` — pass `source` (`toolbar` \| `api` \| `row-action`); default `toolbar` from menu handler | `pixel-data-grid.ts` |
| A4c | Emit `data.export` after async success (excel blob, clipboard) where feasible; document attempt vs success | `writeExport()` |

#### A-filter — Column filter menus

| # | Task | Location |
|---|------|----------|
| A5 | Filter menu / selects — guarded ids: `{gid}-filter-{field}`, `-operator`, `-value` | `pixel-data-grid.html` |
| A6 | `data.table.filter` → add `filterType` from `column.filter.type` | `applyFilter()` |

#### A-column-menu — Header column options

| # | Task | Location |
|---|------|----------|
| A7 | Column menu + item `analyticsAction` values | `pixel-data-grid.html` |
| A8 | `data.table.sort` → `source: 'header' \| 'column-menu'`; align `additive` on menu path (`setColumnSort` vs `toggleSort`) | sort methods |
| A8b | Sort clear: use `direction: 'none'` or omit `direction` if `null` breaks `validateRegistry` | sort emit |

#### A-pagination — Mute embedded chrome

| # | Task | Location |
|---|------|----------|
| A9 | Embedded `pixel-paginator` → `[analyticsDisabled]="true"` | `pixel-data-grid.html` |
| A10 | Document: standalone paginator → `ui.paginator.page`; grid embed → **`data.table.page` only** | README + guidelines |

#### A-row-selection — Mute noisy chrome

| # | Task | Location |
|---|------|----------|
| A11 | Row selection `pixel-checkbox` → `[analyticsDisabled]="true"` | `pixel-data-grid.html` |
| A12 | Defer `data.table.selection` (counts/mode only, never row ids) | future |

#### A-columns-drawer — Manage columns panel

| # | Task | Location |
|---|------|----------|
| A13 | Columns `pixel-drawer` → `[analyticsId]="gid + '-columns'"` when `gid` set | `pixel-data-grid.html` |
| A13b | **Defer** `data.table.column.*` (pin / hide / reorder) unless product requires in A | note in plan |

#### A-cross-cutting

| # | Task | Location |
|---|------|----------|
| A14 | Optional registry property schemas for new `data.export` / `data.table.*` fields (not required) | `event-registry.ts` |
| A15 | Align `ANALYTICS-GUIDELINES.md`: `data.table.filter` (not `.apply`); confirm `data.export` vs `data.table.export` | guidelines |
| A16 | Docs samples split by scenario (filter / sort / export / page) | `docs-analytics-event-samples.ts` |
| A17 | Document `scope: 'page'` — public API only, not toolbar menu | README |
| A18 | Document `action` ↔ `format` mapping: `export-clipboard` ↔ `format: clipboard` | guidelines |
| A19 | Grid + library specs for mute, ids, outcome, sort `source` | specs |

**Exit criteria:**

- When `analyticsId` set: export/filter/column menus show `menuId` / `selectId` / `action`; select includes inherited `menuId`.
- When `analyticsId` empty: no broken `-export` ids; business events still emit without `gridId`.
- `data.export` includes `scope`, `columnCount`, `hasActiveFilters`, `source`, `outcome`.
- Embedded paginator muted; row checkboxes muted; only `data.table.page` for pagination.
- **No ingest dedup** of `ui.menu.select` when `data.export` exists — KPI in warehouse views (M1).
- `npm run build` + `npm test` pass.

---

### Phase B — Interaction correlation (**✅ done**)

**Prerequisite:** A0.5 port extension implemented and apps can pass shared `traceId` without `pixel-ui` importing `pixel-analytics`.

| # | Task | Owner area |
|---|------|------------|
| B1 | Interaction scope API in app/`pixel-analytics`; port forwards optional `context.correlation` | both packages |
| B2 | Overlapping scopes for nested overlays (filter menu + select + async export) — not a single menu wrap | design note |
| B3 | Optional `parentSpanId` on `PixelAnalyticsCorrelationContext` | `analytics.types.ts` |

**Exit criteria:** Related events can share `traceId` when host opts in; nested async export documented.

---

### Phase C — App domain entity context (**✅ done / redefined**)

**Do not** use `context.entity` to duplicate `gridId` / `menuId` / component identity — that collides with `properties.gridId` and warehouse dimensions.

| # | Task | Owner area |
|---|------|------------|
| C1 | `context.entity` reserved for **host-supplied app objects** (e.g. `type: "claim"`, `id: "CLM-42"`) via `PixelAnalyticsService.setContext()` or per-track override | `pixel-analytics` + app docs |
| C2 | Optional registry property schemas (if not done in A14) | `event-registry.ts` |
| C3 | Production: `withRouteTracking()` + `application.version` | app config docs |

**Removed:** ingest dedup of export `ui.menu.select` (lossy — reject per review M1).

**Removed:** `context.entity.type: "data-grid"` for grid/menu chrome (H3).

---

### Phase D — Governance (ongoing)

| # | Task |
|---|------|
| D1 | Contract tests for export, filter, mute, paginator dedup |
| D2 | `validateRegistry: true` in staging |
| D3 | Privacy checklist per new `data.*` property (incl. sensitive `field` names) |

---

## Proposed JSON (Phase A — after A0)

Placeholders for dynamic fields. **No `context.component.instanceId`** until the port supports it (B5). Phase B correlation samples omitted — deferred.

**Sync export order:** open → select → `data.export` → close. **DataSource export-all:** open → select → close → later `data.export`.

### 1. `ui.menu.open`

```json
{
  "id": "<uuid>",
  "name": "ui.menu.open",
  "category": "interaction",
  "timestamp": "<iso8601>",
  "schemaVersion": "1",
  "application": {
    "id": "docs-demo",
    "environment": "docs"
  },
  "identity": {
    "anonymousId": "<uuid>",
    "sessionId": "<uuid>"
  },
  "context": {
    "page": {
      "path": "/docs/services/analytics",
      "route": "/docs/services/analytics"
    },
    "component": {
      "name": "pixel-menu"
    },
    "correlation": {
      "traceId": "<32-char-hex>",
      "spanId": "<16-char-hex>"
    }
  },
  "properties": {
    "menuId": "docs-claims-grid-export"
  },
  "meta": {
    "consent": "granted",
    "sampled": true,
    "sdk": { "name": "pixel-analytics", "version": "0.0.1" }
  }
}
```

### 2. `ui.menu.select` *(requires A0.2 menuId inheritance)*

```json
{
  "id": "<uuid>",
  "name": "ui.menu.select",
  "category": "interaction",
  "timestamp": "<iso8601>",
  "schemaVersion": "1",
  "application": {
    "id": "docs-demo",
    "environment": "docs"
  },
  "identity": {
    "anonymousId": "<uuid>",
    "sessionId": "<uuid>"
  },
  "context": {
    "component": { "name": "pixel-menu-item" }
  },
  "properties": {
    "menuId": "docs-claims-grid-export",
    "action": "export-clipboard",
    "variant": "default"
  },
  "meta": {
    "consent": "granted",
    "sampled": true,
    "sdk": { "name": "pixel-analytics", "version": "0.0.1" }
  }
}
```

### 3. `data.export` (primary business event)

```json
{
  "id": "<uuid>",
  "name": "data.export",
  "category": "data",
  "timestamp": "<iso8601>",
  "schemaVersion": "1",
  "application": {
    "id": "docs-demo",
    "environment": "docs"
  },
  "identity": {
    "anonymousId": "<uuid>",
    "sessionId": "<uuid>"
  },
  "context": {
    "component": { "name": "pixel-data-grid" }
  },
  "properties": {
    "gridId": "docs-claims-grid",
    "format": "clipboard",
    "scope": "all",
    "rowCount": 3,
    "columnCount": 3,
    "hasActiveFilters": false,
    "source": "toolbar",
    "outcome": "success"
  },
  "meta": {
    "consent": "granted",
    "sampled": true,
    "sdk": { "name": "pixel-analytics", "version": "0.0.1" }
  }
}
```

### 4. `ui.menu.close` *(requires A0.3 close `reason`)*

```json
{
  "id": "<uuid>",
  "name": "ui.menu.close",
  "category": "interaction",
  "timestamp": "<iso8601>",
  "schemaVersion": "1",
  "application": {
    "id": "docs-demo",
    "environment": "docs"
  },
  "identity": {
    "anonymousId": "<uuid>",
    "sessionId": "<uuid>"
  },
  "context": {
    "component": { "name": "pixel-menu" }
  },
  "properties": {
    "menuId": "docs-claims-grid-export",
    "reason": "select"
  },
  "meta": {
    "consent": "granted",
    "sampled": true,
    "sdk": { "name": "pixel-analytics", "version": "0.0.1" }
  }
}
```

---

## Property variants (Phase A)

### Export selected rows only

```json
{
  "name": "ui.menu.select",
  "properties": {
    "menuId": "docs-claims-grid-export",
    "action": "export-csv",
    "variant": "default"
  }
}
```

```json
{
  "name": "data.export",
  "properties": {
    "gridId": "docs-claims-grid",
    "format": "csv",
    "scope": "selected",
    "rowCount": 2,
    "columnCount": 3,
    "hasActiveFilters": true,
    "source": "toolbar",
    "outcome": "success"
  }
}
```

> Prefer `hasActiveFilters` as the primary flag; add `activeFilterCount` only if product needs both.

### Export CSV to file

```json
{
  "name": "data.export",
  "properties": {
    "gridId": "docs-claims-grid",
    "format": "csv",
    "scope": "all",
    "rowCount": 3,
    "columnCount": 3,
    "hasActiveFilters": false,
    "source": "toolbar"
  }
}
```

---

## Phase B — Correlation (**✅ done**)

See Phase B above. Port extension (A0.5) + `PixelAnalyticsInteractionService` + root `pixel-menu` scopes.

---

## Phase C — App domain `context.entity` (**✅ done / redefined**)

**Not** for grid/menu/component identity — use `properties.gridId`, `menuId`, and `context.component.name` instead.

Reserve `context.entity` for **host-supplied business objects** the app sets via analytics context:

```json
"context": {
  "component": { "name": "pixel-data-grid" },
  "entity": {
    "type": "claim",
    "id": "CLM-42"
  }
}
```

Apps map `entity.type` to their domain (claim, policy, account). Pixel UI does not auto-stamp `data-grid` here — that would duplicate `gridId` and pollute warehouse entity dimensions (review H3).

---

## Today vs proposed (summary)

| Field | Today (live capture) | Phase A proposed |
|-------|----------------------|------------------|
| `ui.menu.open.properties` | `{}` | `{ "menuId": "docs-claims-grid-export" }` |
| `ui.menu.select.properties` | `{ "variant": "default" }` | `{ "menuId", "action": "export-clipboard", "variant" }` |
| `data.export.properties` | `gridId`, `format`, `rowCount` | + `scope`, `columnCount`, `hasActiveFilters`, `source` |
| `ui.menu.close.properties` | `{}` | `{ "menuId", "reason": "select" }` |
| Event order | export → select → close (sync) | select → export → close (sync); DataSource: select → close → later export |
| `correlation.traceId` | Different per event | **Shared within menu interaction (B)** |

---

## Warehouse modeling

### Primary fact table

**Event:** `data.export`

**Dimensions:**

- `gridId`
- `format` (`csv` | `json` | `excel` | `clipboard`)
- `scope` (`all` | `selected` | `page`)
- `rowCount`, `columnCount` (exportable visible columns)
- `hasActiveFilters`, `outcome`, `source`
- `context.page.path` / `application.environment`

**Action ↔ format mapping:** `ui.menu.select.action` `export-clipboard` ↔ `data.export.format` `clipboard` (strip `export-` prefix).

### Secondary (UX diagnostics)

**Events:** `ui.menu.open`, `ui.menu.select`, `ui.menu.close`

**Use for:** menu abandonment (open without export), format discovery via `action`.

**Do not** build export KPIs on menu open/close alone. **Do not** drop `ui.menu.select` in ingest when `data.export` exists — model KPIs in warehouse views (M1).

### Join keys

| Phase | Key |
|-------|-----|
| Interim | `identity.sessionId` + timestamp window |
| Phase B+ | `context.correlation.traceId` |
| Phase A+ | `properties.menuId` + `properties.action` aligned with `data.export.format` |

---

## Privacy constraints (do not regress)

- Never emit row cell values, filter query text, or column labels in analytics properties.
- `data.table.filter` **does** emit `field` — treat it as a **column schema id**, not display text. Avoid binding sensitive keys (`email`, `ssn`, `dob`) as `column.field` if analytics is enabled, or document the risk for app authors.
- `hasActiveFilters` only — not filter values. Prefer `hasActiveFilters` over `activeFilterCount` unless both are needed.
- Clipboard export: `format: "clipboard"` is sufficient; never log clipboard payload.
- Menu `action` uses semantic ids (`export-clipboard`), not visible menu labels.
- Row selection: mute per-row `ui.checkbox.toggle`; future `data.table.selection` uses counts/mode only, never row ids.

---

## Review checklist

| Decision | Status | Notes |
|----------|--------|-------|
| Dual-layer model (`data.*` vs `ui.*`) | **Approve** | Chrome already fires; A adds ids + mute |
| Phase A0 (`analyticsDisabled`, menuId inheritance, close `reason`) | **Approve** | Prerequisite |
| Phase A chrome ids (guarded by `gridId`) | **Approve after A0** | B6 |
| Id pattern `{gridId}-export` / `-filter-{field}` | **Approve when gridId set** | |
| New `data.export` fields + `outcome` | **Approve** | `source` parametric (B4) |
| Embedded paginator = only `data.table.page` | **Approve via mute** | Not via omitting `analyticsId` (B1) |
| Row selection chrome | **Mute now** | Defer `data.table.selection` (H2) |
| Phase B correlation | **Done** | Menu interaction scopes + port |
| Phase C `context.entity` for grid/menu | **Reject / redefine** | App domain objects only (H3) — use `setEntity()` |
| Ingest dedup of `ui.menu.select` | **Reject** | M1 |
| Docs samples split by scenario | **Approve** | A16 |
| `data.table.column.*` / `group.*` | **Defer** | M3 |
| Align `ANALYTICS-GUIDELINES.md` naming | **Approve** | H6 (`data.table.filter`) |

---

## Lifecycle

When Phase A0/A is implemented and stable:

1. Mark phases ✅ in this file with completion dates.
2. Move lasting contracts into `pixel-data-grid` / `pixel-menu` READMEs and `ANALYTICS-GUIDELINES.md`.
3. Close [PLAN-EXPORT-ANALYTICS-REVIEW.md](./PLAN-EXPORT-ANALYTICS-REVIEW.md) when blockers/highs are implemented in code.
4. Delete this file when all approved phases are done (git keeps history).
