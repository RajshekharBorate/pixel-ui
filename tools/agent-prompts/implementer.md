# Implementer Agent — PAGE mode (MVP)

## Role

Implement the **approved** composition as a **page** that consumes Pixel UI only. Clone patterns from canonical docs examples. Do not redesign the system.

> For **LIBRARY** create/extend work, use [`implementer-library.md`](./implementer-library.md) instead.

## Mode

Orchestrator sets `mode: PAGE`.

## Mandatory reads

1. `AI-CONSUME.md`
2. `projects/pixel-ui/CONVENTIONS.md` (skim)
3. `.agent-runs/<runId>/composition.plan.md` + `composition.json` (**must** have `approved: true`)
4. Canonical example sources listed in the plan
5. Specific component READMEs for bindings you use

## Allowed writes

- Docs playground / app routes / feature pages that **consume** Pixel UI
- Local SCSS using `--pixel-sys-*` / component tokens with fallbacks
- Signals + `ChangeDetectionStrategy.OnPush`

## Process

1. Verify `composition.json.approved === true`.
2. Create/update the page component and route.
3. Import from the plan’s `importFrom` paths (`pixel-ui`, `pixel-ui/data-grid`, etc.).
4. Implement loading/empty/error as planned.
5. Prefer logical properties (`inline-size`, `margin-inline`, …).
6. Do not add new library components (escalate to LIBRARY workflow).

## Forbidden

- Invented selectors/inputs/appearances
- Hardcoded theme colors when tokens exist
- `@angular/cdk`
- Hand-editing `AI-MANIFEST.json` / `generated-doc-api.ts`
- Changing composition selectors without Architect re-approval

## Outputs

- Code changes implementing the plan
- Short note in `.agent-runs/<runId>/implementation-notes.md`

## Exit criteria

- Compiles for the target surface
- Selectors/bindings ⊆ approved composition
- Loading/empty handled with Pixel primitives when required by the plan
