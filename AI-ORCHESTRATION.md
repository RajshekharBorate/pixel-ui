# AI-ORCHESTRATION.md — start a multi-agent Pixel UI run

Short entry for **Phase 2** multi-agent orchestration (schemas + G0–G5 gates + golden fixtures).
Full architecture: [`AI-MULTI-AGENT-WORKFLOW.md`](./AI-MULTI-AGENT-WORKFLOW.md).
Consumption laws: [`AI-CONSUME.md`](./AI-CONSUME.md).

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
6. Validate: `node tools/validate-agent-run.mjs .agent-runs/<runId>`

Artifact folder (gitignored for ad-hoc runs):

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

Committed golden samples live under `tools/agent-fixtures/golden-*` and are checked with:

```bash
npm run agent:validate
```

## Schemas

| Artifact | Schema |
|----------|--------|
| `discovery.json` | `tools/agent-schemas/discovery.schema.json` |
| `composition.json` | `tools/agent-schemas/composition.schema.json` |
| `workflow-run.json` | `tools/agent-schemas/workflow-run.schema.json` |
| `review-metrics.json` | `tools/agent-schemas/review-metrics.schema.json` |
| `scorecard.json` (quality gate) | `tools/agent-schemas/scorecard.schema.json` |

## Gates (G0–G5 required; G6 for LIBRARY)

| Gate | Meaning | Complete-run rule |
|------|---------|-------------------|
| G0 | Docs pass: `AGENTS.md` → `AI-CONSUME.md` → manifest | must `pass` |
| G1 | Composition approved before Implementer | must `pass`; `composition.approved === true` |
| G2 | Implementation matches approved selectors | must `pass` |
| G3 | A11y / theme walkthrough | `pass` or `n/a` |
| G4 | Build (and tests if LIBRARY) | must `pass` |
| G5 | Reviewer must-fix = 0; inventing metrics = 0 | must `pass` |
| G6 | `npm run readme:api` contract sync | LIBRARY `pass`; PAGE `n/a` |

Orchestrator must refuse `status: complete` while G0/G1/G2/G4/G5 are not `pass`.

## Golden PAGE dry-runs (Phase 2)

| Golden | Route | Focus |
|--------|-------|--------|
| Products | `/playground/products` | cards + search + data grid + export |
| Dashboard | `/playground/dashboard` | KPI cards + sparklines + activity grid |
| Settings wizard | `/playground/settings-wizard` | stepper + input/select/toggle |

Success = each scorecard has `inventedApiCount: 0`, `manifestMissCount: 0`, and `npm run agent:validate` passes.

## Related files

- Always-on rules: `.cursor/rules/consume-pixel-ui.mdc`, `.cursor/rules/read-docs-before-coding.mdc`
- Inventory: `projects/pixel-ui/AI-MANIFEST.json`
- Regen contracts (LIBRARY): `npm run readme:api`
