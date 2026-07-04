import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelDrawerComponent } from 'pixel-ui';

@Component({
  selector: 'docs-drawer-blocking-example',
  imports: [PixelButtonComponent, PixelDrawerComponent],
  template: `
    <pixel-button appearance="outline" (click)="open.set(true)">Open blocking panel</pixel-button>

    <pixel-drawer
      [(open)]="open"
      position="end"
      size="sm"
      title="Confirm exit"
      [dismissable]="false"
    >
      <p class="body">
        You have unsaved changes. Choose an action — the scrim and Escape are disabled.
      </p>
      <pixel-button pixelDrawerFooter appearance="outline" (click)="open.set(false)">Discard</pixel-button>
      <pixel-button pixelDrawerFooter appearance="solid" (click)="open.set(false)">Save</pixel-button>
    </pixel-drawer>
  `,
  styles: `
    .body {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerBlockingExample {
  protected readonly open = signal(false);
}
