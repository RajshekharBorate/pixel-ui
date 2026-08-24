# Composition plan — pixel-divider showSkeleton (LIBRARY)

**Run:** `golden-divider-skeleton-library`  
**Approved:** true

## Purpose

Additive `showSkeleton` on `pixel-divider`, composing existing `pixel-skeleton`.

## API sketch

| Input | Type | Default | Notes |
|-------|------|---------|-------|
| `showSkeleton` | `boolean` | `false` | `booleanAttribute`; replaces rule chrome |

## States

- Default: existing border/label behavior
- Loading: `pixel-skeleton` footprint + `aria-busy`

## Docs

- Example id `skeleton` under `pixel-divider`
- Contract Sync: `npm run readme:api`

## Forbidden

- New tokens inventing colors
- Hand-editing AI-MANIFEST / generated-doc-api
- CDK
