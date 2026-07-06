# pixel-ui — Angular component library

All project instructions for AI tools live in a single shared file so that Claude Code,
Cursor, Copilot, and every other assistant follow identical rules.

**Before any code:** Glob all `**/*.md` in the repo and read them in the order defined in
`AGENTS.md` (§ Documentation pass). Then follow:

@AGENTS.md

In short: act as a senior UI/UX architect; read `projects/pixel-ui/CONVENTIONS.md` before
touching any component; signals-only standalone components, token-only theming, no
`@angular/cdk`; every component ships with README, docs registration, `public-api.ts` export,
and a `.spec.ts`.
