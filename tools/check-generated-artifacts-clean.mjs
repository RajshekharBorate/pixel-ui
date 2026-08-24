/**
 * Fails when regenerating AI/docs contracts changes file contents.
 *
 * Compares SHA-256 hashes before/after `npm run readme:api` so the check works
 * both on a clean CI checkout and with unrelated local WIP.
 *
 * Usage: node tools/check-generated-artifacts-clean.mjs
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const GENERATED_PATHS = [
  'projects/pixel-ui/AI-MANIFEST.json',
  'projects/docs/src/app/registry/generated-doc-api.ts',
];

function run(command, args) {
  execFileSync(command, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
}

function sha256(absPath) {
  let bytes = readFileSync(absPath);
  if (absPath.endsWith('AI-MANIFEST.json')) {
    const json = JSON.parse(bytes.toString('utf8'));
    delete json.generatedAt;
    bytes = Buffer.from(`${JSON.stringify(json)}\n`, 'utf8');
  }
  return createHash('sha256').update(bytes).digest('hex');
}

function* walkReadmes(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkReadmes(full);
    } else if (entry.name === 'README.md') {
      yield full;
    }
  }
}

function collectTrackedPaths() {
  const paths = [...GENERATED_PATHS];
  const libRoot = join(ROOT, 'projects/pixel-ui/src/lib');
  for (const abs of walkReadmes(libRoot)) {
    paths.push(relative(ROOT, abs).replace(/\\/g, '/'));
  }
  return paths;
}

const tracked = collectTrackedPaths();
const missing = tracked.filter((rel) => !existsSync(join(ROOT, rel)));
if (missing.length) {
  console.error('Missing files before regen:');
  for (const rel of missing) console.error(`  - ${rel}`);
  process.exit(1);
}

const before = new Map(tracked.map((rel) => [rel, sha256(join(ROOT, rel))]));

console.log('check-generated-artifacts-clean — regenerating contracts…');
run('npm', ['run', 'readme:api']);

const changed = [];
for (const rel of tracked) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    changed.push(`${rel} (missing after regen)`);
    continue;
  }
  if (sha256(abs) !== before.get(rel)) {
    changed.push(rel);
  }
}

if (changed.length) {
  console.error('Regenerating contracts changed these files (commit the regen, or fix source):');
  for (const rel of changed) console.error(`  - ${rel}`);
  process.exit(1);
}

console.log('check-generated-artifacts-clean — OK (regen is idempotent).');
