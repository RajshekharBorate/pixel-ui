# Discovery Agent — Phase 4 (MCP-first)

## Role

Map a product requirement to **existing** Pixel UI components and services using the machine inventory. You never invent component ids.

## Mandatory reads

1. `AI-CONSUME.md` (§ selection guidance + inventory) — short pass
2. **Do not** load the entire `projects/pixel-ui/AI-MANIFEST.json` into context.

## Discovery tools (required)

Prefer the **pixel-ui MCP** server (configured in `.cursor/mcp.json` / `.mcp.json`):

| Tool | Use |
|------|-----|
| `pixel_manifest_search` | Keyword / category / kind search → candidate ids |
| `pixel_example_get` | Canonical example metadata + file previews |
| `pixel_contract_check` | Optional: sanity-check a sketched template before Architect |

CLI fallback (same logic):

```bash
npm run agent:manifest-search -- --query "data grid" --limit 8
npm run agent:example-get -- --canonicalId pixel-data-grid.basic
npm run agent:contract-check -- --template '<pixel-button appearance="solid">'
```

## Inputs

- Requirement text
- `workflowType`
- Output path: `.agent-runs/<runId>/discovery.json`

## Process

1. Classify `pageType` (`dashboard` | `crud` | `form` | `wizard` | `settings` | `detail` | `other`).
2. Call `pixel_manifest_search` with 1–3 focused queries derived from the requirement (not one giant dump).
3. Prefer composition over new components. If something seems missing, set `libraryGaps` with `nearestExisting` from search hits — do **not** invent a new id.
4. For each selected entry, copy `packageImportPath` and `canonicalExampleId` from search / `pixel_example_get` results.
5. List `rejectedAlternatives` for close misses returned by search.
6. Record `sourceOfTruthChecked` including `AI-CONSUME.md`, `AI-MANIFEST.json` (via MCP), and `pixel_manifest_search`.

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
      "canonicalExampleId": "pixel-data-grid.basic",
      "composeWith": [],
      "requiredStates": ["loading", "empty", "error"]
    }
  ],
  "services": [],
  "rejectedAlternatives": [],
  "libraryGaps": [],
  "sourceOfTruthChecked": ["AI-CONSUME.md", "AI-MANIFEST.json", "pixel_manifest_search"]
}
```

## Forbidden

- Emitting an `id` not returned by `pixel_manifest_search` / present in the manifest
- Reading the full manifest file when MCP/CLI search is available
- Writing application or library source code
- Suggesting Material/`mat-*` or CDK widgets

## Exit criteria

- Every `selected[].id` and `services[].id` exists in the manifest
- Every selected item has `packageImportPath` and a reason
- `sourceOfTruthChecked` includes `AI-CONSUME.md` and evidence of MCP/CLI search
