import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import PixelButtonComponent from '../pixel-button/pixel-button';
import { PIXEL_DIALOG_DATA } from '../pixel-dialog/pixel-dialog.types';
import { PixelDialogRef } from '../pixel-dialog/pixel-dialog-ref';
import type { PixelNotification } from './pixel-notification.types';
import { PixelNotificationService } from './pixel-notification.service';

export interface PixelNotificationDialogData {
  readonly notification: PixelNotification;
}

/**
 * Imperative critical-dialog content opened by the notification orchestrator when a record
 * routes to the `dialog` channel. Uses `alertdialog` semantics via the dialog service config.
 */
@Component({
  selector: 'pixel-notification-dialog',
  imports: [PixelButtonComponent],
  template: `
    <div class="pixel-notification-dialog">
      <p class="pixel-notification-dialog__message">{{ data.notification.message }}</p>

      <div class="pixel-notification-dialog__actions">
        @for (action of data.notification.actions; track action.id) {
          <pixel-button
            [appearance]="action.appearance === 'primary' ? 'solid' : 'outline'"
            [state]="action.appearance === 'danger' ? 'error' : 'default'"
            (click)="onAction(action.id)"
          >
            {{ action.label }}
          </pixel-button>
        }
        <pixel-button appearance="text" (click)="dismiss()">Dismiss</pixel-button>
      </div>
    </div>
  `,
  styles: `
    .pixel-notification-dialog {
      display: grid;
      gap: var(--pixel-sys-space-md, 1rem);
    }

    .pixel-notification-dialog__message {
      margin: 0;
      color: var(--pixel-sys-on-surface, #1a1b1f);
      font-size: var(--pixel-sys-body-md-size, 0.9375rem);
      line-height: 1.5;
    }

    .pixel-notification-dialog__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--pixel-sys-space-sm, 0.5rem);
      justify-content: flex-end;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelNotificationDialogComponent {
  protected readonly data = inject<PixelNotificationDialogData>(PIXEL_DIALOG_DATA);
  private readonly dialogRef = inject(PixelDialogRef);
  private readonly notifications = inject(PixelNotificationService);

  protected async onAction(actionId: string): Promise<void> {
    await this.notifications.invokeAction(this.data.notification.id, actionId);
    this.dialogRef.close(actionId);
  }

  protected dismiss(): void {
    this.notifications.markRead(this.data.notification.id);
    this.dialogRef.close('dismiss');
  }
}
