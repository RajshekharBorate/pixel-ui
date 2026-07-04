import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelStepActionsComponent,
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-stepper-horizontal-example',
  imports: [
    PixelStepperComponent,
    PixelStepComponent,
    PixelStepContentComponent,
    PixelStepActionsComponent,
    PixelButtonComponent,
  ],
  template: `
    <pixel-stepper navigationMode="free" #stepper>
      <pixel-step label="Cart" icon="shopping_cart">
        <pixel-step-content>Review the items in your cart.</pixel-step-content>
        <pixel-step-actions align="end">
          <pixel-button appearance="solid" size="sm" (click)="stepper.next()">Next</pixel-button>
        </pixel-step-actions>
      </pixel-step>
      <pixel-step label="Shipping" icon="local_shipping">
        <pixel-step-content>Choose a delivery option.</pixel-step-content>
        <pixel-step-actions>
          <pixel-button appearance="text" size="sm" (click)="stepper.previous()">Back</pixel-button>
          <pixel-button appearance="solid" size="sm" (click)="stepper.next()">Next</pixel-button>
        </pixel-step-actions>
      </pixel-step>
      <pixel-step label="Payment" icon="payments">
        <pixel-step-content>Enter your payment details.</pixel-step-content>
        <pixel-step-actions align="start">
          <pixel-button appearance="text" size="sm" (click)="stepper.previous()">Back</pixel-button>
        </pixel-step-actions>
      </pixel-step>
    </pixel-stepper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperHorizontalExample {}
