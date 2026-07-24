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

- **Engine:** TipTap (ProseMirror). Created in `afterNextRender` (skipped while `showSkeleton`),
  destroyed on `DestroyRef` / when skeleton returns.
- **Canonical value:** ProseMirror/TipTap JSON (`PixelEditorDoc`). `(htmlChange)` emits derived HTML.
- **Paste / sanitize:** `PixelEditorPasteSanitize` strips scripts, iframes, inline event handlers,
  `javascript:` URLs, and Office markup before schema parse. Allowed structure is whatever the
  TipTap schema accepts (no raw HTML round-trip guarantee). Export `sanitizePastedHtml` for tests.
- **Forms:** `ControlValueAccessor` + `Validator`. `[required]` fails when the document has no
  plain text; `[minLength]` checks trimmed text length. Prefer these over Angular’s
  `Validators.required` on object values (empty docs are truthy).
- **Loading / skeleton / empty:** `showSkeleton` replaces chrome with `pixel-skeleton`. `loading`
  overlays `pixel-loader` and sets `aria-busy` / disables editing. Optional `emptyHeading` +
  `emptyDescription` show a `pixel-empty-state` overlay when the doc has no text (click focuses).
- **Mentions / emoji / dates:** `@` suggestion list from `[mentionItems]` + `(mentionQuery)`.
  Toolbar uses `pixel-autocomplete`, curated emoji/special-char grids, `pixel-datepicker` /
  `dateChip` atom.
- **Code / tables:** `CodeBlockLowlight` + `lowlight` `common` grammars; Insert language submenu.
  Tables default 3×3 with header; Tab/Shift+Tab cell nav. Escape exits fullscreen.
- **Media:** Color/highlight swatches, link popover, image URL/`pixel-file-upload` +
  `(imageRequest)`. Paste URL autolinks.
- **Panels:** TipTap `panel` node (`info | note | success | warning | error`). Task checkboxes
  use primary accent; checked items strikethrough.
- **Toolbar:** Container-query overflow collapses Insert on narrow hosts; ArrowLeft/Right roving
  focus. Touch targets ≥ 44×44px on glyph pickers.
- **Status bar:** Word count; selection-derived block breadcrumb; **Pixel Document Format** hint.
- **Optional TipTap peers:** Declared optional on the library package. Alias `pixel-ui/editor`
  maps to the editor barrel; dedicated ng-packagr secondary entry deferred.
- **Non-goals (v1):** TipTap Cloud, ADF import/export, emoji-mart, Yjs collab, AI slash palette.

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

### Component `pixel-editor-status-bar` (`PixelEditorStatusBarComponent`)

Footer status bar for `pixel-editor` (Phase 0 shell / Phase 6 polish).

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `blockKind` | `PixelEditorBlockKind` | `'paragraph'` | Current block kind for the breadcrumb chip. |
| `wordCount` | `number` | `0` | Word count shown in the footer. |
| `saveState` | `PixelEditorSaveState` | `'idle'` | Save indicator state. |
| `savedAtLabel` | `string` | `''` | Relative time label next to save state (e.g. "Just now"). |
| `showFormatHint` | `boolean` | `true` | Whether to show the Pixel Document Format hint. |

### Component `pixel-editor-toolbar` (`PixelEditorToolbarComponent`)

Formatting toolbar for `pixel-editor` — menus + pickers compose pixel chrome.

**Inputs**

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `ariaLabel` | `string` | `'Formatting'` | Accessible name for the toolbar landmark. |
| `config` | `PixelEditorToolbarConfig` | `{}` | Group visibility overrides. |
| `disabled` | `boolean` | `false` | Disables all toolbar controls. |
| `fullscreen` | `boolean` | `false` | Whether fullscreen is active (toggle pressed). |
| `mentionItems` | `readonly PixelEditorMentionItem[]` | `[]` | People/entities for the mention autocomplete popover. |

**Outputs**

| Output | Payload | Description |
| --- | --- | --- |
| `fullscreenToggle` | `void` | Emits when the fullscreen control is activated. |
| `undo` | `void` | Emits when undo is requested. |
| `redo` | `void` | Emits when redo is requested. |
| `insertRequest` | `PixelEditorInsertAction` | Insert actions that need later-phase UI (mentions, emoji, table, …). |
| `imageRequest` | `PixelEditorImageRequest` | Image upload / URL insert — parent may upload `file` then rewrite `src`. |
| `mentionQuery` | `PixelEditorMentionQuery` | Forwards mention search queries from the autocomplete popover. |

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
| `size` | `PixelEditorSize` | `'md'` | Chrome density. |
| `minHeight` | `string` | `'12rem'` | Minimum height of the editing surface. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `readonly` | `boolean` | `false` | Read-only surface (focus allowed; edits blocked). |
| `showStatusBar` | `boolean` | `true` | Shows the footer status bar. |
| `showToolbar` | `boolean` | `true` | Shows the formatting toolbar. |
| `saveState` | `PixelEditorSaveState` | `'idle'` | Status-bar save indicator. |
| `savedAtLabel` | `string` | `''` | Relative time next to save state. |
| `blockKind` | `PixelEditorBlockKind | null` | `null` | Optional override for the status-bar block breadcrumb. When unset, follows selection. |
| `mentionItems` | `readonly PixelEditorMentionItem[]` | `[]` | People/entities available for |
| `showSkeleton` | `boolean` | `false` | Replaces the editor chrome with a skeleton placeholder (async hydrate). |
| `loading` | `boolean` | `false` | Shows an inline loading overlay on the surface and sets `aria-busy`. |
| `loadingLabel` | `string` | `'Loading'` | Accessible label for the loading overlay. |
| `required` | `boolean` | `false` | Marks the control required — empty documents (no text) are invalid. |
| `minLength` | `number` | `0` | Minimum plain-text length (after trim). `0` disables. |
| `emptyHeading` | `string` | `''` | Optional empty-state heading when the document has no text (first-use). TipTap placeholder still applies when this is empty. |
| `emptyDescription` | `string` | `''` | Optional empty-state description paired with `emptyHeading`. |

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
| `PixelEditorSaveState` | `'idle' | 'saving' | 'saved' | 'error'` |
| `PixelEditorBlockKind` | `'paragraph' | 'heading' | 'list' | 'code' | 'table' | 'panel' | 'unknown'` |
| `PixelEditorToolbarConfig` | `{ readonly textStyle?: boolean; readonly marks?: boolean; readonly color?: boolean; readonly more?: boolean; readonly alignment?: boolean; readonly lists?: boolean; readonly insert?: boolean; readonly history?: boolean; readonly fullscreen?: boolean; }` |

<!-- API-CONTRACT:END -->
