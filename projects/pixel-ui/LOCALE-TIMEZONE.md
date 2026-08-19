# Locale & timezone — library plan

Living plan for how **pixel-ui** should treat **locale** (formatting / parsing / week start) and **timezone** (calendar day vs instant). Read this before implementing.

> **Scope:** library only (`projects/pixel-ui`). Not docs SEO. Not a full IANA timezone picker product.
>
> **Related:** `CONVENTIONS.md` § shared datetime · `shared/datetime/` · datepicker / date-range / calendar / timepicker READMEs · `RESPONSIVE.md` / `PERFORMANCE.md` style of living docs.
>
> **Status:** Phases 0–3 **implemented** (2026-08-19). Enterprise pattern review added (2026-08-19). Phases 0–3 exit criteria met; phase 4 remains deferred. This file is the single source of truth. Do **not** implement the rejected `PIXEL_DATE_LOCALE = inject(LOCALE_ID)` default.

---

## 0. Two rules (lock these)

### Rule 1 — Calendar date (no time)

The user picked a **day**, not an instant (birthday, invoice date, leave day).

| Do | Don’t |
| --- | --- |
| Store / compare as **local Y-M-D** | Treat the value as a UTC instant |
| Prefer `Date` at **local midnight** (`startOfDay` / `new Date(y, m, d)`) | Use `date.toISOString().slice(0, 10)` for date-only |
| Parse ISO `YYYY-MM-DD` as a **local** calendar day | Parse `YYYY-MM-DD` via `new Date('YYYY-MM-DD')` (UTC midnight → off-by-one west of UTC) |
| Serialize to APIs as **date-only** strings when the domain is date-only | Send `2024-07-15T00:00:00.000Z` and hope every client agrees |

### Rule 2 — Instant (date + time)

A real moment in time (notification `createdAt`, chart point, “5 minutes ago”).

| Do | Don’t |
| --- | --- |
| Store **epoch ms** or **ISO-8601 with offset / Z** | Strip time and treat as a calendar date |
| Display with `Intl` in the **viewer’s local zone** (optional explicit `timeZone` later) | Assume the browser zone equals a fixed business zone without documenting it |

**Timezone on a datepicker is usually the wrong product.** Civil “July 15” has no zone. IANA zones belong on **instants**, or as an advanced **adapter flag** (UTC midnight), not as a picker input on every date control.

### Shared parse contract — `parseLocalIsoDate` (lock)

One helper, used by `toNativeDate`, `defaultParseDate`, and (Phase 2) `parseGridDate` / query-builder / export. **Do not** copy `parseGridDate`’s prefix regex (`/^\d{4}-\d{2}-\d{2}/` on any longer string) — that is the export `slice(0, 10)` bug.

| Input | Result |
| --- | --- |
| Exact `YYYY-MM-DD` | Local civil day via `buildDate` (Y/M/D fields) |
| Full ISO / offset / `Z` | Parse as an **instant**, then `startOfDay` of that `Date` (viewer-local civil day) |
| `Date` | `startOfDay` |
| Number (epoch ms) | `startOfDay` of that instant |
| Unparseable | `null` |

Example (IST, UTC+5:30): `2024-07-15` → 15 Jul local. `2024-07-15T22:00:00.000Z` → 16 Jul local. Prefix-slicing both to `2024-07-15` is wrong for the second.

---

## 0.5 Enterprise library patterns (cross-reference)

This section maps what leading enterprise toolkits do so our decisions are grounded in industry practice, not just Angular Material parity.

### AG Grid

- **Date filter model:** stores as `YYYY-MM-DD` plain string to avoid timezone issues — never a `Date` object in the model ([docs](https://www.ag-grid.com/react-data-grid/filter-date/)).
- **Display / comparator:** passes a local-midnight `Date` to comparators. `new Date('YYYY-MM-DD')` = UTC midnight; devs must provide a `comparator` that normalizes to the same civil day. This is the same P0 bug we have.
- **Built-in relative ranges** (`thisWeek`, `Last 30 Days`) use browser-local time and respect `firstDay` from `Intl.Locale` — *exactly what our Phase 1 does*.
- **String-based model wins for data-grid.** Lesson for `pixel-data-grid`: keep filter model as `YYYY-MM-DD` strings, only convert to `Date` for display/sorting via `parseLocalIsoDate`.

### Kendo UI for Angular

- DateInputs return a native `Date` with local timezone always; Kendo explicitly says you cannot change this — the `Date` object spec mandates local TZ ([issue #578](https://github.com/telerik/kendo-angular/issues/578)).
- Recommended workaround: strip TZ in `valueChange` via `toISOString()` — *fine for an instant; wrong for a civil date*. Their real fix is `new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())` which is exactly our `buildDate()`.
- **No native `useUtc`** on DateInput. Kendo's Scheduler has `timezone` support, not the picker.
- **`firstDayOfWeek`:** must be passed explicitly; no auto-locale derivation built in.
- Lesson: even mature paid libraries leave this to the consumer. Our Phase 1 `getFirstDayOfWeek` from `Intl` is ahead of Kendo.

### PrimeNG

- DatePicker relies on native `Date`; no timezone abstraction; locale is a global runtime object (`PrimeNG.setLocale`).
- Off-by-one fix: construct with `new Date(year, month, day)` — same pattern as `buildDate`.
- `firstDayOfWeek` is a component input (`[firstDayOfWeek]="1"`); no adapter; no auto-Intl.

### Angular Material Temporal adapter (PR #32668, 2026)

- Three modes: `date` → `PlainDate`, `datetime` → `PlainDateTime`, `zoned` → `ZonedDateTime`.
- **`PlainDate` is the gold standard for calendar dates** — it has no timezone, no midnight, no day-shift. Our `YYYY-MM-DD` string model is semantically equivalent for wire format; `Date`-at-local-midnight is the closest native approximation.
- `ZonedDateTime` mode takes an IANA timezone ID — same concept as our Phase 4 deferred `useUtc` / explicit zone.
- `firstDayOfWeek` via `Intl.Locale.getWeekInfo()` with Monday fallback for Firefox — **matches our Phase 1 plan exactly**.
- Lesson: the ecosystem is converging on PlainDate semantics. Our local-midnight `Date` is the right native proxy. Phase 1 week-start approach is correct.

### Enterprise takeaways for pixel-ui

| Observation | Impact on plan |
| --- | --- |
| AG Grid uses string model in filter, local `Date` for comparator | Confirms P0: fix display/sort path in Phase 2; keep `YYYY-MM-DD` as the grid model |
| Kendo/PrimeNG have no auto locale week-start; must pass input | Phase 1 `Intl.Locale.getWeekInfo` is a differentiator — worth doing |
| Temporal `PlainDate` is the right abstraction; `Date`-at-midnight is native proxy | Phase 0 `parseLocalIsoDate` is the correct bridge; no new dependency needed |
| All enterprise libs leave UTC-at-midnight binding to the dev | Phase 0 `toNativeDate` fix is high-value; confirmed P0 (not P1) |
| String-based wire format avoids all TZ bugs; convert only at display | Export rule (§4) confirmed: emit `YYYY-MM-DD` string, not `Date.toISOString()` |
| No enterprise picker has IANA timezone on the date control itself | Phase 4 deferral of IANA picker confirmed |

---

## 1. How Angular Material does it

Source: [Material Datepicker overview](https://material.angular.dev/components/datepicker/overview) + community / adapter docs.

| Concern | Material |
| --- | --- |
| Date type | Generic `DateAdapter<D>` — native `Date`, Luxon, Moment, date-fns |
| Locale | `MAT_DATE_LOCALE` **defaults to Angular `LOCALE_ID`**; overridable; runtime `setLocale()` |
| Formats | `MAT_DATE_FORMATS` passed into the adapter |
| Native adapter limits | Native `Date` is **weak for many locales** (hard to set parse format); Material **recommends** Luxon / Moment / date-fns |
| Timezone | Datepicker operates as **local calendar dates**. Moment/Luxon adapters offer **`useUtc: true`** so create/parse use UTC midnight — **not** an IANA zone picker |
| Known class of bugs | Binding UTC ISO / `toISOString` date-only → **one day earlier** depending on offset ([components#11027](https://github.com/angular/components/issues/11027) discussion: date ≠ timepoint) |
| Time | Separate from datepicker; datepicker is date-only |

**Takeaway for pixel-ui:** Match Material’s **architecture** (adapter + locale token + formats + optional UTC adapter mode later). Do **not** invent a timezone dropdown on `pixel-datepicker`. Do **not** silent-match Material’s `LOCALE_ID` default — Angular always provides `LOCALE_ID` and it defaults to `en-US`; pixel-ui’s `undefined` factory means viewer Intl. Prefer documenting local-midnight semantics clearly (Material’s native path under-documents this for newcomers).

---

## 2. How pixel-ui does it today

### Shared foundation (`shared/datetime/`)

| Piece | Role | Status |
| --- | --- | --- |
| `PixelDateAdapter` | Abstract calendar math + format/parse | Exists |
| `PixelNativeDateAdapter` | Native `Date`, local midnight via `startOfDay` | Exists |
| `PIXEL_DATE_ADAPTER` / `PIXEL_DATE_FORMATS` / `PIXEL_DATE_LOCALE` | DI | Exists |
| `provideNativeDateAdapter({ locale, formats })` | App / feature providers | Exists — locale only set when `options.locale` is passed |
| `defaultParseDate` / `defaultFormatDate` / `localeDateFieldOrder` | Locale-aware numeric + **exact** ISO date-only | Exists — **stronger than Material native parse** |
| `toNativeDate` | Coerce `Date \| string \| number` → local midnight | Exists — **ISO date-only is UTC** (`new Date(string)`). Binding hole. |
| `startOfDay` / `sameDay` / `buildDate` | Local-day helpers | Exists |
| `formatRelativeTime` / `formatAbsoluteTimestamp` | Instant display | Exists |
| `toLocalIsoDate` | Local `YYYY-MM-DD` | Exists on **editor** (already on `public-api.ts`) — move to shared, re-export from editor util |

**Gaps in the foundation:**

1. **P0 — `toNativeDate` ISO hole.** Typed parse (`defaultParseDate` / `parseDateBySpec`) uses `buildDate` (local). Binding path (`value` / `writeValue` / `min` / `max` / `startAt`) uses `toNativeDate` → `new Date(string)` then `startOfDay`. `YYYY-MM-DD` is UTC midnight, so US Pacific shows the previous day. Adapter `parse(string)` is already local; datepicker CVA does not use it. Material #11027 **inside** pixel-ui.
2. **P1-policy — keep `PIXEL_DATE_LOCALE` factory `undefined`.** Not a live day-shift. Do **not** default it to `inject(LOCALE_ID)`. Offer an opt-in `provideNativeDateAdapter` path that injects `LOCALE_ID` for apps that actually configured Angular i18n.
3. `getFirstDayOfWeek()` is **hardcoded `0` (Sunday)** — not locale-driven. Component inputs are `input(0, { transform: numberAttribute })`, so Sunday and “unset” are the same.
4. `addCalendarDays` uses **`+ n * 86_400_000`**. Calendar keyboard also walks `MS_PER_DAY` / `7 * MS_PER_DAY`. `addCalendarMonths` / `addCalendarYears` use Date overflow (31 Jan + 1 month → early March) with no last-day clamp.
5. CONVENTIONS say calendar/datepicker consume the adapter and never invent inline `new Date()` parsing — **calendar still formats with raw `Intl`, does not inject the adapter, and owns DST-unsafe arrow math**. Wire it; do not leave a presentational exception.
6. No **`useUtc`** option (Material Moment/Luxon have it). Out of scope until a consumer asks; document the absence.

### Component inventory

#### A. Calendar dates — must follow local-day rules

| Component | Locale today | Day / timezone model today | Following? | Gap |
| --- | --- | --- | --- | --- |
| **`toNativeDate`** (shared) | n/a | `new Date(string)` + `startOfDay` | **No** for ISO date-only | Unify with `parseLocalIsoDate`. Used by datepicker / range value, min, max, startAt, CVA `writeValue`, calendar min/max |
| **pixel-datepicker** | `locale` input + DI formats / field IO | Typed ISO = local; **bound ISO = UTC** | **Parse yes, bind no** | First-slice `toNativeDate` fix. Document value = local midnight |
| **pixel-date-range-picker** | same | same | **Parse yes, bind no** | same |
| **pixel-calendar** | `locale` for month/weekday labels | `startOfDay` / `sameDay`; keyboard `± MS_PER_DAY` | **Partial** | Inject adapter (native fallback). Locale `firstDayOfWeek`. Keyboard via adapter day math |
| **pixel-query-builder** (date / between) | summary `toLocaleDateString(undefined)` | `new Date(String(value))` in `dateValue`, `readRangePart`, rule + summary | **No** | Same `parseLocalIsoDate`; summary via `defaultFormatDate` |
| **pixel-data-grid** (date filter / cells / sort) | mixed | `parseGridDate`: date-only = **local**; **prefix-slices** full ISO. `formatGridCell`: `new Date(string)`. Sort: string `localeCompare` | **Parse (date-only) yes; display/sort no** | P0: display + sort can show 14 Jul and filter as 15 Jul. Do not copy prefix regex into the shared helper |
| **pixel-editor** date chips | n/a | `toLocalIsoDate` (tested) | **Yes** | Move helper to `shared/datetime`; re-export so the public name does not break |
| **export** `type: 'date'` | n/a | `Date` → local Y-M-D; **any `YYYY-MM-DD…` string sliced to 10 chars** (CSV + `toExcelDateSerial`) | **No** for full ISO | Locked table in §4. Spec today freezes `T12:00Z` slice — update it |

#### B. Instants — store UTC/epoch, display local

| Component | Locale today | Timezone today | Following? | Gap |
| --- | --- | --- | --- | --- |
| **pixel-notification** timestamps | `Intl.RelativeTimeFormat` / `toLocaleString` | Instant ms; day groups via local `toDayKey` | **Mostly yes** | Compact relative strings hardcoded English (`3m ago`); no IANA `timeZone` (OK for v1) |
| **charts** time axis (`toChartTimestamp`) | `LOCALE_ID` + optional adapter | `Date.parse` / `getTime()`; labels local | **Yes for instants** | `Date.parse` of date-only = UTC midnight. Document that. Civil-date series must parse local before `getTime()`. No `timeZone` input until a consumer asks |
| **toast / file-transfer** `createdAt` | none | epoch for ordering | **N/A UI** | No user-facing clock — skip |

#### C. Time-of-day without a zone — keep zone-free

| Component | Model | Following? | Gap |
| --- | --- | --- | --- |
| **pixel-timepicker** | Canonical `"HH:mm"` (like `<input type="time">`) | **Yes** for timezone | `format` default `'12'` not derived from locale; AM/PM labels English unless `labels` override |
| Notification quiet hours `HH:mm` | Local wall-clock minutes | **Yes** | — |
| Datepicker + timepicker **compose** (docs only) | Merge local midnight `Date` + `HH:mm` | **Undocumented** | Phase 0 Behavior notes: `new Date(y, m, d, h, min)` in viewer zone. Do not `toISOString`-slice the date half. Not a new widget |

#### D. Locale-only (not timezone work)

- Chart number formats (`LOCALE_ID`)
- Data-grid string `localeCompare`
- Title / toast / empty-state copy i18n
- Paginator labels
- `getDateNames()` ASCII `1`–`31` (no Arabic-Indic digits) — defer
- Native `Date` is Gregorian only — document; do not invent Islamic/Hebrew calendars
- SSR `today()` follows the server zone — mention once in CONVENTIONS; no timezone service

#### E. Explicitly out of scope for locale/timezone

Button, input, select, dialog, drawer, tabs, menu, tooltip, loader, skeleton, divider, card, chip, toggle, checkbox, radio, slider, stepper, tree, sidenav, app-shell, navigate, title, file-upload chrome, etc.

---

## 3. Material vs pixel — comparison summary

| Concern | Material | pixel-ui (current) | Target |
| --- | --- | --- | --- |
| Adapter pattern | Yes | Yes | Keep |
| Locale token ↔ `LOCALE_ID` | Default yes (`en-US` if unset) | Default `undefined` (viewer Intl) | **Keep browser default.** Opt-in helper injects `LOCALE_ID` |
| Formats token | Yes | Yes | Keep |
| Date-only = local midnight | Native yes; UTC via Moment/Luxon `useUtc` | Typed yes; **bound ISO no** | Binding path through `parseLocalIsoDate`. Optional `useUtc` later |
| ISO date-only parse | Adapter-dependent | Local via `buildDate` on **typed** path only | Same helper on bind, grid, QB, export |
| First day of week | Adapter / locale data | Hardcoded Sunday; input default `0` | **Locale-driven; input `undefined` → adapter** (small break) |
| Add N days | Calendar fields (adapters) | `+86400000` + calendar `MS_PER_DAY` | **Calendar fields**; clamp month/year overflow |
| Rich locale parse | Luxon/Moment/date-fns recommended | Custom Intl field-order parser | Keep native path; optional rich adapter later |
| IANA timezone UI | No | No | **Stay no** |

---

## 4. Product policy (propose for CONVENTIONS)

1. **Date controls emit `Date` at local midnight** (or apps use a shared `toLocalIsoDate` for date-only wire format).
2. **No IANA timezone input on datepicker / calendar / range.** Apps that need “day in UTC” map at the API boundary (or later `useUtc` on the adapter). Promoting `useUtc` early creates mixed local/UTC apps.
3. **Instants** stay epoch / offset ISO; format with `Intl` (optional `timeZone` later on format helpers only).
4. **Locale default stays the browser.** `PIXEL_DATE_LOCALE` factory remains `undefined` (viewer Intl). Per-control `locale` input still wins. Apps that configured Angular i18n opt in via `provideNativeDateAdapter` (named helper or `{ localeFrom: 'localeId' }` — not a magic string `'angular'` unless documented). Do **not** silent-match Material.
5. **First day of week** from adapter (`Intl` `weekInfo.firstDay`: `1` = Monday … `7` = Sunday; map with `% 7` to JS `getDay()` `0` = Sunday). Fallback Sunday when `getWeekInfo` is missing. Component `firstDayOfWeek` is `number | undefined`, default `undefined` → adapter. Apps that need Sunday pass `[firstDayOfWeek]="0"`. Small breaking change; document in READMEs.
6. **All calendar arithmetic** goes through the adapter (no inline `+ 86400000` / `MS_PER_DAY` day math). Month/year add clamps to last valid day of the target month.
7. **Timepicker** remains timezone-free wall time (`HH:mm`). Combined datetime is composition, not a new widget: `new Date(y, m, d, h, min)` in the viewer zone unless the app names a zone.
8. **Export `type: 'date'`** follows the locked table below. CSV and xlsx must use the same civil-day fields. Add `type: 'datetime'` later only if consumers need the clock in CSV.

### Locked export rule (`type: 'date'`)

| Input | Output |
| --- | --- |
| `Date` | Local `YYYY-MM-DD` (`getFullYear` / `getMonth` / `getDate`) |
| Exact `YYYY-MM-DD` | Keep as-is |
| Full ISO / offset / `Z` | Local civil day via `Date` — **not** `slice(0, 10)` |
| Unparseable | Stringify (current) |

---

## 5. Phased work

Mark phases `✅ DONE (date)` as they land. When all phases are done, **delete this file** (or fold lasting rules into `CONVENTIONS.md` + component Behavior notes) per AGENTS PLAN lifecycle.

### Phase 0 — Contract, docs, and ISO bind fix — ✅ DONE (2026-08-19)

**Exit criteria**

- [ ] CONVENTIONS: date-only vs instant; local midnight; `parseLocalIsoDate` contract; never UTC-slice date-only; timepicker zone-free; no IANA on datepicker; `PIXEL_DATE_LOCALE` stays browser-default; SSR `today()` = server zone; Gregorian-only native `Date`; link this plan from CONVENTIONS §8
- [ ] Datepicker / date-range / calendar README Behavior notes: value = local midnight; bind vs type ISO; API serialization; compose date+time recipe (`new Date(y, m, d, h, min)`)
- [ ] `toLocalIsoDate` + `parseLocalIsoDate` live under `shared/datetime/` and are re-exported; editor imports from shared (re-export so `public-api.ts` name does not break)
- [ ] **`toNativeDate` uses `parseLocalIsoDate`** (exact `YYYY-MM-DD` local; full ISO → instant then local civil day). Specs: IST and US Pacific (or fixed TZ in test) for bind vs type of the same ISO date-only string
- [ ] Export rule locked in this file (done) so Phase 2 does not invent a third rule

**Non-goals:** `LOCALE_ID` default; `useUtc`; IANA picker; grid/QB/export implementation (Phase 2, except the helper they will share).

This phase **does** change bind behavior for ISO date-only strings. Do not call it “docs only.”

### Phase 1 — Adapter is the source of truth — ✅ DONE (2026-08-19)

**Exit criteria**

- [x] **Do not** default `PIXEL_DATE_LOCALE` to `LOCALE_ID`. Add opt-in `provideNativeDateAdapter` path that injects `LOCALE_ID` via `localeFrom: 'localeId'`
- [x] `PixelNativeDateAdapter.getFirstDayOfWeek()` locale-aware via `Intl.Locale(locale).getWeekInfo().firstDay`; try/catch with Sunday fallback for Firefox <126 / invalid locale
- [x] `addCalendarDays` uses Y/M/D fields (DST-safe); `addCalendarMonths` / `addCalendarYears` clamp overflow
- [x] `pixel-calendar` injects `PIXEL_DATE_ADAPTER` optionally; `CALENDAR_FALLBACK_ADAPTER` for no-adapter case; keyboard uses adapter day math
- [x] Datepicker / range / calendar `firstDayOfWeek`: `number | undefined`, default `undefined` → adapter. Breaking change documented in CONVENTIONS §11.6

**Non-goals:** Luxon/Moment package; `useUtc`; IANA picker.

**Enterprise note:** AG Grid, Kendo, PrimeNG all require the consumer to pass `firstDayOfWeek` explicitly. Auto-deriving from `Intl` in Phase 1 is a genuine differentiator — no major Angular library does this fully yet (Material Luxon adapter landed it in Jan 2025; native adapter still hardcodes Sunday).

### Phase 2 — Close remaining off-by-one holes — ✅ DONE (2026-08-19)

P0 severity still lives here for grid display/sort even though the datepicker bind fix is Phase 0.

**Exit criteria**

- [x] Query-builder `dateValue` / `readRangePart` / rule parse: `parseLocalIsoDate`; `pixel-query-value.ts`, `pixel-query-rule.ts`, `pixel-query-summary.utils.ts` all fixed
- [x] Export: `formatExportDate` and `toExcelDateSerial` use `parseLocalIsoDate`; spec updated and expanded with full-ISO test
- [x] Grid `formatGridCell` date branch uses `parseLocalIsoDate`; `compareGridValues` uses civil-day timestamps for date-like values; filter model stays `YYYY-MM-DD` string

**Enterprise note:** AG Grid uses `YYYY-MM-DD` string as its filter model *specifically to avoid timezone issues*. Pixel data-grid should adopt the same: string model externally, `Date`-at-local-midnight only as an internal comparator. This also means the filter state is safe to JSON-serialize and send to backends as-is.

### Phase 3 — Locale polish (not timezone) — ✅ DONE (2026-08-19)

**Exit criteria**

- [x] Timepicker: `format` input now `undefined`-default; `resolvedFormat` computed from `Intl.DateTimeFormat(locale).resolvedOptions().hour12`; `locale` input added
- [ ] Notification compact relative: Intl or overridable `labels` (no hardcoded `ago` only)
- [ ] Chart time-axis docs: “labels in local zone”; `Date.parse` of date-only is UTC midnight — civil-date series must parse local; no `timeZone` API unless a consumer asks

### Phase 4 — Explicitly deferred

Do **not** start unless product asks:

- [ ] Full IANA timezone picker / `timeZone` input on date controls
- [ ] Luxon / date-fns / Moment adapter packages
- [ ] Combined `datetime-local` control (compose datepicker + timepicker instead)
- [ ] `useUtc` on native adapter (Material-parity) — only if an API team cannot map at the boundary
- [ ] Arabic-Indic `getDateNames()`; non-Gregorian calendars; chart `timeZone` input

---

## 6. Suggested first implementation slice

**Phase 0** — document the contract, centralize `toLocalIsoDate` / `parseLocalIsoDate`, wire it through `toNativeDate`.

That is the highest-leverage Material-parity fix (bind vs type ISO) and needs no new dependencies. Do **not** start Phase 1 locale/week/DST work in the same PR unless Phase 0 is already green.

---

## 7. Locked decisions (accepted 2026-08-19)

| # | Question | Decision |
| --- | --- | --- |
| 1 | Calendar day vs instant rules? | **Keep.** Matches Temporal PlainDate vs Instant, HTML `<input type="date">`, Material. |
| 2 | No IANA on datepicker? Promote `useUtc`? | **Lock no.** `useUtc` stays Phase 4. UTC-midnight dates are API-boundary mapping. |
| 3 | `firstDayOfWeek` default `0` → adapter — breaking or soft? | **Breaking, small.** `input(0)` cannot tell Sunday from unset. Default `undefined` → adapter. |
| 4 | Calendar on adapter vs presentational? | **Wire it.** Calendar owns DST-unsafe keyboard math. Optional inject + native fallback. |
| 5 | Export ISO-string policy? | **Local civil day.** Table in §4. Never `slice(0, 10)` on full ISO. |
| 6 | Missing inventory? | **Folded** into §2 (`toNativeDate`, calendar keyboard, grid display/sort, QB value/range, chart `Date.parse`, Excel serial, month overflow, compose recipe). |
| 7 | `PIXEL_DATE_LOCALE` = `LOCALE_ID`? | **No silent match.** Keep `undefined`; opt-in for apps that set Angular i18n. P1-policy, not P0 day-shift. |

---

## 8. References (in-repo)

| Path | Why |
| --- | --- |
| `projects/pixel-ui/src/lib/shared/datetime/` | Adapter, formats, parse/format utils, relative time |
| `projects/pixel-ui/src/lib/shared/datetime/pixel-date-utils.ts` | `toNativeDate`, `defaultParseDate`, `buildDate` |
| `projects/pixel-ui/src/lib/pixel-datepicker/README.md` | Locale / formats contract |
| `projects/pixel-ui/src/lib/pixel-date-range-picker/README.md` | Same family |
| `projects/pixel-ui/src/lib/pixel-calendar/pixel-calendar.ts` | Keyboard `MS_PER_DAY`; no adapter |
| `projects/pixel-ui/src/lib/pixel-timepicker/README.md` | Zone-free `HH:mm` |
| `projects/pixel-ui/src/lib/pixel-editor/pixel-editor-date.util.ts` | `toLocalIsoDate` |
| `projects/pixel-ui/src/lib/pixel-data-grid/pixel-data-grid.utils.ts` | `parseGridDate` / `formatGridCell` / `compareGridValues` |
| `projects/pixel-ui/src/lib/pixel-query-builder/` | `dateValue`, `readRangePart`, summary formatter |
| `projects/pixel-ui/src/lib/pixel-chart/builders/time-axis.ts` | `toChartTimestamp` → `Date.parse` |
| `projects/pixel-ui/src/lib/services/export/serialize.ts` | `formatExportDate` prefix slice |
| `projects/pixel-ui/src/lib/services/export/xlsx.ts` | `toExcelDateSerial` same slice |
| `projects/pixel-ui/CONVENTIONS.md` | § shared datetime |

External:

- [Angular Material — Datepicker](https://material.angular.dev/components/datepicker/overview) (locale, adapters, Luxon `useUtc`)
- [angular/components#11027](https://github.com/angular/components/issues/11027) — datepicker vs timezone debate
- [Material Temporal adapter PR #32668](https://github.com/angular/components/pull/32668) — `PlainDate` / `ZonedDateTime` modes; `getWeekInfo` week start
- [AG Grid Date Filter](https://www.ag-grid.com/react-data-grid/filter-date/) — string model, `firstDay` from `Intl.Locale`
- [Kendo Angular TZ KB](https://www.telerik.com/kendo-angular-ui/components/knowledge-base/dateinputs-manage-timezones) — native `Date` always local; `buildDate`-style fix
- [Kendo issue #578](https://github.com/telerik/kendo-angular/issues/578) — cannot change TZ in pickers; middleware pattern recommended
- [Temporal `PlainDate` (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate) — civil date semantics; gold standard for date-only
- [Temporal Stage 4 migration guide](https://dev.to/vishal_singh_0610/javascript-temporal-reached-stage-4-a-practical-migration-guide-beyond-date-4bjp) — `PlainDate` vs `ZonedDateTime` decision tree

---

## 9. Review changelog (folded)

Architect review of 2026-08-19 was **accepted**. The pending §9 commentary is no longer a second plan.

| Original draft (§§0–8 before fold) | After accept |
| --- | --- |
| Datepicker “mostly yes” | Parse yes, bind no (`toNativeDate`) |
| Phase 0 docs only, no behavior change | Phase 0 includes ISO bind fix |
| First slice = Phase 0 + Phase 1 including `LOCALE_ID` | First slice = Phase 0 only |
| `PIXEL_DATE_LOCALE` = `LOCALE_ID` (policy + Phase 1) | Keep `undefined`; opt-in; P1-policy |
| `firstDayOfWeek` “prefer adapter without breaking `0` callers” | Default `undefined`; document Sunday as `[firstDayOfWeek]="0"` |
| Calendar “or documented exception” | Wire adapter; no exception |
| Export “pick local vs UTC slice in Phase 2” | Locked local civil day (§4) |
| Grid “prefer a nicer formatter” | P0 display/filter/sort disagreement |
| `parseLocalIsoDate` = reuse `parseGridDate` | Exact date-only vs full ISO contract (§0); do not copy prefix regex |

Out of scope (unchanged): no IANA picker · no Luxon / date-fns / Moment · no `datetime-local` widget · `useUtc` deferred · no chart `timeZone` until asked · no Islamic / Hebrew calendars.
