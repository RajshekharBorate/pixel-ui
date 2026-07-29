/**
 * Measure modular chart register (+ sparkline) gzip sizes and fail over budget.
 *
 * Usage:
 *   node tools/check-charts-bundle-size.mjs           # CI / after intentional register changes
 *   node tools/check-charts-bundle-size.mjs --write    # print current sizes as JSON
 *
 * Interactive exploration of the built library FESM (optional, not required in CI):
 *   npx source-map-explorer dist/pixel-ui/fesm2022/*.mjs
 *
 * Published package size gates can also use size-limit against `pixel-ui/charts` once
 * the package is versioned — keep budgets in `tools/charts-size-budgets.mjs` in sync.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  PIXEL_CHART_FAMILY_GZIP_BUDGETS,
  PIXEL_CHARTS_BUNDLE_GZIP_BUDGET,
} from './charts-size-budgets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const writeMode = process.argv.includes('--write');

const FAMILY_ENTRIES = {
  bar: 'projects/pixel-ui/src/lib/pixel-chart/register/bar.register.ts',
  line: 'projects/pixel-ui/src/lib/pixel-chart/register/line.register.ts',
  area: 'projects/pixel-ui/src/lib/pixel-chart/register/area.register.ts',
  pie: 'projects/pixel-ui/src/lib/pixel-chart/register/pie.register.ts',
  gauge: 'projects/pixel-ui/src/lib/pixel-chart/register/gauge.register.ts',
  scatter: 'projects/pixel-ui/src/lib/pixel-chart/register/scatter.register.ts',
  bubble: 'projects/pixel-ui/src/lib/pixel-chart/register/bubble.register.ts',
  radar: 'projects/pixel-ui/src/lib/pixel-chart/register/radar.register.ts',
};

/** Sparkline is custom SVG — measure source weight, not an ECharts register. */
const SPARKLINE_SOURCES = [
  'projects/pixel-ui/src/lib/pixel-chart-sparkline/pixel-chart-sparkline.ts',
  'projects/pixel-ui/src/lib/pixel-chart-sparkline/pixel-chart-sparkline.scss',
];

function resolveEsbuild() {
  try {
    return require('esbuild');
  } catch {
    try {
      const angularBuild = path.dirname(require.resolve('@angular/build/package.json'));
      return require(path.join(angularBuild, 'node_modules/esbuild'));
    } catch {
      return null;
    }
  }
}

/**
 * @param {string} entryRel
 * @param {import('esbuild') | null} esbuild
 */
async function gzipSizeOfRegister(entryRel, esbuild) {
  const entry = path.join(root, entryRel);
  if (!fs.existsSync(entry)) {
    throw new Error(`Missing entry: ${entryRel}`);
  }
  if (!esbuild) {
    return zlib.gzipSync(fs.readFileSync(entry)).length;
  }
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    loader: { '.ts': 'ts' },
    external: ['@angular/*', 'rxjs', 'rxjs/*', 'tslib'],
    logLevel: 'silent',
  });
  const out = result.outputFiles?.[0]?.contents;
  if (!out) {
    throw new Error(`esbuild produced no output for ${entryRel}`);
  }
  return zlib.gzipSync(Buffer.from(out)).length;
}

function gzipSizeOfSparkline() {
  const buf = Buffer.concat(
    SPARKLINE_SOURCES.map((rel) => fs.readFileSync(path.join(root, rel))),
  );
  return zlib.gzipSync(buf).length;
}

function findChartsFesm() {
  const dir = path.join(root, 'dist/pixel-ui/fesm2022');
  if (!fs.existsSync(dir)) {
    return null;
  }
  const hit = fs.readdirSync(dir).find((f) => f.endsWith('.mjs'));
  return hit ? path.join(dir, hit) : null;
}

const esbuild = resolveEsbuild();
if (!esbuild) {
  console.warn('size:charts — esbuild not found; measuring raw register sources (less accurate)');
}

const sizes = {};
const failures = [];

console.log('Chart family gzip sizes:\n');

for (const [family, entry] of Object.entries(FAMILY_ENTRIES)) {
  const gzip = await gzipSizeOfRegister(entry, esbuild);
  sizes[family] = gzip;
  const budget = PIXEL_CHART_FAMILY_GZIP_BUDGETS[family];
  const status = gzip <= budget ? 'OK' : 'OVER';
  console.log(
    `  ${family.padEnd(10)} ${String(gzip).padStart(8)} B gzip  (budget ${budget})  ${status}`,
  );
  if (gzip > budget) {
    failures.push(`${family}: ${gzip} > ${budget}`);
  }
}

{
  const gzip = gzipSizeOfSparkline();
  sizes.sparkline = gzip;
  const budget = PIXEL_CHART_FAMILY_GZIP_BUDGETS.sparkline;
  const status = gzip <= budget ? 'OK' : 'OVER';
  console.log(
    `  ${'sparkline'.padEnd(10)} ${String(gzip).padStart(8)} B gzip  (budget ${budget})  ${status}`,
  );
  if (gzip > budget) {
    failures.push(`sparkline: ${gzip} > ${budget}`);
  }
}

const fesm = findChartsFesm();
if (fesm) {
  const gzip = zlib.gzipSync(fs.readFileSync(fesm)).length;
  sizes.fesm = gzip;
  const note =
    gzip <= PIXEL_CHARTS_BUNDLE_GZIP_BUDGET
      ? 'info'
      : 'info (above soft cap — whole library, not charts-only)';
  console.log(
    `  ${'fesm'.padEnd(10)} ${String(gzip).padStart(8)} B gzip  (soft ${PIXEL_CHARTS_BUNDLE_GZIP_BUDGET})  ${note}  ← ${path.relative(root, fesm)}`,
  );
} else {
  console.log('  (dist FESM not found — run `npm run build` for whole-package info)');
}

if (writeMode) {
  const outPath = path.join(root, 'tools/charts-size-latest.json');
  fs.writeFileSync(outPath, JSON.stringify({ measuredAt: new Date().toISOString(), sizes }, null, 2));
  console.log(`\nWrote ${path.relative(root, outPath)}`);
}

if (failures.length) {
  console.error('\nsize:charts — FAILED budgets:\n', failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}

console.log('\nsize:charts — OK');
