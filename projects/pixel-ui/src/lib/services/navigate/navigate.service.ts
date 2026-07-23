import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { copyTextToClipboard } from '../export/clipboard';
import { PixelToastService } from '../../pixel-toast/pixel-toast.service';
import { PixelNavAnchorRegistry } from './navigate-anchor';
import {
  announceNavigate,
  focusElement,
  highlightElement,
  scrollToElement,
  waitForElement,
  waitForLayout,
} from './navigate-dom';
import { PIXEL_NAVIGATE_ANALYTICS, PIXEL_NAVIGATE_CONFIG } from './navigate.tokens';
import {
  coerceNavigateRequest,
  navigateRequestToUrl,
  normalizeTargets,
  parseNavigateUrl,
  serializeNavTargets,
} from './navigate-url';
import { openNotificationTarget } from './notification-nav';
import {
  PIXEL_NAVIGATE_DEFAULTS,
  type PixelNavActivationAdapter,
  type PixelNavigateAnalytics,
  type PixelNavigateConfig,
  type PixelNavigateContextEntry,
  type PixelNavigateFailureMode,
  type PixelNavigateFailureReason,
  type PixelNavigatePermissionGuard,
  type PixelNavigateRequest,
  type PixelNavigateResult,
  type PixelNavGridRevealApi,
  type PixelNavTarget,
  type PixelNavWizardAdapter,
  type PixelNavWizardContext,
  type ResolvedPixelNavigateConfig,
} from './navigate.types';

function mergeConfig(partial?: Partial<PixelNavigateConfig> | null): ResolvedPixelNavigateConfig {
  return { ...PIXEL_NAVIGATE_DEFAULTS, ...partial };
}

interface PixelNavigateBroadcastMessage {
  readonly kind: 'focus';
  readonly clientId: string;
  readonly request: PixelNavigateRequest;
}

/**
 * Contextual navigation / deep-link orchestrator. Angular Router owns pages; this service
 * owns targets inside routes (section, accordion, stepper, tabs, grid row, opt-in wizard).
 */
@Injectable({ providedIn: 'root' })
export class PixelNavigateService {
  private readonly router = inject(Router, { optional: true });
  private readonly toast = inject(PixelToastService, { optional: true });
  private readonly anchors = inject(PixelNavAnchorRegistry);
  private readonly analytics = inject(PIXEL_NAVIGATE_ANALYTICS, { optional: true });
  private readonly config = mergeConfig(inject(PIXEL_NAVIGATE_CONFIG, { optional: true }));

  private readonly activationAdapters = new Map<string, PixelNavActivationAdapter>();
  private readonly grids = new Map<string, PixelNavGridRevealApi>();
  private readonly wizards = new Map<string, PixelNavWizardAdapter>();
  private clearHighlight: (() => void) | null = null;

  private readonly contextStack: PixelNavigateContextEntry[] = [];
  private permissionGuard: PixelNavigatePermissionGuard | null = null;
  private broadcast: BroadcastChannel | null = null;
  private readonly clientId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `pixel-nav-${Math.random().toString(36).slice(2)}`;
  private applyingRemote = false;

  constructor() {
    if (this.config.multiTab) {
      this.enableMultiTab();
    }
  }

  /** Merged defaults from {@link PIXEL_NAVIGATE_CONFIG}. */
  get resolvedConfig(): ResolvedPixelNavigateConfig {
    return this.config;
  }

  /** Current return-context stack (newest last). */
  get contextEntries(): readonly PixelNavigateContextEntry[] {
    return this.contextStack;
  }

  /** Register an accordion / stepper / tabs / custom activation adapter. */
  registerAdapter(adapter: PixelNavActivationAdapter): () => void {
    this.activationAdapters.set(adapter.id, adapter);
    return () => {
      if (this.activationAdapters.get(adapter.id) === adapter) {
        this.activationAdapters.delete(adapter.id);
      }
    };
  }

  /** Register a grid reveal API for `grid-row` targets. */
  registerGrid(id: string, api: PixelNavGridRevealApi): () => void {
    this.grids.set(id, api);
    return () => {
      if (this.grids.get(id) === api) {
        this.grids.delete(id);
      }
    };
  }

  /**
   * Opt-in wizard registration. Without this, `wizard:` targets never open a dialog.
   */
  registerWizard(adapter: PixelNavWizardAdapter): () => void {
    this.wizards.set(adapter.id, adapter);
    return () => {
      if (this.wizards.get(adapter.id) === adapter) {
        this.wizards.delete(adapter.id);
      }
    };
  }

  /**
   * Global permission gate (runs before per-request `canActivate`).
   * Return `false` → soft `forbidden`. Pass `null` to clear.
   */
  setPermissionGuard(guard: PixelNavigatePermissionGuard | null): void {
    this.permissionGuard = guard;
  }

  /** Opt-in multi-tab focus fan-out. Safe no-op when BroadcastChannel is unavailable (SSR). */
  enableMultiTab(channelName = this.config.multiTabChannel): void {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }
    try {
      this.broadcast?.close();
      this.broadcast = new BroadcastChannel(channelName);
      this.broadcast.onmessage = (message: MessageEvent<PixelNavigateBroadcastMessage>) => {
        const data = message.data;
        if (!data || data.kind !== 'focus' || data.clientId === this.clientId) {
          return;
        }
        this.applyingRemote = true;
        void this.go({
          ...data.request,
          source: 'multi-tab',
          pushContext: false,
          broadcast: false,
          history: 'replace',
        }).finally(() => {
          this.applyingRemote = false;
        });
        this.track({ name: 'multi_tab_focus', request: data.request });
      };
    } catch {
      this.broadcast = null;
    }
  }

  /** Tear down the multi-tab channel. */
  disableMultiTab(): void {
    try {
      this.broadcast?.close();
    } catch {
      // ignore
    }
    this.broadcast = null;
  }

  /** Parse a URL into a navigate request (`?nav=` wins over `#fragment` for targets). */
  parseUrl(url: string): PixelNavigateRequest | null {
    return parseNavigateUrl(url, this.config.navParam, {
      firstClassParams: this.config.firstClassParams,
    });
  }

  /** Serialize a request to a relative URL string. */
  toUrl(request: PixelNavigateRequest, basePath?: string): string {
    return navigateRequestToUrl(request, {
      navParam: this.config.navParam,
      basePath,
      firstClassParams: this.config.firstClassParams,
    });
  }

  /** Copy a shareable link for `request` (current origin + serialized path). */
  async copyLink(request: PixelNavigateRequest): Promise<void> {
    if (typeof location === 'undefined') {
      await copyTextToClipboard(this.toUrl(request));
      return;
    }
    const relative = this.toUrl(request);
    const absolute = `${location.origin}${relative.startsWith('/') ? '' : '/'}${relative}`;
    await copyTextToClipboard(absolute);
  }

  /** Bootstrap helper: parse the current location and {@link go}. */
  async goFromUrl(url?: string): Promise<PixelNavigateResult> {
    if (url == null && typeof location === 'undefined') {
      return { ok: true, message: 'No location (SSR)' };
    }
    const raw =
      url ?? `${location.pathname}${location.search}${location.hash}`;
    const request = this.parseUrl(raw);
    if (!request) {
      return { ok: true, message: 'No navigate payload in URL' };
    }
    return this.go({
      ...request,
      source: request.source ?? 'bootstrap',
      history: 'replace',
      pushContext: false,
    });
  }

  /**
   * While an opt-in wizard with `syncUrl` is open, write the current step into `?nav=`
   * (and first-class `step` / `wizard` when enabled) using `replaceUrl`.
   */
  syncWizardStep(wizardId: string, step: string | number): void {
    if (!this.router || typeof location === 'undefined') {
      return;
    }
    const nav = serializeNavTargets([{ type: 'wizard', id: wizardId, step }]);
    const queryParams: Record<string, string> = { [this.config.navParam]: nav };
    if (this.config.firstClassParams) {
      queryParams['wizard'] = wizardId;
      queryParams['step'] = String(step);
    }
    void this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Peek the newest context stack entry without removing it. */
  peekContext(): PixelNavigateContextEntry | null {
    return this.contextStack.length
      ? this.contextStack[this.contextStack.length - 1]
      : null;
  }

  /** Clear the return-context stack. */
  clearContext(): void {
    this.contextStack.length = 0;
  }

  /**
   * Pop the previous context and {@link go} there. Soft-fails with `not-found` when empty.
   */
  async back(): Promise<PixelNavigateResult> {
    const entry = this.contextStack.pop();
    if (!entry) {
      return this.fail({}, 'not-found', 'No previous navigate context', {
        onFailure: 'silent',
      });
    }
    this.track({ name: 'context_back', request: entry.request });
    return this.go({
      ...entry.request,
      source: 'context-back',
      pushContext: false,
      broadcast: false,
      history: 'replace',
    });
  }

  /** Convenience: {@link openNotificationTarget} bound to this service. */
  openFromNotification(
    notification: import('../../pixel-notification/pixel-notification.types').PixelNotification,
    options?: import('./notification-nav').OpenNotificationTargetOptions,
  ): Promise<import('./navigate.types').PixelNavigateResult | null> {
    return openNotificationTarget(this, notification, options);
  }

  /** Navigate to a route and/or in-page target chain. Soft-fails by default. */
  async go(request: PixelNavigateRequest = {}): Promise<PixelNavigateResult> {
    try {
      return await this.executeGo(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.fail(request, 'invalid-request', message, { throwAnyway: true });
    }
  }

  private async executeGo(request: PixelNavigateRequest): Promise<PixelNavigateResult> {
    const timeoutMs = request.timeoutMs ?? this.config.timeoutMs;
    const onFailure = request.onFailure ?? this.config.onFailure;

    const allowed = await this.checkPermission(request);
    if (!allowed) {
      return this.fail(request, 'forbidden', 'Navigation is not permitted', { onFailure });
    }

    if (request.route?.length) {
      if (!this.router) {
        return this.fail(request, 'navigation-failed', 'Angular Router is not available', {
          onFailure,
        });
      }
      try {
        const extras = {
          queryParams: this.mergeQueryParams(request) as Record<string, unknown> | undefined,
          fragment: request.fragment,
          queryParamsHandling: 'merge' as const,
          replaceUrl: request.history === 'replace',
        };
        const navigated = await this.router.navigate([...request.route], extras);
        if (navigated === false) {
          return this.fail(request, 'navigation-failed', 'Router navigation was blocked', {
            onFailure,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return this.fail(request, 'navigation-failed', message, { onFailure });
      }
    }

    const targets = normalizeTargets(request);
    let completed = 0;
    let lastElement: Element | null = null;

    for (const target of targets) {
      const step = await this.applyTarget(target, request, timeoutMs);
      if (!step.ok) {
        const partial = completed > 0 || Boolean(request.route?.length);
        return this.fail(request, step.reason ?? 'not-found', step.message ?? 'Target failed', {
          onFailure,
          partial,
          completedTargets: completed,
          element: lastElement,
        });
      }
      completed += 1;
      if (step.element) {
        lastElement = step.element;
      }
    }

    if (!targets.length && request.fragment) {
      const el = await this.resolveSection(request.fragment, timeoutMs);
      if (!el) {
        return this.fail(request, 'timeout', `Section "${request.fragment}" not found`, {
          onFailure,
        });
      }
      this.arriveAtElement(el, request);
      lastElement = el;
      completed = 1;
    }

    if (request.syncUrl && this.router && typeof document !== 'undefined') {
      await this.writeUrl(request, targets);
    }

    if (request.pushContext !== false && request.source !== 'context-back') {
      this.pushContext(request);
    }

    if (request.broadcast !== false && !this.applyingRemote) {
      this.broadcastFocus(request);
    }

    const result: PixelNavigateResult = {
      ok: true,
      completedTargets: completed,
      element: lastElement,
    };
    this.track({ name: 'navigated', request, result });
    if (request.source === 'notification') {
      this.track({ name: 'from_notification', request, result });
    }
    return result;
  }

  private async checkPermission(request: PixelNavigateRequest): Promise<boolean> {
    try {
      if (this.permissionGuard) {
        const globalOk = await this.permissionGuard(request);
        if (!globalOk) {
          return false;
        }
      }
      if (request.canActivate) {
        return await request.canActivate(request);
      }
      return true;
    } catch {
      return false;
    }
  }

  private pushContext(request: PixelNavigateRequest): void {
    const snapshot: PixelNavigateRequest = {
      route: request.route,
      queryParams: request.queryParams,
      fragment: request.fragment,
      target: request.target,
      nav: request.nav,
      row: request.row,
      step: request.step,
      grid: request.grid,
      wizard: request.wizard,
      source: request.source,
    };
    this.contextStack.push({ request: snapshot, at: Date.now() });
    const limit = Math.max(1, this.config.contextStackLimit);
    while (this.contextStack.length > limit) {
      this.contextStack.shift();
    }
  }

  private broadcastFocus(request: PixelNavigateRequest): void {
    if (!this.broadcast) {
      return;
    }
    try {
      const message: PixelNavigateBroadcastMessage = {
        kind: 'focus',
        clientId: this.clientId,
        request: {
          route: request.route,
          queryParams: request.queryParams,
          fragment: request.fragment,
          target: request.target,
          nav: request.nav,
          row: request.row,
          step: request.step,
          grid: request.grid,
          wizard: request.wizard,
        },
      };
      this.broadcast.postMessage(message);
    } catch {
      // restricted contexts — stay single-tab
    }
  }

  private mergeQueryParams(
    request: PixelNavigateRequest,
  ): Record<string, string | number | boolean | null | undefined> | undefined {
    const merged: Record<string, string | number | boolean | null | undefined> = {
      ...(request.queryParams ?? {}),
    };
    if (!this.config.firstClassParams) {
      return Object.keys(merged).length ? merged : undefined;
    }
    if (request.row != null) merged['row'] = request.row;
    if (request.step != null) merged['step'] = request.step;
    if (request.grid) merged['grid'] = request.grid;
    if (request.wizard) merged['wizard'] = request.wizard;
    return Object.keys(merged).length ? merged : undefined;
  }

  private async applyTarget(
    target: PixelNavTarget,
    request: PixelNavigateRequest,
    timeoutMs: number,
  ): Promise<PixelNavigateResult> {
    switch (target.type) {
      case 'section': {
        const el = await this.resolveSection(target.id, timeoutMs);
        if (!el) {
          return {
            ok: false,
            reason: 'timeout',
            message: `Section "${target.id}" not found`,
          };
        }
        this.arriveAtElement(el, request, target.offset);
        return { ok: true, element: el };
      }
      case 'selector': {
        if (typeof document === 'undefined') {
          return {
            ok: false,
            reason: 'timeout',
            message: `Selector "${target.selector}" not available (SSR)`,
          };
        }
        const el = await waitForElement(() => {
          try {
            return document.querySelector(target.selector);
          } catch {
            return null;
          }
        }, timeoutMs);
        if (!el) {
          return {
            ok: false,
            reason: 'timeout',
            message: `Selector "${target.selector}" not found`,
          };
        }
        this.arriveAtElement(el, request, target.offset);
        return { ok: true, element: el };
      }
      case 'accordion':
      case 'stepper':
      case 'tabs': {
        const adapter = this.activationAdapters.get(target.id);
        if (!adapter) {
          return {
            ok: false,
            reason: 'adapter-missing',
            message: `No ${target.type} adapter registered for "${target.id}"`,
          };
        }
        try {
          const activated = await adapter.activate(target);
          if (activated === false) {
            return {
              ok: false,
              reason: 'activation-failed',
              message: `Failed to activate ${target.type} "${target.id}"`,
            };
          }
          // Wait for expand/select layout before a following section scroll.
          await waitForLayout();
          // Only scroll/highlight when the adapter returns a concrete Element.
          // Do NOT resolve the adapter id as a section — that wrongly highlights hosts
          // like pixel-tabs (entire tab strip + panels).
          if (activated instanceof Element) {
            this.arriveAtElement(activated, request);
            return { ok: true, element: activated };
          }
          return { ok: true, element: null };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return { ok: false, reason: 'activation-failed', message };
        }
      }
      case 'grid-row': {
        const grid = this.grids.get(target.gridId);
        if (!grid) {
          return {
            ok: false,
            reason: 'adapter-missing',
            message: `No grid registered for "${target.gridId}"`,
          };
        }
        try {
          const ok = await grid.revealRow(target.rowId, {
            page: target.page,
            select: target.select,
            highlightMs: request.highlight === false ? 0 : this.config.highlightMs,
          });
          if (!ok) {
            return {
              ok: false,
              reason: 'not-found',
              message: `Row "${String(target.rowId)}" not found in grid "${target.gridId}"`,
            };
          }
          return { ok: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return { ok: false, reason: 'activation-failed', message };
        }
      }
      case 'wizard': {
        const wizard = this.wizards.get(target.id);
        if (!wizard) {
          this.track({
            name: 'adapter_missing',
            request,
            data: { wizardId: target.id },
          });
          return {
            ok: false,
            reason: 'adapter-missing',
            message: `No wizard registered for "${target.id}" (opt-in required)`,
          };
        }
        try {
          const ctx: PixelNavWizardContext = { step: target.step, request };
          await wizard.open(ctx);
          if (target.step != null) {
            await wizard.setStep(target.step);
          }
          if (wizard.syncUrl && target.step != null) {
            this.syncWizardStep(target.id, target.step);
          }
          this.track({ name: 'wizard_opened', request, data: { wizardId: target.id } });
          const element = await this.resolveSection(target.id, Math.min(timeoutMs, 2_000));
          if (element) {
            this.arriveAtElement(element, request);
          }
          return { ok: true, element };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return { ok: false, reason: 'activation-failed', message };
        }
      }
      default:
        return { ok: false, reason: 'invalid-request', message: 'Unknown target type' };
    }
  }

  private async resolveSection(id: string, timeoutMs: number): Promise<Element | null> {
    return waitForElement(() => {
      const fromRegistry = this.anchors.resolve(id);
      if (fromRegistry) {
        return fromRegistry;
      }
      if (typeof document === 'undefined') {
        return null;
      }
      const byId = document.getElementById(id);
      if (byId) {
        return byId;
      }
      try {
        return document.querySelector(`[pixelNavAnchor="${id}"]`);
      } catch {
        return null;
      }
    }, timeoutMs);
  }

  private arriveAtElement(
    element: Element,
    request: PixelNavigateRequest,
    offsetOverride?: number,
  ): void {
    try {
      const offset = offsetOverride ?? request.offset ?? this.config.stickyOffset;
      const behavior = request.behavior ?? this.config.behavior;
      scrollToElement(element, { offset, behavior });

      if (request.focus ?? this.config.focus) {
        focusElement(element);
      }

      if (request.highlight ?? this.config.highlight) {
        this.clearHighlight?.();
        this.clearHighlight = highlightElement(element, this.config.highlightMs);
      }

      const announce = request.announce;
      if (announce === true) {
        announceNavigate('Navigated to target');
      } else if (typeof announce === 'string' && announce.trim()) {
        announceNavigate(announce);
      }
    } catch {
      // Arrival polish must not fail the navigation result in limited DOM environments.
    }
  }

  private async writeUrl(
    request: PixelNavigateRequest,
    targets: readonly PixelNavTarget[],
  ): Promise<void> {
    if (!this.router || request.history === 'none') {
      return;
    }
    const navBlob =
      request.nav ?? (targets.length ? serializeNavTargets(targets) : undefined);
    const fragment =
      request.fragment ||
      (targets.length === 1 && targets[0].type === 'section' ? targets[0].id : undefined);
    const queryParams: Record<string, string | number | boolean | null | undefined> = {
      ...(request.queryParams ?? {}),
      ...(navBlob ? { [this.config.navParam]: navBlob } : {}),
    };
    if (this.config.firstClassParams) {
      const gridRow = targets.find((t) => t.type === 'grid-row');
      const wizard = targets.find((t) => t.type === 'wizard');
      const stepper = targets.find((t) => t.type === 'stepper');
      const row =
        request.row ?? (gridRow && gridRow.type === 'grid-row' ? gridRow.rowId : undefined);
      const step =
        request.step ??
        (wizard && wizard.type === 'wizard'
          ? wizard.step
          : stepper && stepper.type === 'stepper'
            ? stepper.step
            : undefined);
      const grid =
        request.grid ?? (gridRow && gridRow.type === 'grid-row' ? gridRow.gridId : undefined);
      const wizardId =
        request.wizard ?? (wizard && wizard.type === 'wizard' ? wizard.id : undefined);
      if (row != null) queryParams['row'] = row;
      if (step != null) queryParams['step'] = step;
      if (grid) queryParams['grid'] = grid;
      if (wizardId) queryParams['wizard'] = wizardId;
    }
    await this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      fragment: fragment || undefined,
      replaceUrl: request.history !== 'push',
    });
  }

  private fail(
    request: PixelNavigateRequest,
    reason: PixelNavigateFailureReason,
    message: string,
    options: {
      readonly onFailure?: PixelNavigateFailureMode;
      readonly partial?: boolean;
      readonly completedTargets?: number;
      readonly element?: Element | null;
      readonly throwAnyway?: boolean;
    } = {},
  ): PixelNavigateResult {
    const onFailure = options.onFailure ?? request.onFailure ?? this.config.onFailure;
    const result: PixelNavigateResult = {
      ok: false,
      reason,
      message,
      partial: options.partial,
      completedTargets: options.completedTargets,
      element: options.element ?? null,
    };

    if (reason === 'timeout' || reason === 'not-found') {
      this.track({
        name: reason === 'timeout' ? 'timeout' : 'target_missing',
        request,
        result,
      });
    } else if (reason === 'navigation-failed') {
      this.track({ name: 'navigation_failed', request, result });
    } else if (reason === 'forbidden') {
      this.track({ name: 'forbidden', request, result });
    }

    if (onFailure === 'toast') {
      this.toast?.warning('Navigation', message);
    }
    if (onFailure === 'throw' || options.throwAnyway) {
      if (onFailure === 'throw') {
        throw new Error(message);
      }
    }
    return result;
  }

  private track(
    event: Parameters<NonNullable<PixelNavigateAnalytics['track']>>[0],
  ): void {
    try {
      this.analytics?.track(event);
    } catch {
      // analytics must never break navigation
    }
  }
}

export { coerceNavigateRequest };
