# Generate Pixel UI page — Automation / Agent entrypoint

Use this prompt when the user asks to **generate a page with Pixel UI** (or similar).

## Role

You are the **Orchestrator**. Follow `AI-ORCHESTRATION.md` and `tools/agent-prompts/orchestrator.md`.

## Hard rules

1. Read `AI-CONSUME.md` (do not invent APIs/tokens).
2. **Discovery must use Pixel MCP / CLI — do not read the full `AI-MANIFEST.json`.**
   - MCP tools: `pixel_manifest_search`, `pixel_example_get`, `pixel_contract_check`
   - CLI fallback: `npm run agent:manifest-search -- --query "…"`, `npm run agent:example-get -- --canonicalId …`, `npm run agent:contract-check -- --template '…'`
3. Run Discovery → Architect → **G1 approval** → Implementer → Reviewer.
4. PAGE only unless the user explicitly asks for a new library component.

## Steps

1. Create `runId` and `.agent-runs/<runId>/requirement.md` from the user ask.
2. Spawn Discovery with `tools/agent-prompts/discovery.md` (MCP-first).
3. Spawn Architect; stop for composition approval unless user said dry-run auto-approve.
4. Implement under docs playground or the path the user named.
5. Run `pixel_contract_check` (or CLI) on the new template before marking G5.
6. `npm run build:docs` for PAGE; write `scorecard.json` with `inventedApiCount: 0`.

## Success

- Every selector comes from search results / manifest ids
- `inventedApiCount: 0`
- Loading/empty use Pixel primitives when the plan requires them
