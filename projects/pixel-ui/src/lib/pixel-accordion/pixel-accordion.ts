import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  booleanAttribute,
  contentChildren,
  effect,
  input,
} from '@angular/core';
import PixelExpansionPanelComponent, {
  type PixelExpansionPanelVariant,
  type PixelExpansionPanelSize,
} from './pixel-expansion-panel';

export type { PixelExpansionPanelVariant as PixelAccordionVariant };
export type { PixelExpansionPanelSize as PixelAccordionSize };

/**
 * Optional coordinator for a set of `pixel-expansion-panel`s. When `multi` is false (default),
 * opening one panel collapses the others.
 *
 * The `variant` and `size` inputs are pushed onto every child panel and take precedence over each
 * panel's own inputs, so all panels in an accordion share a consistent look.
 *
 * @example
 * ```html
 * <pixel-accordion variant="elevated" size="sm">
 *   <pixel-expansion-panel title="One">…</pixel-expansion-panel>
 *   <pixel-expansion-panel title="Two">…</pixel-expansion-panel>
 * </pixel-accordion>
 * ```
 */
@Component({
  selector: 'pixel-accordion',
  template: '<ng-content />',
  host: { class: 'pixel-accordion' },
  styleUrl: './pixel-accordion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelAccordionComponent {
  private readonly panels = contentChildren(PixelExpansionPanelComponent);

  /** Expanded state of each panel as of the previous render, to tell which panel just opened. */
  private readonly wasExpanded = new WeakMap<PixelExpansionPanelComponent, boolean>();

  /** Allow multiple panels open at once. */
  readonly multi = input(false, { transform: booleanAttribute });

  /**
   * Visual style applied to every child panel:
   * - `default` — bordered card (each panel has its own border)
   * - `flush` — no outer borders, only inter-panel dividers
   * - `elevated` — each panel is a floating card with a drop shadow
   */
  readonly variant = input<PixelExpansionPanelVariant>('default');

  /** Size preset: controls trigger padding and type scale across all panels. */
  readonly size = input<PixelExpansionPanelSize>('md');

  constructor() {
    // Push the accordion's variant/size onto each child panel so they render consistently.
    effect(() => {
      const variant = this.variant();
      const size = this.size();
      this.panels().forEach((panel) => {
        panel.inheritedVariant.set(variant);
        panel.inheritedSize.set(size);
      });
    });

    // Tell each panel whether a neighbour is expanded so the corners facing the detached card can
    // round (CSS alone can't reach across sibling hosts under emulated encapsulation).
    effect(() => {
      const panels = this.panels();
      panels.forEach((panel, index) => {
        panel.afterExpandedSibling.set(index > 0 && panels[index - 1].expanded());
        panel.beforeExpandedSibling.set(
          index < panels.length - 1 && panels[index + 1].expanded(),
        );
      });
    });

    // Enforce single-open behaviour: when more than one panel is expanded, keep the panel that
    // just opened (its state flipped since the last render) and collapse the rest. DOM order is
    // only a tie-breaker, so opening a panel above the expanded one works too.
    afterRenderEffect(() => {
      const panels = this.panels();
      const expanded = panels.filter((panel) => panel.expanded());
      if (!this.multi() && expanded.length > 1) {
        const newlyOpened = expanded.filter((panel) => !this.wasExpanded.get(panel));
        const keep = newlyOpened.at(-1) ?? expanded.at(-1);
        expanded.forEach((panel) => {
          if (panel !== keep) {
            panel.expanded.set(false);
          }
        });
      }
      panels.forEach((panel) => this.wasExpanded.set(panel, panel.expanded()));
    });
  }

  /** Opens all non-disabled panels (only useful when `multi` is true). */
  expandAll(): void {
    this.panels().forEach((panel) => {
      if (!panel.disabled()) {
        panel.expanded.set(true);
      }
    });
  }

  /** Collapses all panels. */
  collapseAll(): void {
    this.panels().forEach((panel) => panel.expanded.set(false));
  }
}
