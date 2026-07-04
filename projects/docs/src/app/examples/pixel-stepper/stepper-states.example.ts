import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({
  selector: 'docs-stepper-states-example',
  imports: [PixelStepperComponent, PixelStepComponent, PixelStepContentComponent],
  template: `
    <pixel-stepper navigationMode="free" [selectedIndex]="3">
      <pixel-step label="Completed" [completed]="true">
        <pixel-step-content>This step passed.</pixel-step-content>
      </pixel-step>
      <pixel-step label="Has errors" state="error">
        <pixel-step-content>Fix the highlighted fields.</pixel-step-content>
      </pixel-step>
      <pixel-step label="Needs review" state="warning">
        <pixel-step-content>Double-check this section.</pixel-step-content>
      </pixel-step>
      <pixel-step label="Validating" state="loading">
        <pixel-step-content>Running checks…</pixel-step-content>
      </pixel-step>
      <pixel-step label="Locked" state="locked">
        <pixel-step-content>Unlocks once earlier steps are done.</pixel-step-content>
      </pixel-step>
    </pixel-stepper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperStatesExample {}
