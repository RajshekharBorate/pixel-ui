/**
 * Soft check: each pixel-* / services README should include CONVENTIONS §11 headings.
 * Exits 0 by default; `--strict` fails when gaps remain.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libRoot = path.join(root, 'projects/pixel-ui/src/lib');
const strict = process.argv.includes('--strict');

const REQUIRED = [
  { id: 'behavior', re: /^##\s+Behavior notes\b/m },
  { id: 'a11y', re: /^##\s+Accessibility\b/m },
  { id: 'theme', re: /^##\s+Theme customization\b/m },
];

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'shared', 'theme', 'testing']);

function* walkComponentDirs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || !entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name === 'services') {
      for (const sub of fs.readdirSync(full, { withFileTypes: true })) {
        if (sub.isDirectory()) yield path.join(full, sub.name);
      }
    } else if (entry.name.startsWith('pixel-')) {
      yield full;
    }
  }
}

const gaps = [];
for (const folder of walkComponentDirs(libRoot)) {
  const readme = path.join(folder, 'README.md');
  if (!fs.existsSync(readme)) {
    gaps.push(`${path.relative(root, folder)}: missing README.md`);
    continue;
  }
  const text = fs.readFileSync(readme, 'utf8');
  const missing = REQUIRED.filter((r) => !r.re.test(text)).map((r) => r.id);
  if (missing.length) {
    gaps.push(`${path.relative(root, readme)}: missing ${missing.join(', ')}`);
  }
}

console.log(
  `lint:readme-sections — ${gaps.length} README(s) missing Behavior notes / Accessibility / Theme customization`,
);
if (gaps.length) {
  for (const g of gaps.slice(0, 40)) console.log(`  ${g}`);
  if (gaps.length > 40) console.log(`  … +${gaps.length - 40} more`);
  if (!strict) console.log('Pass --strict to fail when gaps remain.');
}
if (strict && gaps.length) process.exit(1);
