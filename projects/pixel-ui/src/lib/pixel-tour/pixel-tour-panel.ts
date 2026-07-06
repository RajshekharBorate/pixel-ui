import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  effect,
  inject,
  input,
  runInInjectionContext,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { ConnectedOverlay, getOverlayContainer } from '../shared/overlay/connected-overlay';
import { copyPixelThemeContext } from '../theme/pixel-theme';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelProgressBarComponent from '../pixel-progress/pixel-progress-bar';
import PixelTourControlsComponent from './pixel-tour-controls';
import { PixelTourAnchorRegistry } from './pixel-tour-anchor';
import { PixelTourPanelBody } from './pixel-tour-panel-body';
import { provideHeadlessTourPanel } from './pixel-tour-panel.providers';
import { PixelTourPanelRefBridge } from './pixel-tour-panel-ref-bridge';
import { PixelTourPanelController, PIXEL_TOUR_PANEL_CONTROLLER } from './pixel-tour-panel-controller';
import { attachTourPanel } from './pixel-tour-panel-position';
import { PixelTourRef } from './pixel-tour-ref';
import type { PixelTourViewConfig } from './pixel-tour.types';

const PANEL_HOST_BINDINGS = {
  class: 'pixel-tour-card pixel-tour-panel pixel-tour-card--host',
  role: 'dialog',
  'aria-modal': 'false',
  tabindex: '-1',
  '[class.pixel-tour-card--centered]': '!step().target',
  '[class.pixel-tour-card--minimized]': 'panel.minimized()',
  '[class.pixel-tour-card--dragging]': 'panel.dragging()',
  '[attr.aria-labelledby]': 'step().title ? titleId : null',
  '[attr.aria-label]': "step().title ? null : config.labels.stepAriaLabel",
  '[attr.aria-describedby]': 'bodyId',
  '(keydown)': 'panel.onKeydown($event)',
  '(mouseenter)': 'panel.hoverPaused.set(true)',
  '(mouseleave)': 'panel.hoverPaused.set(false)',
  '(focusin)': 'panel.onFocusIn($event)',
  '(focusout)': 'panel.focusPaused.set(false)',
  '(touchstart)': 'panel.onTouchStart($event)',
  '(touchend)': 'panel.onTouchEnd($event)',
} as const;

/**
 * Optional default tour panel for `ui: 'headless'` — mounts into the shared overlay layer
 * above the scrim, anchors to step targets, and ships the same keyboard / focus / autoplay
 * contract as the built-in card.
 *
 * ```html
 * @if (ref(); as tour) {
 *   <pixel-tour-panel [ref]="tour" />
 * }
 * ```
 *
 * Pair with `PixelTourService.start(steps, { ui: 'headless' })`. Do not use while
 * `ui: 'default'` or `ui: 'custom'` — the service already mounts a panel in those modes.
 */
@Component({
  selector: 'pixel-tour-panel',
  imports: [
    NgTemplateOutlet,
    NgComponentOutlet,
    PixelButtonComponent,
    PixelProgressBarComponent,
    PixelTourControlsComponent,
  ],
  templateUrl: './pixel-tour-card.html',
  styleUrl: './pixel-tour-card.scss',
  host: PANEL_HOST_BINDINGS,
  providers: [provideHeadlessTourPanel()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTourPanelComponent extends PixelTourPanelBody implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly anchors = inject(PixelTourAnchorRegistry);
  private readonly refBridge = inject(PixelTourPanelRefBridge);
  private readonly hostInjector = inject(Injector);
  private readonly overlay = new ConnectedOverlay();

  protected panel!: PixelTourPanelController;

  /**
   * @type {PixelTourRef}
   * @description Running tour ref returned by `PixelTourService.start()` with `ui: 'headless'`.
   */
  readonly panelRef = input.required<PixelTourRef>({ alias: 'ref' });

  protected tourRef(): PixelTourRef {
    return this.panelRef();
  }

  protected viewConfig(): PixelTourViewConfig {
    return this.panelRef().view;
  }

  protected get ref(): PixelTourRef {
    return this.panelRef();
  }

  protected get config(): PixelTourViewConfig {
    return this.panelRef().view;
  }

  ngOnInit(): void {
    const ref = this.panelRef();
    this.refBridge.bind(ref);
    this.panel = runInInjectionContext(this.hostInjector, () =>
      inject(PIXEL_TOUR_PANEL_CONTROLLER),
    );
  }

  constructor() {
    super();

    afterNextRender(() => {
      const host = this.hostRef.nativeElement;
      copyPixelThemeContext(host);
      getOverlayContainer().appendChild(host);
      this.repositionActiveStep();
    });

    effect(() => {
      const ref = this.panelRef();
      const status = ref.status();
      ref.stepIndex();
      ref.activeStep();

      if (status !== 'running' && status !== 'waiting' && status !== 'paused') {
        return;
      }

      queueMicrotask(() => this.repositionActiveStep());
    });

    this.destroyRef.onDestroy(() => {
      this.overlay.destroy();
      this.refBridge.clear();
      this.hostRef.nativeElement.remove();
    });
  }

  private repositionActiveStep(): void {
    const ref = this.panelRef();
    const mount = ref._mount;
    if (!mount) {
      return;
    }
    attachTourPanel(
      this.overlay,
      this.hostRef.nativeElement,
      ref.activeStep(),
      mount.config,
      (id) => this.anchors.resolve(id),
    );
  }
}
