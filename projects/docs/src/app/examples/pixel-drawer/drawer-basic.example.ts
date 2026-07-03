import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelDrawerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-drawer-basic-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelDrawerComponent],
  template: `
    <pixel-button appearance="solid" (click)="open.set(true)">Open filters</pixel-button>

    <pixel-drawer [(open)]="open" title="Filters" position="end" size="md">
      <p class="body">Refine the list by status, owner, and date range.</p>
      <ul class="list">
        <li>Status: Active, Archived</li>
        <li>Owner: Anyone on your team</li>
        <li>Updated: Last 30 days</li>
      </ul>
      <pixel-button pixelDrawerFooter appearance="text" (click)="open.set(false)">Reset</pixel-button>
      <pixel-button pixelDrawerFooter appearance="solid" (click)="open.set(false)">Apply</pixel-button>
    </pixel-drawer>
  `,
  styles: `
    .body {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      line-height: 1.55;
    }

    .list {
      margin: 0;
      padding-inline-start: 1.25rem;
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerBasicExample {
  protected readonly open = signal(false);
}
