# Composition plan — Products management (PAGE)

**Run:** `golden-products-page`  
**Approved:** true

## Purpose

Docs playground page: summary cards, search, grid with loading/empty, export action.

## Component tree

```text
docs-products-playground
├── header (h1 + actions)
│   ├── pixel-button (Export CSV)
│   └── pixel-button (Add product)
├── summary row → pixel-card ×3
├── toolbar → pixel-input (Search)
└── pixel-data-grid
```

## States

- Loading: card + grid `showSkeleton`
- Empty: grid `emptyMessage`
- Tokens: `--pixel-sys-*` only

## Forbidden

- Invented appearances / selectors
- Hardcoded theme colors
- `@angular/cdk`
