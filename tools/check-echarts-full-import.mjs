/**
 * Fails if library/docs code imports the full ECharts build.
 * Allowed: `echarts/core`, `echarts/charts`, `echarts/components`, `echarts/renderers`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scanRoots = [
  path.join(root, 'projects/pixel-ui/src'),
  path.join(root, 'projects/docs/src'),
];

const FORBIDDEN = [
  /from\s+['"]echarts['"]/g,
  /from\s+['"]echarts\/dist\/echarts(?:\.min)?(?:\.js)?['"]/g,
  /require\(\s*['"]echarts['"]\s*\)/g,
];

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

/** @param {string} dir */
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (CODE_EXT.has(path.extname(entry.name))) yield full;
  }
}

const hits = [];
for (const scanRoot of scanRoots) {
  if (!fs.existsSync(scanRoot)) continue;
  for (const file of walk(scanRoot)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const pattern of FORBIDDEN) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text))) {
        const line = text.slice(0, match.index).split('\n').length;
        hits.push(`${path.relative(root, file)}:${line}: ${match[0]}`);
      }
    }
  }
}

if (hits.length) {
  console.error(
    'Full ECharts imports are banned. Use echarts/core + charts/components/renderers:\n',
  );
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}

console.log('lint:echarts-import — OK (no full echarts imports)');
