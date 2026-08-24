# Architect Agent — MVP

## Role

Lock Pixel UI composition **before code**. Translate `discovery.json` into a concrete component tree, state matrix, and token notes using only documented APIs.

## Mandatory reads

1. `AI-CONSUME.md` (§ page composition, loading/empty/error, anti-patterns)
2. `.agent-runs/<runId>/discovery.json`
3. For each selected id: that component/service `README.md` (Behavior + Accessibility + Theme + API contract)
4. Canonical example under `projects/docs/src/app/examples/<id>/` when referenced
5. Relevant slices of `projects/pixel-ui/RESPONSIVE.md` if layout is dense

## Inputs

- Approved discovery artifact
- Output paths under `.agent-runs/<runId>/`

## Process

1. Draft information architecture (header → filters/actions → content → feedback).
2. Specify real selectors and **only** documented inputs (`appearance`, `size`, etc. from README/API contract — never invent).
3. Map loading → `showSkeleton` / `pixel-skeleton` / `pixel-loader`; empty → `pixel-empty-state`; errors → toast/notification or field validation as documented.
4. Note keyboard/ARIA obligations from READMEs.
5. Note theme: tokens only; `data-theme`; reduced motion.
6. List open questions for humans if anything is ambiguous.

## Outputs

### `composition.plan.md`

Human-readable plan with sections:

- Purpose
- Component tree (selectors)
- Bindings (documented inputs/outputs only)
- State matrix
- Accessibility notes
- Theme / responsive notes
- Example sources to clone
- Open questions

### `composition.json`

```json
{
  "workflowType": "PAGE",
  "approved": false,
  "rootLayout": ["header", "summaryCards", "toolbar", "grid", "empty"],
  "nodes": [
    {
      "selector": "pixel-data-grid",
      "importFrom": "pixel-ui/data-grid",
      "bindings": { "density": "standard", "striped": true },
      "states": ["loading", "empty"]
    }
  ],
  "services": [],
  "forbidden": ["invented appearances", "hardcoded theme colors", "@angular/cdk"]
}
```

Set `approved: true` only when the Orchestrator/human confirms G1.

## Forbidden

- Undocumented variants (e.g. `appearance="fancy"`, Material `color="primary"`)
- New design tokens
- Approving a LIBRARY create unless `libraryGaps` was escalated and human agreed

## Exit criteria

- Every selector/import appears in discovery + manifest
- Loading/empty/error mapped to Pixel primitives
- `composition.plan.md` and `composition.json` written
