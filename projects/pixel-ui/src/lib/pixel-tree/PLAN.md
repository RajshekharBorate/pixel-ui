# pixel-tree — Enterprise TreeView plan

Multi-phase feature. Structural references: `pixel-data-grid` (flattened render rows,
signal derivation), `pixel-select` (async loading, keyboard nav), WAI-ARIA `tree` pattern.

## Decisions (locked)

- **Flat render model**: visible nodes are flattened into one `computed()` list (level,
  posinset, setsize per entry) and rendered with a single `@for` — indentation via a CSS
  var, not nested DOM. This keeps keyboard nav simple and Phase 3 virtualization possible.
- Node shape `PixelTreeNode<T>`: `id`, `label`, optional `icon`, `children`, `disabled`,
  `data`, `hasChildren` (lazy marker). Ids are the identity — consumers own them.
- **Two-way state via `model()`** (genuine two-way, like tabs/stepper): `expandedIds`,
  `selectedIds`. Everything else controlled inputs + typed outputs.
- Selection modes: `'none' | 'single' | 'checkbox'`. Checkbox mode cascades down (toggling a
  branch (de)selects its descendants) and derives parent checked/indeterminate state — the
  stored set contains explicitly selected node ids only.
- Lazy loading: `loadChildren(node) => Promise<PixelTreeNode<T>[]>`; loaded children are
  cached in an internal map keyed by node id (input `nodes` is never mutated); per-node
  inline `pixel-loader` while pending.
- Keyboard: full WAI-ARIA tree contract (roving tabindex, arrows, Home/End, Enter, Space).
- Custom node content via `[pixelTreeNodeDef]` template directive (context: node, level,
  expanded, selected); default rendering is icon + label.

## Phase 1 — Core tree ✅ DONE (2026-07-04)

Render + expand/collapse + single selection + full keyboard map + ARIA
(`role=tree/treeitem/group` semantics via flat pattern: `aria-level`, `aria-posinset`,
`aria-setsize`, `aria-expanded`, `aria-selected`) + empty state slot + spec + docs (2
examples) + README contract.

## Phase 2 — Checkbox cascade & lazy loading ✅ DONE (2026-07-04)

Checkbox mode with indeterminate parents and cascade toggle; `loadChildren` async expansion
with per-node loading state and `aria-busy`; spec coverage; docs example.

## Phase 3 — Scale & polish (NOT STARTED)

- Virtualization for 10k+ nodes (reuse the flat render list; follow pixel-select's
  IntersectionObserver / manual window pattern).
- Typeahead (printable-character focus jump) and `*` (expand siblings) per WAI-ARIA.
- Optional connector lines; drag-to-reorder (reuse data-grid drag utilities).
- **Exit:** build+test green, docs example with 10k nodes, README updated.

Cross-cutting acceptance per phase: `ng build` + `ng test` green · docs example · README
regenerated (`npm run readme:api`) · dark mode + reduced motion + keyboard-only pass.
Delete this file only when Phase 3 lands.
