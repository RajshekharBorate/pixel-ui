/**
 * Post-process the docs production build for GitHub Pages project sites.
 * - Writes `.nojekyll` so underscore-prefixed assets are not ignored.
 * - Copies `index.html` → `404.html` so deep SPA routes resolve (Pages has no rewrite rules).
 */
import { copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'dist', 'docs', 'browser');
const indexPath = join(outDir, 'index.html');

if (!existsSync(indexPath)) {
  console.error(`Docs build output not found: ${indexPath}`);
  console.error('Run `npm run build:docs` first.');
  process.exit(1);
}

writeFileSync(join(outDir, '.nojekyll'), '');
copyFileSync(indexPath, join(outDir, '404.html'));
console.log(`Prepared GitHub Pages artifact in ${outDir}`);
