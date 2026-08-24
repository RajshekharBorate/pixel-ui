# Multi-Agent AI Development Workflow — Pixel UI

> **Status:** Phase 4 complete (Pixel MCP + contract check + generate-page entrypoint)  
> **Goal:** A repeatable multi-agent architecture so coding agents generate Pixel UI pages and library components **without inventing** styles, APIs, or interaction patterns.  
> **Depends on:** `AGENTS.md`, `AI-CONSUME.md`, `projects/pixel-ui/CONVENTIONS.md`, `projects/pixel-ui/AI-MANIFEST.json`

This document is the detailed plan for orchestrating specialized agents around Pixel UI’s existing AI-ready substrate. It does **not** replace `AI-CONSUME.md`; it describes **how many agents collaborate** to enforce that contract at scale.

---

## 1. Problem Statement

A single generalist agent often:

- Skips the documentation pass or reads only a fragment  
- Invents selectors / appearances / tokens  
- Implements UI before composition is locked  
- Ships without loading / empty / a11y / theme checks  
- Edits machine-owned artifacts by hand  

We need a **pipeline of specialized agents** with hard gates, shared artifacts, and a single orchestrator that owns the requirement-to-merge flow.

### Success definition

Given a product requirement (page or new Pixel component), the multi-agent system can:

1. Discover the correct Pixel surfaces from `AI-MANIFEST.json`  
2. Produce a locked composition plan (no invented APIs)  
3. Implement against README contracts + examples  
4. Validate build / tests / contracts / a11y / theme / responsive  
5. Sync docs + regenerate `readme:api` when library surfaces change  

…with fewer inventing failures than a single-agent chat.

---

## 2. Design Principles

| Principle | Meaning |
|-----------|---------|
| **Single source of truth** | Agents may only assert APIs present in SoT order (`AGENTS` → `AI-CONSUME` → `CONVENTIONS` → `public-api` → READMEs → meta → examples → `AI-MANIFEST`) |
| **Contracts over creativity** | Visual / interaction language is owned by Pixel UI; agents compose, they do not redesign |
| **Narrow context per agent** | Each agent gets only the files and artifact slice it needs |
| **Artifacts between stages** | Handoffs are structured JSON/Markdown plans, not vague chat summaries |
| **Gates before write** | Implementation agents cannot start until Discovery + Architect approve |
| **Verify before done** | No “done” without orchestrator checklist mapped to `AI-CONSUME` / `AGENTS` definition of done |
| **No parallel rewrite of SoT** | Only Contract Sync may regenerate machine-owned files via `npm run readme:api` |
| **Human at merge** | Agents propose; humans approve merges / breaking changes |

---

## 3. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR (Conductor)                     │
│  Owns: requirement, workflow type, gates, retries, final report │
└───────────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────┼───────────┬──────────────┬──────────────┐
    ▼           ▼           ▼              ▼              ▼
┌────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌────────────┐
│Discover│ │Architect│ │Implement │ │  Verify    │ │Contract    │
│ Agent  │─▶│ Agent   │─▶│ Agent(s) │─▶│  Agents    │─▶│Sync Agent  │
└────────┘ └─────────┘ └──────────┘ └────────────┘ └────────────┘
     │           │            │             │              │
     ▼           ▼            ▼             ▼              ▼
 discovery   composition   code + tests  gate reports   readme:api
 .json       .plan.md      / docs demo   (build/a11y/…)  + meta sync
```

### Two primary workflow types

| Type ID | When | Output |
|---------|------|--------|
| `PAGE` | Build an app/docs page using existing Pixel UI | Routes/components under `projects/docs` or consumer app; no new library exports unless gap approved |
| `LIBRARY` | Create or extend a Pixel UI component/service | `projects/pixel-ui/src/lib/...`, README, meta, examples, `public-api`, tests |

Optional third type later: `PATTERN` (document a reusable page recipe without new components).

---

## 4. Agent Roster

Each agent has: **mission**, **inputs**, **outputs**, **allowed tools**, **forbidden actions**, **exit criteria**.

### 4.1 Orchestrator (Conductor)

| | |
|--|--|
| **Mission** | Classify task (`PAGE` / `LIBRARY`), sequence agents, enforce gates, merge results, produce final report |
| **Inputs** | User requirement; repo SoT pointers |
| **Outputs** | `workflow-run.json` (status, agent results, blockers); human-readable summary |
| **Allowed** | Spawn/resume subagents; run gate commands; update todos |
| **Forbidden** | Large code edits; inventing Pixel APIs |
| **Exit** | All required gates green **or** explicit human-blocked issues listed |

**Implementation mapping (Cursor today):** Parent Agent chat + `Task` tool as subagents; later Cursor Automations / Cloud Agents for async runs.

---

### 4.2 Discovery Agent

| | |
|--|--|
| **Mission** | Map requirement → candidate Pixel components/services **from the manifest only** |
| **Inputs** | Requirement text; `AI-CONSUME.md` selection tables; `AI-MANIFEST.json` |
| **Outputs** | `artifacts/discovery.json` (schema below) |
| **Allowed** | Read manifest, registry meta, example indexes, READMEs (selected ids) |
| **Forbidden** | Write application/library code; invent ids not in manifest |
| **Exit** | Every proposed `id` exists in `AI-MANIFEST.json`; `packageImportPath` filled; gaps flagged as `libraryGap: true` |

#### `discovery.json` schema (proposed)

```json
{
  "workflowType": "PAGE | LIBRARY",
  "requirementSummary": "string",
  "pageType": "dashboard | crud | form | wizard | settings | detail | other",
  "selected": [
    {
      "id": "pixel-data-grid",
      "reason": "primary tabular surface",
      "packageImportPath": "pixel-ui/data-grid",
      "canonicalExampleId": "pixel-data-grid.basic",
      "composeWith": ["pixel-empty-state", "pixel-button"],
      "requiredStates": ["loading", "empty", "error"]
    }
  ],
  "services": [
    { "id": "pixel-export", "reason": "CSV/Excel download of grid rows" }
  ],
  "rejectedAlternatives": [
    { "id": "pixel-tree", "whyNot": "flat product list, not hierarchy" }
  ],
  "libraryGaps": [
    {
      "need": "KPI sparkline in card",
      "nearestExisting": "pixel-chart-sparkline",
      "recommendation": "compose existing"
    }
  ],
  "sourceOfTruthChecked": ["AI-CONSUME.md", "AI-MANIFEST.json"]
}
```

---

### 4.3 Architect Agent (Composition / UX)

| | |
|--|--|
| **Mission** | Lock page or component composition before code: layout, states, a11y outline, responsive notes |
| **Inputs** | `discovery.json`; selected READMEs; canonical examples; `RESPONSIVE.md` slices |
| **Outputs** | `artifacts/composition.plan.md` + `artifacts/composition.json` |
| **Allowed** | Cite real inputs/appearances from contracts; reference example source paths |
| **Forbidden** | Undocumented variants (e.g. `appearance="fancy"`); new design tokens; CDK |
| **Exit** | Plan lists concrete selectors + bindings; loading/empty/error mapped to Pixel primitives; keyboard notes for composites |

#### Composition plan must include

1. Information architecture (header → filters → content → feedback)  
2. Component tree with real selectors  
3. State matrix (default / loading / empty / error / disabled)  
4. Token usage (which `--pixel-sys-*` / component tokens)  
5. Theme (`data-theme`) and reduced-motion notes  
6. Open questions for human (if any)  

**Gate G1 — Architect approval:** Orchestrator (or human) must mark `composition.plan.md` as `approved: true` before Implementer starts.

---

### 4.4 Implementer Agent(s)

Split by workflow type. May run as one agent or parallel specialists (template vs styles vs tests).

#### 4.4a Page Implementer

| | |
|--|--|
| **Mission** | Implement the approved composition in docs playground or app routes |
| **Inputs** | Approved composition plan; example sources to clone |
| **Outputs** | Angular standalone components/routes; wired imports from correct package path |
| **Forbidden** | New library components without Architect `libraryGaps` promotion; hardcoded colors; inventing APIs |
| **Exit** | Compiles in docs/app context; matches plan selectors |

#### 4.4b Library Implementer

| | |
|--|--|
| **Mission** | Create/extend `pixel-*` under CONVENTIONS (signals, OnPush, tokens, README skeleton) |
| **Inputs** | Composition/API sketch; closest sibling component named in `AGENTS.md` |
| **Outputs** | Source, scss, template, `.spec.ts`, README stubs, meta + example stubs |
| **Forbidden** | `@angular/cdk`; constrained generics `<T extends Record<...>>`; hand-editing generated API contracts |
| **Exit** | Matches closest sibling patterns; JSDoc on inputs; host ARIA/state hooks present |

**Parallelism:** For large pages, Orchestrator may spawn:

- `Implementer-UI` (templates)  
- `Implementer-State` (signals / stores)  
- `Implementer-Tests` (after UI exists)  

They share the same approved plan and must not diverge on selectors.

---

### 4.5 Accessibility Agent

| | |
|--|--|
| **Mission** | Verify keyboard map, focus, ARIA, live regions against component READMEs |
| **Inputs** | Implemented UI; Accessibility sections of used READMEs |
| **Outputs** | `artifacts/a11y-report.md` (pass/fail + fixes applied or queued) |
| **Forbidden** | Restyling for aesthetics; inventing ARIA that contradicts native semantics |
| **Exit** | Icon-only controls have `ariaLabel`; overlays restore focus; no keyboard traps undocumented |

---

### 4.6 Theme & Responsive Agent

| | |
|--|--|
| **Mission** | Token-only styling; light/dark; breakpoints per `RESPONSIVE.md` |
| **Inputs** | Implemented UI; `_theming.scss`; component Theme sections |
| **Outputs** | `artifacts/theme-responsive-report.md`; token fixes |
| **Forbidden** | New color systems; physical `margin-left` where logical props required |
| **Exit** | No hardcoded hex for themeable surfaces; works under `data-theme`; reduced-motion respected |

---

### 4.7 Contract Sync Agent

| | |
|--|--|
| **Mission** | Keep machine-owned surfaces synchronized after library changes |
| **Inputs** | Diff of public APIs / READMEs / meta |
| **Outputs** | Regenerated README API contracts, `generated-doc-api.ts`, `AI-MANIFEST.json` |
| **Allowed commands** | `npm run readme:api` or `npm run docs:ai`; `node tools/check-readme-sections.mjs --strict` |
| **Forbidden** | Manual edits to `AI-MANIFEST.json` / `generated-doc-api.ts` |
| **Exit** | Generators clean; section lint 0 gaps for touched READMEs |

**Required for `LIBRARY` workflow;** optional no-op for pure `PAGE` consumption.

---

### 4.8 Quality Gate Agent (Verifier)

| | |
|--|--|
| **Mission** | Run mechanical verification and map results to definition of done |
| **Inputs** | Working tree after implementers |
| **Outputs** | `artifacts/quality-gate.json` |
| **Commands (library)** | `npm run build`, `npm test` (scoped if possible), `npm run build:docs` when registry touched |
| **Commands (page/docs)** | `npm run build:docs` or relevant project build |
| **Exit** | Build green; critical tests green; known flakes labeled (e.g. zone-testing tooltip) |

---

### 4.9 Reviewer Agent (Adversarial / Bugbot-like)

| | |
|--|--|
| **Mission** | Diff review against `AI-CONSUME` anti-patterns and CONVENTIONS |
| **Inputs** | Branch diff; discovery + composition artifacts |
| **Outputs** | `artifacts/review.md` (must-fix / nice-to-have) |
| **Checks** | Invented APIs; CDK; token bypass; missing empty/loading; missing docs registration for new components; secret leaks |
| **Exit** | Zero must-fix remaining **or** human override recorded |

**Cursor mapping:** `bugbot` / `security-review` Task subagents for code review; custom prompt for Pixel anti-patterns.

---

### 4.10 Optional: Docs Example Agent

| | |
|--|--|
| **Mission** | Ensure docs examples + meta stay aligned (`createDocExample`, canonical ids) |
| **When** | New/changed public component or new docs page showcasing a pattern |
| **Exit** | Example folder matches doc id; registry lists examples; canonical example marked |

---

## 5. Shared Artifact Store

Propose a run-local folder (gitignored by default, or committed only for golden runs):

```text
.agent-runs/<run-id>/
  requirement.md
  workflow-run.json
  discovery.json
  composition.plan.md
  composition.json
  a11y-report.md
  theme-responsive-report.md
  quality-gate.json
  review.md
```

Add `.agent-runs/` to `.gitignore` unless the team wants golden run fixtures under `tools/agent-fixtures/`.

### `workflow-run.json` (orchestrator state)

```json
{
  "runId": "2026-08-24-products-dashboard",
  "workflowType": "PAGE",
  "status": "in_progress | blocked | complete | failed",
  "gates": {
    "G0_docsPass": "pending | pass | fail",
    "G1_compositionApproved": "pending | pass | fail",
    "G2_implementation": "pending | pass | fail",
    "G3_a11yTheme": "pending | pass | fail",
    "G4_quality": "pending | pass | fail",
    "G5_review": "pending | pass | fail",
    "G6_contractSync": "pending | pass | n/a"
  },
  "agents": {},
  "blockers": []
}
```

---

## 6. End-to-End Workflows

### 6.1 PAGE workflow (generate a Pixel UI page)

```text
0. Orchestrator: classify PAGE; write requirement.md
1. G0 Docs pass (Orchestrator or Discovery):
     AGENTS.md → AI-CONSUME.md → CONVENTIONS (skim) → AI-MANIFEST.json
2. Discovery Agent → discovery.json
3. Gate: every id ∈ manifest; if libraryGaps need NEW component → escalate to human / switch LIBRARY
4. Architect → composition.plan.md
5. G1: human or Orchestrator approves composition
6. Page Implementer → code (clone canonical examples)
7. A11y + Theme/Responsive agents (parallel)
8. G3: both reports pass or fixes re-enter Implementer
9. Quality Gate → build:docs / tests
10. Reviewer → anti-pattern diff check
11. G5: must-fix cleared
12. Orchestrator final report; human merges
```

**Target latency:** Discovery + Architect before any write (prevents wasted inventing).

### 6.2 LIBRARY workflow (new/extend component)

```text
0. Orchestrator: classify LIBRARY; require PLAN.md per AGENTS for large work
1. G0 Docs pass (full component README set or sibling + CONVENTIONS)
2. Discovery: nearest sibling + gap justification
3. Architect: API sketch (inputs/outputs/states) aligned with siblings — still no inventing tokens
4. G1 approve API/UX sketch
5. Library Implementer (+ tests)
6. Contract Sync → npm run readme:api
7. Docs Example + meta registration
8. A11y + Theme agents
9. Quality Gate → npm run build + npm test
10. Reviewer (CONVENTIONS + public API break check)
11. Orchestrator; human reviews Breaking changes section
```

### 6.3 Failure / retry policy

| Failure | Action |
|---------|--------|
| Discovery proposes unknown id | Fail G0/G1; Discovery must re-query manifest |
| Implementer uses undocumented input | Reviewer must-fix; Implementer fixes from README contract |
| Build fail | Quality Gate returns logs; Implementer only (no Architect rewrite unless API wrong) |
| Flaky known test | Label in quality-gate.json; do not block if pre-existing and unrelated |
| Library gap mid-PAGE | Stop; ask human: compose-only vs open LIBRARY sub-workflow |

---

## 7. Prompt Pack (per agent)

Store reusable prompts under:

```text
tools/agent-prompts/
  orchestrator.md
  discovery.md
  architect.md
  implementer-page.md
  implementer-library.md
  a11y.md
  theme-responsive.md
  contract-sync.md
  quality-gate.md
  reviewer.md
```

Each prompt **must** open with:

1. Role (one sentence)  
2. Mandatory reads (file list)  
3. Output schema / path  
4. Forbidden actions (from `AI-CONSUME` anti-patterns)  
5. Exit criteria  

Orchestrator injects: `runId`, `workflowType`, paths to prior artifacts.

---

## 8. Mapping to Cursor / Current Tooling

| Plan concept | Cursor mechanism (near-term) |
|--------------|------------------------------|
| Always-on rules | `.cursor/rules/consume-pixel-ui.mdc`, `read-docs-before-coding.mdc` |
| Orchestrator | Parent Agent session |
| Specialist agents | `Task` subagents (`generalPurpose`, `explore`, `shell`, `bugbot`, `security-review`) |
| Docs pass | Forced by rules + AGENTS |
| Contract sync | `shell` subagent running `npm run readme:api` |
| Parallel implementers | Multiple `Task` calls in one turn |
| Cloud / long runs | Cursor Cloud Agents / Automations (later phase) |
| Human gate G1 | AskQuestion / explicit user approval of composition plan |

### Near-term MVP (no new infra)

1. Document this plan (this file)  
2. Add `tools/agent-prompts/*`  
3. Add Orchestrator “starter” prompt in `AI-CONSUME.md` or a short `AI-ORCHESTRATION.md` pointer  
4. Run PAGE workflow manually via parent agent spawning Task subagents  
5. Measure inventing defects on 3 golden page requests  

### Later

- Cursor Automation that triggers on “Generate page with Pixel UI”  
- Optional MCP tool: `pixel.manifest.search(query)` wrapping `AI-MANIFEST.json`  
- CI job: fail PRs that change components without `readme:api` regen  

---

## 9. MCP / Tooling Enhancements (optional phases)

| Tool | Purpose |
|------|---------|
| `pixel_manifest_search` | Keyword / category / supports filter over `AI-MANIFEST.json` |
| `pixel_example_get` | Return canonical example files for a `docId` |
| `pixel_contract_check` | Validate a proposed template string against known inputs for a selector |
| `pixel_readme_api` | Run generator and return diff summary |

These reduce Discovery/Implementer hallucination more than adding more prose.

---

## 10. Metrics & Evaluation

Run a fixed suite of **golden requirements** after each orchestration change:

| Golden | Expected Pixel surfaces (examples) |
|--------|-------------------------------------|
| Products CRUD | header, filters, data-grid, empty-state, export service |
| Dashboard | app-shell/header, cards, chart-shell + series, grid |
| Settings wizard | stepper, input/select/toggle, dialog confirm |
| Notification inbox | notification panel, navigate service deep link |

### Scorecard (per run)

| Metric | Target |
|--------|--------|
| Invented API count | 0 |
| Hardcoded theme color count | 0 |
| Missing loading/empty handling | 0 |
| Manifest miss (used id not in manifest) | 0 |
| Build pass | required |
| Human rewrite severity | trending down |

Log scores in `.agent-runs/<id>/scorecard.json` for comparison.

---

## 11. Phased Rollout Plan

### Phase 0 — Document & agree (this plan)

- [x] Substrate exists (`AI-CONSUME`, manifest, rules)  
- [ ] Review this architecture with owners  
- [ ] Decide artifact location (gitignore vs fixtures)  

### Phase 1 — Prompt pack + manual orchestration (1–2 days)

- [x] Create `tools/agent-prompts/*` (MVP five agents)
- [x] Add `AI-ORCHESTRATION.md` (short entry pointing here + how to start a run)
- [x] Wire pointer from `AI-CONSUME.md` / `AGENTS.md` / root `README.md`
- [x] Add `.agent-runs/` to `.gitignore`
- [x] Dry-run one PAGE workflow (run id `2026-08-24-products-page` → `/playground/products`)

**Exit:** One successful Products-style page without invented APIs. ✅ (`inventedApiCount: 0`, `npm run build:docs` pass)

### Phase 2 — Structured artifacts + gates (3–5 days)

- [x] JSON schemas for discovery / composition / quality-gate (`tools/agent-schemas/`)
- [x] Orchestrator checklist enforcing G0–G5 (`tools/agent-prompts/orchestrator.md`, `AI-ORCHESTRATION.md`)
- [x] `.agent-runs/` gitignore + sample fixtures (`tools/agent-fixtures/golden-*`, `npm run agent:validate`)
- [x] Three golden PAGE dry-runs scored (products, dashboard, settings-wizard)

**Exit:** Scorecard inventing metrics at 0 on goldens. ✅ (`npm run agent:validate`)

### Phase 3 — LIBRARY workflow automation (1 week)

- [x] Library implementer + contract-sync prompts (`implementer-library.md`, `contract-sync.md`, `docs-examples.md`)
- [x] Require `PLAN.md` for new components (Orchestrator G0 + `AI-ORCHESTRATION.md`)
- [x] Docs example agent (`tools/agent-prompts/docs-examples.md`)
- [x] CI check: README sections + generated artifacts dirty detection (`lint:readme-sections:strict`, `lint:generated-clean`, `agent:validate` in CI)

**Exit:** One new trivial component (or small extension) through full pipeline. ✅ (`pixel-divider` `showSkeleton`, golden `golden-divider-skeleton-library`)

### Phase 4 — Tooling / MCP (optional)

- [x] Manifest search MCP (`tools/pixel-mcp/server.mjs` → `pixel_manifest_search`)
- [x] Contract check against template strings (`pixel_contract_check` + `npm run agent:contract-check`)
- [x] Cursor Automation entrypoint (`tools/agent-prompts/entrypoint-generate-page.md`, `.cursor/rules/generate-pixel-page.mdc`)

**Exit:** Discovery agent uses MCP instead of full-file reads for selection. ✅ (`discovery.md` MCP-first; CLI fallback documented)

### Phase 5 — Continuous improvement

- [ ] Feed Reviewer must-fix back into `AI-CONSUME` anti-patterns  
- [ ] Enrich curated `composeWith` / `supports` in meta where heuristics fail  
- [ ] Golden pattern gallery routes in docs  

---

## 12. RACI (who owns what)

| Concern | Orchestrator | Discovery | Architect | Implementer | A11y/Theme | Contract Sync | Reviewer | Human |
|---------|:------------:|:---------:|:---------:|:-----------:|:----------:|:-------------:|:--------:|:-----:|
| Requirement clarity | A | C | C | I | I | I | I | R |
| Component selection | A | R | C | I | I | I | C | C |
| Composition lock | A | C | R | I | C | I | C | A (G1) |
| Code | A | I | I | R | C | I | C | C |
| Tokens / a11y | A | I | C | C | R | I | C | C |
| Manifest regen | A | I | I | I | I | R | C | I |
| Merge | I | I | I | I | I | I | C | R |

R = responsible, A = accountable, C = consulted, I = informed.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Too many agents → cost/latency | MVP: Orchestrator + Discovery + Architect + Implementer + Reviewer only; A11y/Theme merged into Reviewer early |
| Agents ignore SoT | Always-on Cursor rules + G0 gate that fails if `sourceOfTruthChecked` incomplete |
| Composition approved then silently changed | Reviewer diffs code selectors vs `composition.json` |
| Generator noise | Contract Sync only on LIBRARY; PAGE skips G6 |
| Context window overflow | Discovery returns ids only; Architect reads only those READMEs |
| Conflicting agent edits | Single Implementer writer lock; specialists sequential or file-partitioned |

---

## 14. Recommended MVP Agent Set

Start with **5 agents**, not 10:

1. **Orchestrator**  
2. **Discovery**  
3. **Architect**  
4. **Implementer** (page or library mode)  
5. **Reviewer** (includes a11y/theme anti-pattern checklist + suggests running build)

Add Contract Sync + Quality Gate as separate agents once MVP proves inventing rate drops.

---

## 15. Immediate Next Steps (when implementation is approved)

1. Add short `AI-ORCHESTRATION.md` entry + link from `AI-CONSUME.md` and `AGENTS.md`.  
2. Create `tools/agent-prompts/` for the MVP five agents.  
3. Add `.agent-runs/` to `.gitignore`.  
4. Run dry-run: “Products management page” through Discovery → Architect → Implementer → Reviewer.  
5. Capture scorecard; tighten prompts where inventing still occurs.  

---

## 16. Relationship to Existing Files

| File | Role vs this plan |
|------|-------------------|
| `AGENTS.md` | Library contribution law; docs pass; definition of done |
| `AI-CONSUME.md` | What any agent must obey when generating UI |
| **This file** | How multiple agents divide labor to obey those laws |
| `AI-MANIFEST.json` | Machine inventory Discovery must query |
| `.cursor/rules/*` | Always-on enforcement hooks for single- and multi-agent runs |

```text
Laws (AGENTS + AI-CONSUME + CONVENTIONS)
        ↑ enforced by
Rules (.cursor) + Gates (this workflow)
        ↑ executed by
Agents (roster above)
        ↑ informed by
AI-MANIFEST + READMEs + examples
```

---

## 17. Out of Scope (for this plan)

- Replacing Pixel UI with another design system  
- Building a separate product “AI app builder” UI  
- Hand-maintained duplicate YAML APIs for every component  
- Requiring Storybook (docs site remains the playground)  

---

**Plan owner:** Pixel UI maintainers + AI workflow owners  
**Implementation trigger:** Explicit approval to execute Phase 1 (prompt pack + dry-run)
)
