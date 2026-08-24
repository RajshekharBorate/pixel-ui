# Pixel UI Workspace

Pixel UI is an Angular 21 design-system workspace with two main surfaces:

- `projects/pixel-ui/` is the standalone component and service library.
- `projects/docs/` is the runnable docs site and the only manual playground for the library.

This repository is optimized for both human contributors and coding agents. The goal is to make
component usage, theming, accessibility behavior, and composition rules discoverable from one
reliable contract instead of inference.

## AI Consumption

If you are a coding agent or using one, trust the repo in this order:

1. `AGENTS.md` for the workflow, architecture role, and definition of done.
2. `AI-CONSUME.md` for **page and component generation** — discovery, composition, tokens, anti-patterns, validation (enforced by `.cursor/rules/consume-pixel-ui.mdc`).
3. `projects/pixel-ui/CONVENTIONS.md` for mechanical Angular, theming, overlay, and testing rules.
4. `projects/pixel-ui/src/public-api.ts` for the supported import surface.
5. Component or service `README.md` files under `projects/pixel-ui/src/lib/` for behavior contracts.
6. `projects/docs/src/app/registry/components/*.meta.ts` for curated summaries and docs taxonomy.
7. `projects/docs/src/app/examples/**` for runnable examples.
8. `projects/pixel-ui/AI-MANIFEST.json` for the generated machine-readable union of the sources above.

Agents should not invent styling, spacing, states, keyboard contracts, or composition patterns
that contradict these files.

## Source Of Truth

- `projects/pixel-ui/src/public-api.ts` defines what consumers are allowed to import.
- `tools/generate-readme-api.mjs` regenerates machine-owned API contract sections in every
  component and service README.
- `tools/generate-ai-doc-artifacts.mjs` emits the generated docs API surface and
  `projects/pixel-ui/AI-MANIFEST.json`.
- `projects/docs/src/app/registry/generated-doc-api.ts` is machine-owned and feeds registry data
  back into the docs app.

Curated prose stays in the docs meta files and READMEs. Machine-derivable API rows, normalized
selectors, imports, and example identifiers come from the generators.

## Workspace Layout

- `projects/pixel-ui/src/lib/pixel-*/` component folders with source, tests, and README contracts.
- `projects/pixel-ui/src/lib/services/*/` headless service folders with README contracts.
- `projects/pixel-ui/src/styles/` shared theming tokens and Sass entrypoints.
- `projects/docs/src/app/registry/` docs metadata and generated registry API data.
- `projects/docs/src/app/examples/` canonical runnable examples used by the docs site.
- `tools/` repo automation, contract generators, and standards checks.

## Common Commands

```bash
npm run build
npm test
npm run docs
npm run build:docs
npm run readme:api
```

`npm run readme:api` is the contract sync command. It refreshes README API sections, generated
docs API data, and the AI manifest in one pass.

## Contributing Notes

- Follow the documentation pass in `AGENTS.md` before editing Angular code.
- Do not add `@angular/cdk`; overlays, focus, and motion helpers are hand-rolled in `shared/`.
- Every meaningful component change must keep README contracts, docs registration, examples,
  exports, and tests aligned.
