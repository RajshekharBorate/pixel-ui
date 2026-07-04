import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-async-save-example',
  imports: [PixelButtonComponent],
  template: `
    <pixel-button
      appearance="outline"
      [state]="isSaving() ? 'loading' : 'default'"
      loadingLabel="Saving draft"
      (click)="saveDraft()"
    >
      Save draft
    </pixel-button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonAsyncSaveExample {
  protected readonly isSaving = signal(false);

  protected saveDraft(): void {
    if (this.isSaving()) {
      return;
    }
    this.isSaving.set(true);
    window.setTimeout(() => this.isSaving.set(false), 1600);
  }
}
