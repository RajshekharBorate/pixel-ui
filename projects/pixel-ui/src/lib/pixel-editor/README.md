# pixel-editor

Jira-like rich text editor for `pixel-ui`: formatting toolbar, editable canvas, and status bar.

> **Install:** `import { PixelEditorComponent } from 'pixel-ui'` (alias `pixel-ui/editor` also
> works). Install TipTap peer packages listed in `projects/pixel-ui/package.json` (marked
> optional — only required when you use the editor).

## Overview

- Structured **JSON** documents (`PixelEditorDoc`) are the canonical value; HTML is derived.
- Status bar shows **Pixel Document Format** (ADF is out of v1).
- Toolbar composes `pixel-button`, `pixel-menu`, `pixel-popover`, `pixel-divider`, and `pixel-tooltip`.

## Use cases

- Issue / ticket description fields
- Comment and wiki-style document bodies
- Form fields that need headings, lists, tasks, code, tables, and mentions

## Behavior notes

- **Chrome:** Frame border/hover/focus matches `pixel-input` (single border + soft focus ring via
  `box-shadow`, no separate outline). TipTap mounts with `{ mount }` so the canvas element *is*
  the editable (no nested one-line box). Clicks on empty canvas place the caret at the end.
- **Engine:** TipTap (ProseMirror). Created in `afterNextRender` (skipped while `showSkeleton`),
  destroyed on `DestroyRef` / when skeleton returns.
- **Paste / sanitize:** `PixelEditorPasteSanitize` strips scripts, iframes, inline event handlers,
  `javascript:` URLs, and Office markup before schema parse. Allowed structure is whatever the
  TipTap schema accepts (no raw HTML round-trip guarantee). Export `sanitizePastedHtml` for tests.
- **Forms:** `ControlValueAccessor` + `Validator`. `[required]` fails when the document has no
  plain text; `[minLength]` checks trimmed text length. Prefer these over Angular’s
  `Validators.required` on object values (empty docs are truthy). Invalid chrome follows the
  bound control when it is invalid and touched/dirty (error border + optional
  `validationMessages` / `errorOverride` / `helperText`), matching `pixel-input`.
- **Loading / skeleton / empty:** `showSkeleton` replaces chrome with `pixel-skeleton`. `loading`
  overlays `pixel-loader` and sets `aria-busy` / disables editing. Optional `emptyHeading` +
  `emptyDescription` show a `pixel-empty-state` overlay when the doc has no text (click focuses).
- **Mentions / emoji / dates:** `@` caret suggestions (select-like option chrome) from
  `[mentionItems]` + `(mentionQuery)`. Toolbar uses `pixel-autocomplete`, curated emoji/special-char
  grids, `pixel-datepicker` / `dateChip` atom. Date chips store local calendar `YYYY-MM-DD`
  (`toLocalIsoDate` — never UTC `toISOString` slicing). Insert menu is block-only (code / table /
  panel / HR); emoji, date, and special characters stay on dedicated controls (also available in
  the narrow overflow strip).
- **Slash (`/`):** Type `/` on the canvas for a floating command palette (headings, lists, panel,
  code, table, HR, mention, emoji, date). The list mirrors `pixel-select` panel chrome (surface,
  elevation shadow, option rows with icon + label + subtitle) as a caret-anchored TipTap popup —
  embedding `pixel-select` itself is not viable (form trigger). Panel uses `position: fixed` and
  repositions on scroll/resize like connected-overlay. Each command deletes `/query` and applies
  the change in one editor chain. Disabled inside inline `code` and `codeBlock`. Image clears the
  query and points users at the toolbar Image control.
- **Mentions (`@`):** Same select-like panel + scroll reposition as slash; bind `[mentionItems]`
  (docs demo seeds people). Toolbar mention picker still uses `pixel-autocomplete`.
- **Find & replace:** Toolbar search uses the same `pixel-popover` + `pixel-editor-picker-panel`
  chrome as Date / Mention. Equal-width Find / Replace fields; Match case / Match whole word.
  Dismiss via Esc or outside click (no close icon). Status shows only when a query is present.
- **Table chrome:** Selecting inside a table shows a floating contextual toolbar (add row/column
  above or below/after, delete row/column, merge/split, cell align + background, toggle header
  row/column, header fill color, **border style** (Solid default / Dashed / None — Dashed uses
  `border_clear`), table/column/row size presets, delete table) positioned above the table like
  the image toolbar. **Resize model:** columns use TipTap `colwidth` drag handles (do not store
  a competing px `displayWidth`); row bottoms show a single primary bar → `rowHeight`; the SE
  corner (only while the table is selected) scales all columns on X and the last row on Y.
  Percent table-width presets still use `displayWidth` (`25%`…`100%` / fit). Default border is
  **solid** (Dashed / None available in the menu). Insert table is a
  main-toolbar `table` control (slash `/table` too — not
  in the Insert menu); default insert is **2×2 with header** seeded at the Default column width
  (120px).
- **Font size:** Icon control near text style applies `sm`/`md`/`lg`/`xl` (rem) via TipTap
  `FontSize` on `textStyle` — persisted in document JSON. Active size shows a check in the menu.
  Text style uses Material `format_h1` / `format_h2` / `format_h3` icons.
- **Clear formatting:** More menu only (`unsetAllMarks` + `clearNodes`) — not duplicated as a
  standalone toolbar button.
- **Copy HTML / Markdown:** Status-bar actions copy `getHTML()` or a best-effort Markdown
  serialization (`editorDocToMarkdown`). Markdown drops colors/highlights/font-size, flattens
  panels to labeled blockquotes, and emits GFM tables without colspan/rowspan — not a round-trip.
- **Code / tables:** `CodeBlockLowlight` + `lowlight` `common` grammars; Insert language submenu.
  Tables default 2×2 with header; Tab/Shift+Tab cell nav. Escape exits fullscreen.
- **Panels / tasks / quote:** Panel NodeView keeps icon + body on one row. Task checkboxes are
  visual twins of `pixel-checkbox` (custom box + check). Block quote (`format_quote`) toggles
  TipTap `blockquote` with a primary start border. Content CSS is injected globally because TipTap
  DOM escapes Angular encapsulation.
- **Media:** Images are rectangular (no corner radius). Width / crop via icon menus on a floating
  toolbar that uses the same surface as the main toolbar. Caption wraps the image in a `figure`
  with an editable figcaption below. No corner resize handle — use the width menu. Selection is
  remembered across toolbar clicks. Insert image popover is center-aligned.
- **Pickers:** Emoji/special glyph cells use icon-button hover + `pixelTooltip` labels.
- **Toolbar:** Single horizontal row with overflow scroll; text style / font size use icon
  triggers. Container-query overflow collapses Insert on narrow hosts; ArrowLeft/Right roving
  focus. Touch targets ≥ 44×44px on glyph pickers. `toolbarPosition` places chrome `top` (default)
  or `bottom`; bottom placement hides the status bar (footer slot is the toolbar).
- **Status bar:** Clickable count cycles `words` | `characters` | `charactersWithSpaces`
  (`countMode` input, default `words`); selection-derived block breadcrumb; HTML/MD copy;
  **Pixel Document Format** hint. Not shown when `toolbarPosition="bottom"`.
- **Optional TipTap peers:** Declared optional on the library package. Alias `pixel-ui/editor`
  maps to the editor barrel; dedicated ng-packagr secondary entry deferred.
- **Non-goals (v1):** TipTap Cloud, ADF import/export, emoji-mart, Yjs collab, AI compose.

## Examples

```html
<pixel-editor
  label="Description"
  placeholder="Write a description…"
  required
  [value]="doc()"
  saveState="saved"
  savedAtLabel="Just now"
/>
```

```ts
import { PixelEditorComponent, type PixelEditorDoc } from 'pixel-ui';
```

## Accessibility

- Toolbar uses `role="toolbar"` with labeled icon controls (`ariaLabel` + tooltip) and ≥44×44px
  effective targets on picker glyphs.
- Editing surface exposes `role="textbox"` and `aria-multiline="true"`.
- Status bar is `role="status"` with `aria-live="polite"`.
- `loading` sets host `aria-busy` and a polite loading status region.
- `prefers-reduced-motion: reduce` disables fullscreen / overlay transitions.
- Escape exits fullscreen.

## Theme customization

Component tokens on `:host`:

- `--pixel-editor-border`
- `--pixel-editor-border-hover`
- `--pixel-editor-border-focus`
- `--pixel-editor-error`
- `--pixel-editor-radius`
- `--pixel-editor-bg`
- `--pixel-editor-on-surface`
- `--pixel-editor-label-color`
- `--pixel-editor-placeholder`
- `--pixel-editor-focus-ring`
- `--pixel-editor-surface-padding`

Toolbar / status bar expose local `--pixel-editor-toolbar-*` tokens where needed.

## Breaking changes

- **Phase 6:** `blockKind` default is now `null` (selection-derived breadcrumb). Pass an
  explicit value only to force the chip; omit it for normal use.
- **Phase 7:** Prefer `[required]` / `[minLength]` on `<pixel-editor>` for empty-doc validation;
  Angular `Validators.required` on a `PixelEditorDoc` object does not treat blank paragraphs as empty.

## TipTap peers (install when using this entry)

```bash
npm i @tiptap/core @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-link \
  @tiptap/extension-placeholder @tiptap/extension-task-list @tiptap/extension-task-item \
  @tiptap/extension-image @tiptap/extension-table @tiptap/extension-table-row \
  @tiptap/extension-table-cell @tiptap/extension-table-header \
  @tiptap/extension-code-block-lowlight @tiptap/extension-horizontal-rule \
  @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight \
  @tiptap/extension-mention @tiptap/suggestion lowlight
```

Pin matching `@tiptap/*` versions (workspace uses `3.28.0`).

<!-- API-CONTRACT:START — generated by tools/generate-readme-api.mjs. Do NOT edit between these markers; run `npm run readme:api` instead. -->

## API contract

_Machine-generated from the component source. This is the behavioral API surface: any change
to it is a **breaking-change candidate** and must be deliberate. After modifying this
component, run `npm run readme:api` and review this section's diff as a regression check._

### Component `pixel-editor-find-bar` (`PixelEditorFindBarComponent`)

Find & replace panel for `pixel-editor` (toolbar popover).

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `findQuery` | `string` | `''` | Find query. |
| `replaceQuery` | `string` | `''` | Replace query. |
| `matchIndex` | `number` | `0` | Current match index (1-based for display; 0 when none). |
| `matchCount` | `number` | `0` | Total matches. |
| `matchCase` | `boolean` | `false` | Case-sensitive matching. |
| `matchWholeWord` | `boolean` | `false` | Match whole words only. |
| `disabled` | `boolean` | `false` | Disables controls. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `findQueryChange` | `string` |  |
| `replaceQueryChange` | `string` |  |
| `matchCaseChange` | `boolean` |  |
| `matchWholeWordChange` | `boolean` |  |
| `findNext` | `void` |  |
| `findPrev` | `void` |  |
| `replace` | `void` |  |
| `replaceAll` | `void` |  |
| `close` | `void` | Optional — host may close via Esc / outside click; close control removed from UI. |

### Component `pixel-editor-image-toolbar` (`PixelEditorImageToolbarComponent`)

Contextual chrome when an image (or figure) is selected.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `state` | `PixelEditorImageToolbarState` | *required* |  |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `alignChange` | `'start' | 'center' | 'end'` |  |
| `floatChange` | `'none' | 'start' | 'end'` |  |
| `widthChange` | `string` |  |
| `captionToggle` | `void` |  |
| `cropRequest` | `'1:1' | '4:3' | '16:9' | 'free'` |  |
| `remove` | `void` |  |

### Component `pixel-editor-status-bar` (`PixelEditorStatusBarComponent`)

Footer status bar for `pixel-editor` (Phase 0 shell / Phase 6 polish).

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `blockKind` | `PixelEditorBlockKind` | `'paragraph'` | Current block kind for the breadcrumb chip. |
| `count` | `number` | `0` | Numeric count shown in the footer (words or characters depending on `countMode`). |
| `countMode` | `PixelEditorCountMode` | `'words'` | How `count` is interpreted / labeled. |
| `saveState` | `PixelEditorSaveState` | `'idle'` | Save indicator state. |
| `savedAtLabel` | `string` | `''` | Relative time label next to save state (e.g. "Just now"). |
| `showFormatHint` | `boolean` | `true` | Whether to show the Pixel Document Format hint. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `countModeCycle` | `void` | Emits when the user cycles the count mode control. |
| `copyHtml` | `void` | Copy document as HTML. |
| `copyMarkdown` | `void` | Copy document as Markdown. |

### Component `pixel-editor-table-toolbar` (`PixelEditorTableToolbarComponent`)

Contextual chrome when the selection is inside a table.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `disabled` | `boolean` | `false` | Whether the toolbar controls are disabled. Disables all table chrome actions. |
| `headerColor` | `string | null` | `null` | Current header fill color (hex), or null for the theme default. Highlights the active swatch in the header color picker. |
| `borderStyle` | `PixelEditorTableBorderStyle` | `'solid'` | Current table border style. Active border style for the border menu checkmarks. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `addRow` | `void` |  |
| `addRowBefore` | `void` |  |
| `addColumn` | `void` |  |
| `addColumnBefore` | `void` |  |
| `deleteRow` | `void` |  |
| `deleteColumn` | `void` |  |
| `toggleHeader` | `void` |  |
| `toggleHeaderColumn` | `void` |  |
| `mergeCells` | `void` |  |
| `splitCell` | `void` |  |
| `headerColorChange` | `string | null` |  |
| `cellBackgroundChange` | `string | null` |  |
| `cellAlignChange` | `PixelEditorTableCellAlign` |  |
| `borderStyleChange` | `PixelEditorTableBorderStyle` |  |
| `columnWidthChange` | `number | null` |  |
| `equalizeColumns` | `void` |  |
| `rowHeightChange` | `string | null` |  |
| `tableWidthChange` | `string | null` |  |
| `deleteTable` | `void` |  |

### Component `pixel-editor-toolbar` (`PixelEditorToolbarComponent`)

Formatting toolbar for `pixel-editor` — menus + pickers compose pixel chrome.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `ariaLabel` | `string` | `'Formatting'` | Accessible name for the toolbar landmark. |
| `config` | `PixelEditorToolbarConfig` | `{}` | Group visibility overrides. |
| `position` | `PixelEditorToolbarPosition` | `'top'` | Visual placement relative to the canvas (border side). |
| `disabled` | `boolean` | `false` | Disables all toolbar controls. |
| `fullscreen` | `boolean` | `false` | Whether fullscreen is active (toggle pressed). |
| `mentionItems` | `readonly PixelEditorMentionItem[]` | `[]` | People/entities for the mention autocomplete popover. |
| `findQuery` | `string` | `''` | Find query (controlled by host). |
| `replaceQuery` | `string` | `''` | Replace query (controlled by host). |
| `findMatchIndex` | `number` | `0` | 1-based match index for display. |
| `findMatchCount` | `number` | `0` | Total find matches. |
| `findOpen` | `boolean` | `false` | When true, open the find popover (e.g. Ctrl/Cmd+F from host). |
| `findMatchCase` | `boolean` | `false` | Case-sensitive find. |
| `findMatchWholeWord` | `boolean` | `false` | Whole-word find. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `fullscreenToggle` | `void` | Emits when the fullscreen control is activated. |
| `undo` | `void` | Emits when undo is requested. |
| `redo` | `void` | Emits when redo is requested. |
| `insertRequest` | `PixelEditorInsertAction` | Insert actions that need later-phase UI (mentions, emoji, table, …). |
| `imageRequest` | `PixelEditorImageRequest` | Image upload / URL insert — parent may upload `file` then rewrite `src`. |
| `mentionQuery` | `PixelEditorMentionQuery` | Forwards mention search queries from the autocomplete popover. |
| `findQueryChange` | `string` |  |
| `replaceQueryChange` | `string` |  |
| `findMatchCaseChange` | `boolean` |  |
| `findMatchWholeWordChange` | `boolean` |  |
| `findNext` | `void` |  |
| `findPrev` | `void` |  |
| `findReplace` | `void` |  |
| `findReplaceAll` | `void` |  |
| `findClose` | `void` |  |
| `findOpenChange` | `boolean` | Syncs host `findOpen` when the popover is toggled by the search button. |

### Component `pixel-editor` (`PixelEditorComponent`)

Jira-like rich text editor backed by TipTap (ProseMirror). Canonical `value` is JSON (`PixelEditorDoc`). HTML is available via `(htmlChange)`. TipTap packages are optional peers — install them when using this component.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `''` | Optional host id. |
| `label` | `string` | `''` | Visible field label above the editor. |
| `placeholder` | `string` | `''` | Placeholder when the document is empty. |
| `value` | `PixelEditorDoc | null` | `null` | Canonical document JSON (controlled). Prefer with `(valueChange)` or forms CVA. |
| `toolbar` | `PixelEditorToolbarConfig` | `{}` | Toolbar group visibility. |
| `toolbarPosition` | `PixelEditorToolbarPosition` | `'top'` | Places the formatting toolbar above (`top`) or below (`bottom`) the canvas. When `bottom`, the status bar is hidden even if `showStatusBar` is true. |
| `size` | `PixelEditorSize` | `'md'` | Chrome density. |
| `minHeight` | `string` | `'12rem'` | Minimum height of the editing surface. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `readonly` | `boolean` | `false` | Read-only surface (focus allowed; edits blocked). |
| `showStatusBar` | `boolean` | `true` | Shows the footer status bar. Ignored when `toolbarPosition` is `bottom` (toolbar replaces the footer chrome). |
| `showToolbar` | `boolean` | `true` | Shows the formatting toolbar. |
| `saveState` | `PixelEditorSaveState` | `'idle'` | Status-bar save indicator. |
| `savedAtLabel` | `string` | `''` | Relative time next to save state. |
| `blockKind` | `PixelEditorBlockKind | null` | `null` | Optional override for the status-bar block breadcrumb. When unset, follows selection. |
| `countMode` | `PixelEditorCountMode` | `'words'` | Status-bar count mode: words, characters (no spaces), or characters with spaces. |
| `mentionItems` | `readonly PixelEditorMentionItem[]` | `[]` | People/entities available for |
| `showSkeleton` | `boolean` | `false` | Replaces the editor chrome with a skeleton placeholder (async hydrate). |
| `loading` | `boolean` | `false` | Shows an inline loading overlay on the surface and sets `aria-busy`. |
| `loadingLabel` | `string` | `'Loading'` | Accessible label for the loading overlay. |
| `required` | `boolean` | `false` | Marks the control required — empty documents (no text) are invalid. |
| `minLength` | `number` | `0` | Minimum plain-text length (after trim). `0` disables. |
| `emptyHeading` | `string` | `''` | Optional empty-state heading when the document has no text (first-use). TipTap placeholder still applies when this is empty. |
| `emptyDescription` | `string` | `''` | Optional empty-state description paired with `emptyHeading`. |
| `helperText` | `string` | `''` | Helper text below the frame (hidden while a validation error is shown). |
| `errorOverride` | `string` | `''` | Forces the error message (and error chrome) regardless of control state. |
| `validationMessages` | `PixelEditorValidationMessages` | `{}` | Map of validation error keys to messages when the bound control is invalid and touched/dirty. Use `{requiredLength}` / `{actualLength}` in `minlength` strings. |

**Two-way (model)**

| Model | Type | Default | Description |
| --- | --- | --- | --- |
| `fullscreen` | `boolean` | `false` | Fullscreen presentation of the host. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `valueChange` | `PixelEditorDoc` | Emits when the document JSON changes. |
| `htmlChange` | `string` | Emits derived HTML when the document changes. |
| `imageRequest` | `PixelEditorImageRequest` | Image insert via upload or URL — apps may upload `file` then replace `src`. |
| `mentionQuery` | `PixelEditorMentionQuery` | Emits as the user types after `@` (for optional server-side filtering). |

### Exported types

| Type | Definition |
| --- | --- |
| `PixelEditorInsertAction` | `| 'link' | 'image' | 'mention' | 'emoji' | 'table' | 'panel' | 'date' | 'special-char'` |
| `PixelEditorTextStyle` | `'paragraph' | 'heading1' | 'heading2' | 'heading3'` |
| `PixelEditorTextAlign` | `'left' | 'center' | 'right' | 'justify'` |
| `PixelEditorDoc` | `{ type: 'doc'; content?: Array<Record<string, unknown>>; [key: string]: unknown; }` |
| `PixelEditorSize` | `'sm' | 'md' | 'lg'` |
| `PixelEditorToolbarPosition` | `'top' | 'bottom'` |
| `PixelEditorSaveState` | `'idle' | 'saving' | 'saved' | 'error'` |
| `PixelEditorBlockKind` | `| 'paragraph' | 'heading' | 'list' | 'code' | 'table' | 'panel' | 'unknown'` |
| `PixelEditorValidationMessages` | `{ readonly required?: string; readonly minlength?: string; readonly [key: string]: string | undefined; }` |
| `PixelEditorCountMode` | `'words' | 'characters' | 'charactersWithSpaces'` |
| `PixelEditorFontSize` | `'sm' | 'md' | 'lg' | 'xl'` |
| `PixelEditorToolbarConfig` | `{ readonly textStyle?: boolean; readonly fontSize?: boolean; readonly marks?: boolean; readonly color?: boolean; readonly more?: boolean; readonly alignment?: boolean; readonly lists?: boolean; readonly insert?: boolean; readonly find?: boolean; readonly history?: boolean; readonly fullscreen?: boolean; }` |

<!-- API-CONTRACT:END -->
