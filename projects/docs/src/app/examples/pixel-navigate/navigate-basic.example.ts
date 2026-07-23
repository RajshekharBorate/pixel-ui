import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelNavAnchorDirective,
  PixelNavigateService,
} from 'pixel-ui';

@Component({
  selector: 'docs-navigate-basic-example',
  imports: [PixelButtonComponent, PixelNavAnchorDirective],
  template: `
    <p class="hint">
      PixelNavigateService scrolls to <code>pixelNavAnchor</code> targets, can sync
      <code>?nav=</code>, and soft-fails when a target is missing. Pair with notifications via
      <code>data.nav</code>.
    </p>
    <div class="actions">
      <pixel-button appearance="solid" leadingIcon="south" (click)="goPayments()">
        Go to payments
      </pixel-button>
      <pixel-button appearance="outline" leadingIcon="link" (click)="copyLink()">
        Copy link
      </pixel-button>
    </div>
    <div class="spacer" aria-hidden="true"></div>
    <section class="panel" pixelNavAnchor="payments" id="payments">
      <h3>Payments</h3>
      <p>Deep-link target. Arrival applies scroll, focus, and a short highlight.</p>
    </section>
    @if (status()) {
      <p class="info">{{ status() }}</p>
    }
  `,
  styles: `
    .hint,
    .info {
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
    .spacer {
      block-size: 40vh;
    }
    .panel {
      padding: 1rem;
      border: 1px solid var(--pixel-sys-outline-variant, #ccc);
      border-radius: 0.5rem;
      background: var(--pixel-sys-surface, #fff);
    }
    .panel h3 {
      margin: 0 0 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigateBasicExample {
  private readonly navigate = inject(PixelNavigateService);
  readonly status = signal('');

  async goPayments(): Promise<void> {
    const result = await this.navigate.go({
      target: { type: 'section', id: 'payments' },
      syncUrl: true,
      history: 'replace',
      announce: 'Navigated to payments',
      onFailure: 'silent',
    });
    this.status.set(result.ok ? 'Arrived at payments.' : result.message ?? 'Failed');
  }

  async copyLink(): Promise<void> {
    await this.navigate.copyLink({
      target: { type: 'section', id: 'payments' },
    });
    this.status.set('Link copied to clipboard.');
  }
}
