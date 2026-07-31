/**
 * Consumer-owned drill stack helpers for any chart facade.
 * Charts emit typed clicks only — apps push/pop levels and rebind data (and facade).
 */

/** Minimal level shape shared by all drill stacks. */
export type PixelChartDrillLevelBase = {
  readonly id: string;
  readonly label: string;
  /** Node that opened this level (omitted for root). */
  readonly parentId?: string;
};

/**
 * One level in a consumer-owned drill stack.
 * `data` is whatever the current facade needs (series, slices, map regions, …).
 */
export type PixelChartDrillLevel<TData = unknown> = PixelChartDrillLevelBase & {
  readonly data: TData;
};

/** Payload stored on breadcrumb `data` for drill-up. */
export type PixelChartDrillBreadcrumbData = {
  readonly levelId: string;
  readonly parentId?: string;
};

/**
 * Breadcrumb-compatible item (assignable to `PixelBreadcrumbItem`).
 * Omit `link` / `href` so in-page drill-up stays on `(itemClick)`.
 */
export type PixelChartDrillBreadcrumbItem = {
  readonly id: string;
  readonly label: string;
  readonly active?: boolean;
  readonly data?: PixelChartDrillBreadcrumbData;
};

/** Levels → breadcrumb trail (last item marked active). */
export function drillLevelsToBreadcrumbItems(
  levels: readonly PixelChartDrillLevelBase[],
): PixelChartDrillBreadcrumbItem[] {
  if (!levels.length) {
    return [];
  }
  return levels.map((level, index) => ({
    id: level.id,
    label: level.label,
    active: index === levels.length - 1,
    data: {
      levelId: level.id,
      parentId: level.parentId,
    },
  }));
}

/** Truncate the stack through `index` (inclusive) for breadcrumb drill-up. */
export function truncateDrillLevels<T extends PixelChartDrillLevelBase>(
  levels: readonly T[],
  index: number,
): T[] {
  if (!levels.length) {
    return [];
  }
  const end = Math.max(0, Math.min(index, levels.length - 1));
  return levels.slice(0, end + 1);
}

/**
 * Append a child level. Default equality is `id`; pass `sameLevel` when a family
 * needs a richer key (map uses `id` + `mapName`).
 */
export function pushDrillLevel<T extends PixelChartDrillLevelBase>(
  levels: readonly T[],
  next: T,
  sameLevel: (current: T, next: T) => boolean = (a, b) => a.id === b.id,
): T[] {
  const current = levels[levels.length - 1];
  if (current && sameLevel(current, next)) {
    return [...levels];
  }
  return [...levels, next];
}
