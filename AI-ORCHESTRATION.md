# AI-ORCHESTRATION.md — start a multi-agent Pixel UI run

Short entry for **Phase 3** multi-agent orchestration (PAGE + LIBRARY).
Full architecture: [`AI-MULTI-AGENT-WORKFLOW.md`](./AI-MULTI-AGENT-WORKFLOW.md).
Consumption laws: [`AI-CONSUME.md`](./AI-CONSUME.md).

## When to use

Use this workflow when an AI (or team of AIs) must:

- Generate an application / docs **page** with Pixel UI, or
- Create / extend a **library** component

Do **not** skip Discovery → Architect before coding.

## Agents

| Agent | Prompt | When |
|-------|--------|------|
| Orchestrator | [`tools/agent-prompts/orchestrator.md`](./tools/agent-prompts/orchestrator.md) | Always |
| Discovery | [`tools/agent-prompts/discovery.md`](./tools/agent-prompts/discovery.md) | Always |
| Architect | [`tools/agent-prompts/architect.md`](./tools/agent-prompts/architect.md) | Always |
| Implementer (PAGE) | [`tools/agent-prompts/implementer.md`](./tools/agent-prompts/implementer.md) | PAGE |
| Implementer (LIBRARY) | [`tools/agent-prompts/implementer-library.md`](./tools/agent-prompts/implementer-library.md) | LIBRARY |
| Docs Examples | [`tools/agent-prompts/docs-examples.md`](./tools/agent-prompts/docs-examples.md) | LIBRARY (and PAGE when demos need new examples) |
| Contract Sync | [`tools/agent-prompts/contract-sync.md`](./tools/agent-prompts/contract-sync.md) | LIBRARY only (`G6`) |
| Reviewer | [`tools/agent-prompts/reviewer.md`](./tools/agent-prompts/reviewer.md) | Always |

## How to start a run (Cursor)

1. Create a `runId` (example: `2026-08-24-divider-skeleton`).
2. Parent chat acts as **Orchestrator** — read `tools/agent-prompts/orchestrator.md`.
3. Classify `workflowType`: `PAGE` | `LIBRARY`.
4. Write `.agent-runs/<runId>/requirement.md`.
5. **LIBRARY + new component:** create `projects/pixel-ui/src/lib/pixel-<name>/PLAN.md` before Implementer (phased scope + exit criteria). Extensions may use a short PLAN when multi-phase; delete PLAN when all phases are ✅.
6. Spawn specialists:
   - Discovery → `discovery.json`
   - Architect → `composition.plan.md` + `composition.json`
   - **Stop for G1** — user approves composition (or dry-run auto-approve)
   - Implementer (page or library)
   - LIBRARY: Docs Examples → Contract Sync (`npm run readme:api`)
   - Reviewer → `review.md` + `review-metrics.json`
7. Quality: `npm run build:docs` (PAGE) and/or `npm run build` + tests (LIBRARY).
8. Validate: `node tools/validate-agent-run.mjs .agent-runs/<runId>`

Artifact folder (gitignored for ad-hoc runs):

```text
.agent-runs/<runId>/
  requirement.md
  workflow-run.json
  discovery.json
  composition.plan.md
  composition.json
  implementation-notes.md
  docs-examples.md          # LIBRARY
  contract-sync.md          # LIBRARY
  review.md
  review-metrics.json
  scorecard.json
```

Committed golden samples: `tools/agent-fixtures/golden-*` via `npm run agent:validate`.

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
| G0 | Docs pass: `AGENTS.md` → `AI-CONSUME.md` → manifest (+ CONVENTIONS for LIBRARY) | must `pass` |
| G1 | Composition approved before Implementer | must `pass`; `composition.approved === true` |
| G2 | Implementation matches approved selectors/API | must `pass` |
| G3 | A11y / theme walkthrough | `pass` or `n/a` |
| G4 | Build (and tests if LIBRARY) | must `pass` |
| G5 | Reviewer must-fix = 0; inventing metrics = 0 | must `pass` |
| G6 | Contract Sync (`npm run readme:api`) | LIBRARY must `pass`; PAGE `n/a` |

**PLAN.md gate (LIBRARY new components):** Orchestrator fails G0/G1 if a **new** `pixel-*` folder lacks `PLAN.md` before coding.

## CI checks (Phase 3)

| Script | Purpose |
|--------|---------|
| `npm run lint:readme-sections:strict` | README Behavior / Accessibility / Theme sections present |
| `npm run lint:generated-clean` | Regenerating contracts leaves no dirty generated files |
| `npm run agent:validate` | Golden fixture schemas + inventing metrics |

Wired in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

## Golden dry-runs

### PAGE (Phase 2)

| Golden | Route |
|--------|-------|
| Products | `/playground/products` |
| Dashboard | `/playground/dashboard` |
| Settings wizard | `/playground/settings-wizard` |

### LIBRARY (Phase 3)

| Golden | Change |
|--------|--------|
| Divider skeleton | `showSkeleton` on `pixel-divider` + docs example |

Success = scorecard `inventedApiCount: 0`, contracts regenerated via Contract Sync, CI dirty checks green.

## Related files

- Always-on rules: `.cursor/rules/consume-pixel-ui.mdc`, `.cursor/rules/read-docs-before-coding.mdc`
- Inventory: `projects/pixel-ui/AI-MANIFEST.json`
- Regen contracts (LIBRARY): `npm run readme:api`
