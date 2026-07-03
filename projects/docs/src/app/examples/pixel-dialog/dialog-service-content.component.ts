import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PIXEL_DIALOG_DATA,
  PixelButtonComponent,
  PixelDialogRef,
  PixelInputComponent,
} from 'pixel-ui';

export interface DocsRenamePolicyData {
  readonly currentName: string;
}

@Component({
  selector: 'docs-dialog-service-content',
  standalone: true,
  imports: [PixelButtonComponent, PixelInputComponent],
  template: `
    <p class="lede">
      Opened imperatively via <code>PixelDialogService.open()</code> — no template
      <code>[(open)]</code> binding required.
    </p>
    <pixel-input
      label="Policy name"
      [value]="name"
      (valueChange)="name = $event"
      placeholder="Enter a new name"
    />
    <div class="actions">
      <pixel-button appearance="text" (click)="ref.close()">Cancel</pixel-button>
      <pixel-button appearance="solid" (click)="ref.close(name)">Save</pixel-button>
    </div>
  `,
  styles: `
    .lede {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      line-height: 1.5;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 80%, transparent);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsDialogServiceContentComponent {
  protected readonly ref =
    inject<PixelDialogRef<string, DocsDialogServiceContentComponent>>(PixelDialogRef);
  private readonly data = inject<DocsRenamePolicyData>(PIXEL_DIALOG_DATA);

  protected name = this.data.currentName;
}
