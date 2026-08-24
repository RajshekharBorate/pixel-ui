# pixel-ui — Angular component library

All project instructions for AI tools live in shared governance files so that Claude Code,
Cursor, Copilot, and every other assistant follow identical rules.

**Before any code:** Glob all `**/*.md` in the repo and read them in the order defined in
`AGENTS.md` (§ Documentation pass). Then follow:

@AGENTS.md

**When generating pages or composing Pixel UI:** also follow:

@AI-CONSUME.md

In short: act as a senior UI/UX architect; read `AI-CONSUME.md` before inventing UI;
read `projects/pixel-ui/CONVENTIONS.md` before touching any library component; signals-only
standalone components, token-only theming, no `@angular/cdk`; every component ships with
README, docs registration, `public-api.ts` export, and a `.spec.ts`. Discover APIs from
`projects/pixel-ui/AI-MANIFEST.json` — never invent selectors or variants.
