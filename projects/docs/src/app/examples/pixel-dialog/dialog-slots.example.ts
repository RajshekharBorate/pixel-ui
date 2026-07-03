import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelDialogComponent } from 'pixel-ui';

@Component({
  selector: 'docs-dialog-slots-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelDialogComponent],
  template: `
    <pixel-button appearance="outline" (click)="open.set(true)">Open with custom slots</pixel-button>

    <pixel-dialog [(open)]="open" size="md">
      <div pixelDialogHeader class="header">
        <span class="material-symbols-outlined" aria-hidden="true">workspace_premium</span>
        <div>
          <strong>Upgrade to Pro</strong>
          <span>Unlock advanced analytics</span>
        </div>
      </div>

      <p class="body">Custom header and footer slots keep focus trapping and accessibility for free.</p>
      <ul class="list">
        <li>Unlimited exports</li>
        <li>Team workspaces</li>
        <li>Priority support</li>
      </ul>

      <pixel-button pixelDialogFooter appearance="text" (click)="open.set(false)">Maybe later</pixel-button>
      <pixel-button pixelDialogFooter appearance="solid" (click)="open.set(false)">Upgrade</pixel-button>
    </pixel-dialog>
  `,
  styles: `
    .header {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .header span {
      display: block;
      font-size: 0.8125rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 68%, transparent);
    }

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
export class DialogSlotsExample {
  protected readonly open = signal(false);
}
