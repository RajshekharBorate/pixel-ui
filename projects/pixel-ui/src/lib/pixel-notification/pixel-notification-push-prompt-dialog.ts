import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { PixelDialogRef } from '../pixel-dialog/pixel-dialog-ref';
import { PIXEL_DIALOG_DATA } from '../pixel-dialog/pixel-dialog.types';
import PixelNotificationPushPromptComponent from './pixel-notification-push-prompt';
import type {
  PixelPushPromptDialogData,
  PixelPushPromptDialogResult,
} from './pixel-notification-push-prompt.scheduler.types';
import type { PixelPushOperationResult } from './pixel-notification-push.types';

/**
 * @internal Dialog body for {@link PixelPushPromptScheduler}. Hosts the soft-ask prompt;
 * never calls `enable()` itself — only the prompt CTA does.
 */
@Component({
  selector: 'pixel-notification-push-prompt-dialog',
  imports: [PixelNotificationPushPromptComponent],
  template: `
    <div class="pixel-notification-push-prompt-dialog">
      <pixel-notification-push-prompt
        [deviceLabel]="data.deviceLabel"
        [labels]="data.labels"
        [compact]="data.compact"
        [surface]="data.surface"
        [layout]="data.layout"
        [showBenefits]="data.showBenefits"
        (dismissed)="close('dismissed')"
        (continueWithInbox)="close('continue-inbox')"
        (enabled)="onEnabled($event)"
      />
    </div>
  `,
  styles: `
    .pixel-notification-push-prompt-dialog {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PixelNotificationPushPromptDialogComponent {
  private readonly dialogRef = inject<PixelDialogRef<PixelPushPromptDialogResult>>(PixelDialogRef);
  protected readonly data = inject<PixelPushPromptDialogData>(PIXEL_DIALOG_DATA);

  protected close(result: PixelPushPromptDialogResult): void {
    this.dialogRef.close(result);
  }

  protected onEnabled(result: PixelPushOperationResult): void {
    this.close(result.ok ? 'accepted' : 'dismissed');
  }
}
