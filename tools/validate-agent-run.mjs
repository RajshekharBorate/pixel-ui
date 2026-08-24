/**
 * Validates a Pixel UI multi-agent run folder against Phase 2 schemas + gate checklist.
 *
 * Usage:
 *   node tools/validate-agent-run.mjs <runDir>
 *   node tools/validate-agent-run.mjs --fixtures
 *
 * Exit 0 when all checks pass; 1 on validation failure.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_DIR = join(ROOT, 'tools/agent-schemas');
const MANIFEST_PATH = join(ROOT, 'projects/pixel-ui/AI-MANIFEST.json');
const FIXTURES_DIR = join(ROOT, 'tools/agent-fixtures');

const REQUIRED_FILES = [
  'requirement.md',
  'workflow-run.json',
  'discovery.json',
  'composition.plan.md',
  'composition.json',
  'review-metrics.json',
  'scorecard.json',
];

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

/** Minimal draft-2020-12 subset used by our agent schemas (no $ref recursion beyond one $defs hop). */
function validateAgainstSchema(data, schema, path = '$', defs = schema.$defs ?? {}) {
  const errors = [];
  const resolved = schema.$ref
    ? defs[schema.$ref.replace(/^#\/\$defs\//, '')] ?? schema
    : schema;

  if (resolved.type) {
    const actual = typeOf(data);
    const allowed = Array.isArray(resolved.type) ? resolved.type : [resolved.type];
    const matches = allowed.some((type) => {
      if (type === 'integer') return actual === 'number' && Number.isInteger(data);
      return type === actual;
    });
    if (!matches) {
      errors.push(`${path}: expected ${allowed.join('|')}, got ${actual}`);
      return errors;
    }
  }

  if (resolved.enum && !resolved.enum.includes(data)) {
    errors.push(`${path}: value ${JSON.stringify(data)} not in enum ${JSON.stringify(resolved.enum)}`);
  }

  if (typeof data === 'string') {
    if (resolved.minLength != null && data.length < resolved.minLength) {
      errors.push(`${path}: string shorter than minLength ${resolved.minLength}`);
    }
    if (resolved.pattern && !new RegExp(resolved.pattern).test(data)) {
      errors.push(`${path}: string does not match pattern ${resolved.pattern}`);
    }
  }

  if (typeof data === 'number') {
    if (resolved.minimum != null && data < resolved.minimum) {
      errors.push(`${path}: number below minimum ${resolved.minimum}`);
    }
  }

  if (Array.isArray(data)) {
    if (resolved.minItems != null && data.length < resolved.minItems) {
      errors.push(`${path}: array shorter than minItems ${resolved.minItems}`);
    }
    if (resolved.items) {
      data.forEach((item, index) => {
        errors.push(...validateAgainstSchema(item, resolved.items, `${path}[${index}]`, defs));
      });
    }
  }

  if (isObject(data) && resolved.properties) {
    for (const key of resolved.required ?? []) {
      if (!(key in data)) errors.push(`${path}: missing required property "${key}"`);
    }
    if (resolved.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!(key in resolved.properties)) {
          errors.push(`${path}: unexpected property "${key}"`);
        }
      }
    }
    for (const [key, propSchema] of Object.entries(resolved.properties)) {
      if (key in data) {
        errors.push(...validateAgainstSchema(data[key], propSchema, `${path}.${key}`, defs));
      }
    }
  }

  return errors;
}

function assertGateChecklist(workflow) {
  const errors = [];
  const gates = workflow.gates ?? {};
  const required = [
    'G0_docsPass',
    'G1_compositionApproved',
    'G2_implementation',
    'G4_quality',
    'G5_review',
    'G7_humanQa',
  ];

  for (const gate of required) {
    if (!(gate in gates)) {
      errors.push(`workflow-run.gates missing ${gate}`);
      continue;
    }
    if (workflow.status === 'complete' && gates[gate] !== 'pass' && gates[gate] !== 'n/a') {
      errors.push(`complete run requires ${gate}=pass|n/a (got ${gates[gate]})`);
    }
  }

  if (workflow.status === 'complete') {
    if (gates.G1_compositionApproved !== 'pass') {
      errors.push('G1_compositionApproved must be pass before complete');
    }
    if (gates.G0_docsPass !== 'pass') {
      errors.push('G0_docsPass must be pass before complete');
    }
    if (gates.G7_humanQa !== 'pass' && gates.G7_humanQa !== 'n/a') {
      errors.push('complete run requires G7_humanQa=pass|n/a (human green or explicit opt-out)');
    }
  }

  if (workflow.status === 'awaiting_human_qa' && gates.G7_humanQa === 'pass') {
    errors.push('awaiting_human_qa is inconsistent with G7_humanQa=pass');
  }

  if (workflow.workflowType === 'PAGE' && gates.G6_contractSync && gates.G6_contractSync !== 'n/a') {
    // PAGE may leave G6 as n/a; fail only if explicitly failed.
    if (gates.G6_contractSync === 'fail') {
      errors.push('G6_contractSync failed');
    }
  }

  return errors;
}

function assertBugsArtifact(bugs, workflow) {
  const errors = [];
  const gates = workflow.gates ?? {};

  if (!bugs) {
    if (workflow.status === 'awaiting_human_qa') {
      errors.push('awaiting_human_qa requires bugs.json');
    }
    if (workflow.status === 'complete' && gates.G7_humanQa === 'pass') {
      errors.push('G7_humanQa=pass on complete run requires bugs.json (humanSignal=green)');
    }
    return errors;
  }

  if (bugs.runId && workflow.runId && bugs.runId !== workflow.runId) {
    errors.push(`bugs.runId (${bugs.runId}) != workflow-run.runId (${workflow.runId})`);
  }

  const openBugs = (bugs.bugs ?? []).filter((bug) => bug.status === 'open');
  if (bugs.humanSignal === 'green' && openBugs.length) {
    errors.push('bugs.humanSignal=green but open bugs remain');
  }

  if (gates.G7_humanQa === 'pass' && bugs.humanSignal !== 'green') {
    errors.push('G7_humanQa=pass requires bugs.humanSignal=green');
  }

  if (workflow.status === 'complete' && gates.G7_humanQa === 'pass' && bugs.humanSignal !== 'green') {
    errors.push('complete + G7 pass requires bugs.humanSignal=green');
  }

  const maxIterations = bugs.maxIterations ?? 5;
  if (
    typeof bugs.iteration === 'number' &&
    bugs.iteration > maxIterations &&
    bugs.humanSignal !== 'green' &&
    workflow.status === 'awaiting_human_qa'
  ) {
    errors.push(
      `bugs.iteration (${bugs.iteration}) exceeds maxIterations (${maxIterations}) while still awaiting QA`,
    );
  }

  return errors;
}

function assertManifestIds(discovery, manifestIds) {
  const errors = [];
  for (const item of discovery.selected ?? []) {
    if (!manifestIds.has(item.id)) {
      errors.push(`discovery.selected unknown manifest id: ${item.id}`);
    }
  }
  for (const item of discovery.services ?? []) {
    if (!manifestIds.has(item.id)) {
      errors.push(`discovery.services unknown manifest id: ${item.id}`);
    }
  }
  const sot = discovery.sourceOfTruthChecked ?? [];
  if (!sot.includes('AI-CONSUME.md') || !sot.includes('AI-MANIFEST.json')) {
    errors.push('discovery.sourceOfTruthChecked must include AI-CONSUME.md and AI-MANIFEST.json');
  }
  return errors;
}

function assertCompositionGates(composition, workflow) {
  const errors = [];
  if (workflow.status === 'complete' && composition.approved !== true) {
    errors.push('composition.approved must be true when workflow is complete');
  }
  if (workflow.gates?.G1_compositionApproved === 'pass' && composition.approved !== true) {
    errors.push('G1 pass requires composition.approved === true');
  }
  return errors;
}

function assertScorecard(scorecard, reviewMetrics) {
  const errors = [];
  if (scorecard.inventedApiCount !== 0) {
    errors.push(`scorecard.inventedApiCount must be 0 (got ${scorecard.inventedApiCount})`);
  }
  if (scorecard.manifestMissCount !== 0) {
    errors.push(`scorecard.manifestMissCount must be 0 (got ${scorecard.manifestMissCount})`);
  }
  if (reviewMetrics.mustFixCount !== 0) {
    errors.push(`review-metrics.mustFixCount must be 0 (got ${reviewMetrics.mustFixCount})`);
  }
  if (reviewMetrics.inventedApiCount !== scorecard.inventedApiCount) {
    errors.push('review-metrics.inventedApiCount must match scorecard.inventedApiCount');
  }
  return errors;
}

function validateRunDir(runDir) {
  const errors = [];
  const abs = resolve(runDir);

  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(abs, file))) {
      errors.push(`missing required file: ${file}`);
    }
  }
  if (errors.length) return { runDir: abs, errors };

  const discoverySchema = loadJson(join(SCHEMA_DIR, 'discovery.schema.json'));
  const compositionSchema = loadJson(join(SCHEMA_DIR, 'composition.schema.json'));
  const workflowSchema = loadJson(join(SCHEMA_DIR, 'workflow-run.schema.json'));
  const scorecardSchema = loadJson(join(SCHEMA_DIR, 'scorecard.schema.json'));
  const reviewSchema = loadJson(join(SCHEMA_DIR, 'review-metrics.schema.json'));
  const bugsSchema = loadJson(join(SCHEMA_DIR, 'bugs.schema.json'));
  const manifest = loadJson(MANIFEST_PATH);
  const manifestIds = new Set(manifest.entries.map((entry) => entry.id));

  const discovery = loadJson(join(abs, 'discovery.json'));
  const composition = loadJson(join(abs, 'composition.json'));
  const workflow = loadJson(join(abs, 'workflow-run.json'));
  const scorecard = loadJson(join(abs, 'scorecard.json'));
  const reviewMetrics = loadJson(join(abs, 'review-metrics.json'));
  const bugsPath = join(abs, 'bugs.json');
  const bugs = existsSync(bugsPath) ? loadJson(bugsPath) : null;

  errors.push(...validateAgainstSchema(discovery, discoverySchema));
  errors.push(...validateAgainstSchema(composition, compositionSchema));
  errors.push(...validateAgainstSchema(workflow, workflowSchema));
  errors.push(...validateAgainstSchema(scorecard, scorecardSchema));
  errors.push(...validateAgainstSchema(reviewMetrics, reviewSchema));
  if (bugs) {
    errors.push(...validateAgainstSchema(bugs, bugsSchema));
  }
  errors.push(...assertManifestIds(discovery, manifestIds));
  errors.push(...assertGateChecklist(workflow));
  errors.push(...assertCompositionGates(composition, workflow));
  errors.push(...assertScorecard(scorecard, reviewMetrics));
  errors.push(...assertBugsArtifact(bugs, workflow));

  if (workflow.runId && scorecard.runId && workflow.runId !== scorecard.runId) {
    errors.push(`workflow-run.runId (${workflow.runId}) != scorecard.runId (${scorecard.runId})`);
  }

  return { runDir: abs, errors };
}

function listFixtureDirs() {
  if (!existsSync(FIXTURES_DIR)) return [];
  return readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('golden-'))
    .map((entry) => join(FIXTURES_DIR, entry.name));
}

const args = process.argv.slice(2);
const targets = args.includes('--fixtures')
  ? listFixtureDirs()
  : args.filter((arg) => !arg.startsWith('-')).map((arg) => resolve(arg));

if (!targets.length) {
  console.error('Usage: node tools/validate-agent-run.mjs <runDir> | --fixtures');
  process.exit(2);
}

let failed = 0;
for (const target of targets) {
  const { runDir, errors } = validateRunDir(target);
  if (errors.length) {
    failed += 1;
    console.error(`FAIL  ${basename(runDir)}`);
    for (const error of errors) console.error(`  - ${error}`);
  } else {
    console.log(`PASS  ${basename(runDir)}`);
  }
}

if (failed) {
  console.error(`\n${failed} run(s) failed validation.`);
  process.exit(1);
}

console.log(`\n${targets.length} run(s) passed validation.`);
