import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PixelNavAnchorDirective, PixelToggleComponent } from 'pixel-ui';
import { AppShellPlaygroundNavBridge } from '../app-shell-playground-nav.bridge';

@Component({
  selector: 'docs-app-shell-settings-page',
  imports: [PixelToggleComponent, PixelNavAnchorDirective],
  template: `
    <header class="page-head">
      <h1>Settings</h1>
      <p>
        Deep-links to this page (and the security section below) respect the permission toggle.
        When off, notification navigation returns <code>forbidden</code>.
      </p>
    </header>

    <pixel-toggle
      label="Allow settings deep-links"
      [checked]="bridge.settingsAllowed()"
      (checkedChange)="bridge.settingsAllowed.set($event)"
    />

    <section class="panel" pixelNavAnchor="security-review" id="security-review">
      <h2>Security review</h2>
      <p>
        Notification “Security review recommended” lands here when deep-links are allowed.
      </p>
    </section>
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
      margin: 0 0 1rem;
      max-inline-size: 40rem;
      color: var(--pixel-sys-on-surface-variant, #444);
      font-size: 0.875rem;
    }
    .panel {
      margin-block-start: 1.25rem;
      padding: 1rem;
      border: 1px solid var(--pixel-sys-outline-variant, #ccc);
      border-radius: 0.5rem;
      background: var(--pixel-sys-surface, #fff);
    }
    .panel h2 {
      margin: 0 0 0.35rem;
      font-size: 1.125rem;
    }
    .panel p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--pixel-sys-on-surface-variant, #444);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellSettingsPage {
  protected readonly bridge = inject(AppShellPlaygroundNavBridge);
}
