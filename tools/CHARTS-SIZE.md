# Charts size & CI

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run lint:echarts-import` | Ban full `echarts` imports |
| `npm run size:charts` | Fail if modular register (+ sparkline) gzip exceeds budgets |
| `npm run size:charts -- --write` | Snapshot sizes to `tools/charts-size-latest.json` |

Budgets live in `tools/charts-size-budgets.mjs`.

## Interactive analysis

After `npm run build`:

```bash
npx source-map-explorer dist/pixel-ui/fesm2022/*.mjs
```

Optional published-package gates (not required in this monorepo CI):

```bash
npx size-limit
```

Keep `size-limit` config aligned with `PIXEL_CHART_FAMILY_GZIP_BUDGETS` if you add it later.

## Deep entries (`pixel-ui/charts/bar`)

Deferred — ng-packagr 21 secondary entry spike failed in Phase 0.
Continue using the `pixel-ui/charts` alias + tree-shaken named imports.
