import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  viewChild,
} from '@angular/core';
import {
  PIXEL_DIALOG_DATA,
  PixelButtonComponent,
  PixelDialogRef,
  PixelNavAnchorDirective,
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';
import type { AppShellPlaygroundNavBridge } from './app-shell-playground-nav.bridge';

export interface ClaimAmendmentDialogData {
  readonly bridge: AppShellPlaygroundNavBridge;
  readonly initialStep?: string | number;
}

@Component({
  selector: 'docs-claim-amendment-dialog',
  imports: [
    PixelButtonComponent,
    PixelStepperComponent,
    PixelStepComponent,
    PixelStepContentComponent,
    PixelNavAnchorDirective,
  ],
  template: `
    <div class="wizard" pixelNavAnchor="claim-amendment" id="claim-amendment" role="document">
      <p class="lede">
        Opt-in wizard opened via <code>registerWizard</code>. Step restores from the notification
        or <code>?wizard=claim-amendment&amp;step=</code>.
      </p>
      <pixel-stepper type="wizard" navigationMode="free" [(selectedIndex)]="stepIndex">
        <pixel-step label="Details" stepId="details">
          <pixel-step-content>Enter amendment basics for the claim.</pixel-step-content>
        </pixel-step>
        <pixel-step label="Documents" stepId="documents">
          <pixel-step-content>Upload supporting documents for the amendment.</pixel-step-content>
        </pixel-step>
        <pixel-step label="Review" stepId="review">
          <pixel-step-content>Confirm and submit the amendment.</pixel-step-content>
        </pixel-step>
      </pixel-stepper>
      <div class="actions">
        <pixel-button appearance="text" (click)="ref.close()">Close</pixel-button>
      </div>
    </div>
  `,
  styles: `
    .lede {
      margin: 0 0 1rem;
      font-size: 0.875rem;
      color: var(--pixel-sys-on-surface-variant, #444);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-block-start: 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClaimAmendmentDialogComponent {
  protected readonly ref =
    inject<PixelDialogRef<void, ClaimAmendmentDialogComponent>>(PixelDialogRef);
  private readonly data = inject<ClaimAmendmentDialogData>(PIXEL_DIALOG_DATA);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stepper = viewChild(PixelStepperComponent);

  readonly stepIndex = model(0);

  constructor() {
    const bridge = this.data.bridge;
    afterNextRender(() => {
      bridge.setWizardAdapter({
        id: 'claim-amendment',
        syncUrl: true,
        open: async () => undefined,
        setStep: async (step) => {
          const index = this.resolveStepIndex(step);
          this.stepIndex.set(index);
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          });
          await this.stepper()?.jumpTo(index);
        },
        getStep: () => this.stepIndex(),
        close: () => this.ref.close(),
      });

      if (this.data.initialStep != null) {
        void bridge.setWizardStep(this.data.initialStep);
      }
    });

    this.destroyRef.onDestroy(() => bridge.setWizardAdapter(null));
  }

  private resolveStepIndex(step: string | number): number {
    if (typeof step === 'number') {
      return step;
    }
    if (step === 'documents') {
      return 1;
    }
    if (step === 'review') {
      return 2;
    }
    return 0;
  }
}
