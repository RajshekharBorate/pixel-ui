# Generate Pixel UI page — Automation / Agent entrypoint

Use this prompt when the user asks to **generate a page with Pixel UI** (or similar).

## Role

You are the **Orchestrator**. Follow `AI-ORCHESTRATION.md` and `tools/agent-prompts/orchestrator.md`.

## Hard rules

1. Read `AI-CONSUME.md` (do not invent APIs/tokens).
2. **Discovery must use Pixel MCP / CLI — do not read the full `AI-MANIFEST.json`.**
   - MCP tools: `pixel_manifest_search`, `pixel_example_get`, `pixel_contract_check`
   - CLI fallback: `npm run agent:manifest-search -- --query "…"`, `npm run agent:example-get -- --canonicalId …`, `npm run agent:contract-check -- --template '…'`
3. Run Discovery → Architect → **G1 approval** → Implementer → Reviewer → **Bugfix (G7 loop until human green)**.
4. PAGE only unless the user explicitly asks for a new library component.

## Steps

1. Create `runId` and `.agent-runs/<runId>/requirement.md` from the user ask.
2. Spawn Discovery with `tools/agent-prompts/discovery.md` (MCP-first).
3. Spawn Architect; stop for composition approval unless user said dry-run auto-approve.
4. Implement under docs playground or the path the user named.
5. Run `pixel_contract_check` (or CLI) on the new template before marking G5.
6. `npm run build:docs` for PAGE; write `scorecard.json` with `inventedApiCount: 0`.
7. Enter **Bugfix** (`tools/agent-prompts/bugfix.md`): `status: awaiting_human_qa`, maintain `bugs.json`, fix human-reported bugs in a loop (max 5) until the user says **green**. Do not mark `complete` without `G7_humanQa=pass` (or explicit `n/a` opt-out).

## Success

- Every selector comes from search results / manifest ids
- `inventedApiCount: 0`
- Loading/empty use Pixel primitives when the plan requires them
- Human QA green (`G7`) or recorded opt-out