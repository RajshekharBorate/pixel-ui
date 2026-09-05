import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelNavAnchorDirective } from 'pixel-ui';

@Component({
  selector: 'docs-app-shell-settings-page',
  imports: [PixelNavAnchorDirective],
  template: `
    <header class="page-head">
      <h1>Settings</h1>
      <p>
        Account and security settings. Switch the header role to Viewer to leave this page —
        it is hidden from the menu and the URL will not stay here.
      </p>
    </header>

    <section class="panel panel--bordered" pixelNavAnchor="security-review" id="security-review">
      <h2>Security review</h2>
      <p>
        Notification “Security review recommended” lands here when the Admin role is selected.
      </p>
    </section>
  `,
  styleUrl: '../playground-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellSettingsPage {}
