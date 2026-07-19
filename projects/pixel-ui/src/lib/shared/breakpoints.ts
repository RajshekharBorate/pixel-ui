/**
 * Viewport breakpoint widths in CSS pixels — keep in sync with `$breakpoints` in
 * `projects/pixel-ui/src/styles/_theming.scss`.
 */
export const PIXEL_BREAKPOINT_PX = {
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

export type PixelBreakpointName = keyof typeof PIXEL_BREAKPOINT_PX;
