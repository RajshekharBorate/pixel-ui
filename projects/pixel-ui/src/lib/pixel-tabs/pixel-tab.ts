import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  contentChild,
  input,
  signal,
} from '@angular/core';
import PixelTabLabelDirective from './pixel-tab-label';
import type { PixelBadgeState } from '../pixel-badge/pixel-badge';

let nextTabId = 0;

/** Direction the entering panel content animates from, driven by the parent `pixel-tabs`. */
export type PixelTabEnterDirection = 'forward' | 'backward';

/**
 * A single tab within `pixel-tabs`. Set a `label` (and optional `icon`) and project the panel
 * content. Inactive panels stay in the DOM but hidden; pair with `[lazy]` on `pixel-tabs` to defer
 * rendering until first activation. The panel plays a short directional enter transition when it
 * becomes active (configurable via the parent group's `animated` / `animationDuration` inputs).
 */
@Component({
  selector: 'pixel-tab',  template: `
    <div
      class="pixel-tab__panel"
      role="tabpanel"
      [id]="panelId"
      [attr.aria-labelledby]="tabId"
      [hidden]="!active()"
      [class.pixel-tab__panel--animate]="active() && animationEnabled()"
      [attr.data-enter]="enterDirection()"
      [style.--pixel-tab-duration.ms]="animationDuration()"
    >
      @if (active() || hasRendered() || !isLazy()) {
        <ng-content />
      }
    </div>
  `,
  styles: [
    `
      .pixel-tab__panel--animate[data-enter='forward'] {
        animation: pixel-tab-enter-forward var(--pixel-tab-duration, 250ms)
          cubic-bezier(0.4, 0, 0.2, 1);
      }

      .pixel-tab__panel--animate[data-enter='backward'] {
        animation: pixel-tab-enter-backward var(--pixel-tab-duration, 250ms)
          cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes pixel-tab-enter-forward {
        from {
          opacity: 0;
          transform: translateX(0.75rem);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }

      @keyframes pixel-tab-enter-backward {
        from {
          opacity: 0;
          transform: translateX(-0.75rem);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .pixel-tab__panel--animate {
          animation: none !important;
        }
      }
    `,
  ],
  host: {
    class: 'pixel-tab',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelTabComponent {
  /** Tab header label. */
  readonly label = input('');

  /** Optional leading Material Symbols glyph in the tab header. */
  readonly icon = input('');

  /** Optional badge value shown after the tab label (e.g. an unread count). Numbers overflow at 99+. */
  readonly badge = input<string | number>('');

  /** Semantic color of the tab badge. */
  readonly badgeState = input<PixelBadgeState>('error');

  /** Disables selection of this tab. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Shows a close affordance in the tab header; the group emits `tabClose` when used. */
  readonly closable = input(false, { transform: booleanAttribute });

  /** Optional rich header label projected via `<ng-template pixelTabLabel>` (overrides `label`). */
  readonly labelTemplate = contentChild(PixelTabLabelDirective);

  /** Whether content should render only after first activation. Set directly, or inherited from
   * the parent `pixel-tabs` `[lazy]` input. */
  readonly lazy = input(false, { transform: booleanAttribute });

  private readonly uid = ++nextTabId;
  readonly tabId = `pixel-tab-${this.uid}`;
  readonly panelId = `pixel-tabpanel-${this.uid}`;

  readonly active = signal(false);
  protected readonly hasRendered = signal(false);
  private readonly parentLazy = signal(false);
  protected readonly animationEnabled = signal(true);
  protected readonly animationDuration = signal(250);
  protected readonly enterDirection = signal<PixelTabEnterDirection>('forward');

  /** Effective lazy flag: this tab's own `lazy` input OR the parent group's `lazy` setting. */
  protected readonly isLazy = computed(() => this.lazy() || this.parentLazy());

  /** Whether a non-empty badge value was supplied. */
  readonly hasBadge = computed(() => {
    const badge = this.badge();
    return badge !== '' && badge !== null && badge !== undefined;
  });

  setActive(value: boolean, direction: PixelTabEnterDirection = 'forward'): void {
    if (value) {
      this.enterDirection.set(direction);
    }
    this.active.set(value);
    if (value) {
      this.hasRendered.set(true);
    }
  }

  /** Called by the parent `pixel-tabs` to propagate its `lazy` setting. */
  setLazy(value: boolean): void {
    this.parentLazy.set(value);
  }

  /** Called by the parent `pixel-tabs` to propagate animation config. */
  setAnimation(enabled: boolean, duration: number): void {
    this.animationEnabled.set(enabled);
    this.animationDuration.set(duration);
  }
}
