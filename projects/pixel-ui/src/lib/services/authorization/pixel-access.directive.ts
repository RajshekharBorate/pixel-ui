import {
  Directive,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  PIXEL_ACCESS_PEP,
  type PixelAccessPep,
} from '../../shared/access-pep';
import { PixelAuthorizationService } from './authorization.service';
import type {
  PixelAccessDecision,
  PixelAuthorizationRequest,
  PixelDeniedActionMode,
} from './authorization.types';

/**
 * Attribute PEP — prefer with `@if (auth.can()())` for hide, or bind mode for disable/readonly.
 *
 * ```html
 * <pixel-button pixelAccess="claims:export">Export</pixel-button>
 * <pixel-button pixelAccess="claims:edit" pixelAccessMode="disable">Edit</pixel-button>
 * ```
 *
 * When context is `unknown`/`loading`, host is not hidden (aria-busy) — avoids flash-of-empty UI.
 *
 * Custom elements (`pixel-button`, `pixel-input`, …) ignore host `hidden`/`disabled`/`readonly`
 * because author `:host { display }` overrides `[hidden]`, and inner native controls bind their
 * own inputs. This directive (1) sets inline `display: none` for hide, (2) provides
 * {@link PIXEL_ACCESS_PEP} for Pixel controls, (3) syncs descendant native controls after render.
 */
@Directive({
  selector: '[pixelAccess]',
  providers: [{ provide: PIXEL_ACCESS_PEP, useExisting: PixelAccessDirective }],
  host: {
    '[attr.hidden]': 'hidden() ? "" : null',
    '[attr.inert]': 'hidden() ? "" : null',
    '[style.display]': 'hidden() ? "none" : null',
    '[attr.aria-hidden]': 'hidden() ? "true" : null',
    '[attr.aria-busy]': 'busy() ? "true" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.disabled]': 'nativeDisabled() ? "" : null',
    '[attr.readonly]': 'readonly() ? "" : null',
    '[class.pixel-access--denied]': 'deniedReady()',
    '[class.pixel-access--pending]': 'busy()',
  },
})
export default class PixelAccessDirective implements PixelAccessPep {
  private readonly auth = inject(PixelAuthorizationService, { optional: true });
  private readonly host = inject(ElementRef<HTMLElement>);

  /**
   * @type {string | PixelAuthorizationRequest}
   * @default ''
   * @description Permission key or full authorization request. Empty → no gating.
   */
  readonly pixelAccess = input<string | PixelAuthorizationRequest>('', { alias: 'pixelAccess' });

  /**
   * @type {PixelDeniedActionMode | null}
   * @default null
   * @description Override config `deniedActionMode`. Null → service config.
   */
  readonly pixelAccessMode = input<PixelDeniedActionMode | null>(null, {
    alias: 'pixelAccessMode',
  });

  /**
   * @type {boolean}
   * @default false
   * @description When true, denied controls stay in the a11y tree but are non-interactive (disable).
   */
  readonly pixelAccessForceDisable = input(false, {
    alias: 'pixelAccessForceDisable',
    transform: booleanAttribute,
  });

  private readonly missingService = signal(false);

  private readonly decision = computed((): PixelAccessDecision => {
    this.missingService();
    const raw = this.pixelAccess();
    if (!raw || (typeof raw === 'string' && !raw.trim())) {
      return { status: 'allow', effect: 'allow', reason: 'rbac', source: 'local' };
    }
    if (!this.auth) {
      return {
        status: 'deny',
        effect: 'deny',
        reason: 'error',
        source: 'local',
      };
    }
    const request: PixelAuthorizationRequest =
      typeof raw === 'string' ? { permission: raw.trim(), action: 'view' } : raw;
    return this.auth.authorize(request);
  });

  private readonly mode = computed((): PixelDeniedActionMode => {
    return (
      this.pixelAccessMode() ??
      this.auth?.deniedActionMode() ??
      'hide'
    );
  });

  protected readonly deniedReady = computed(() => {
    const d = this.decision();
    if (!this.auth) {
      return true;
    }
    if (this.auth.shouldShowWhilePending(d)) {
      return false;
    }
    return d.status !== 'allow';
  });

  readonly busy = computed(() => {
    if (!this.auth) {
      return false;
    }
    return this.auth.shouldShowWhilePending(this.decision());
  });

  readonly hidden = computed(() => {
    if (this.pixelAccessForceDisable()) {
      return false;
    }
    if (this.mode() !== 'hide') {
      return false;
    }
    return this.deniedReady();
  });

  readonly disabled = computed(() => {
    if (this.busy()) {
      return this.mode() === 'disable' || this.pixelAccessForceDisable();
    }
    if (!this.deniedReady()) {
      return false;
    }
    return this.mode() === 'disable' || this.pixelAccessForceDisable() || this.mode() === 'hide';
  });

  readonly nativeDisabled = computed(() => this.disabled() && this.mode() !== 'readonly');

  readonly readonly = computed(() => this.deniedReady() && this.mode() === 'readonly');

  constructor() {
    effect(() => {
      const raw = this.pixelAccess();
      if (!raw || (typeof raw === 'string' && !raw.trim())) {
        return;
      }
      if (!this.auth) {
        this.missingService.set(true);
        console.error(
          '[pixelAccess] PixelAuthorizationService is missing. Provide authorization or remove pixelAccess.',
        );
      }
    });

    afterRenderEffect(() => {
      this.syncNativeControls();
    });
  }

  /**
   * Custom-element templates bind their own `[disabled]` / `[readOnly]`. Re-apply after
   * render so inner native controls match the PEP when the host does not inject
   * {@link PIXEL_ACCESS_PEP}.
   */
  private syncNativeControls(): void {
    const root = this.host.nativeElement;
    if (typeof HTMLElement === 'undefined' || !(root instanceof HTMLElement)) {
      return;
    }
    const disable = this.nativeDisabled();
    const readonly = this.readonly();
    const nodes: Element[] = [];
    if (root.matches('button, input, textarea, select')) {
      nodes.push(root);
    }
    root.querySelectorAll('button, input, textarea, select').forEach((node) => nodes.push(node));
    for (const node of nodes) {
      if (node instanceof HTMLButtonElement) {
        node.disabled = disable;
      } else if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        node.disabled = disable;
        node.readOnly = readonly;
      } else if (node instanceof HTMLSelectElement) {
        node.disabled = disable || readonly;
      }
    }
  }
}
