/** How missing / failed targets are surfaced to the user. */
export type PixelNavigateFailureMode = 'toast' | 'silent' | 'throw';

/** Soft-failure reasons returned by {@link PixelNavigateService.go}. */
export type PixelNavigateFailureReason =
  | 'not-found'
  | 'timeout'
  | 'navigation-failed'
  | 'adapter-missing'
  | 'activation-failed'
  | 'invalid-request'
  | 'cancelled'
  | 'forbidden';

/** Scroll behavior for section / element arrival. */
export type PixelNavigateScrollBehavior = 'smooth' | 'instant';

/** History write policy when syncing `?nav=` / fragment. */
export type PixelNavigateHistoryMode = 'push' | 'replace' | 'none';

/**
 * A single arrival target. Prefer registered adapters / `[pixelNavAnchor]` ids over CSS
 * selectors.
 */
export type PixelNavTarget =
  | {
      readonly type: 'section';
      readonly id: string;
      readonly offset?: number;
    }
  | {
      readonly type: 'selector';
      readonly selector: string;
      readonly offset?: number;
    }
  | {
      readonly type: 'accordion';
      readonly id: string;
      readonly panelId: string;
    }
  | {
      readonly type: 'stepper';
      readonly id: string;
      readonly step: number | string;
    }
  | {
      readonly type: 'tabs';
      readonly id: string;
      readonly tab: number | string;
    }
  | {
      readonly type: 'grid-row';
      readonly gridId: string;
      readonly rowId: string | number;
      readonly page?: number;
      readonly select?: boolean;
    }
  | {
      readonly type: 'wizard';
      readonly id: string;
      readonly step?: number | string;
    };

/** Primary request passed to {@link PixelNavigateService.go}. */
export interface PixelNavigateRequest {
  /** Angular Router commands when the view lives on another route. */
  readonly route?: readonly unknown[];
  /** Query params merged into the navigation (existing keys preserved unless overwritten). */
  readonly queryParams?: Readonly<Record<string, string | number | boolean | null | undefined>>;
  /** Native fragment (`#id`) for simple sections; `?nav=` wins when both are present. */
  readonly fragment?: string;
  /** One target or an ordered chain (tabs → accordion → section, etc.). */
  readonly target?: PixelNavTarget | readonly PixelNavTarget[];
  /** Explicit `?nav=` blob; when omitted, derived from `target` when URL sync is on. */
  readonly nav?: string;
  /**
   * First-class query companions (also readable from `?row=` / `?step=` / `?grid=` /
   * `?wizard=`). Merged into targets when `target` / `nav` omit them.
   */
  readonly row?: string | number;
  readonly step?: string | number;
  readonly grid?: string;
  readonly wizard?: string;
  readonly highlight?: boolean;
  readonly focus?: boolean;
  readonly announce?: string | boolean;
  readonly behavior?: PixelNavigateScrollBehavior;
  readonly offset?: number;
  readonly timeoutMs?: number;
  readonly onFailure?: PixelNavigateFailureMode;
  readonly history?: PixelNavigateHistoryMode;
  /** Sync `?nav=` (and optional fragment / first-class params) after a successful go. */
  readonly syncUrl?: boolean;
  /** When true (default), push this request onto the context stack after success. */
  readonly pushContext?: boolean;
  /** When false, skip multi-tab broadcast for this call. */
  readonly broadcast?: boolean;
  /**
   * Optional permission gate. Return `false` / reject → soft `forbidden`.
   * Runs before routing. Global guard from {@link PixelNavigateService.setPermissionGuard}
   * runs first when set.
   */
  readonly canActivate?: (
    request: PixelNavigateRequest,
  ) => boolean | Promise<boolean>;
  readonly source?:
    | 'user'
    | 'notification'
    | 'search'
    | 'email'
    | 'api'
    | 'bootstrap'
    | 'multi-tab'
    | 'context-back'
    | string;
}

/** Snapshot stored on the return-to-previous-context stack. */
export interface PixelNavigateContextEntry {
  readonly request: PixelNavigateRequest;
  readonly at: number;
}

export type PixelNavigatePermissionGuard = (
  request: PixelNavigateRequest,
) => boolean | Promise<boolean>;

export interface PixelNavigateResult {
  readonly ok: boolean;
  readonly reason?: PixelNavigateFailureReason;
  readonly message?: string;
  /** True when the route changed or early targets succeeded but a later target failed. */
  readonly partial?: boolean;
  readonly completedTargets?: number;
  readonly element?: Element | null;
}

export interface PixelNavigateConfig {
  readonly stickyOffset: number;
  readonly timeoutMs: number;
  readonly highlightMs: number;
  readonly onFailure: PixelNavigateFailureMode;
  readonly behavior: PixelNavigateScrollBehavior;
  readonly highlight: boolean;
  readonly focus: boolean;
  /** Query param key for the canonical shareable contract (default `nav`). */
  readonly navParam: string;
  /** Max depth of the return-context stack (default 20). */
  readonly contextStackLimit: number;
  /**
   * When true, successful navigations fan out to other tabs via BroadcastChannel.
   * Off by default.
   */
  readonly multiTab: boolean;
  /** BroadcastChannel name when multi-tab is enabled. */
  readonly multiTabChannel: string;
  /**
   * Also write/read first-class `row` / `step` / `grid` / `wizard` query params
   * alongside `nav` (default true).
   */
  readonly firstClassParams: boolean;
}

export const PIXEL_NAVIGATE_DEFAULTS: PixelNavigateConfig = {
  stickyOffset: 72,
  timeoutMs: 8_000,
  highlightMs: 2_000,
  onFailure: 'toast',
  behavior: 'smooth',
  highlight: true,
  focus: true,
  navParam: 'nav',
  contextStackLimit: 20,
  multiTab: false,
  multiTabChannel: 'pixel-navigate',
  firstClassParams: true,
};

export type ResolvedPixelNavigateConfig = PixelNavigateConfig;

/** Context passed to wizard adapters on open. */
export interface PixelNavWizardContext {
  readonly step?: number | string;
  readonly request: PixelNavigateRequest;
}

/**
 * Opt-in wizard surface. Without registration, `wizard:` URL targets soft-fail and never
 * open a dialog.
 */
export interface PixelNavWizardAdapter {
  readonly id: string;
  open(ctx: PixelNavWizardContext): void | Promise<void>;
  setStep(step: string | number): void | Promise<void>;
  getStep?(): string | number | null;
  close?(): void | Promise<void>;
  /** When true, step changes should call {@link PixelNavigateService.syncWizardStep}. */
  readonly syncUrl?: boolean;
}

/** Generic activation adapter for accordion / stepper / tabs / custom surfaces. */
export interface PixelNavActivationAdapter {
  readonly id: string;
  readonly kind: 'accordion' | 'stepper' | 'tabs' | 'custom';
  activate(target: PixelNavTarget): void | Promise<void | boolean | Element | null>;
}

/** Grid reveal contract registered with the navigate service (grid itself stays decoupled). */
export interface PixelNavGridRevealApi {
  revealRow(
    rowId: string | number,
    options?: {
      readonly page?: number;
      readonly select?: boolean;
      readonly highlightMs?: number;
    },
  ): boolean | Promise<boolean>;
}

export interface PixelNavigateAnalyticsEvent {
  readonly name:
    | 'navigated'
    | 'target_missing'
    | 'timeout'
    | 'navigation_failed'
    | 'from_notification'
    | 'wizard_opened'
    | 'adapter_missing'
    | 'forbidden'
    | 'context_back'
    | 'multi_tab_focus';
  readonly request?: PixelNavigateRequest;
  readonly result?: PixelNavigateResult;
  readonly data?: Readonly<Record<string, unknown>>;
}

export interface PixelNavigateAnalytics {
  track(event: PixelNavigateAnalyticsEvent): void;
}
