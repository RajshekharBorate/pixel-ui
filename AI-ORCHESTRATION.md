# AI-ORCHESTRATION.md — start a multi-agent Pixel UI run

Short entry for **Phase 1 (MVP)** multi-agent orchestration. Full architecture:
[`AI-MULTI-AGENT-WORKFLOW.md`](./AI-MULTI-AGENT-WORKFLOW.md). Consumption laws:
[`AI-CONSUME.md`](./AI-CONSUME.md).

## When to use

Use this workflow when an AI (or team of AIs) must:

- Generate an application / docs **page** with Pixel UI, or
- Create / extend a **library** component

Do **not** skip Discovery → Architect before coding.

## MVP agents (5)

| Agent | Prompt |
|-------|--------|
| Orchestrator | [`tools/agent-prompts/orchestrator.md`](./tools/agent-prompts/orchestrator.md) |
| Discovery | [`tools/agent-prompts/discovery.md`](./tools/agent-prompts/discovery.md) |
| Architect | [`tools/agent-prompts/architect.md`](./tools/agent-prompts/architect.md) |
| Implementer | [`tools/agent-prompts/implementer.md`](./tools/agent-prompts/implementer.md) |
| Reviewer | [`tools/agent-prompts/reviewer.md`](./tools/agent-prompts/reviewer.md) |

## How to start a run (Cursor)

1. Create a `runId` (example: `2026-08-24-products-page`).
2. Parent chat acts as **Orchestrator** — read `tools/agent-prompts/orchestrator.md`.
3. Write `.agent-runs/<runId>/requirement.md` with the user ask.
4. Spawn specialists via the Task tool (or sequential turns), each loaded with its prompt file + prior artifacts:
   - Discovery → `discovery.json`
   - Architect → `composition.plan.md` + `composition.json`
   - **Stop for G1** — user approves composition (or user said dry-run auto-approve)
   - Implementer → code
   - Reviewer → `review.md` + `review-metrics.json`
5. Orchestrator runs `npm run build:docs` (PAGE) and writes `scorecard.json` + updates `workflow-run.json`.

Artifact folder (gitignored):

```text
.agent-runs/<runId>/
  requirement.md
  workflow-run.json
  discovery.json
  composition.plan.md
  composition.json
  implementation-notes.md
  review.md
  review-metrics.json
  scorecard.json
```

## Gates (MVP)

| Gate | Meaning |
|------|---------|
| G0 | Docs pass: `AGENTS.md` → `AI-CONSUME.md` → manifest |
| G1 | Composition approved before Implementer |
| G2 | Implementation matches approved selectors |
| G4 | Build (and tests if LIBRARY) |
| G5 | Reviewer must-fix = 0 |

## Golden dry-run requirement (Phase 1 exit)

> Create an enterprise Products management page using Pixel UI: page header, summary cards, filters, searchable data grid, loading and empty states, responsive layout, dark-theme-safe tokens.

Expected surfaces (non-exhaustive): `pixel-card`, `pixel-input` / `pixel-button`, `pixel-data-grid`, `pixel-empty-state`, optional `PixelExportService`.

Success = scorecard `inventedApiCount: 0` and docs playground route builds.

## Related files

- Always-on rules: `.cursor/rules/consume-pixel-ui.mdc`, `.cursor/rules/read-docs-before-coding.mdc`
- Inventory: `projects/pixel-ui/AI-MANIFEST.json`
- Regen contracts (LIBRARY): `npm run readme:api`
