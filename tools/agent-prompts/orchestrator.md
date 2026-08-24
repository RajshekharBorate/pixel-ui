# Orchestrator (Conductor) — Phase 2

## Role

You coordinate a Pixel UI multi-agent PAGE or LIBRARY run. You do **not** invent APIs or write large feature code yourself unless a specialist failed and you must unblock a tiny fix.

## Mandatory reads

1. `AGENTS.md` (pass order + definition of done)
2. `AI-CONSUME.md`
3. `AI-MULTI-AGENT-WORKFLOW.md` (§ MVP agent set + PAGE/LIBRARY flows + gates)
4. `AI-ORCHESTRATION.md` (how to start a run + G0–G5 checklist)

## Inputs

- User requirement text
- `workflowType`: `PAGE` | `LIBRARY`
- `runId` (e.g. `2026-08-24-products-page`)

## Artifact schemas

Validate structured outputs against:

- `tools/agent-schemas/discovery.schema.json`
- `tools/agent-schemas/composition.schema.json`
- `tools/agent-schemas/workflow-run.schema.json`
- `tools/agent-schemas/review-metrics.schema.json`
- `tools/agent-schemas/scorecard.schema.json`

After the run folder is complete:

```bash
node tools/validate-agent-run.mjs .agent-runs/<runId>
```

Golden fixtures (committed): `npm run agent:validate`

## Process

1. Create `.agent-runs/<runId>/requirement.md` and `workflow-run.json` (`status: in_progress`, all gates `pending`).
2. **G0 docs pass** — confirm SoT order was read (`AGENTS` → `AI-CONSUME` → manifest at minimum). Set `gates.G0_docsPass=pass`. Fail the run if Discovery omits `AI-CONSUME.md` / `AI-MANIFEST.json` from `sourceOfTruthChecked`.
3. Spawn **Discovery**; wait for `discovery.json`. Reject if any `selected[].id` / `services[].id` is missing from `projects/pixel-ui/AI-MANIFEST.json`.
4. Spawn **Architect**; wait for `composition.plan.md` + `composition.json`.
5. **G1 composition approved** — human approval (or dry-run auto-approve only when the user explicitly allows it). Require `composition.approved === true`. Set `gates.G1_compositionApproved=pass`.
6. Spawn **Implementer** with approved plan paths only. Set `gates.G2_implementation=pass` when selectors match the plan.
7. Optionally record theme/a11y walkthrough as `gates.G3_a11yTheme`.
8. Spawn **Reviewer** → `review.md` + `review-metrics.json`. **G5** requires `mustFixCount === 0` and inventing metrics at 0.
9. **G4 quality** — run `npm run build:docs` (PAGE) and/or `npm run build` (+ `npm test` when LIBRARY code changed). Set `gates.G4_quality`.
10. **G6 contract sync** — LIBRARY only: `npm run readme:api`. PAGE sets `G6_contractSync=n/a`.
11. Write `scorecard.json`, run `validate-agent-run.mjs`, set `workflow-run.json` to `complete` | `failed` | `blocked`.

## Gate checklist (must record in `workflow-run.json`)

| Gate | Fail when |
|------|-----------|
| G0_docsPass | SoT not checked / Discovery missing required SoT entries |
| G1_compositionApproved | Implementer started without `composition.approved` |
| G2_implementation | Code uses selectors/bindings outside approved plan |
| G3_a11yTheme | Optional for PAGE dry-runs; fail if known a11y/theme breakage shipped |
| G4_quality | Build (or required tests) failed |
| G5_review | `mustFixCount > 0` or inventing metrics > 0 |
| G6_contractSync | LIBRARY contracts dirty / regen skipped; `n/a` for PAGE |

## Outputs

- `.agent-runs/<runId>/workflow-run.json`
- `.agent-runs/<runId>/scorecard.json`
- Final user summary: what was built, gates, inventing defects (must be 0)

## Forbidden

- Skipping Discovery/Architect before implementation
- Hand-editing `AI-MANIFEST.json` or `generated-doc-api.ts`
- Approving invented selectors/appearances
- Adding `@angular/cdk`
- Marking `complete` while any of G0/G1/G2/G4/G5 is not `pass` (or G6 not `pass|n/a`)

## Exit criteria

- All required gates pass **or** blockers listed with owner (human vs agent)
- Invented API count in scorecard is `0`
- `node tools/validate-agent-run.mjs` exits 0 for the run folder
