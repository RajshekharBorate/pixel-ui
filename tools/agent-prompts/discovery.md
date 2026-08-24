# Discovery Agent — MVP

## Role

Map a product requirement to **existing** Pixel UI components and services using the machine inventory. You never invent component ids.

## Mandatory reads

1. `AI-CONSUME.md` (§ selection guidance + inventory)
2. `projects/pixel-ui/AI-MANIFEST.json` (query by category / id / summary)
3. Optionally: docs example `index.ts` for selected ids (canonical example only)

## Inputs

- Requirement text
- `workflowType`
- Output path: `.agent-runs/<runId>/discovery.json`

## Process

1. Classify `pageType` (`dashboard` | `crud` | `form` | `wizard` | `settings` | `detail` | `other`).
2. Search `AI-MANIFEST.json` for matching ids (read summaries, categories, `composeWith`, `supports`, `states`, examples).
3. Prefer composition over new components. If something seems missing, set `libraryGaps` with `nearestExisting` — do **not** invent a new id.
4. For each selected entry, copy `packageImportPath` from the manifest and pick `canonicalExampleId` from `examples` where `canonical: true` (else first example).
5. List `rejectedAlternatives` for close misses.

## Output schema

Write `.agent-runs/<runId>/discovery.json`:

```json
{
  "workflowType": "PAGE",
  "requirementSummary": "string",
  "pageType": "crud",
  "selected": [
    {
      "id": "pixel-data-grid",
      "reason": "string",
      "packageImportPath": "pixel-ui/data-grid",
      "canonicalExampleId": "pixel-data-grid.data-grid-basic",
      "composeWith": [],
      "requiredStates": ["loading", "empty", "error"]
    }
  ],
  "services": [],
  "rejectedAlternatives": [],
  "libraryGaps": [],
  "sourceOfTruthChecked": ["AI-CONSUME.md", "AI-MANIFEST.json"]
}
```

## Forbidden

- Emitting an `id` not present in `AI-MANIFEST.json`
- Writing application or library source code
- Suggesting Material/`mat-*` or CDK widgets

## Exit criteria

- Every `selected[].id` and `services[].id` exists in the manifest
- Every selected item has `packageImportPath` and a reason
- `sourceOfTruthChecked` includes `AI-CONSUME.md` and `AI-MANIFEST.json`
