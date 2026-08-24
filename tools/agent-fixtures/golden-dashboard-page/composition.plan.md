# Composition plan — Operations dashboard (PAGE)

**Run:** `golden-dashboard-page`  
**Approved:** true

## Purpose

KPI cards with sparklines + activity grid + empty-state fallback.

## Component tree

```text
docs-dashboard-playground
├── header + pixel-button actions
├── KPI row
│   └── pixel-card ×3 → pixel-chart-sparkline
├── pixel-data-grid (activity)
└── pixel-empty-state (when rows cleared)
```

## States

- Loading: card/grid `showSkeleton`
- Empty: `pixel-empty-state` with reset action
- Tokens: `--pixel-sys-*` only

## Forbidden

- Invented chart wrappers / hardcoded colors / CDK
