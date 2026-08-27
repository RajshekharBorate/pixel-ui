import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import { withDocsBaseHref } from '../../core/docs-push-sw';

@Component({
  selector: 'docs-app-shell-launcher-example',
  imports: [PixelButtonComponent],
  template: `
    <div class="launcher">
      <p>
        See every layout-shell piece together at real viewport scale — routed pages, sticky header with a
        notification center that deep-links via PixelNavigateService (claims grid, billing section,
        amendment wizard, gated settings), nested sidenav groups, and footer.
      </p>
      <pixel-button leadingIcon="open_in_new" (click)="open()"> Open full-page demo </pixel-button>
    </div>
  `,
  styles: `
    .launcher {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    p {
      margin: 0;
      max-inline-size: 32rem;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellLauncherExample {
  protected open(): void {
    // Must honor docs `baseHref` (GitHub Pages: `/pixel-ui/`); root-absolute paths 404 there.
    window.open(withDocsBaseHref('/playground/app-shell/overview'), '_blank', 'noopener');
  }
}
