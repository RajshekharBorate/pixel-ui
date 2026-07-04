import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-stepper-wizard-example',
  imports: [PixelStepperComponent, PixelStepComponent, PixelStepContentComponent],
  template: `
    <pixel-stepper type="wizard" navigationMode="linear" (finished)="onFinished()">
      <pixel-step label="Plan">
        <pixel-step-content>Pick a plan that fits your team.</pixel-step-content>
      </pixel-step>
      <pixel-step label="Billing">
        <pixel-step-content>Add a payment method.</pixel-step-content>
      </pixel-step>
      <pixel-step label="Invite">
        <pixel-step-content>Invite your teammates.</pixel-step-content>
      </pixel-step>
      <pixel-step label="Done">
        <pixel-step-content>Press Finish to complete setup.</pixel-step-content>
      </pixel-step>
    </pixel-stepper>

    @if (finished()) {
      <p class="log" role="status">Wizard finished!</p>
    }
  `,
  styles: `
    .log {
      margin: 0.75rem 0 0;
      font-size: 0.875rem;
      color: var(--pixel-sys-primary);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperWizardExample {
  protected readonly finished = signal(false);

  protected onFinished(): void {
    this.finished.set(true);
  }
}
