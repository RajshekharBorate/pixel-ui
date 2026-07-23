import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelNavAnchorDirective,
  PixelNavigateService,
  PixelToggleComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-navigate-context-example',
  imports: [PixelButtonComponent, PixelNavAnchorDirective, PixelToggleComponent],
  template: `
    <p class="hint">
      Successful <code>go</code> pushes a context snapshot. <code>back()</code> returns to the
      previous target. A permission guard soft-fails with <code>forbidden</code>.
    </p>
    <div class="actions">
      <pixel-toggle
        [checked]="allowNav()"
        label="Allow navigation"
        (checkedChange)="allowNav.set($event)"
      />
      <pixel-button appearance="solid" (click)="goAlpha()">Go to Alpha</pixel-button>
      <pixel-button appearance="solid" (click)="goBeta()">Go to Beta</pixel-button>
      <pixel-button appearance="outline" leadingIcon="undo" (click)="goBack()">
        Context back
      </pixel-button>
      <pixel-button appearance="text" (click)="clearStack()">Clear stack</pixel-button>
    </div>
    <p class="info">Stack depth: {{ stackDepth() }}</p>

    <div class="spacer" aria-hidden="true"></div>
    <section class="panel" pixelNavAnchor="alpha" id="alpha">
      <h3>Alpha</h3>
      <p>First context target.</p>
    </section>
    <div class="spacer short" aria-hidden="true"></div>
    <section class="panel" pixelNavAnchor="beta" id="beta">
      <h3>Beta</h3>
      <p>Second context target — use Back to return to Alpha.</p>
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
      align-items: center;
      margin-block-end: 0.75rem;
    }
    .spacer {
      block-size: 20vh;
    }
    .spacer.short {
      block-size: 8vh;
    }
    .panel {
      padding: 1rem;
      border: 1px solid var(--pixel-sys-outline-variant, #ccc);
      border-radius: 0.5rem;
      background: var(--pixel-sys-surface, #fff);
      margin-block-end: 0.75rem;
    }
    .panel h3 {
      margin: 0 0 0.35rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigateContextExample {
  private readonly navigate = inject(PixelNavigateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly allowNav = signal(true);
  readonly status = signal('');
  readonly stackDepth = signal(0);

  constructor() {
    this.navigate.setPermissionGuard(() => this.allowNav());
    this.destroyRef.onDestroy(() => {
      this.navigate.setPermissionGuard(null);
      this.navigate.clearContext();
    });
  }

  private refreshDepth(): void {
    this.stackDepth.set(this.navigate.contextEntries.length);
  }

  async goAlpha(): Promise<void> {
    const result = await this.navigate.go({
      target: { type: 'section', id: 'alpha' },
      pushContext: true,
      broadcast: false,
      onFailure: 'silent',
    });
    this.refreshDepth();
    this.status.set(
      result.ok ? 'At Alpha (context pushed).' : `${result.reason}: ${result.message}`,
    );
  }

  async goBeta(): Promise<void> {
    const result = await this.navigate.go({
      target: { type: 'section', id: 'beta' },
      pushContext: true,
      broadcast: false,
      onFailure: 'silent',
    });
    this.refreshDepth();
    this.status.set(
      result.ok ? 'At Beta (context pushed).' : `${result.reason}: ${result.message}`,
    );
  }

  async goBack(): Promise<void> {
    const result = await this.navigate.back();
    this.refreshDepth();
    this.status.set(
      result.ok ? 'Restored previous context.' : `${result.reason}: ${result.message}`,
    );
  }

  clearStack(): void {
    this.navigate.clearContext();
    this.refreshDepth();
    this.status.set('Context stack cleared.');
  }
}
