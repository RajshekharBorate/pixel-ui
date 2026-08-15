import { InjectionToken } from '@angular/core';
import type {
  PixelNotificationPushPromptLabels,
  PixelNotificationPushPromptLayout,
  PixelNotificationPushPromptSurface,
} from './pixel-notification-push-prompt';

/** How the soft-ask is scheduled. Default `manual` — prompt never auto-opens. */
export type PixelPushPromptSchedulerMode = 'manual' | 'delayed' | 'event';

/** Why a soft-ask was opened or skipped. */
export type PixelPushPromptSchedulerReason =
  | 'delayed'
  | 'value-moment'
  | 'manual'
  | 'eligibility'
  | 'cooldown'
  | 'critical-dialog'
  | 'editing'
  | 'already-open';

/** Analytics / host callback event names. */
export type PixelPushPromptSchedulerEventType =
  | 'shown'
  | 'dismissed'
  | 'accepted'
  | 'denied'
  | 'skipped'
  | 'suppressed';

export interface PixelPushPromptSchedulerEvent {
  readonly type: PixelPushPromptSchedulerEventType;
  readonly reason?: PixelPushPromptSchedulerReason;
  readonly at: number;
}

/** Persisted soft-ask dismiss cooldown (localStorage). */
export interface PixelPushPromptCooldownRecord {
  readonly dismissedAt: number;
}

export interface ProvidePixelPushPromptSchedulerOptions {
  /**
   * `manual` — only `show()` / `showAfterValueMoment()`.
   * `delayed` — schedule soft-ask dialog after `delayMs` on `start()`.
   * `event` — same as manual; use `showAfterValueMoment()` after a product action.
   * @default 'manual'
   */
  readonly mode?: PixelPushPromptSchedulerMode;
  /**
   * Delay before opening the soft-ask dialog when `mode` is `delayed`.
   * @default 45000
   */
  readonly delayMs?: number;
  /**
   * Suppress re-showing after Not now / Escape / continue-with-inbox.
   * @default 2592000000 (30 days)
   */
  readonly cooldownMs?: number;
  /** localStorage key for cooldown. @default 'pixel-push-prompt-cooldown' */
  readonly storageKey?: string;
  /** Presentation surface. Only `dialog` is supported. @default 'dialog' */
  readonly openIn?: 'dialog';
  /**
   * @description Dialog header title. When omitted, uses `labels.heading` (or the default heading)
   * so the title sits opposite the close control — same chrome as confirm dialogs. Pass `''` to
   * omit the title (prompt then shows an in-body heading only if not using dialog layout).
   * @default labels.heading
   */
  readonly dialogTitle?: string;
  readonly deviceLabel?: string;
  readonly labels?: Partial<PixelNotificationPushPromptLabels>;
  readonly compact?: boolean;
  /**
   * Prompt chrome inside the dialog. Scheduler always uses `'flat'` (no nested card).
   * @default 'flat'
   */
  readonly promptSurface?: PixelNotificationPushPromptSurface;
  /**
   * Prompt layout inside the dialog. Scheduler defaults to `'dialog'` (no benefit chips,
   * settings hint, wider action gaps).
   * @default 'dialog'
   */
  readonly promptLayout?: PixelNotificationPushPromptLayout;
  /**
   * Forwarded to the prompt. Scheduler defaults to `false` (chips repeat dialog copy).
   * @default false
   */
  readonly showBenefits?: boolean;
  /**
   * Do not open while a critical `alertdialog` is visible.
   * @default true
   */
  readonly respectCriticalDialogs?: boolean;
  /**
   * Defer open while focus is in an editable field; retry briefly.
   * @default true
   */
  readonly deferWhileEditing?: boolean;
  /** Max retries while editing before giving up this session. @default 15 */
  readonly editingRetryLimit?: number;
  /** Gap between editing retries (ms). @default 2000 */
  readonly editingRetryMs?: number;
  /**
   * When `mode` is `delayed`, call `start()` after construct.
   * @default true
   */
  readonly autoStart?: boolean;
  /** Host analytics / telemetry hook. */
  readonly onEvent?: (event: PixelPushPromptSchedulerEvent) => void;
}

export const PIXEL_PUSH_PROMPT_SCHEDULER_OPTIONS =
  new InjectionToken<ProvidePixelPushPromptSchedulerOptions>(
    'PIXEL_PUSH_PROMPT_SCHEDULER_OPTIONS',
  );

export const DEFAULT_PUSH_PROMPT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
export const DEFAULT_PUSH_PROMPT_DELAY_MS = 45_000;
export const DEFAULT_PUSH_PROMPT_STORAGE_KEY = 'pixel-push-prompt-cooldown';
/** Applied to the dialog surface for denser soft-ask chrome. */
export const PIXEL_PUSH_PROMPT_DIALOG_PANEL_CLASS = 'pixel-notification-push-prompt-panel';

/** @internal Payload injected into the soft-ask dialog host. */
export interface PixelPushPromptDialogData {
  readonly deviceLabel: string;
  readonly labels: Partial<PixelNotificationPushPromptLabels>;
  readonly compact: boolean;
  readonly surface: PixelNotificationPushPromptSurface;
  readonly layout: PixelNotificationPushPromptLayout;
  readonly showBenefits: boolean;
}

export type PixelPushPromptDialogResult =
  | 'dismissed'
  | 'accepted'
  | 'continue-inbox'
  | 'escape';
