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

    <section class="panel panel--bordered" pixelNavAnchor="security-review" id="security-review">
      <h2>Security review</h2>
      <p>
        Notification “Security review recommended” lands here when deep-links are allowed.
      </p>
    </section>
  `,
  styleUrl: '../playground-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellSettingsPage {
  protected readonly bridge = inject(AppShellPlaygroundNavBridge);
}
