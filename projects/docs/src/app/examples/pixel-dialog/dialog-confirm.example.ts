import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelConfirmDialogComponent } from 'pixel-ui';

@Component({
  selector: 'docs-dialog-confirm-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelConfirmDialogComponent],
  template: `
    <div class="row">
      <pixel-button (click)="confirmOpen.set(true)">Standard confirm</pixel-button>
      <pixel-button appearance="outline" (click)="dangerOpen.set(true)">Danger confirm</pixel-button>
    </div>

  @if (lastResult()) {
    <p class="log" role="status">{{ lastResult() }}</p>
  }

    <pixel-confirm-dialog
      [(open)]="confirmOpen"
      title="Discard changes?"
      message="You have unsaved edits. Discard them and leave?"
      confirmLabel="Discard"
      (confirmed)="onConfirm('standard')"
      (cancelled)="onCancel('standard')"
    />

    <pixel-confirm-dialog
      [(open)]="dangerOpen"
      title="Delete policy"
      message="This action cannot be undone."
      confirmLabel="Delete"
      [danger]="true"
      (confirmed)="onConfirm('danger')"
      (cancelled)="onCancel('danger')"
    />
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .log {
      margin: 0.75rem 0 0;
      font-size: 0.8125rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogConfirmExample {
  protected readonly confirmOpen = signal(false);
  protected readonly dangerOpen = signal(false);
  protected readonly lastResult = signal('');

  protected onConfirm(kind: string): void {
    this.lastResult.set(`Confirmed (${kind})`);
  }

  protected onCancel(kind: string): void {
    this.lastResult.set(`Cancelled (${kind})`);
  }
}
