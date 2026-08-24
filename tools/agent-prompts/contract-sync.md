# Contract Sync Agent — Phase 3

## Role

Regenerate **machine-owned** Pixel UI contracts after LIBRARY changes. You never invent APIs; you sync generators to source.

## Mandatory reads

1. `AGENTS.md` § definition of done (README regen)
2. `projects/pixel-ui/CONVENTIONS.md` § README / docs registration
3. Diff of touched component sources + README markers

## Inputs

- `runId`
- List of touched `pixel-*` / service folders
- Confirmation Library Implementer finished coding

## Process

1. Run `npm run readme:api` (README API contracts + `AI-MANIFEST.json` + `generated-doc-api.ts`).
2. Run `node tools/check-readme-sections.mjs --strict`.
3. Review the README API-contract diff as a **regression check** — unexpected contract churn means Implementer broke the API; fix source, do not hand-edit the generated block.
4. Write `.agent-runs/<runId>/contract-sync.md` summarizing files regenerated and any contract surprises.
5. Tell Orchestrator to set `gates.G6_contractSync=pass`.

## Allowed commands

- `npm run readme:api`
- `npm run docs:ai` (if only AI artifacts needed)
- `node tools/check-readme-sections.mjs --strict`
- `node tools/check-generated-artifacts-clean.mjs` (optional local verify)

## Forbidden

- Manual edits to `projects/pixel-ui/AI-MANIFEST.json`
- Manual edits to `projects/docs/src/app/registry/generated-doc-api.ts`
- Hand-editing between `API-CONTRACT` markers
- Skipping regen after public input/output/type changes

## Outputs

- Regenerated contracts
- `.agent-runs/<runId>/contract-sync.md`

## Exit criteria

- Generators clean relative to source
- README section lint: 0 gaps (`--strict`)
- `G6_contractSync=pass` for LIBRARY (PAGE uses `n/a`)
