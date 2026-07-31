import type {
  PixelSkeletonGaugeLayout,
  PixelSkeletonMapLayout,
  PixelSkeletonPathLayout,
  PixelSkeletonPathPoint,
  PixelSkeletonPieLayout,
  PixelSkeletonPointsLayout,
  PixelSkeletonRadarLayout,
} from '../../pixel-loader/pixel-loader.types';
import type { PixelChartSeries } from '../pixel-chart.types';
import { seriesValuesForCategories, toPercentStacks } from './cartesian-utils';
import type { PixelChartAreaMode } from './area-option';
import type { PixelChartBubbleSeries } from './bubble-option';
import type { PixelChartPieMode, PixelChartPieSlice } from './pie-option';
import type { PixelChartRadarIndicator } from './radar-option';
import { collectScatterPoints } from './scatter-option';
import { normalizeCategoryLabels, type PixelChartAxisValue } from './time-axis';
import type { PixelChartRegionDatum } from './map-option';

const MAX_PATH_POINTS = 32;
const MAX_MARKERS = 48;
const MAX_MAP_BLOBS = 5;

function downsample<T>(items: readonly T[], max: number): T[] {
  if (items.length <= max) {
    return [...items];
  }
  const out: T[] = [];
  const step = (items.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) {
    out.push(items[Math.round(i * step)]!);
  }
  return out;
}

function hiddenSet(
  hidden?: ReadonlySet<string> | readonly string[],
): Set<string> {
  return hidden instanceof Set ? hidden : new Set(hidden ?? []);
}

/**
 * Line / area path stubs from the same series the chart renders.
 * Returns `null` when there is no drawable data.
 */
export function buildSkeletonPathLayout(args: {
  readonly series: readonly PixelChartSeries[];
  readonly categories: readonly PixelChartAxisValue[];
  readonly filled: boolean;
  readonly mode?: PixelChartAreaMode | 'straight' | 'smooth' | 'step';
  readonly hiddenSeriesIds?: ReadonlySet<string> | readonly string[];
}): PixelSkeletonPathLayout | null {
  const categories = normalizeCategoryLabels(args.categories);
  const hidden = hiddenSet(args.hiddenSeriesIds);
  const visible = args.series.filter((s) => !hidden.has(s.id));
  if (visible.length === 0 || categories.length === 0) {
    return null;
  }

  const matrix = visible.map((s) => seriesValuesForCategories(s, categories));
  const catCount = categories.length;
  const xs = Array.from({ length: catCount }, (_, i) =>
    catCount === 1 ? 50 : (i / (catCount - 1)) * 100,
  );

  const mode = args.mode;
  const stacked = mode === 'stacked' || mode === 'percent' || mode === 'stream';

  let seriesPoints: PixelSkeletonPathPoint[][];

  if (stacked && args.filled) {
    const pct =
      mode === 'percent'
        ? toPercentStacks(matrix).map((row) => row.map((v) => v ?? 0))
        : null;
    const values = pct ?? matrix.map((row) => row.map((v) => Math.max(0, v ?? 0)));
    const tops: number[][] = values.map(() => Array.from({ length: catCount }, () => 0));
    let maxTop = 0;
    for (let c = 0; c < catCount; c++) {
      let sum = 0;
      for (let r = 0; r < values.length; r++) {
        sum += values[r]![c] ?? 0;
        tops[r]![c] = sum;
      }
      maxTop = Math.max(maxTop, sum);
    }
    if (mode === 'percent') {
      maxTop = 100;
    }
    if (maxTop <= 0) {
      return null;
    }
    seriesPoints = tops.map((row) =>
      downsample(
        row.map((y, i) => ({ x: xs[i]!, y: (y / maxTop) * 100 })),
        MAX_PATH_POINTS,
      ),
    );
  } else {
    let max = 0;
    for (const row of matrix) {
      for (const v of row) {
        if (v != null && Number.isFinite(v) && v > max) {
          max = v;
        }
      }
    }
    if (max <= 0) {
      return null;
    }
    seriesPoints = matrix.map((row) =>
      downsample(
        row.map((v, i) => ({
          x: xs[i]!,
          y: v != null && Number.isFinite(v) ? (Math.max(0, v) / max) * 100 : 0,
        })),
        MAX_PATH_POINTS,
      ),
    );
  }

  return {
    series: seriesPoints.map((points) => ({ points })),
    filled: args.filled,
  };
}

/** Pie / donut segment stubs from live slices. */
export function buildSkeletonPieLayout(args: {
  readonly slices: readonly PixelChartPieSlice[];
  readonly mode: PixelChartPieMode;
  readonly hiddenSliceIds?: ReadonlySet<string> | readonly string[];
}): PixelSkeletonPieLayout | null {
  const hidden = hiddenSet(args.hiddenSliceIds);
  const visible = args.slices.filter(
    (s) => !hidden.has(s.id) && Number.isFinite(s.value) && s.value > 0,
  );
  if (visible.length === 0) {
    return null;
  }
  const total = visible.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) {
    return null;
  }
  return {
    segments: visible.map((s) => (s.value / total) * 100),
    mode: args.mode,
  };
}

/** Scatter markers from live series points. */
export function buildSkeletonScatterLayout(args: {
  readonly series: readonly PixelChartSeries[];
  readonly hiddenSeriesIds?: ReadonlySet<string> | readonly string[];
}): PixelSkeletonPointsLayout | null {
  const hidden = hiddenSet(args.hiddenSeriesIds);
  const raw = collectScatterPoints(args.series, hidden);
  if (raw.length === 0) {
    return null;
  }
  const points = downsample(raw, MAX_MARKERS);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  return {
    kind: 'scatter',
    points: points.map((p) => ({
      x: ((p.x - minX) / dx) * 100,
      // CSS inset-block-start: 0 at top → invert so larger Y sits lower
      y: (1 - (p.y - minY) / dy) * 100,
    })),
  };
}

/** Bubble markers (cartesian) from live bubble series. */
export function buildSkeletonBubbleLayout(args: {
  readonly series: readonly PixelChartBubbleSeries[];
  readonly hiddenSeriesIds?: ReadonlySet<string> | readonly string[];
}): PixelSkeletonPointsLayout | null {
  const hidden = hiddenSet(args.hiddenSeriesIds);
  const raw: { x: number; y: number; size: number }[] = [];
  for (const s of args.series) {
    if (hidden.has(s.id)) {
      continue;
    }
      for (const p of s.data) {
      if (
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        Number.isFinite(p.size) &&
        p.size > 0
      ) {
        raw.push({ x: p.x, y: p.y, size: p.size });
      }
    }
  }
  if (raw.length === 0) {
    return null;
  }
  const points = downsample(raw, MAX_MARKERS);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let maxSize = 0;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    maxSize = Math.max(maxSize, p.size);
  }
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  return {
    kind: 'bubble',
    points: points.map((p) => ({
      x: ((p.x - minX) / dx) * 100,
      y: (1 - (p.y - minY) / dy) * 100,
      size: maxSize > 0 ? (p.size / maxSize) * 100 : 50,
    })),
  };
}

/** Radar polygon radii from indicators + series. */
export function buildSkeletonRadarLayout(args: {
  readonly indicators: readonly PixelChartRadarIndicator[];
  readonly series: readonly PixelChartSeries[];
  readonly hiddenSeriesIds?: ReadonlySet<string> | readonly string[];
}): PixelSkeletonRadarLayout | null {
  const n = args.indicators.length;
  if (n === 0) {
    return null;
  }
  const hidden = hiddenSet(args.hiddenSeriesIds);
  const visible = args.series.filter((s) => !hidden.has(s.id));
  if (visible.length === 0) {
    return null;
  }

  const seriesRadii = visible.map((s) => {
    const raw = s.data;
    const values: number[] = Array.from({ length: n }, (_, i) => {
      if (raw.length === 0) {
        return 0;
      }
      if (typeof raw[0] === 'number' || raw[0] === null) {
        const v = (raw as readonly (number | null)[])[i];
        return v != null && Number.isFinite(v) ? v : 0;
      }
      const p = (raw as readonly { y: number | null }[])[i];
      return p?.y != null && Number.isFinite(p.y) ? p.y : 0;
    });
    return values.map((v, i) => {
      const ind = args.indicators[i]!;
      const min = ind.min ?? 0;
      const max = ind.max > min ? ind.max : min + 1;
      return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
    });
  });

  return {
    indicatorCount: n,
    series: seriesRadii.map((radii) => ({ radii })),
  };
}

/** Gauge fill from live value / min / max. */
export function buildSkeletonGaugeLayout(args: {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly variant: PixelSkeletonGaugeLayout['variant'];
}): PixelSkeletonGaugeLayout | null {
  const min = Number.isFinite(args.min) ? args.min : 0;
  const max = Number.isFinite(args.max) ? args.max : 100;
  if (!(max > min) || !Number.isFinite(args.value)) {
    return null;
  }
  const clamped = Math.min(max, Math.max(min, args.value));
  return {
    fillPercent: ((clamped - min) / (max - min)) * 100,
    variant: args.variant,
  };
}

/** Map land stub intensities from region values. */
export function buildSkeletonMapLayout(args: {
  readonly data: readonly PixelChartRegionDatum[];
}): PixelSkeletonMapLayout | null {
  const values = args.data
    .map((d) => d.value)
    .filter((v): v is number => v != null && Number.isFinite(v) && v >= 0);
  if (values.length === 0) {
    return null;
  }
  const sampled = downsample(values, MAX_MAP_BLOBS);
  const max = Math.max(...sampled, 0);
  if (max <= 0) {
    return null;
  }
  return {
    intensities: sampled.map((v) => v / max),
  };
}

/** SVG polygon / polyline points string in a 0–100 viewBox (y up from baseline). */
export function skeletonPathToSvgPoints(
  points: readonly PixelSkeletonPathPoint[],
  filled: boolean,
): string {
  if (points.length === 0) {
    return '';
  }
  const coords = points.map((p) => `${p.x},${100 - p.y}`);
  if (!filled) {
    return coords.join(' ');
  }
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return [`${first.x},100`, ...coords, `${last.x},100`].join(' ');
}

/** Radar radii → SVG polygon points centered in a 100×100 viewBox. */
export function skeletonRadarToSvgPoints(radii: readonly number[]): string {
  const n = radii.length;
  if (n === 0) {
    return '';
  }
  const cx = 50;
  const cy = 50;
  const maxR = 42;
  return radii
    .map((r, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const rad = (Math.max(0, Math.min(100, r)) / 100) * maxR;
      return `${cx + rad * Math.cos(angle)},${cy + rad * Math.sin(angle)}`;
    })
    .join(' ');
}

/** Conic-gradient stops for pie skeleton segments. */
export function skeletonPieConicGradient(segments: readonly number[]): string {
  if (segments.length === 0) {
    return 'var(--pixel-loader-skeleton)';
  }
  let cursor = 0;
  const stops: string[] = [];
  segments.forEach((pct, i) => {
    const start = cursor;
    cursor += pct;
    const opacity = 0.55 + (i % 3) * 0.15;
    const color = `color-mix(in srgb, var(--pixel-loader-skeleton) ${Math.round(opacity * 100)}%, transparent)`;
    stops.push(`${color} ${start}% ${cursor}%`);
  });
  return `conic-gradient(from -90deg, ${stops.join(', ')})`;
}
