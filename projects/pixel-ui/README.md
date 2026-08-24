# Pixel UI Library

`pixel-ui` is a standalone Angular 21 component and service library designed for enterprise UI
workflows, docs-driven development, and reliable agent consumption.

## What To Trust

Use the library in this source-of-truth order:

1. `../AGENTS.md`
2. `../AI-CONSUME.md` — required when generating pages or composing Pixel UI
3. `CONVENTIONS.md`
4. `src/public-api.ts`
5. `src/lib/pixel-*/README.md` and `src/lib/services/*/README.md`
6. `../docs/src/app/registry/components/*.meta.ts`
7. `../docs/src/app/examples/**`
8. `AI-MANIFEST.json`

`CONVENTIONS.md` wins on mechanical rules. Component and service `README.md` files are the
behavior contracts. `AI-MANIFEST.json` is the generated machine-readable join, not the place to
invent new behavior.

## AI Consumption

Agents should be able to answer these questions without guessing:

- What package path should I import from?
- Which selector or service should I use?
- Which states, variants, and capabilities are supported?
- Which Pixel components should be composed together?
- Which examples are canonical?
- Which theme tokens are safe to override?

The repo now supports that flow through:

- `../AI-CONSUME.md` for the mandatory generation workflow and anti-patterns.
- `src/public-api.ts` for imports and symbol ownership.
- `src/lib/**/README.md` for behavior and accessibility rules.
- `AI-MANIFEST.json` for normalized selectors, imports, states, examples, and theme-token hooks.
- `../../tools/generate-ai-doc-artifacts.mjs` for regenerating machine-owned artifacts.

## Library Surfaces

- Components live under `src/lib/pixel-*/`.
- Headless services live under `src/lib/services/*/`.
- Shared overlays, focus helpers, and motion utilities live under `src/lib/shared/`.
- Design tokens and Sass entrypoints live under `src/styles/`.

This library intentionally avoids `@angular/cdk`. Reuse the existing shared primitives instead of
adding a parallel overlay or focus system.

## Generated Contracts

Run this whenever the public contract changes:

```bash
npm run readme:api
```

That command regenerates:

- machine-owned `## API contract` sections in component and service README files,
- `../docs/src/app/registry/generated-doc-api.ts`,
- `AI-MANIFEST.json`.

Curated prose remains hand-authored in meta files and README sections outside the API markers.

## Build And Test

```bash
npm run build
npm test
```

For manual verification, run the docs app:

```bash
npm run docs
```

## Definition Of Done

A component or service change is not complete until:

- exports stay aligned with `src/public-api.ts`,
- README contracts regenerate cleanly,
- docs registry metadata still renders,
- examples remain runnable and discoverable,
- relevant tests pass.
