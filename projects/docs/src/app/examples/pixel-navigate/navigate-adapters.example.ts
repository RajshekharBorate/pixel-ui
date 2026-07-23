import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  PixelButtonComponent,
  PixelExpansionPanelComponent,
  PixelNavAnchorDirective,
  PixelNavigateService,
  PixelTabComponent,
  PixelTabsComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-navigate-adapters-example',
  imports: [
    PixelButtonComponent,
    PixelTabsComponent,
    PixelTabComponent,
    PixelExpansionPanelComponent,
    PixelNavAnchorDirective,
  ],
  template: `
    <p class="hint">
      Register adapters for composite widgets, then chain targets:
      <code>tabs → accordion → section</code>.
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="alt_route" (click)="goChain()">
        Open Billing (chain)
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="vertical_align_bottom" (click)="goBelowFold()">
        Scroll below fold
      </pixel-button>
    </div>

    <pixel-tabs [(selectedIndex)]="tabIndex">
      <pixel-tab label="General">
        <p class="body">General preferences live here.</p>
      </pixel-tab>
      <pixel-tab label="Billing">
        <pixel-expansion-panel
          title="Invoices & payments"
          description="Expand for billing details"
          icon="payments"
          [(expanded)]="billingOpen"
        >
          <section class="panel" pixelNavAnchor="billing-detail" id="billing-detail">
            <h3>Billing detail</h3>
            <p class="body">Deep-link lands on this section after the tab and panel activate.</p>
          </section>
        </pixel-expansion-panel>
      </pixel-tab>
    </pixel-tabs>

    <div class="below-fold" aria-hidden="true"></div>
    <section class="panel" pixelNavAnchor="billing-footer-note" id="billing-footer-note">
      <h3>Below the fold</h3>
      <p class="body">Used to verify smooth scroll inside the docs content panel.</p>
    </section>

    @if (status()) {
      <p class="info">{{ status() }}</p>
    }
  `,
  styles: `
    .hint,
    .info,
    .body {
      margin: 0 0 0.75rem;
      color: var(--pixel-sys-on-surface-variant, #444);
      font-size: 0.875rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-end: 1rem;
    }
    .panel {
      padding: 0.75rem 0 0;
    }
    .panel h3 {
      margin: 0 0 0.35rem;
      font-size: 1rem;
    }
    .below-fold {
      block-size: 55vh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigateAdaptersExample {
  private readonly navigate = inject(PixelNavigateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tabs = viewChild(PixelTabsComponent);

  readonly tabIndex = model(0);
  readonly billingOpen = signal(false);
  readonly status = signal('');

  constructor() {
    const unsubTabs = this.navigate.registerAdapter({
      id: 'settings',
      kind: 'tabs',
      activate: async (target) => {
        if (target.type !== 'tabs') {
          return false;
        }
        const index = typeof target.tab === 'number' ? target.tab : Number(target.tab);
        this.tabs()?.select(Number.isFinite(index) ? index : 0);
        return true;
      },
    });
    const unsubAccordion = this.navigate.registerAdapter({
      id: 'help',
      kind: 'accordion',
      activate: async (target) => {
        if (target.type !== 'accordion') {
          return false;
        }
        if (target.panelId === 'billing') {
          this.billingOpen.set(true);
        }
        return true;
      },
    });
    this.destroyRef.onDestroy(() => {
      unsubTabs();
      unsubAccordion();
    });
  }

  async goChain(): Promise<void> {
    const result = await this.navigate.go({
      target: [
        { type: 'tabs', id: 'settings', tab: 1 },
        { type: 'accordion', id: 'help', panelId: 'billing' },
        { type: 'section', id: 'billing-detail' },
      ],
      behavior: 'smooth',
      onFailure: 'silent',
      announce: 'Opened billing settings',
    });
    this.status.set(
      result.ok
        ? 'Chain completed: Billing tab → panel → section.'
        : `${result.reason}: ${result.message}`,
    );
  }

  async goBelowFold(): Promise<void> {
    const result = await this.navigate.go({
      target: { type: 'section', id: 'billing-footer-note' },
      behavior: 'smooth',
      onFailure: 'silent',
      announce: 'Scrolled to below-fold section',
    });
    this.status.set(
      result.ok ? 'Scrolled smoothly to the below-fold section.' : `${result.reason}: ${result.message}`,
    );
  }
}
