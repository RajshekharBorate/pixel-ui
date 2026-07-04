import { createDocExample } from '../../shared/example-source.util';
import { CheckboxSkeletonExample } from './checkbox-skeleton.example';
import { CheckboxBasicExample } from './checkbox-basic.example';
import { CheckboxDisabledControlExample } from './checkbox-disabled-control.example';
import { CheckboxIndeterminateExample } from './checkbox-indeterminate.example';
import { CheckboxKeyboardEventsExample } from './checkbox-keyboard-events.example';
import { CheckboxLabelPositionsExample } from './checkbox-label-positions.example';
import { CheckboxReactiveFormExample } from './checkbox-reactive-form.example';
import { CheckboxSizesExample } from './checkbox-sizes.example';
import { CheckboxStatesExample } from './checkbox-states.example';
import { CheckboxTemplateFormExample } from './checkbox-template-form.example';

const CHECKBOX_IMPORTS = ['PixelCheckboxComponent'] as const;

export const CHECKBOX_EXAMPLES = [
createDocExample({
    id: 'basic',
    title: 'Basic checkbox',
    category: 'Setup',
    description: 'Controlled checked state with explicit checkedChange output.',
    component: CheckboxBasicExample,
    imports: [...CHECKBOX_IMPORTS],
    html: `<pixel-checkbox
  label="Receive product updates"
  helperText="Uses checked and checkedChange without two-way binding."
  [checked]="newsletter()"
  (checkedChange)="newsletter.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-basic-example',
  imports: [PixelCheckboxComponent],
  templateUrl: './checkbox-basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxBasicExample {
  protected readonly newsletter = signal(true);
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'indeterminate',
    title: 'Indeterminate parent',
    category: 'Behavior',
    description: 'Mixed state for select-all rows when only some items are checked.',
    component: CheckboxIndeterminateExample,
    imports: [...CHECKBOX_IMPORTS],
    html: `<pixel-checkbox
  label="Select all rows"
  [checked]="allRowsSelected()"
  [indeterminate]="someRowsSelected()"
  (checkedChange)="toggleAllRows($event)"
/>
<p class="meta">{{ selectedRows() }} of 4 rows selected</p>`,
    typescript: `import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-indeterminate-example',
  imports: [PixelCheckboxComponent],
  templateUrl: './checkbox-indeterminate.example.html',
  styleUrl: './checkbox-indeterminate.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxIndeterminateExample {
  protected readonly selectedRows = signal(2);
  protected readonly allRowsSelected = computed(() => this.selectedRows() === 4);
  protected readonly someRowsSelected = computed(
    () => this.selectedRows() > 0 && this.selectedRows() < 4,
  );
  // …toggleAllRows
}`,
    scss: `.meta {
  margin: 0;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
}`,
  }),
createDocExample({
    id: 'reactive-form',
    title: 'Reactive form',
    category: 'Forms',
    description: 'Validators.requiredTrue with requiredErrorMessage copy.',
    component: CheckboxReactiveFormExample,
    imports: [...CHECKBOX_IMPORTS, 'ReactiveFormsModule'],
    html: `<pixel-checkbox
  label="I accept the terms"
  helperText="Required before submitting."
  requiredErrorMessage="Please accept the terms to continue."
  required
  [formControl]="termsControl"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-reactive-form-example',
  imports: [ReactiveFormsModule, PixelCheckboxComponent],
  templateUrl: './checkbox-reactive-form.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxReactiveFormExample {
  protected readonly termsControl = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'Density scale from xs through lg.',
    component: CheckboxSizesExample,
    imports: [...CHECKBOX_IMPORTS],
    html: `<div class="row">
  @for (size of sizes; track size) {
    <pixel-checkbox
      [size]="size"
      [checked]="size === 'md' || size === 'lg'"
      [label]="'Size ' + size"
      helperText="Responsive density"
    />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelCheckboxComponent, PixelCheckboxSize } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-sizes-example',
  imports: [PixelCheckboxComponent],
  templateUrl: './checkbox-sizes.example.html',
  styleUrl: './checkbox-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxSizesExample {
  protected readonly sizes: readonly PixelCheckboxSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 1.5rem;
  align-items: flex-start;
}`,
  }),
  createDocExample({
    id: 'states',
    title: 'States',
    category: 'States',
    description: 'Indeterminate, loading, and disabled checked/unchecked states.',
    component: CheckboxStatesExample,
    imports: [...CHECKBOX_IMPORTS],
    html: `<div class="grid">
  @for (item of stateExamples; track item.state) {
    <pixel-checkbox
      [label]="item.label"
      [state]="item.state"
      [helperText]="item.helperText ?? ''"
    />
  }
  <pixel-checkbox label="Disabled unchecked" disabled helperText="Muted outline" />
  <pixel-checkbox
    label="Disabled checked"
    disabled
    [checked]="true"
    helperText="Material-style selected disabled"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelCheckboxComponent, PixelCheckboxState } from 'pixel-ui';

interface StateExample {
  readonly label: string;
  readonly state: PixelCheckboxState;
  readonly helperText?: string;
}

@Component({
  selector: 'docs-checkbox-states-example',
  imports: [PixelCheckboxComponent],
  template: \`
    <div class="grid">
      @for (item of stateExamples; track item.state) {
        <pixel-checkbox
          [label]="item.label"
          [state]="item.state"
          [helperText]="item.helperText ?? ''"
        />
      }
      <pixel-checkbox label="Disabled unchecked" disabled helperText="Muted outline" />
      <pixel-checkbox
        label="Disabled checked"
        disabled
        [checked]="true"
        helperText="Material-style selected disabled"
      />
    </div>
  \`,
  styles: \`
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      max-width: 36rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxStatesExample {
  protected readonly stateExamples: readonly StateExample[] = [
    {
      label: 'Indeterminate',
      state: 'indeterminate',
      helperText: 'Partial selection.',
    },
    { label: 'Loading', state: 'loading', helperText: 'Applying change.' },
  ];
}`,
    scss: `.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  max-width: 36rem;
}`,
  }),
  createDocExample({
    id: 'label-positions',
    title: 'Label positions',
    category: 'Layout',
    description: 'Label on the left or right of the checkbox control.',
    component: CheckboxLabelPositionsExample,
    imports: [...CHECKBOX_IMPORTS],
    html: `<div class="row">
  @for (position of labelPositions; track position) {
    <pixel-checkbox
      [labelPosition]="position"
      [label]="position === 'left' ? 'Label on the left' : 'Label on the right'"
      helperText="The whole row is clickable."
      [checked]="position === 'right'"
    />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelCheckboxComponent, PixelCheckboxLabelPosition } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-label-positions-example',
  imports: [PixelCheckboxComponent],
  template: \`
    <div class="row">
      @for (position of labelPositions; track position) {
        <pixel-checkbox
          [labelPosition]="position"
          [label]="position === 'left' ? 'Label on the left' : 'Label on the right'"
          helperText="The whole row is clickable."
          [checked]="position === 'right'"
        />
      }
    </div>
  \`,
  styles: \`
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: flex-start;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxLabelPositionsExample {
  protected readonly labelPositions: readonly PixelCheckboxLabelPosition[] = ['left', 'right'];
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-start;
}`,
  }),
  createDocExample({
    id: 'template-form',
    title: 'Template-driven form',
    category: 'Forms',
    description: 'ngModel with required validation and template form validity.',
    component: CheckboxTemplateFormExample,
    imports: [...CHECKBOX_IMPORTS, 'FormsModule'],
    html: `<form class="stack" #templateForm="ngForm" (submit)="$event.preventDefault()">
  <pixel-checkbox
    name="templateTerms"
    label="I accept the template form terms"
    helperText="Uses ngModel with the same ControlValueAccessor."
    requiredErrorMessage="Template terms are required."
    required
    [(ngModel)]="templateAccepted"
  />
  <p class="meta">Template model: {{ templateAccepted ? 'accepted' : 'not accepted' }}</p>
  <p class="meta">Form valid: {{ templateForm.valid }}</p>
</form>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-template-form-example',
  imports: [FormsModule, PixelCheckboxComponent],
  template: \`
    <form class="stack" #templateForm="ngForm" (submit)="$event.preventDefault()">
      <pixel-checkbox
        name="templateTerms"
        label="I accept the template form terms"
        helperText="Uses ngModel with the same ControlValueAccessor."
        requiredErrorMessage="Template terms are required."
        required
        [(ngModel)]="templateAccepted"
      />
      <p class="meta">Template model: {{ templateAccepted ? 'accepted' : 'not accepted' }}</p>
      <p class="meta">Form valid: {{ templateForm.valid }}</p>
    </form>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 0.5rem;
      max-width: 22rem;
    }

    .meta {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxTemplateFormExample {
  protected templateAccepted = false;
}`,
    scss: `.stack {
  display: grid;
  gap: 0.5rem;
  max-width: 22rem;
}

.meta {
  margin: 0;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
}`,
  }),
  createDocExample({
    id: 'disabled-control',
    title: 'Disabled control',
    category: 'States',
    description: 'FormControl disabled via ControlValueAccessor setDisabledState.',
    component: CheckboxDisabledControlExample,
    imports: [...CHECKBOX_IMPORTS, 'ReactiveFormsModule'],
    html: `<pixel-checkbox
  label="Disabled by form control"
  helperText="Disabled comes from ControlValueAccessor setDisabledState."
  [formControl]="disabledControl"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-disabled-control-example',
  imports: [ReactiveFormsModule, PixelCheckboxComponent],
  template: \`
    <pixel-checkbox
      label="Disabled by form control"
      helperText="Disabled comes from ControlValueAccessor setDisabledState."
      [formControl]="disabledControl"
    />
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxDisabledControlExample {
  protected readonly disabledControl = new FormControl({ value: false, disabled: true }, {
    nonNullable: true,
  });
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'keyboard-events',
    title: 'Keyboard events',
    category: 'Accessibility',
    description: 'Space and Enter toggle with stateChange output logging.',
    component: CheckboxKeyboardEventsExample,
    imports: [...CHECKBOX_IMPORTS],
    html: `<div class="split">
  <pixel-checkbox
    label="Keyboard reachable"
    helperText="Tab here, then press Space or Enter."
    [checked]="checked()"
    (stateChange)="handleEvent($event)"
  />
  <aside class="log" aria-label="Interaction log">
    <p class="log-title">Events</p>
    @for (entry of eventLog(); track $index) {
      <p>{{ entry }}</p>
    }
  </aside>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent, PixelCheckboxStateChangeEvent } from 'pixel-ui';

@Component({
  selector: 'docs-checkbox-keyboard-events-example',
  imports: [PixelCheckboxComponent],
  template: \`
    <div class="split">
      <pixel-checkbox
        label="Keyboard reachable"
        helperText="Tab here, then press Space or Enter."
        [checked]="checked()"
        (stateChange)="handleEvent($event)"
      />
      <aside class="log" aria-label="Interaction log">
        <p class="log-title">Events</p>
        @for (entry of eventLog(); track $index) {
          <p>{{ entry }}</p>
        }
      </aside>
    </div>
  \`,
  styles: \`
    .split {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(14rem, 1fr) minmax(10rem, 14rem);
      align-items: start;
      max-width: 40rem;
    }

    .log {
      margin: 0;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: color-mix(in srgb, var(--pixel-sys-surface-container) 80%, transparent);
      font-size: 0.8125rem;
    }

    .log-title {
      margin: 0 0 0.5rem;
      font-weight: 600;
    }

    .log p {
      margin: 0.25rem 0;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxKeyboardEventsExample {
  protected readonly checked = signal(false);
  protected readonly eventLog = signal<string[]>([
    'Toggle a checkbox to see emitted events here.',
  ]);

  protected handleEvent(event: PixelCheckboxStateChangeEvent): void {
    this.checked.set(event.checked);
    this.eventLog.update((entries) => [
      \`Keyboard demo \${event.state} via \${event.source}\`,
      ...entries,
    ].slice(0, 8));
  }
}`,
    scss: `.split {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(14rem, 1fr) minmax(10rem, 14rem);
  align-items: start;
  max-width: 40rem;
}

.log {
  margin: 0;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--pixel-sys-surface-container) 80%, transparent);
  font-size: 0.8125rem;
}

.log-title {
  margin: 0 0 0.5rem;
  font-weight: 600;
}

.log p {
  margin: 0.25rem 0;
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show checkbox placeholders while permission lists or user preferences are being fetched.',
    component: CheckboxSkeletonExample,
    imports: ['PixelCheckboxComponent'],
    html: `<pixel-checkbox label="Accept terms and conditions" [showSkeleton]="skeleton()" />
<pixel-checkbox label="Subscribe to newsletter" [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelCheckboxComponent } from 'pixel-ui';

@Component({ /* … */ })
export class CheckboxSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
