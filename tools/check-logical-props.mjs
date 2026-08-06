/**
 * Soft inventory of physical layout properties in library SCSS.
 * Exits 0 by default; `--strict` fails when hits remain (CI ratchet).
 * Skips custom-property *names*, line-height, scrollbar-width, stroke-width, SCSS vars.
 *
 * See CONVENTIONS.md §7 / STANDARDS-GAP-REPORT P3-06 / P1-10.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libRoot = path.join(root, 'projects/pixel-ui/src/lib');
const strict = process.argv.includes('--strict');

const PROP =
  /(?:^|\s)((?:max-|min-)?(?:width|height)|margin-(?:left|right)|padding-(?:left|right)|(?<![\w-])(?:left|right))\s*:/;

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

/** @param {string} dir */
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.scss')) yield full;
  }
}

const hits = [];
for (const file of walk(libRoot)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }
    if (/^\s*--[\w-]+\s*:/.test(line)) return;
    if (/^\s*\$[\w-]+\s*:/.test(line)) return;
    if (/line-height|scrollbar-width|stroke-width|border-width|outline-width|column-width|font-size/.test(line)) {
      return;
    }
    if (/@container|@media/.test(line)) return;
    if (PROP.test(line)) {
      hits.push(`${path.relative(root, file)}:${i + 1}: ${trimmed.slice(0, 80)}`);
    }
  });
}

console.log(`lint:logical-props — ${hits.length} physical layout decls (inventory)`);
if (hits.length) {
  for (const h of hits.slice(0, 30)) console.log(`  ${h}`);
  if (hits.length > 30) console.log(`  … +${hits.length - 30} more`);
  if (!strict) console.log('Pass --strict to fail when hits remain.');
}
if (strict && hits.length) process.exit(1);
