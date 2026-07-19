/**
 * Fails if library SCSS uses hard-coded viewport width media queries instead of
 * `pixel.breakpoint-up` / `pixel.breakpoint-down` (see CONVENTIONS.md §7a).
 *
 * Allowed: prefers-*, color-scheme, and @container queries.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libRoot = path.join(root, 'projects/pixel-ui/src');

/** @media (min|max)-width with px or rem — exclude prefers-* via negative lookahead not needed. */
const FORBIDDEN =
  /@media\s*\(\s*(?:min|max)-width\s*:\s*[\d.]+(?:px|rem|em)\s*\)/gi;

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

/** @param {string} dir */
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.scss') || entry.name.endsWith('.css')) yield full;
  }
}

const hits = [];
for (const file of walk(libRoot)) {
  // Theming defines the mixins; allow its docs examples only — still no consumer-style hard codes there.
  if (file.replace(/\\/g, '/').endsWith('/styles/_theming.scss')) continue;

  const text = fs.readFileSync(file, 'utf8');
  let match;
  FORBIDDEN.lastIndex = 0;
  while ((match = FORBIDDEN.exec(text))) {
    const line = text.slice(0, match.index).split('\n').length;
    hits.push(`${path.relative(root, file)}:${line}: ${match[0]}`);
  }
}

if (hits.length) {
  console.error('Hard-coded viewport breakpoints found. Use pixel.breakpoint-up/down:\n');
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}

console.log('lint:breakpoints — OK (no hard-coded viewport width media queries)');
