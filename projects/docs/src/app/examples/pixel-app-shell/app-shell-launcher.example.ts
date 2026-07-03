import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-app-shell-launcher-example',
  standalone: true,
  imports: [PixelButtonComponent],
  template: `
    <div class="launcher">
      <p>
        See every layout-shell piece together at real viewport scale — sticky header with a
        user-profile menu, a grouped sidenav, genuinely scrollable content, and a footer.
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
    window.open('/playground/app-shell', '_blank', 'noopener');
  }
}
