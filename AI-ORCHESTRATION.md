# AI-ORCHESTRATION.md — start a multi-agent Pixel UI run

Short entry for **Phase 4** multi-agent orchestration (PAGE + LIBRARY + MCP tooling).
Full architecture: [`AI-MULTI-AGENT-WORKFLOW.md`](./AI-MULTI-AGENT-WORKFLOW.md).
Consumption laws: [`AI-CONSUME.md`](./AI-CONSUME.md).

## When to use

Use this workflow when an AI (or team of AIs) must:

- Generate an application / docs **page** with Pixel UI, or
- Create / extend a **library** component

Do **not** skip Discovery → Architect before coding.

## Quick start — “Generate page with Pixel UI”

1. Attach / follow [`.cursor/rules/generate-pixel-page.mdc`](./.cursor/rules/generate-pixel-page.mdc) **or** paste [`tools/agent-prompts/entrypoint-generate-page.md`](./tools/agent-prompts/entrypoint-generate-page.md).
2. Ensure the **pixel-ui** MCP server is enabled (`.cursor/mcp.json` → `pixel-ui`). Reload MCP if needed.
3. Discovery uses `pixel_manifest_search` (not a full-file manifest read).

Cursor Automations: create a new automation whose instructions point at `tools/agent-prompts/entrypoint-generate-page.md` and enable the project `pixel-ui` MCP. Trigger on demand / Slack / PR as you prefer.

## Agents

| Agent | Prompt | When |
|-------|--------|------|
| Orchestrator | [`tools/agent-prompts/orchestrator.md`](./tools/agent-prompts/orchestrator.md) | Always |
| Discovery | [`tools/agent-prompts/discovery.md`](./tools/agent-prompts/discovery.md) | Always (MCP-first) |
| Architect | [`tools/agent-prompts/architect.md`](./tools/agent-prompts/architect.md) | Always |
| Implementer (PAGE) | [`tools/agent-prompts/implementer.md`](./tools/agent-prompts/implementer.md) | PAGE |
| Implementer (LIBRARY) | [`tools/agent-prompts/implementer-library.md`](./tools/agent-prompts/implementer-library.md) | LIBRARY |
| Docs Examples | [`tools/agent-prompts/docs-examples.md`](./tools/agent-prompts/docs-examples.md) | LIBRARY |
| Contract Sync | [`tools/agent-prompts/contract-sync.md`](./tools/agent-prompts/contract-sync.md) | LIBRARY (`G6`) |
| Reviewer | [`tools/agent-prompts/reviewer.md`](./tools/agent-prompts/reviewer.md) | Always |

## Pixel MCP / CLI

| Tool | MCP | CLI |
|------|-----|-----|
| Manifest search | `pixel_manifest_search` | `npm run agent:manifest-search -- --query "…"` |
| Example get | `pixel_example_get` | `npm run agent:example-get -- --canonicalId pixel-button.basic` |
| Contract check | `pixel_contract_check` | `npm run agent:contract-check -- --template '…'` |

Server entry: `node tools/pixel-mcp/server.mjs` (wired in `.cursor/mcp.json` and `.mcp.json`).

## How to start a run (Cursor)

1. Create a `runId` (example: `2026-08-24-products-page`).
2. Parent chat acts as **Orchestrator** — read `tools/agent-prompts/orchestrator.md` or the generate-page entrypoint.
3. Classify `workflowType`: `PAGE` | `LIBRARY`.
4. Write `.agent-runs/<runId>/requirement.md`.
5. **LIBRARY + new component:** create `PLAN.md` before Implementer; delete when all phases ✅.
6. Spawn specialists (Discovery **must** use MCP/CLI search):
   - Discovery → `discovery.json`
   - Architect → `composition.plan.md` + `composition.json`
   - **Stop for G1** — user approves composition (or dry-run auto-approve)
   - Implementer → code
   - LIBRARY: Docs Examples → Contract Sync
   - Reviewer → optionally run `pixel_contract_check` on templates; `review-metrics.json`
7. Quality: `npm run build:docs` (PAGE) and/or `npm run build` + tests (LIBRARY).
8. Validate: `node tools/validate-agent-run.mjs .agent-runs/<runId>`

## Gates (G0–G5 required; G6 for LIBRARY)

| Gate | Meaning | Complete-run rule |
|------|---------|-------------------|
| G0 | Docs pass + Discovery used MCP/CLI search | must `pass` |
| G1 | Composition approved | must `pass` |
| G2 | Implementation matches plan | must `pass` |
| G3 | A11y / theme | `pass` or `n/a` |
| G4 | Build / tests | must `pass` |
| G5 | Reviewer must-fix = 0; inventing = 0 | must `pass` |
| G6 | `npm run readme:api` | LIBRARY `pass`; PAGE `n/a` |

## CI checks

| Script | Purpose |
|--------|---------|
| `npm run lint:readme-sections:strict` | README sections |
| `npm run lint:generated-clean` | Generated contracts idempotent |
| `npm run agent:validate` | Golden fixtures |

## Golden dry-runs / pattern gallery

Playground routes remain available for agents (not linked from docs nav for now):

PAGE: `/playground/products`, `/playground/dashboard`, `/playground/settings-wizard`  
LIBRARY: `pixel-divider` `showSkeleton` (`golden-divider-skeleton-library`)  
Gallery page (hidden from nav): `/patterns`

## Related files

- Always-on rules: `.cursor/rules/consume-pixel-ui.mdc`, `.cursor/rules/read-docs-before-coding.mdc`
- On-demand: `.cursor/rules/generate-pixel-page.mdc`
- Inventory: `projects/pixel-ui/AI-MANIFEST.json` (query via MCP)
- Regen contracts (LIBRARY): `npm run readme:api`
