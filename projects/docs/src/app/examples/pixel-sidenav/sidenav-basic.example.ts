import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelSidenavComponent } from 'pixel-ui';

@Component({
  selector: 'docs-sidenav-basic-example',
  imports: [PixelSidenavComponent, PixelButtonComponent],
  template: `
    <pixel-button size="sm" (click)="open.set(!open())">
      {{ open() ? 'Close' : 'Open' }} sidenav
    </pixel-button>

    <div class="shell">
      <pixel-sidenav mode="side" autoCollapseBreakpoint="none" [(opened)]="open">
        <nav class="nav">
          <a>Overview</a>
          <a>Reports</a>
          <a>Settings</a>
        </nav>
      </pixel-sidenav>
      <div class="content">Main content area</div>
    </div>
  `,
  styles: `
    .shell {
      display: flex;
      block-size: 16rem;
      margin-block-start: 0.75rem;
      border: 1px solid color-mix(in srgb, var(--pixel-sys-outline, #6b7280) 30%, transparent);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
    }

    .nav a {
      color: var(--pixel-sys-primary, #0b57d0);
      text-decoration: none;
      cursor: pointer;
    }

    .content {
      flex: 1 1 auto;
      padding: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavBasicExample {
  protected readonly open = signal(true);
}
