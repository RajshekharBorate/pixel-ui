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
import { AppShellPlaygroundNavBridge } from '../app-shell-playground-nav.bridge';

@Component({
  selector: 'docs-app-shell-billing-page',
  imports: [
    PixelButtonComponent,
    PixelTabsComponent,
    PixelTabComponent,
    PixelExpansionPanelComponent,
    PixelNavAnchorDirective,
  ],
  template: `
    <header class="page-head">
      <h1>Billing</h1>
      <p>
        Notification deep-links chain <code>tabs → accordion → section</code>. Use the button to
        run the same path without leaving the page.
      </p>
    </header>

    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="alt_route" (click)="goChain()">
        Open Billing detail (chain)
      </pixel-button>
    </div>

    <pixel-tabs [(selectedIndex)]="tabIndex">
      <pixel-tab label="General">
        <p class="body">General billing preferences live here.</p>
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

    @if (status()) {
      <p class="info">{{ status() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .page-head {
      margin-block-end: 1rem;
    }
    .page-head h1 {
      margin: 0 0 0.35rem;
      font-size: 1.5rem;
    }
    .page-head p {
      margin: 0;
      max-inline-size: 40rem;
      color: var(--pixel-sys-on-surface-variant, #444);
      font-size: 0.875rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-end: 1rem;
    }
    .body,
    .info {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: var(--pixel-sys-on-surface-variant, #444);
    }
    .panel {
      padding: 0.75rem 0 0;
    }
    .panel h3 {
      margin: 0 0 0.35rem;
      font-size: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellBillingPage {
  private readonly navigate = inject(PixelNavigateService);
  private readonly bridge = inject(AppShellPlaygroundNavBridge);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tabs = viewChild(PixelTabsComponent);

  readonly tabIndex = model(0);
  readonly billingOpen = signal(false);
  readonly status = signal('');

  constructor() {
    this.bridge.setTabsAdapter({
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
    this.bridge.setAccordionAdapter({
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
      this.bridge.setTabsAdapter(null);
      this.bridge.setAccordionAdapter(null);
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
      announce: 'Opened billing detail',
    });
    this.status.set(
      result.ok
        ? 'Chain completed: Billing tab → panel → section.'
        : `${result.reason}: ${result.message}`,
    );
  }
}
