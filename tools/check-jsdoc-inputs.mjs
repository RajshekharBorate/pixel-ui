/**
 * Soft check: public `input()` declarations should carry `@description` in the preceding JSDoc.
 * Exits 0 with a summary; use `--strict` to fail when any gaps remain (CI ratchet).
 *
 * See CONVENTIONS.md §3 / STANDARDS-GAP-REPORT P2-04.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libRoot = path.join(root, 'projects/pixel-ui/src/lib');
const strict = process.argv.includes('--strict');

const INPUT_RE = /readonly\s+(\w+)\s*=\s*input(?:\.<[^>]+>)?\s*\(/g;
const DESC_RE = /@description\b/;

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

/** @param {string} dir */
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) yield full;
  }
}

/** @param {string} text @param {number} index */
function jsdocBefore(text, index) {
  const before = text.slice(0, index);
  const start = before.lastIndexOf('/**');
  if (start < 0) return '';
  const between = before.slice(start);
  // Ensure no code between JSDoc close and input
  const close = between.lastIndexOf('*/');
  if (close < 0) return '';
  const afterDoc = between.slice(close + 2);
  if (/[;{}]/.test(afterDoc.replace(/\s+/g, ''))) return '';
  return between.slice(0, close);
}

const gaps = [];
let totalInputs = 0;
for (const file of walk(libRoot)) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  INPUT_RE.lastIndex = 0;
  while ((match = INPUT_RE.exec(text))) {
    totalInputs++;
    const doc = jsdocBefore(text, match.index);
    if (!DESC_RE.test(doc)) {
      const line = text.slice(0, match.index).split('\n').length;
      gaps.push(`${path.relative(root, file)}:${line}: ${match[1]}`);
    }
  }
}

const covered = totalInputs - gaps.length;
console.log(
  `lint:jsdoc-inputs — ${covered}/${totalInputs} inputs have @description (${gaps.length} gaps)`,
);

if (gaps.length && !strict) {
  console.log('Top gaps (first 25):');
  for (const g of gaps.slice(0, 25)) console.log(`  ${g}`);
  if (gaps.length > 25) console.log(`  … +${gaps.length - 25} more`);
  console.log('Pass --strict to fail the build when gaps remain.');
}

if (strict && gaps.length) {
  process.exit(1);
}
