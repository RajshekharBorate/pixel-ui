import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PIXEL_DRAWER_DATA,
  PixelButtonComponent,
  PixelDrawerRef,
  PixelInputComponent,
} from 'pixel-ui';

export interface DocsCreatePolicyData {
  readonly owner: string;
}

export interface DocsCreatePolicyResult {
  readonly name: string;
  readonly owner: string;
}

@Component({
  selector: 'docs-drawer-service-content',
  imports: [PixelButtonComponent, PixelInputComponent],
  template: `
    <p class="lede">
      Opened imperatively via <code>PixelDrawerService.open()</code> — ideal for wizards launched
      from a table row or menu.
    </p>
    <pixel-input
      label="Policy name"
      [value]="name"
      (valueChange)="name = $event"
      placeholder="e.g. Q4 enterprise renewal"
    />
    <pixel-input label="Owner" [value]="owner" (valueChange)="owner = $event" />
    <div class="actions">
      <pixel-button appearance="text" (click)="ref.close()">Cancel</pixel-button>
      <pixel-button appearance="solid" [disabled]="!name.trim()" (click)="save()">
        Create policy
      </pixel-button>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .lede {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 80%, transparent);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: auto;
      padding-top: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsDrawerServiceContentComponent {
  protected readonly ref =
    inject<PixelDrawerRef<DocsCreatePolicyResult, DocsDrawerServiceContentComponent>>(
      PixelDrawerRef,
    );
  private readonly data = inject<DocsCreatePolicyData>(PIXEL_DRAWER_DATA);

  protected name = '';
  protected owner = this.data.owner;

  protected save(): void {
    this.ref.close({ name: this.name.trim(), owner: this.owner });
  }
}
