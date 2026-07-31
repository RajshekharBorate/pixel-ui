/**
 * Map chrome appearance presets (visual density / hover elevation).
 * Colors stay token-driven; presets only tune weights and emphasis.
 */

export type PixelChartMapAppearance = 'minimal' | 'soft' | 'emphasis';

/** Resolved chrome knobs applied to geo / map series. */
export type PixelChartMapChrome = {
  readonly borderWidth: number;
  readonly emphasisBorderWidth: number;
  readonly shadowBlur: number;
  readonly shadowOffsetY: number;
  /** Multiplier for emphasis fill lightness (0 = keep fill, 1 = strong lift). */
  readonly emphasisLift: number;
};

const CHROME: Readonly<Record<PixelChartMapAppearance, PixelChartMapChrome>> = {
  minimal: {
    borderWidth: 0.5,
    emphasisBorderWidth: 1,
    shadowBlur: 0,
    shadowOffsetY: 0,
    emphasisLift: 0.08,
  },
  soft: {
    borderWidth: 0.85,
    emphasisBorderWidth: 1.35,
    shadowBlur: 10,
    shadowOffsetY: 2,
    emphasisLift: 0.14,
  },
  emphasis: {
    borderWidth: 1.1,
    emphasisBorderWidth: 1.85,
    shadowBlur: 16,
    shadowOffsetY: 3,
    emphasisLift: 0.22,
  },
};

/** Default appearance for `pixel-chart-map`. */
export const PIXEL_CHART_MAP_APPEARANCE_DEFAULT: PixelChartMapAppearance = 'soft';

export function resolveMapChrome(
  appearance: PixelChartMapAppearance | null | undefined,
): PixelChartMapChrome {
  return CHROME[appearance ?? PIXEL_CHART_MAP_APPEARANCE_DEFAULT] ?? CHROME.soft;
}

/**
 * Default camera for a world atlas — trims deep Antarctica and empty polar ocean
 * so landmasses read larger in a dashboard card.
 */
export const PIXEL_CHART_MAP_WORLD_GEO_VIEW = {
  boundingCoords: [
    [-168, -55],
    [195, 78],
  ],
} as const;
