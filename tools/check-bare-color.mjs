/**
 * Fails if library SCSS paints with a bare hex/rgb (not inside `var(..., fallback)`).
 * Allowed: custom-property definitions (`--token: #…`), `color-mix`, gradients with tokens,
 * and SCSS interpolation `#{$var}` for non-color uses.
 *
 * See CONVENTIONS.md §7 / STANDARDS-GAP-REPORT P2-03.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libRoot = path.join(root, 'projects/pixel-ui/src/lib');

/** Property paint with a literal color — not a custom-property definition. */
const FORBIDDEN =
  /(?:^|[^{};])\s*(?:color|background(?:-color)?|border-color|fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\s*;/gm;

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
  const text = fs.readFileSync(file, 'utf8');
  let match;
  FORBIDDEN.lastIndex = 0;
  while ((match = FORBIDDEN.exec(text))) {
    const line = text.slice(0, match.index).split('\n').length;
    hits.push(`${path.relative(root, file)}:${line}: ${match[0].trim()}`);
  }
}

if (hits.length) {
  console.error('Bare color paints found. Use var(--pixel-sys-*, #fallback) or component tokens:\n');
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}

console.log('lint:bare-color — OK (no bare color/background/fill paints)');
