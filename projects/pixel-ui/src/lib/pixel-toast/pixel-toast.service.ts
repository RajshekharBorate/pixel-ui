import { Injectable, computed, inject, signal } from '@angular/core';
import {
  PIXEL_UI_ANALYTICS,
  emitPixelUiAnalytics,
} from '../shared/analytics/pixel-ui-analytics';
import {
  PIXEL_TOAST_DEFAULT_GLOBAL_CONFIG,
  PIXEL_TOAST_DEFAULT_TIMEOUT,
} from './pixel-toast.defaults';
import type {
  PixelToastConfig,
  PixelToastDismissEvent,
  PixelToastGlobalConfig,
  PixelToastPlacement,
  PixelToastPosition,
  PixelToastPromiseMessages,
  PixelToastRecord,
  PixelToastType,
} from './pixel-toast.types';

function resolvePlacement(config: PixelToastConfig): PixelToastPlacement {
  return config.placement ?? 'overlay';
}

function isOverlayPlacement(config: PixelToastConfig): boolean {
  return resolvePlacement(config) === 'overlay';
}

let nextToastId = 0;

function createToastId(): string {
  return `pixel-toast-${++nextToastId}`;
}

function normalizeClassValue(
  classValue: PixelToastConfig['className'],
): string {
  if (!classValue) {
    return '';
  }
  if (typeof classValue === 'string') {
    return classValue.trim();
  }
  if (Array.isArray(classValue)) {
    return classValue.filter(Boolean).join(' ').trim();
  }
  return Object.entries(classValue)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .join(' ')
    .trim();
}

function duplicateFingerprint(config: PixelToastConfig): string {
  return config.duplicateKey ?? `${config.type ?? 'default'}|${config.title ?? ''}|${config.message ?? ''}`;
}

function resolveMessage<T>(
  value: string | ((arg: T) => string | PixelToastConfig),
  arg: T,
): string | PixelToastConfig {
  return typeof value === 'function' ? value(arg) : value;
}

interface TimerState {
  timeoutId?: ReturnType<typeof setTimeout>;
  progressId?: ReturnType<typeof setInterval>;
  startedAt: number;
  elapsedBeforePause: number;
}

@Injectable({ providedIn: 'root' })
export class PixelToastService {
  private readonly analytics = inject(PIXEL_UI_ANALYTICS, { optional: true });
  private readonly timers = new Map<string, TimerState>();
  private readonly globalConfigSignal = signal<PixelToastGlobalConfig>(
    PIXEL_TOAST_DEFAULT_GLOBAL_CONFIG,
  );
  private readonly recordsSignal = signal<readonly PixelToastRecord[]>([]);
  private readonly queueSignal = signal<readonly { readonly id: string; readonly config: PixelToastConfig }[]>(
    [],
  );

  readonly globalConfig = this.globalConfigSignal.asReadonly();
  readonly toasts = this.recordsSignal.asReadonly();
  readonly queue = this.queueSignal.asReadonly();

  readonly dismissEvents = signal<PixelToastDismissEvent | null>(null);

  readonly visibleByPosition = computed(() => {
    const map = new Map<PixelToastPosition, PixelToastRecord[]>();
    for (const record of this.recordsSignal()) {
      if (record.exiting || !isOverlayPlacement(record.config)) {
        continue;
      }
      const position = record.config.position ?? this.globalConfig().position ?? 'top-right';
      const list = map.get(position) ?? [];
      list.push(record);
      map.set(position, list);
    }
    for (const [position, list] of map) {
      const newestOnTop = list[0]?.config.newestOnTop ?? this.globalConfig().newestOnTop ?? true;
      map.set(
        position,
        [...list].sort((a, b) =>
          newestOnTop ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
        ),
      );
    }
    return map;
  });

  readonly activePositions = computed(() => [...this.visibleByPosition().keys()]);

  readonly visibleInlineByAnchor = computed(() => {
    const map = new Map<string, PixelToastRecord[]>();
    for (const record of this.recordsSignal()) {
      if (record.exiting || isOverlayPlacement(record.config)) {
        continue;
      }
      const anchor = record.config.inlineAnchor ?? 'default';
      const list = map.get(anchor) ?? [];
      list.push(record);
      map.set(anchor, list);
    }
    for (const [anchor, list] of map) {
      const newestOnTop = list[0]?.config.newestOnTop ?? this.globalConfig().newestOnTop ?? true;
      map.set(
        anchor,
        [...list].sort((a, b) =>
          newestOnTop ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
        ),
      );
    }
    return map;
  });

  configure(config: Partial<PixelToastGlobalConfig>): void {
    this.globalConfigSignal.update((current) => ({ ...current, ...config }));
  }

  show(config: PixelToastConfig = {}): string {
    const merged = this.mergeConfig(config);
    if (this.shouldPreventDuplicate(merged)) {
      const existing = this.recordsSignal().find(
        (r) => duplicateFingerprint(r.config) === duplicateFingerprint(merged) && !r.exiting,
      );
      if (existing) {
        return existing.id;
      }
    }

    const maxVisible = merged.maxVisible ?? this.globalConfig().maxVisible ?? 5;
    const enableQueue = merged.enableQueue ?? this.globalConfig().enableQueue ?? true;
    const visibleOverlayCount = this.recordsSignal().filter(
      (r) => !r.exiting && isOverlayPlacement(r.config),
    ).length;

    if (
      isOverlayPlacement(merged) &&
      visibleOverlayCount >= maxVisible &&
      enableQueue
    ) {
      const queuedId = createToastId();
      this.queueSignal.update((q) => [...q, { id: queuedId, config: merged }]);
      return queuedId;
    }

    return this.enqueueRecord(merged);
  }

  success(title: string, message?: string, config: PixelToastConfig = {}): string {
    return this.show({ ...config, type: 'success', title, message });
  }

  error(title: string, message?: string, config: PixelToastConfig = {}): string {
    return this.show({ ...config, type: 'error', title, message, role: config.role ?? 'alert' });
  }

  warning(title: string, message?: string, config: PixelToastConfig = {}): string {
    return this.show({ ...config, type: 'warning', title, message });
  }

  info(title: string, message?: string, config: PixelToastConfig = {}): string {
    return this.show({ ...config, type: 'info', title, message });
  }

  loading(title: string, message?: string, config: PixelToastConfig = {}): string {
    return this.show({
      ...config,
      type: 'loading',
      title,
      message,
      disableTimeOut: true,
      progressBar: config.progressBar ?? false,
      closeButton: config.closeButton ?? true,
    });
  }

  offline(title: string, message?: string, config: PixelToastConfig = {}): string {
    return this.show({ ...config, type: 'offline', title, message, disableTimeOut: true });
  }

  online(title: string, message?: string, config: PixelToastConfig = {}): string {
    return this.show({ ...config, type: 'online', title, message });
  }

  system(title: string, message?: string, config: PixelToastConfig = {}): string {
    return this.show({ ...config, type: 'system', title, message });
  }

  custom(title: string, message?: string, config: PixelToastConfig = {}): string {
    return this.show({ ...config, type: 'custom', title, message });
  }

  async promise<T>(
    task: Promise<T>,
    messages: PixelToastPromiseMessages<T>,
    config: PixelToastConfig = {},
  ): Promise<T> {
    const loadingCfg =
      typeof messages.loading === 'string'
        ? { title: messages.loading }
        : messages.loading;
    const id = this.show({
      ...config,
      ...loadingCfg,
      type: 'promise',
      disableTimeOut: true,
      progressBar: false,
    });

    try {
      const value = await task;
      this.remove(id);
      const successCfg = resolveMessage(messages.success, value);
      if (typeof successCfg === 'string') {
        this.success(successCfg, undefined, config);
      } else {
        this.show({ ...config, ...successCfg, type: successCfg.type ?? 'success' });
      }
      return value;
    } catch (error) {
      this.remove(id);
      const errorCfg = resolveMessage(messages.error, error);
      if (typeof errorCfg === 'string') {
        this.error(errorCfg, undefined, config);
      } else {
        this.show({ ...config, ...errorCfg, type: errorCfg.type ?? 'error' });
      }
      throw error;
    }
  }

  update(id: string, patch: Partial<PixelToastConfig>): void {
    this.recordsSignal.update((records) =>
      records.map((record) =>
        record.id === id
          ? {
              ...record,
              config: { ...record.config, ...patch },
            }
          : record,
      ),
    );
  }

  setProgress(id: string, percent: number): void {
    const clamped = Math.max(0, Math.min(100, percent));
    this.recordsSignal.update((records) =>
      records.map((r) => (r.id === id ? { ...r, progressPercent: clamped } : r)),
    );
  }

  setExpanded(id: string, expanded: boolean): void {
    this.recordsSignal.update((records) =>
      records.map((r) => (r.id === id ? { ...r, expanded } : r)),
    );
  }

  setPaused(id: string, paused: boolean): void {
    this.recordsSignal.update((records) =>
      records.map((r) => (r.id === id ? { ...r, paused } : r)),
    );
    if (paused) {
      this.pauseTimer(id);
    } else {
      this.resumeTimer(id);
    }
  }

  setHovered(id: string, hovered: boolean): void {
    this.recordsSignal.update((records) =>
      records.map((r) => (r.id === id ? { ...r, hovered } : r)),
    );
    const record = this.recordsSignal().find((r) => r.id === id);
    if (!record) {
      return;
    }
    const pauseOnHover = record.config.pauseOnHover ?? this.globalConfig().pauseOnHover ?? true;
    if (pauseOnHover) {
      this.setPaused(id, hovered || record.focused);
    }
  }

  setFocused(id: string, focused: boolean): void {
    this.recordsSignal.update((records) =>
      records.map((r) => (r.id === id ? { ...r, focused } : r)),
    );
    const record = this.recordsSignal().find((r) => r.id === id);
    if (!record) {
      return;
    }
    const pauseOnFocus = record.config.pauseOnFocus ?? this.globalConfig().pauseOnFocus ?? true;
    if (pauseOnFocus) {
      this.setPaused(id, focused || record.hovered);
    }
  }

  remove(id: string, reason: PixelToastDismissEvent['reason'] = 'manual'): void {
    const record = this.recordsSignal().find((r) => r.id === id);
    if (!record) {
      return;
    }
    this.clearTimer(id);
    this.recordsSignal.update((records) =>
      records.map((r) => (r.id === id ? { ...r, exiting: true } : r)),
    );
    record.config.onClose?.();
    this.dismissEvents.set({ id, reason });
    this.emitAnalytics('ui.toast.dismiss', record, { reason });
    const exitMs = 280;
    setTimeout(() => {
      this.recordsSignal.update((records) => records.filter((r) => r.id !== id));
      this.dequeueNext();
    }, exitMs);
  }

  clear(position?: PixelToastPosition): void {
    const ids = this.recordsSignal()
      .filter(
        (r) =>
          isOverlayPlacement(r.config) && (!position || r.config.position === position),
      )
      .map((r) => r.id);
    for (const id of ids) {
      this.remove(id, 'clear');
    }
    if (!position) {
      this.queueSignal.set([]);
    }
  }

  clearInline(anchor?: string): void {
    const ids = this.recordsSignal()
      .filter(
        (r) =>
          !isOverlayPlacement(r.config) &&
          (!anchor || (r.config.inlineAnchor ?? 'default') === anchor),
      )
      .map((r) => r.id);
    for (const id of ids) {
      this.remove(id, 'clear');
    }
  }

  /** Show a toast in the document flow (`pixel-toast-inline` anchor). */
  inline(config: PixelToastConfig = {}): string {
    return this.show({ ...config, placement: 'inline' });
  }

  private mergeConfig(config: PixelToastConfig): PixelToastConfig {
    const global = this.globalConfig();
    const merged = {
      ...global,
      ...config,
      className: normalizeClassValue(config.className ?? global.className),
    };
    const placement = resolvePlacement(merged);
    const withPlacement: PixelToastConfig = {
      ...merged,
      placement,
      variant: merged.variant ?? 'soft',
      inlineAnchor: merged.inlineAnchor ?? 'default',
    };
    if (placement === 'inline') {
      return {
        ...withPlacement,
        closeButton: config.closeButton ?? merged.closeButton ?? false,
        progressBar: config.progressBar ?? merged.progressBar ?? false,
        swipeDismiss: config.swipeDismiss ?? merged.swipeDismiss ?? false,
        animation: config.animation ?? merged.animation ?? 'fade',
      };
    }
    return withPlacement;
  }

  private shouldPreventDuplicate(config: PixelToastConfig): boolean {
    return config.duplicatePrevention ?? this.globalConfig().duplicatePrevention ?? true;
  }

  private enqueueRecord(config: PixelToastConfig, presetId?: string): string {
    const id = presetId ?? createToastId();
    const record: PixelToastRecord = {
      id,
      config: {
        type: config.type ?? 'default',
        title: config.title ?? '',
        message: config.message ?? '',
        size: config.size ?? 'md',
        placement: config.placement ?? 'overlay',
        inlineAnchor: config.inlineAnchor ?? 'default',
        position: config.position ?? this.globalConfig().position ?? 'top-right',
        animation: config.animation ?? 'slide',
        role:
          config.role ??
          (config.type === 'error' || config.type === 'warning' ? 'alert' : 'status'),
        timeOut: config.timeOut ?? PIXEL_TOAST_DEFAULT_TIMEOUT,
        disableTimeOut: config.disableTimeOut ?? false,
        tapToDismiss: config.tapToDismiss ?? this.globalConfig().tapToDismiss ?? false,
        closeButton: config.closeButton ?? this.globalConfig().closeButton ?? true,
        progressBar: config.progressBar ?? this.globalConfig().progressBar ?? true,
        pauseOnHover: config.pauseOnHover ?? this.globalConfig().pauseOnHover ?? true,
        pauseOnFocus: config.pauseOnFocus ?? this.globalConfig().pauseOnFocus ?? true,
        compact: config.compact ?? false,
        expandable: config.expandable ?? false,
        swipeDismiss: config.swipeDismiss ?? this.globalConfig().swipeDismiss ?? true,
        ...config,
        variant: config.variant ?? 'soft',
      },
      createdAt: Date.now(),
      progressPercent: 0,
      paused: false,
      exiting: false,
      expanded: config.expanded ?? false,
      hovered: false,
      focused: false,
    };

    this.recordsSignal.update((records) => [...records, record]);
    this.emitAnalytics('ui.toast.show', record);
    this.startTimer(record);
    return id;
  }

  private emitAnalytics(
    name: 'ui.toast.show' | 'ui.toast.dismiss',
    record: PixelToastRecord,
    extraReserved: Record<string, unknown> = {},
  ): void {
    const category = record.config.category?.trim();
    emitPixelUiAnalytics(this.analytics, {
      name,
      component: 'pixel-toast',
      reserved: {
        toastId: record.id,
        type: record.config.type,
        size: record.config.size,
        variant: record.config.variant,
        placement: record.config.placement,
        position: record.config.position,
        role: record.config.role,
        ...(category ? { category } : {}),
        ...extraReserved,
      },
    });
  }

  private dequeueNext(): void {
    const visibleOverlayCount = this.recordsSignal().filter(
      (r) => !r.exiting && isOverlayPlacement(r.config),
    ).length;
    const maxVisible = this.globalConfig().maxVisible ?? 5;
    if (visibleOverlayCount >= maxVisible || this.queueSignal().length === 0) {
      return;
    }
    const [next, ...rest] = this.queueSignal();
    this.queueSignal.set(rest);
    if (next) {
      this.enqueueRecord(this.mergeConfig(next.config), next.id);
    }
  }

  private startTimer(record: PixelToastRecord): void {
    if (record.config.disableTimeOut) {
      return;
    }
    const duration = record.config.timeOut ?? PIXEL_TOAST_DEFAULT_TIMEOUT;
    const state: TimerState = { startedAt: Date.now(), elapsedBeforePause: 0 };
    this.timers.set(record.id, state);

    if (record.config.progressBar) {
      state.progressId = setInterval(() => {
        const current = this.recordsSignal().find((r) => r.id === record.id);
        if (!current || current.paused || current.exiting) {
          return;
        }
        const timer = this.timers.get(record.id);
        if (!timer) {
          return;
        }
        const elapsed = timer.elapsedBeforePause + (Date.now() - timer.startedAt);
        const percent = Math.min(100, (elapsed / duration) * 100);
        this.setProgress(record.id, percent);
        if (percent >= 100) {
          this.remove(record.id, 'timeout');
        }
      }, 50);
    } else {
      state.timeoutId = setTimeout(() => this.remove(record.id, 'timeout'), duration);
    }
  }

  private pauseTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) {
      return;
    }
    timer.elapsedBeforePause += Date.now() - timer.startedAt;
    if (timer.timeoutId) {
      clearTimeout(timer.timeoutId);
      timer.timeoutId = undefined;
    }
    if (timer.progressId) {
      clearInterval(timer.progressId);
      timer.progressId = undefined;
    }
  }

  private resumeTimer(id: string): void {
    const record = this.recordsSignal().find((r) => r.id === id);
    const timer = this.timers.get(id);
    if (!record || !timer || record.config.disableTimeOut) {
      return;
    }
    const duration = record.config.timeOut ?? PIXEL_TOAST_DEFAULT_TIMEOUT;
    const remaining = duration - timer.elapsedBeforePause;
    if (remaining <= 0) {
      this.remove(id, 'timeout');
      return;
    }
    timer.startedAt = Date.now();
    if (record.config.progressBar) {
      timer.progressId = setInterval(() => {
        const current = this.recordsSignal().find((r) => r.id === id);
        if (!current || current.paused || current.exiting) {
          return;
        }
        const elapsed = timer.elapsedBeforePause + (Date.now() - timer.startedAt);
        const percent = Math.min(100, (elapsed / duration) * 100);
        this.setProgress(id, percent);
        if (percent >= 100) {
          this.remove(id, 'timeout');
        }
      }, 50);
    } else {
      timer.timeoutId = setTimeout(() => this.remove(id, 'timeout'), remaining);
    }
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) {
      return;
    }
    if (timer.timeoutId) {
      clearTimeout(timer.timeoutId);
    }
    if (timer.progressId) {
      clearInterval(timer.progressId);
    }
    this.timers.delete(id);
  }
}
