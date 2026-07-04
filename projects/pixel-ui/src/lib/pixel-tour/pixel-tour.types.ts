import type { TemplateRef, Type } from '@angular/core';
import type { PixelTourRef } from './pixel-tour-ref';

export type PixelTourStatus =
  | 'idle'
  | 'running'
  | 'waiting'
  | 'paused'
  | 'completed'
  | 'skipped'
  | 'aborted';

export type PixelTourPlacement = 'auto' | 'below' | 'above';
export type PixelTourAlign = 'start' | 'center' | 'end';
export type PixelTourButton = 'back' | 'next' | 'skip-step' | 'skip-tour' | 'done';
export type PixelTourSpotlightShape = 'rounded' | 'circle';
export type PixelTourProgressStyle = 'count' | 'dots' | 'bar' | 'none';

/** Template context for `TemplateRef` step content. */
export interface PixelTourStepContext {
  readonly $implicit: PixelTourRef;
}

export interface PixelTourSpotlightOptions {
  /** Gap in px between the target's box and the cutout edge. @default 8 */
  readonly padding?: number;
  /** Cutout corner radius in px (`rounded` shape). @default 8 */
  readonly radius?: number;
  /** Cutout shape. @default 'rounded' */
  readonly shape?: PixelTourSpotlightShape;
}

export interface PixelTourStep<T = any> {
  /** Stable unique id — used by `goTo`, persistence, and analytics. */
  readonly id: string;
  /**
   * The highlighted element: a `[pixelTourAnchor]` id or CSS selector, the element itself,
   * or a resolver function. Omit for a centered card (welcome / finale steps).
   */
  readonly target?: string | Element | (() => Element | null);
  /** Card heading. */
  readonly title?: string;
  /** Card body: plain text, a template (context = the tour ref), or a component. */
  readonly content: string | TemplateRef<PixelTourStepContext> | Type<unknown>;
  /** Optional illustration rendered above the title. */
  readonly media?: { readonly src: string; readonly alt: string };
  /** Preferred vertical side of the target. @default 'auto' (best fit, flips) */
  readonly placement?: PixelTourPlacement;
  /** Horizontal alignment against the target. @default 'start' */
  readonly align?: PixelTourAlign;
  /** Spotlight cutout options for this step. */
  readonly spotlight?: PixelTourSpotlightOptions;
  /** Buttons rendered for this step (order preserved). Defaults to config-derived set. */
  readonly buttons?: readonly PixelTourButton[];
  /** Consumer payload carried through events. */
  readonly data?: T;
}

/** All user-facing copy — overridable for i18n. */
export interface PixelTourLabels {
  readonly next: string;
  readonly back: string;
  readonly skipStep: string;
  readonly skipTour: string;
  readonly done: string;
  /** `{index}` / `{total}` placeholders. Used for the visible count and SR announcements. */
  readonly progress: string;
  /** Accessible name for the tour dialog when a step has no title. */
  readonly stepAriaLabel: string;
}

export interface PixelTourConfig {
  /** Merged over the built-in English labels. */
  readonly labels?: Partial<PixelTourLabels>;
  /** Progress indicator style. @default 'count' */
  readonly progress?: PixelTourProgressStyle;
  /** ArrowRight/ArrowLeft step navigation and Escape-to-abort. @default true */
  readonly keyboard?: boolean;
  /** What clicking the scrim does. @default 'none' */
  readonly backdropClick?: 'none' | 'skip-tour';
  /** Default spotlight options; per-step `spotlight` overrides field-by-field. */
  readonly spotlight?: PixelTourSpotlightOptions;
}

export type PixelTourEndReason = 'completed' | 'skipped' | 'aborted';

export interface PixelTourStepChange<T = any> {
  readonly step: PixelTourStep<T>;
  readonly index: number;
  readonly total: number;
}
