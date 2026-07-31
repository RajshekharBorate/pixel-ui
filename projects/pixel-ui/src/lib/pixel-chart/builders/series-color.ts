/**
 * Stable series / slice colors for legend hide-show.
 * Never index the palette by “nth currently visible” item — that shifts colors.
 */

export type PixelChartColorable = {
  readonly id: string;
  readonly color?: string;
};

/**
 * Resolve a color for `item` from its position in `allItems` (or an explicit `color`).
 */
export function resolveStableItemColor(
  item: PixelChartColorable,
  allItems: readonly PixelChartColorable[],
  palette: readonly string[],
  fallback = '#1565c0',
): string {
  const explicit = item.color?.trim();
  if (explicit) {
    return explicit;
  }
  if (palette.length === 0) {
    return fallback;
  }
  const index = allItems.findIndex((candidate) => candidate.id === item.id);
  const slot = index >= 0 ? index : 0;
  return palette[slot % palette.length] ?? fallback;
}

/** Precompute id → color for a full series/slice list (same rules as the shell legend). */
export function resolveStableColorMap(
  allItems: readonly PixelChartColorable[],
  palette: readonly string[],
  fallback = '#1565c0',
): ReadonlyMap<string, string> {
  return new Map(
    allItems.map((item) => [
      item.id,
      resolveStableItemColor(item, allItems, palette, fallback),
    ]),
  );
}
