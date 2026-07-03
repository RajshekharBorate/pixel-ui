import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelButtonComponent,
  PixelStepActionsComponent,
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-stepper-vertical-example',
  standalone: true,
  imports: [
    PixelStepperComponent,
    PixelStepComponent,
    PixelStepContentComponent,
    PixelStepActionsComponent,
    PixelButtonComponent,
  ],
  template: `
    <pixel-stepper type="vertical" navigationMode="free" #stepper>
      <pixel-step label="Basic info" description="Name and email">
        <pixel-step-content>Tell us who you are.</pixel-step-content>
        <pixel-step-actions align="start">
          <pixel-button appearance="solid" size="sm" (click)="stepper.next()">Continue</pixel-button>
        </pixel-step-actions>
      </pixel-step>
      <pixel-step label="Settings" description="Preferences">
        <pixel-step-content>Configure your workspace.</pixel-step-content>
        <pixel-step-actions align="start">
          <pixel-button appearance="text" size="sm" (click)="stepper.previous()">Back</pixel-button>
          <pixel-button appearance="solid" size="sm" (click)="stepper.next()">Continue</pixel-button>
        </pixel-step-actions>
      </pixel-step>
      <pixel-step label="Review" description="Confirm and finish">
        <pixel-step-content>Everything look good?</pixel-step-content>
      </pixel-step>
    </pixel-stepper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperVerticalExample {}
