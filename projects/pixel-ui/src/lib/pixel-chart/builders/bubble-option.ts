import type { EChartsCoreOption } from 'echarts/core';
import { resolvePixelChartPaletteColors } from '../pixel-chart-theme';
import type {
  PixelChartPalette,
  PixelChartPoint,
  PixelChartSeries,
  PixelChartShowValues,
} from '../pixel-chart.types';
import { formatChartValue, resolveShowLabel } from './cartesian-utils';
import { resolveStableItemColor } from './series-color';

export type PixelChartBubbleLayout = 'cartesian' | 'pack';

export type PixelChartBubblePoint = {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly label?: string;
};

export type PixelChartBubbleSeries = {
  readonly id: string;
  readonly name: string;
  readonly data: readonly PixelChartBubblePoint[];
  readonly color?: string;
};

/** Hierarchical node for `layout="pack"`. Leaf size comes from `value` (or sum of children). */
export type PixelChartBubbleHierarchyNode = {
  readonly id?: string;
  readonly name: string;
  readonly value?: number;
  readonly color?: string;
  readonly children?: readonly PixelChartBubbleHierarchyNode[];
};

/** Depth-first lookup by `id` (preferred) or `name`. */
export function findBubbleHierarchyNode(
  nodes: readonly PixelChartBubbleHierarchyNode[],
  idOrName: string,
): PixelChartBubbleHierarchyNode | null {
  const key = idOrName.trim();
  if (!key) {
    return null;
  }
  for (const node of nodes) {
    if (node.id === key || node.name === key) {
      return node;
    }
    if (node.children?.length) {
      const hit = findBubbleHierarchyNode(node.children, key);
      if (hit) {
        return hit;
      }
    }
  }
  return null;
}

export type PixelChartBubbleOptionArgs = {
  readonly series: readonly PixelChartBubbleSeries[];
  readonly layout?: PixelChartBubbleLayout;
  /** Hierarchy for pack layout. When empty, pack synthesizes groups from `series`. */
  readonly hierarchy?: readonly PixelChartBubbleHierarchyNode[];
  readonly hiddenSeriesIds?: ReadonlySet<string>;
  readonly palette?: PixelChartPalette;
  readonly showValues?: PixelChartShowValues;
  /** Soft cap before `showValues: 'auto'` hides labels (cartesian point count / pack leaves). */
  readonly autoLabelMaxPoints?: number;
  readonly xAxisName?: string;
  readonly yAxisName?: string;
  /** Symbol size range [minPx, maxPx] for cartesian layout. */
  readonly sizeRange?: readonly [number, number];
};

type PackCircle = {
  name: string;
  id: string;
  value: number;
  color?: string;
  depth: number;
  isLeaf: boolean;
  r: number;
  x: number;
  y: number;
  children?: PackCircle[];
};

function normalizeBubbleSeries(
  series: readonly PixelChartBubbleSeries[] | readonly PixelChartSeries[],
): PixelChartBubbleSeries[] {
  return series.map((s) => {
    if ('data' in s && s.data.length > 0 && typeof (s.data[0] as PixelChartBubblePoint).size === 'number') {
      return s as PixelChartBubbleSeries;
    }
    const data: PixelChartBubblePoint[] = [];
    for (const raw of s.data as readonly PixelChartPoint[] | readonly number[]) {
      if (typeof raw === 'number' || raw === null) {
        continue;
      }
      const p = raw as PixelChartPoint;
      const x = typeof p.x === 'number' ? p.x : Number(p.x);
      const y = p.y;
      const size = p.size ?? 1;
      if (Number.isFinite(x) && y != null && Number.isFinite(y) && Number.isFinite(size)) {
        data.push({ x, y, size, label: p.label });
      }
    }
    return { id: s.id, name: s.name, data, color: s.color };
  });
}

function hierarchyFromSeries(
  series: readonly PixelChartBubbleSeries[],
  hiddenSeriesIds?: ReadonlySet<string>,
): PixelChartBubbleHierarchyNode[] {
  return series
    .filter((s) => !hiddenSeriesIds?.has(s.id))
    .map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      children: s.data.map((p, i) => ({
        id: `${s.id}-${i}`,
        name: p.label ?? `${s.name} ${i + 1}`,
        value: p.size,
        color: s.color,
      })),
    }));
}

function toPackTree(
  node: PixelChartBubbleHierarchyNode,
  depth: number,
  fallbackId: string,
): PackCircle {
  const id = node.id ?? fallbackId;
  const children = node.children?.map((c, i) => toPackTree(c, depth + 1, `${id}-${i}`));
  if (children && children.length > 0) {
    const value = children.reduce((sum, c) => sum + c.value, 0);
    return {
      name: node.name,
      id,
      value: value || 1,
      color: node.color,
      depth,
      isLeaf: false,
      r: 0,
      x: 0,
      y: 0,
      children,
    };
  }
  const value = Math.max(node.value ?? 0, 0.0001);
  return {
    name: node.name,
    id,
    value,
    color: node.color,
    depth,
    isLeaf: true,
    r: Math.sqrt(value),
    x: 0,
    y: 0,
  };
}

function placeCircle(
  placed: readonly { readonly x: number; readonly y: number; readonly r: number }[],
  r: number,
  padding: number,
): { x: number; y: number } {
  if (placed.length === 0) {
    return { x: 0, y: 0 };
  }
  let best: { x: number; y: number; score: number } | null = null;
  for (const p of placed) {
    const dist = p.r + r + padding;
    for (let a = 0; a < 72; a++) {
      const angle = (a / 72) * Math.PI * 2;
      const x = p.x + Math.cos(angle) * dist;
      const y = p.y + Math.sin(angle) * dist;
      const ok = placed.every((q) => {
        const gap = Math.hypot(x - q.x, y - q.y);
        return gap >= q.r + r + padding - 1e-4;
      });
      if (!ok) {
        continue;
      }
      const score = x * x + y * y;
      if (!best || score < best.score) {
        best = { x, y, score };
      }
    }
  }
  return best ? { x: best.x, y: best.y } : { x: 0, y: 0 };
}

function encloseCircles(
  circles: readonly { readonly x: number; readonly y: number; readonly r: number }[],
): { x: number; y: number; r: number } {
  if (circles.length === 0) {
    return { x: 0, y: 0, r: 1 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of circles) {
    minX = Math.min(minX, c.x - c.r);
    maxX = Math.max(maxX, c.x + c.r);
    minY = Math.min(minY, c.y - c.r);
    maxY = Math.max(maxY, c.y + c.r);
  }
  const x = (minX + maxX) / 2;
  const y = (minY + maxY) / 2;
  let r = 0;
  for (const c of circles) {
    r = Math.max(r, Math.hypot(c.x - x, c.y - y) + c.r);
  }
  return { x, y, r: r || 1 };
}

function layoutPack(node: PackCircle, padding: number): void {
  if (!node.children?.length) {
    node.r = Math.sqrt(Math.max(node.value, 0.0001));
    node.x = 0;
    node.y = 0;
    return;
  }
  for (const child of node.children) {
    layoutPack(child, padding);
  }
  const ordered = [...node.children].sort((a, b) => b.r - a.r);
  const placed: PackCircle[] = [];
  for (const child of ordered) {
    const pos = placeCircle(placed, child.r, padding);
    child.x = pos.x;
    child.y = pos.y;
    placed.push(child);
  }
  const enclose = encloseCircles(node.children);
  for (const child of node.children) {
    child.x -= enclose.x;
    child.y -= enclose.y;
  }
  node.r = enclose.r + padding;
  node.x = 0;
  node.y = 0;
}

function flattenPack(
  node: PackCircle,
  ox: number,
  oy: number,
  out: PackCircle[],
): void {
  const x = ox + node.x;
  const y = oy + node.y;
  out.push({ ...node, x, y, children: undefined });
  if (node.children) {
    for (const child of node.children) {
      flattenPack(child, x, y, out);
    }
  }
}

function buildPackOption(args: PixelChartBubbleOptionArgs): EChartsCoreOption {
  const {
    hiddenSeriesIds,
    palette = 'brand',
    showValues = 'auto',
    autoLabelMaxPoints = 40,
  } = args;
  const colors = resolvePixelChartPaletteColors(palette);
  const series = normalizeBubbleSeries(args.series);
  const hierarchy =
    args.hierarchy && args.hierarchy.length > 0
      ? args.hierarchy
      : hierarchyFromSeries(series, hiddenSeriesIds);

  const roots = hierarchy.map((n, i) => toPackTree(n, 0, n.id ?? `root-${i}`));
  const forest: PackCircle = {
    name: 'root',
    id: '__root',
    value: 1,
    depth: -1,
    isLeaf: false,
    r: 0,
    x: 0,
    y: 0,
    children: roots,
  };
  layoutPack(forest, 1.2);

  const flat: PackCircle[] = [];
  flattenPack(forest, 0, 0, flat);
  const nodes = flat.filter((n) => n.id !== '__root');
  const leafCount = nodes.filter((n) => n.isLeaf).length;
  const showLabel = resolveShowLabel(showValues, 1, leafCount, autoLabelMaxPoints);
  const pad = forest.r * 0.08 || 1;

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { data?: { name?: string; value?: number[] } };
        const v = p.data?.value;
        const name = p.data?.name ?? '';
        if (!v) {
          return name;
        }
        return `${name}<br/>value: ${Math.round(v[3] ?? 0)}`;
      },
    },
    legend: { show: false },
    grid: { left: 16, right: 16, top: 16, bottom: 16 },
    xAxis: {
      type: 'value',
      min: -forest.r - pad,
      max: forest.r + pad,
      show: false,
    },
    yAxis: {
      type: 'value',
      min: -forest.r - pad,
      max: forest.r + pad,
      show: false,
    },
    series: [
      {
        type: 'custom',
        id: 'pack',
        name: 'Pack',
        coordinateSystem: 'cartesian2d',
        data: nodes.map((n) => ({
          name: n.name,
          id: n.id,
          value: [n.x, n.y, n.r, n.value, n.depth, n.isLeaf ? 1 : 0],
          itemStyle: {
            color: n.color ?? colors[Math.max(0, n.depth) % colors.length],
          },
        })),
        renderItem: (
          _params: unknown,
          api: {
            value: (dim: number) => number;
            coord: (val: number[]) => number[];
            size: (val: number[]) => number[];
            style: () => Record<string, unknown>;
          },
        ) => {
          const x = api.value(0);
          const y = api.value(1);
          const r = api.value(2);
          const isLeaf = api.value(5) === 1;
          const point = api.coord([x, y]);
          const size = api.size([r, r]);
          const pxR = Math.max(2, Math.min(size[0] ?? 0, size[1] ?? 0));
          const style = api.style();
          return {
            type: 'circle',
            shape: { cx: point[0], cy: point[1], r: pxR },
            style: {
              ...style,
              fill: isLeaf ? style['fill'] : 'transparent',
              stroke: style['fill'],
              lineWidth: isLeaf ? 0 : 1.5,
              opacity: isLeaf ? 0.82 : 0.9,
            },
          };
        },
        label: {
          show: showLabel,
          position: 'inside',
          formatter: (p: { data?: { name?: string; value?: number[] } }) => {
            const leaf = p.data?.value?.[5] === 1;
            const name = p.data?.name ?? '';
            if (!leaf || !name) {
              return '';
            }
            return name.length <= 12 ? name : `${name.slice(0, 10)}…`;
          },
          fontSize: 11,
        },
        encode: { x: 0, y: 1 },
      },
    ],
  };
}

/**
 * Pure ECharts option builder for cartesian bubble charts.
 * Call `ensureBubbleChart()` before rendering.
 * `layout: 'pack'` uses a hierarchical circle pack (custom series).
 */
export function buildBubbleChartOption(args: PixelChartBubbleOptionArgs): EChartsCoreOption {
  if (args.layout === 'pack') {
    return buildPackOption(args);
  }

  const {
    hiddenSeriesIds,
    palette = 'brand',
    showValues = 'auto',
    autoLabelMaxPoints = 40,
    xAxisName = '',
    yAxisName = '',
    sizeRange = [8, 48],
  } = args;

  const series = normalizeBubbleSeries(args.series);
  const colors = resolvePixelChartPaletteColors(palette);
  const visible = series.filter((s) => !hiddenSeriesIds?.has(s.id));

  let minSize = Infinity;
  let maxSize = -Infinity;
  let pointCount = 0;
  for (const s of visible) {
    pointCount += s.data.length;
    for (const p of s.data) {
      if (p.size < minSize) minSize = p.size;
      if (p.size > maxSize) maxSize = p.size;
    }
  }
  if (!Number.isFinite(minSize)) {
    minSize = 0;
    maxSize = 1;
  }
  const span = maxSize - minSize || 1;
  const [symMin, symMax] = sizeRange;
  const showLabel = resolveShowLabel(showValues, 1, pointCount, autoLabelMaxPoints);

  const mapSize = (size: number) =>
    symMin + ((size - minSize) / span) * (symMax - symMin);

  const formatBubbleLabel = (params: {
    value?: number[];
    data?: { label?: string };
  }): string => {
    const labeled = params.data?.label?.trim();
    if (labeled) {
      return labeled;
    }
    const size = params.value?.[2];
    if (size == null || Number.isNaN(Number(size))) {
      return '';
    }
    return formatChartValue(size, false);
  };

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as {
          seriesName?: string;
          value?: number[];
          data?: { label?: string };
        };
        const v = p.value;
        if (!v || v.length < 3) {
          return p.seriesName ?? '';
        }
        const label = p.data?.label ? `<br/>${p.data.label}` : '';
        return `${p.seriesName ?? ''}${label}<br/>x: ${v[0]}<br/>y: ${v[1]}<br/>size: ${v[2]}`;
      },
    },
    legend: { show: false },
    grid: { left: 48, right: 24, top: 24, bottom: 48, containLabel: true },
    xAxis: {
      type: 'value',
      name: xAxisName,
      nameLocation: 'middle',
      nameGap: 28,
      splitLine: { show: true },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameLocation: 'middle',
      nameGap: 36,
      splitLine: { show: true },
    },
    series: visible.map((s) => ({
      type: 'scatter',
      id: s.id,
      name: s.name,
      itemStyle: {
        color: resolveStableItemColor(s, series, colors),
        opacity: 0.75,
      },
      symbolSize: (val: number[]) => mapSize(val[2] ?? 1),
      data: s.data.map((p) => ({
        value: [p.x, p.y, p.size],
        label: p.label,
      })),
      label: {
        show: showLabel,
        position: 'top',
        distance: 6,
        formatter: formatBubbleLabel,
      },
      emphasis: {
        focus: 'series',
        label: {
          show: true,
          position: 'top',
          distance: 6,
          formatter: formatBubbleLabel,
        },
      },
    })),
  };
}

export function bubbleSeriesToLegendSeries(
  series: readonly PixelChartBubbleSeries[],
): PixelChartSeries[] {
  return series.map((s) => ({
    id: s.id,
    name: s.name,
    data: s.data.map((p) => p.size),
    color: s.color,
  }));
}

export function buildBubbleTable(series: readonly PixelChartBubbleSeries[]): {
  columns: { key: string; header: string }[];
  rows: Readonly<Record<string, string | number | null>>[];
} {
  const rows: Readonly<Record<string, string | number | null>>[] = [];
  for (const s of series) {
    for (const p of s.data) {
      rows.push({
        series: s.name,
        label: p.label ?? '',
        x: p.x,
        y: p.y,
        size: p.size,
      });
    }
  }
  return {
    columns: [
      { key: 'series', header: 'Series' },
      { key: 'label', header: 'Label' },
      { key: 'x', header: 'X' },
      { key: 'y', header: 'Y' },
      { key: 'size', header: 'Size' },
    ],
    rows,
  };
}

export function buildBubbleHierarchyTable(
  hierarchy: readonly PixelChartBubbleHierarchyNode[],
): {
  columns: { key: string; header: string }[];
  rows: Readonly<Record<string, string | number | null>>[];
} {
  const rows: Readonly<Record<string, string | number | null>>[] = [];
  const walk = (nodes: readonly PixelChartBubbleHierarchyNode[], path: string) => {
    for (const n of nodes) {
      const next = path ? `${path} / ${n.name}` : n.name;
      if (n.children?.length) {
        walk(n.children, next);
      } else {
        rows.push({ path: next, name: n.name, value: n.value ?? null });
      }
    }
  };
  walk(hierarchy, '');
  return {
    columns: [
      { key: 'path', header: 'Path' },
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value' },
    ],
    rows,
  };
}
