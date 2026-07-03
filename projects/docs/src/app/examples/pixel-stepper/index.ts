import { createDocExample } from '../../shared/example-source.util';
import { StepperSkeletonExample } from './stepper-skeleton.example';
import { StepperHorizontalExample } from './stepper-horizontal.example';
import { StepperLabelsBelowExample } from './stepper-labels-below.example';
import { StepperNavigationModesExample } from './stepper-navigation-modes.example';
import { StepperOptionalExample } from './stepper-optional.example';
import { StepperProgressExample } from './stepper-progress.example';
import { StepperSizesExample } from './stepper-sizes.example';
import { StepperStatesExample } from './stepper-states.example';
import { StepperTimelineExample } from './stepper-timeline.example';
import { StepperVerticalExample } from './stepper-vertical.example';
import { StepperWizardExample } from './stepper-wizard.example';

const STEPPER_IMPORTS = [
  'PixelStepperComponent',
  'PixelStepComponent',
  'PixelStepContentComponent',
] as const;

export const STEPPER_EXAMPLES = [
  createDocExample({
    id: 'horizontal',
    title: 'Horizontal stepper',
    category: 'Setup',
    description:
      'Default horizontal layout with icons, connectors, and per-step pixel-step-actions.',
    component: StepperHorizontalExample,
    imports: [...STEPPER_IMPORTS, 'PixelStepActionsComponent', 'PixelButtonComponent'],
    html: `<pixel-stepper navigationMode="free" #s>
  <pixel-step label="Cart" icon="shopping_cart">
    <pixel-step-content>Review your cart.</pixel-step-content>
    <pixel-step-actions align="end">
      <pixel-button (click)="s.next()">Next</pixel-button>
    </pixel-step-actions>
  </pixel-step>
  <pixel-step label="Payment" icon="payments">…</pixel-step>
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelStepActionsComponent,
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({ /* … */ })
export class StepperHorizontalExample {}`,
  }),
  createDocExample({
    id: 'wizard',
    title: 'Wizard flow',
    category: 'Behavior',
    description:
      'type="wizard" adds Back / Next / Finish footer. navigationMode="linear" gates forward progress.',
    component: StepperWizardExample,
    imports: [...STEPPER_IMPORTS],
    html: `<pixel-stepper type="wizard" navigationMode="linear" (finished)="submit()">
  <pixel-step label="Plan">…</pixel-step>
  <pixel-step label="Billing">…</pixel-step>
  <pixel-step label="Done">…</pixel-step>
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelStepComponent,
  PixelStepContentComponent,
  PixelStepperComponent,
} from 'pixel-ui';

@Component({ /* … */ })
export class StepperWizardExample {
  protected onFinished(): void { /* wizard complete */ }
}`,
  }),
  createDocExample({
    id: 'vertical',
    title: 'Vertical stepper',
    category: 'Layout',
    description: 'type="vertical" stacks indicators with nested content under the active step.',
    component: StepperVerticalExample,
    imports: [...STEPPER_IMPORTS, 'PixelStepActionsComponent', 'PixelButtonComponent'],
    html: `<pixel-stepper type="vertical" navigationMode="free" #s>
  <pixel-step label="Basic info" description="Name and email">
    <pixel-step-content>…</pixel-step-content>
    <pixel-step-actions>
      <pixel-button (click)="s.next()">Continue</pixel-button>
    </pixel-step-actions>
  </pixel-step>
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepperComponent, PixelStepComponent, PixelStepContentComponent } from 'pixel-ui';

@Component({ /* … */ })
export class StepperVerticalExample {}`,
  }),
  createDocExample({
    id: 'states',
    title: 'Validation states',
    category: 'States',
    description:
      'Force indicator presentation with state: error, warning, loading, or locked on individual steps.',
    component: StepperStatesExample,
    imports: [...STEPPER_IMPORTS],
    html: `<pixel-stepper navigationMode="free">
  <pixel-step label="Completed" [completed]="true">…</pixel-step>
  <pixel-step label="Has errors" state="error">…</pixel-step>
  <pixel-step label="Validating" state="loading">…</pixel-step>
  <pixel-step label="Locked" state="locked">…</pixel-step>
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepperComponent, PixelStepComponent, PixelStepContentComponent } from 'pixel-ui';

@Component({ /* … */ })
export class StepperStatesExample {}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'Four density tiers (xs–lg) scale indicators, labels, and spacing.',
    component: StepperSizesExample,
    imports: [...STEPPER_IMPORTS],
    html: `<pixel-stepper [size]="'sm'" navigationMode="free">
  <pixel-step label="One" />
  <pixel-step label="Two" />
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepperComponent, type PixelStepperSize } from 'pixel-ui';

@Component({ /* … */ })
export class StepperSizesExample {
  protected readonly sizes: readonly PixelStepperSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `.row {
  display: grid;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'labels-below',
    title: 'Labels below indicators',
    category: 'Layout',
    description:
      'labelPosition="bottom" stacks label and description beneath each icon with connectors between indicators.',
    component: StepperLabelsBelowExample,
    imports: [...STEPPER_IMPORTS],
    html: `<pixel-stepper labelPosition="bottom" navigationMode="free">
  <pixel-step label="Account" description="Your details" icon="person">…</pixel-step>
  <pixel-step label="Shipping" description="Where to deliver" icon="local_shipping">…</pixel-step>
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepperComponent, PixelStepComponent, PixelStepContentComponent } from 'pixel-ui';

@Component({ /* … */ })
export class StepperLabelsBelowExample {}`,
  }),
  createDocExample({
    id: 'optional',
    title: 'Optional steps',
    category: 'Behavior',
    description:
      'Steps marked optional show a hint and Skip button in wizard mode and do not block linear progress.',
    component: StepperOptionalExample,
    imports: [...STEPPER_IMPORTS],
    html: `<pixel-stepper type="wizard" navigationMode="linear">
  <pixel-step label="Required">…</pixel-step>
  <pixel-step label="Promo code" [optional]="true">…</pixel-step>
  <pixel-step label="Confirm">…</pixel-step>
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepperComponent, PixelStepComponent, PixelStepContentComponent } from 'pixel-ui';

@Component({ /* … */ })
export class StepperOptionalExample {}`,
  }),
  createDocExample({
    id: 'navigation-modes',
    title: 'Navigation modes',
    category: 'Behavior',
    description:
      'non-linear revisits completed steps; free allows jumping anywhere. linear gates forward progress.',
    component: StepperNavigationModesExample,
    imports: [...STEPPER_IMPORTS],
    html: `<pixel-stepper navigationMode="non-linear" [selectedIndex]="1">
  <pixel-step label="Step 1" [completed]="true" />
  <pixel-step label="Step 2" />
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepperComponent, PixelStepComponent } from 'pixel-ui';

@Component({ /* … */ })
export class StepperNavigationModesExample {}`,
    scss: `.stack {
  display: grid;
  gap: 1.25rem;
}`,
  }),
  createDocExample({
    id: 'pixel-progress',
    title: 'Progress stepper',
    category: 'Behavior',
    description:
      'type="progress" shows a slim bar with Step N of M counter — ideal for compact or mobile contexts.',
    component: StepperProgressExample,
    imports: [...STEPPER_IMPORTS, 'PixelStepActionsComponent', 'PixelButtonComponent'],
    html: `<pixel-stepper type="progress" navigationMode="free" #s>
  <pixel-step label="Details">…</pixel-step>
  <pixel-step label="Configure">…</pixel-step>
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepperComponent, PixelStepComponent, PixelStepContentComponent } from 'pixel-ui';

@Component({ /* … */ })
export class StepperProgressExample {}`,
  }),
  createDocExample({
    id: 'timeline',
    title: 'Timeline stepper',
    category: 'Variants',
    description:
      'type="timeline" reads as an activity feed: filled dots for done, outlined dot for what is next.',
    component: StepperTimelineExample,
    imports: [...STEPPER_IMPORTS],
    html: `<pixel-stepper type="timeline" navigationMode="non-linear" [selectedIndex]="2">
  <pixel-step label="Created" description="Mar 3, 09:14" [completed]="true" />
  <pixel-step label="Approved" description="Mar 3, 11:02" [completed]="true" />
  <pixel-step label="Published" description="In progress" />
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelStepperComponent, PixelStepComponent } from 'pixel-ui';

@Component({ /* … */ })
export class StepperTimelineExample {}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show step circle placeholders while the step list is being loaded remotely. Skeleton count mirrors projected steps automatically.',
    component: StepperSkeletonExample,
    imports: ['PixelStepperComponent', 'PixelStepComponent'],
    html: `<pixel-stepper [showSkeleton]="skeleton()" [skeletonSteps]="4">
  <pixel-step label="Personal info" />
  <pixel-step label="Address" />
  <pixel-step label="Payment" />
  <pixel-step label="Review" />
</pixel-stepper>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelStepperComponent, PixelStepComponent } from 'pixel-ui';

@Component({ /* … */ })
export class StepperSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
