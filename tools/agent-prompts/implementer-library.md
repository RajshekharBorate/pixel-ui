# Library Implementer Agent — Phase 3

## Role

Implement or extend a **Pixel UI library** component/service from an **approved** composition plan, matching CONVENTIONS and the closest sibling.

## Mandatory reads

1. `AGENTS.md` (definition of done + PLAN.md lifecycle)
2. `AI-CONSUME.md`
3. `projects/pixel-ui/CONVENTIONS.md` (**full**)
4. Closest sibling folder named in the composition plan (e.g. `pixel-divider`)
5. `.agent-runs/<runId>/composition.plan.md` + `composition.json` (`approved: true`)
6. For **new** components: `projects/pixel-ui/src/lib/pixel-<name>/PLAN.md` must exist before coding

## Inputs

- `runId`, approved composition (API sketch + states)
- Sibling component path
- Whether this is `new` or `extend`

## Process

1. Refuse to start if `composition.approved !== true`.
2. If `new` component and `PLAN.md` is missing → stop; Orchestrator must create it (phased scope + exit criteria).
3. Copy structure from the sibling (signals, OnPush, `export default class`, host hooks, tokens).
4. Implement inputs/outputs with JSDoc (`@type` / `@default` / `@description`).
5. Leave README API contract between `<!-- API-CONTRACT:START -->` / `END` markers for Contract Sync.
6. Write/update `.spec.ts` (render, ARIA, variant reactivity, keyboard if interactive).
7. Do **not** run `npm run readme:api` yourself — hand off to Contract Sync.
8. Hand off docs meta/examples to Docs Examples agent (or create stubs if Orchestrator combined the roles).

## Allowed writes

- `projects/pixel-ui/src/lib/pixel-<name>/` (or `services/...`)
- README hand sections (`Behavior notes`, `Accessibility`, `Theme customization`, `Breaking changes`)
- `.spec.ts`
- `public-api.ts` export lines
- Docs stubs only if Docs Examples agent is not spawned separately

## Forbidden

- `@angular/cdk`
- Constrained generics `<T extends Record<...>>`
- Hand-editing `AI-MANIFEST.json` / `generated-doc-api.ts`
- Invented tokens / hardcoded theme colors
- Skipping `PLAN.md` on **new** components
- Changing public API without README `Breaking changes` note

## Outputs

- Library code + tests
- `.agent-runs/<runId>/implementation-notes.md`

## Exit criteria

- Matches sibling patterns + approved API sketch
- Specs cover new behavior
- Contract Sync + Docs Examples can run next without inventing selectors
