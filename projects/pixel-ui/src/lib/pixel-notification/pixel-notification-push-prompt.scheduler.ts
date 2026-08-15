import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { PixelDialogService } from '../pixel-dialog/pixel-dialog.service';
import { PixelPushNotificationService } from './pixel-notification-push.service';
import PixelNotificationPushPromptDialogComponent from './pixel-notification-push-prompt-dialog';
import { DEFAULT_NOTIFICATION_PUSH_PROMPT_LABELS } from './pixel-notification-push-prompt';
import {
  DEFAULT_PUSH_PROMPT_COOLDOWN_MS,
  DEFAULT_PUSH_PROMPT_DELAY_MS,
  DEFAULT_PUSH_PROMPT_STORAGE_KEY,
  PIXEL_PUSH_PROMPT_DIALOG_PANEL_CLASS,
  PIXEL_PUSH_PROMPT_SCHEDULER_OPTIONS,
  type PixelPushPromptCooldownRecord,
  type PixelPushPromptDialogResult,
  type PixelPushPromptSchedulerEvent,
  type PixelPushPromptSchedulerReason,
} from './pixel-notification-push-prompt.scheduler.types';

/**
 * Opens `pixel-notification-push-prompt` in a dialog on a schedule or after a value moment.
 * Defaults: dialog title from `labels.heading`, `promptSurface: 'flat'`, `promptLayout: 'dialog'`
 * (footer CTAs end-aligned, no benefit chips, settings hint in body). Never calls
 * `Notification.requestPermission` / `enable()` — only the soft-ask CTA does.
 *
 * Provide via {@link providePixelPushPromptScheduler}. Requires
 * {@link providePixelPushNotifications} in a parent injector.
 */
@Injectable()
export class PixelPushPromptScheduler {
  private readonly push = inject(PixelPushNotificationService);
  private readonly dialog = inject(PixelDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly options = inject(PIXEL_PUSH_PROMPT_SCHEDULER_OPTIONS, {
    optional: true,
  }) ?? {};

  private readonly lastEventState = signal<PixelPushPromptSchedulerEvent | null>(null);
  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  private editingRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private editingRetries = 0;
  private dialogOpen = false;
  private started = false;

  readonly lastEvent = this.lastEventState.asReadonly();

  private get mode() {
    return this.options.mode ?? 'manual';
  }

  private get delayMs() {
    return this.options.delayMs ?? DEFAULT_PUSH_PROMPT_DELAY_MS;
  }

  private get cooldownMs() {
    return this.options.cooldownMs ?? DEFAULT_PUSH_PROMPT_COOLDOWN_MS;
  }

  private get storageKey() {
    return this.options.storageKey ?? DEFAULT_PUSH_PROMPT_STORAGE_KEY;
  }

  private get respectCriticalDialogs() {
    return this.options.respectCriticalDialogs !== false;
  }

  private get deferWhileEditing() {
    return this.options.deferWhileEditing !== false;
  }

  private get editingRetryLimit() {
    return this.options.editingRetryLimit ?? 15;
  }

  private get editingRetryMs() {
    return this.options.editingRetryMs ?? 2_000;
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.cancel());
    if ((this.options.autoStart ?? true) && this.mode === 'delayed') {
      // Defer so app bootstrap / push.start() can finish first.
      queueMicrotask(() => this.start());
    }
  }

  /** Begin the delayed soft-ask timer (`mode: 'delayed'`). Idempotent. */
  start(): void {
    if (this.mode !== 'delayed' || this.started) {
      return;
    }
    this.started = true;
    if (typeof window === 'undefined') {
      return;
    }
    this.clearDelayTimer();
    this.delayTimer = setTimeout(() => {
      this.delayTimer = null;
      void this.show('delayed');
    }, Math.max(0, this.delayMs));
  }

  /** Cancel a pending delayed / editing-retry open. Does not close an open dialog. */
  cancel(): void {
    this.clearDelayTimer();
    this.clearEditingRetry();
  }

  /**
   * Open the soft-ask dialog when eligible.
   * @returns Whether a dialog was opened.
   */
  show(reason: PixelPushPromptSchedulerReason = 'manual'): boolean {
    const skip = this.skipReason(reason);
    if (skip) {
      this.emit({ type: skip === 'cooldown' ? 'suppressed' : 'skipped', reason: skip });
      return false;
    }

    if (this.deferWhileEditing && isEditingFocus()) {
      this.scheduleEditingRetry(reason);
      this.emit({ type: 'suppressed', reason: 'editing' });
      return false;
    }

    return this.openDialog(reason);
  }

  /** Soft-ask after a product value moment (job done, watch thread, …). */
  showAfterValueMoment(): boolean {
    return this.show('value-moment');
  }

  /** Whether the soft-ask may open now (permission, cooldown, dialogs). */
  isEligible(): boolean {
    return this.skipReason('eligibility') === null;
  }

  /** Clear persisted cooldown (e.g. settings “Ask again”). */
  clearCooldown(): void {
    writeCooldown(this.storageKey, null);
  }

  private skipReason(
    _attempt: PixelPushPromptSchedulerReason,
  ): PixelPushPromptSchedulerReason | null {
    if (this.dialogOpen) {
      return 'already-open';
    }
    if (!this.pushEligible()) {
      return 'eligibility';
    }
    if (isCooldownActive(this.storageKey, this.cooldownMs)) {
      return 'cooldown';
    }
    if (this.respectCriticalDialogs && hasCriticalDialogOpen()) {
      return 'critical-dialog';
    }
    return null;
  }

  private pushEligible(): boolean {
    const permission = this.push.permission();
    if (
      permission === 'unsupported' ||
      permission === 'insecure-context' ||
      permission === 'denied'
    ) {
      return false;
    }
    if (this.push.status() === 'subscribed') {
      return false;
    }
    // Soft-ask when permission is still undecided, or granted but not yet subscribed.
    return permission === 'default' || permission === 'granted';
  }

  private openDialog(reason: PixelPushPromptSchedulerReason): boolean {
    if (typeof document === 'undefined') {
      return false;
    }
    this.clearEditingRetry();
    this.dialogOpen = true;
    const mergedLabels = {
      ...DEFAULT_NOTIFICATION_PUSH_PROMPT_LABELS,
      ...this.options.labels,
    };
    const data = {
      deviceLabel: this.options.deviceLabel ?? '',
      labels: this.options.labels ?? {},
      compact: this.options.compact ?? false,
      surface: this.options.promptSurface ?? 'flat',
      layout: this.options.promptLayout ?? 'dialog',
      showBenefits: this.options.showBenefits ?? false,
    };
    // undefined → labels.heading (title opposite close). Explicit '' omits the title.
    const title =
      this.options.dialogTitle === undefined
        ? mergedLabels.heading
        : this.options.dialogTitle.trim();
    const ref = this.dialog.open(PixelNotificationPushPromptDialogComponent, {
      ...(title ? { title } : {}),
      size: 'sm',
      role: 'dialog',
      panelClass: PIXEL_PUSH_PROMPT_DIALOG_PANEL_CLASS,
      ...(title ? {} : { ariaLabel: mergedLabels.heading || 'Enable notifications' }),
      data,
    });
    this.emit({ type: 'shown', reason });

    ref.afterClosed().subscribe((result) => {
      this.dialogOpen = false;
      this.handleCloseResult(result as PixelPushPromptDialogResult | undefined);
    });
    return true;
  }

  private handleCloseResult(result: PixelPushPromptDialogResult | undefined): void {
    const resolved: PixelPushPromptDialogResult = result ?? 'escape';
    if (resolved === 'accepted') {
      this.emit({ type: 'accepted', reason: 'manual' });
      return;
    }
    // Soft dismiss — recoverable; write cooldown. Native deny is reflected on next open via permission.
    writeCooldown(this.storageKey, { dismissedAt: Date.now() });
    if (this.push.permission() === 'denied') {
      this.emit({ type: 'denied', reason: 'manual' });
      return;
    }
    this.emit({
      type: 'dismissed',
      reason: resolved === 'continue-inbox' ? 'manual' : 'manual',
    });
  }

  private scheduleEditingRetry(reason: PixelPushPromptSchedulerReason): void {
    this.clearEditingRetry();
    if (this.editingRetries >= this.editingRetryLimit) {
      return;
    }
    this.editingRetries += 1;
    this.editingRetryTimer = setTimeout(() => {
      this.editingRetryTimer = null;
      void this.show(reason);
    }, this.editingRetryMs);
  }

  private clearDelayTimer(): void {
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
  }

  private clearEditingRetry(): void {
    if (this.editingRetryTimer !== null) {
      clearTimeout(this.editingRetryTimer);
      this.editingRetryTimer = null;
    }
  }

  private emit(
    partial: Omit<PixelPushPromptSchedulerEvent, 'at'> & { at?: number },
  ): void {
    const event: PixelPushPromptSchedulerEvent = {
      type: partial.type,
      reason: partial.reason,
      at: partial.at ?? Date.now(),
    };
    this.lastEventState.set(event);
    this.options.onEvent?.(event);
  }
}

/** @internal Exported for unit tests. */
export function isCooldownActive(storageKey: string, cooldownMs: number, now = Date.now()): boolean {
  const record = readCooldown(storageKey);
  if (!record) {
    return false;
  }
  return now - record.dismissedAt < cooldownMs;
}

/** @internal */
export function readCooldown(storageKey: string): PixelPushPromptCooldownRecord | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PixelPushPromptCooldownRecord;
    if (typeof parsed?.dismissedAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** @internal */
export function writeCooldown(
  storageKey: string,
  record: PixelPushPromptCooldownRecord | null,
): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    if (record === null) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(record));
    }
  } catch {
    // Private mode / quota — fail soft.
  }
}

function hasCriticalDialogOpen(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.querySelector('[role="alertdialog"]') !== null;
}

function isEditingFocus(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  if (el.isContentEditable) {
    return true;
  }
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return el.closest('[contenteditable="true"]') !== null;
}
