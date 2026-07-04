import { createDocExample } from '../../shared/example-source.util';
import { RadioSkeletonExample } from './radio-skeleton.example';
import { RadioBasicExample } from './radio-basic.example';
import { RadioCardOptionsExample } from './radio-card-options.example';
import { RadioKeyboardEventsExample } from './radio-keyboard-events.example';
import { RadioLayoutsExample } from './radio-layouts.example';
import { RadioProjectedExample } from './radio-projected.example';
import { RadioReactiveFormExample } from './radio-reactive-form.example';
import { RadioRichOptionsExample } from './radio-rich-options.example';
import { RadioSizesExample } from './radio-sizes.example';
import { RadioStatesExample } from './radio-states.example';
import { RadioTemplateFormExample } from './radio-template-form.example';

const RADIO_IMPORTS = ['PixelRadioGroupComponent', 'PixelRadioComponent'] as const;

export const RADIO_EXAMPLES = [
createDocExample({
    id: 'basic',
    title: 'Basic group',
    category: 'Setup',
    description: 'Declarative options with icons, descriptions, and badges.',
    component: RadioBasicExample,
    imports: [...RADIO_IMPORTS],
    html: `<pixel-radio-group
  label="Notification channel"
  [value]="channel()"
  [options]="channelOptions"
  (valueChange)="channel.set(String($event))"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelRadioGroupComponent, PixelRadioOption } from 'pixel-ui';

@Component({
  selector: 'docs-radio-basic-example',
  imports: [PixelRadioGroupComponent],
  templateUrl: './radio-basic.example.html',
  styleUrl: './radio-basic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioBasicExample {
  protected readonly channel = signal('email');
  // …channelOptions
}`,
    scss: `.meta {
  margin: 0;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
}`,
  }),
createDocExample({
    id: 'card-options',
    title: 'Card options',
    category: 'Variants',
    description: 'Grid layout with bordered card-style selectable plans.',
    component: RadioCardOptionsExample,
    imports: ['PixelRadioGroupComponent'],
    html: `<pixel-radio-group
  label="Choose a plan"
  layout="grid"
  card
  bordered
  [value]="plan()"
  [options]="planOptions"
  (valueChange)="plan.set(String($event))"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelRadioGroupComponent, PixelRadioOption } from 'pixel-ui';

@Component({
  selector: 'docs-radio-card-options-example',
  imports: [PixelRadioGroupComponent],
  templateUrl: './radio-card-options.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioCardOptionsExample {
  protected readonly plan = signal('pro');
  // …planOptions with card: true
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'projected',
    title: 'Projected radios',
    category: 'Layout',
    description: 'Compose individual pixel-radio elements inside a group.',
    component: RadioProjectedExample,
    imports: [...RADIO_IMPORTS],
    html: `<pixel-radio-group
  label="Support tier"
  [value]="tier()"
  (valueChange)="tier.set(String($event))"
>
  <pixel-radio value="standard" label="Standard" description="Email support" />
  <pixel-radio value="priority" label="Priority" description="24/7 support" badge="Fast" />
</pixel-radio-group>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelRadioComponent, PixelRadioGroupComponent } from 'pixel-ui';

@Component({
  selector: 'docs-radio-projected-example',
  imports: [PixelRadioGroupComponent, PixelRadioComponent],
  templateUrl: './radio-projected.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioProjectedExample {
  protected readonly tier = signal('standard');
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'reactive-form',
    title: 'Reactive form',
    category: 'Forms',
    description: 'Bind the group as ControlValueAccessor with Validators.required.',
    component: RadioReactiveFormExample,
    imports: ['PixelRadioGroupComponent', 'ReactiveFormsModule'],
    html: `<pixel-radio-group
  label="Shipping speed"
  helperText="Required before submit."
  [formControl]="shippingControl"
  [options]="shippingOptions"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelRadioGroupComponent } from 'pixel-ui';

@Component({
  selector: 'docs-radio-reactive-form-example',
  imports: [ReactiveFormsModule, PixelRadioGroupComponent],
  templateUrl: './radio-reactive-form.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioReactiveFormExample {
  protected readonly shippingControl = new FormControl<string | null>(null, Validators.required);
  // …shippingOptions
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'layouts',
    title: 'Layouts',
    category: 'Layout',
    description: 'Vertical, horizontal, and grid layouts with a layout toggle toolbar.',
    component: RadioLayoutsExample,
    imports: ['PixelButtonComponent', 'PixelRadioGroupComponent'],
    html: `<div class="stack">
  <div class="toolbar" role="group" aria-label="Layout">
    @for (item of layouts; track item) {
      <pixel-button
        size="sm"
        [appearance]="layout() === item ? 'tonal' : 'elevated'"
        (click)="layout.set(item)"
      >
        {{ item }}
      </pixel-button>
    }
  </div>
  <pixel-radio-group
    label="Delivery layout demo"
    [layout]="layout()"
    [value]="channel()"
    [options]="channelOptions"
    (valueChange)="setChannel($event)"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';
import { PixelRadioGroupComponent, PixelRadioLayout, PixelRadioOption } from 'pixel-ui';

@Component({
  selector: 'docs-radio-layouts-example',
  imports: [PixelButtonComponent, PixelRadioGroupComponent],
  template: \`
    <div class="stack">
      <div class="toolbar" role="group" aria-label="Layout">
        @for (item of layouts; track item) {
          <pixel-button
            size="sm"
            [appearance]="layout() === item ? 'tonal' : 'elevated'"
            (click)="layout.set(item)"
          >
            {{ item }}
          </pixel-button>
        }
      </div>
      <pixel-radio-group
        label="Delivery layout demo"
        [layout]="layout()"
        [value]="channel()"
        [options]="channelOptions"
        (valueChange)="setChannel($event)"
      />
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 28rem;
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioLayoutsExample {
  protected readonly channel = signal('email');
  protected readonly layout = signal<PixelRadioLayout>('vertical');
  protected readonly layouts: readonly PixelRadioLayout[] = ['vertical', 'horizontal', 'grid'];

  protected readonly channelOptions: readonly PixelRadioOption<string>[] = [
    { value: 'email', label: 'Email', icon: 'mail', description: 'Daily digest' },
    { value: 'sms', label: 'SMS', icon: 'sms', description: 'Transactional only' },
    { value: 'push', label: 'Push', icon: 'notifications', badge: 'Beta' },
  ];

  protected setChannel(value: unknown): void {
    this.channel.set(String(value));
  }
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 28rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}`,
  }),
  createDocExample({
    id: 'rich-options',
    title: 'Rich options',
    category: 'Variants',
    description: 'Options with images, alt text, and descriptions in horizontal layout.',
    component: RadioRichOptionsExample,
    imports: ['PixelRadioGroupComponent'],
    html: `<pixel-radio-group
  label="Payment method"
  layout="horizontal"
  [options]="paymentOptions"
  value="card"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelRadioGroupComponent, PixelRadioOption } from 'pixel-ui';

@Component({
  selector: 'docs-radio-rich-options-example',
  imports: [PixelRadioGroupComponent],
  template: \`
    <pixel-radio-group
      label="Payment method"
      layout="horizontal"
      [options]="paymentOptions"
      value="card"
    />
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioRichOptionsExample {
  protected readonly paymentOptions: readonly PixelRadioOption<string>[] = [
    {
      value: 'card',
      label: 'Card',
      imageUrl: 'https://placehold.co/48x48/png?text=C',
      imageAlt: 'Card',
      description: 'Visa, Mastercard',
    },
    {
      value: 'bank',
      label: 'Bank',
      imageUrl: 'https://placehold.co/48x48/png?text=B',
      imageAlt: 'Bank',
      description: 'ACH transfer',
    },
  ];
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'states',
    title: 'States',
    category: 'States',
    description: 'Disabled, readonly, and error group states with helper text.',
    component: RadioStatesExample,
    imports: ['PixelRadioGroupComponent'],
    html: `<div class="grid">
  <pixel-radio-group
    label="Disabled group"
    disabled
    [options]="channelOptions"
    value="email"
  />
  <pixel-radio-group
    label="Readonly group"
    readonly
    [options]="channelOptions"
    value="sms"
  />
  <pixel-radio-group
    label="Error state"
    state="error"
    helperText="Please choose a valid option."
    required
    [options]="channelOptions"
    value=""
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelRadioGroupComponent, PixelRadioOption } from 'pixel-ui';

@Component({
  selector: 'docs-radio-states-example',
  imports: [PixelRadioGroupComponent],
  template: \`
    <div class="grid">
      <pixel-radio-group
        label="Disabled group"
        disabled
        [options]="channelOptions"
        value="email"
      />
      <pixel-radio-group
        label="Readonly group"
        readonly
        [options]="channelOptions"
        value="sms"
      />
      <pixel-radio-group
        label="Error state"
        state="error"
        helperText="Please choose a valid option."
        required
        [options]="channelOptions"
        value=""
      />
    </div>
  \`,
  styles: \`
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      max-width: 36rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioStatesExample {
  protected readonly channelOptions: readonly PixelRadioOption<string>[] = [
    { value: 'email', label: 'Email', icon: 'mail' },
    { value: 'sms', label: 'SMS', icon: 'sms' },
    { value: 'push', label: 'Push', icon: 'notifications' },
  ];
}`,
    scss: `.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  max-width: 36rem;
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'Radio group density from xs through lg.',
    component: RadioSizesExample,
    imports: ['PixelRadioGroupComponent'],
    html: `<div class="row">
  @for (size of sizes; track size) {
    <pixel-radio-group
      [size]="size"
      [label]="'Size ' + size"
      [options]="[{ value: size, label: 'Selected ' + size }]"
      [value]="size"
    />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelRadioGroupComponent, PixelRadioOption, PixelRadioSize } from 'pixel-ui';

@Component({
  selector: 'docs-radio-sizes-example',
  imports: [PixelRadioGroupComponent],
  template: \`
    <div class="row">
      @for (size of sizes; track size) {
        <pixel-radio-group
          [size]="size"
          [label]="'Size ' + size"
          [options]="[{ value: size, label: 'Selected ' + size }]"
          [value]="size"
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
export class RadioSizesExample {
  protected readonly sizes: readonly PixelRadioSize[] = ['xs', 'sm', 'md', 'lg'];
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
    description: 'ngModel binding with required validation on a radio group.',
    component: RadioTemplateFormExample,
    imports: ['PixelRadioGroupComponent', 'FormsModule'],
    html: `<form class="stack" #templateForm="ngForm" (submit)="$event.preventDefault()">
  <pixel-radio-group
    name="priority"
    label="Priority"
    required
    [(ngModel)]="templatePriority"
    [options]="priorityOptions"
  />
  <p class="meta">Template model: {{ templatePriority ?? 'none' }}</p>
  <p class="meta">Form valid: {{ templateForm.valid }}</p>
</form>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PixelRadioGroupComponent } from 'pixel-ui';

@Component({
  selector: 'docs-radio-template-form-example',
  imports: [FormsModule, PixelRadioGroupComponent],
  template: \`
    <form class="stack" #templateForm="ngForm" (submit)="$event.preventDefault()">
      <pixel-radio-group
        name="priority"
        label="Priority"
        required
        [(ngModel)]="templatePriority"
        [options]="priorityOptions"
      />
      <p class="meta">Template model: {{ templatePriority ?? 'none' }}</p>
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
export class RadioTemplateFormExample {
  protected templatePriority: string | null = null;

  protected readonly priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' },
  ];
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
    id: 'keyboard-events',
    title: 'Keyboard events',
    category: 'Accessibility',
    description: 'Arrow keys and Space with keyboardSelection output logging.',
    component: RadioKeyboardEventsExample,
    imports: [...RADIO_IMPORTS],
    html: `<div class="split">
  <div class="stack">
    <p class="meta">Focus the group and use arrow keys or Space.</p>
    <pixel-radio-group
      label="Keyboard demo"
      [value]="value()"
      (valueChange)="setValue($event)"
      (keyboardSelection)="handleSelection($event)"
    >
      <pixel-radio value="standard" label="Standard" />
      <pixel-radio value="priority" label="Priority" />
    </pixel-radio-group>
  </div>
  <aside class="log" aria-label="Interaction log">
    <p class="log-title">Events</p>
    @for (entry of eventLog(); track $index) {
      <p>{{ entry }}</p>
    }
  </aside>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelRadioComponent,
  PixelRadioGroupComponent,
  PixelRadioSelectionChangeEvent,
} from 'pixel-ui';

@Component({
  selector: 'docs-radio-keyboard-events-example',
  imports: [PixelRadioGroupComponent, PixelRadioComponent],
  template: \`
    <div class="split">
      <div class="stack">
        <p class="meta">Focus the group and use arrow keys or Space.</p>
        <pixel-radio-group
          label="Keyboard demo"
          [value]="value()"
          (valueChange)="setValue($event)"
          (keyboardSelection)="handleSelection($event)"
        >
          <pixel-radio value="standard" label="Standard" />
          <pixel-radio value="priority" label="Priority" />
        </pixel-radio-group>
      </div>
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

    .stack {
      display: grid;
      gap: 0.5rem;
    }

    .meta {
      margin: 0;
      font-size: 0.875rem;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
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
export class RadioKeyboardEventsExample {
  protected readonly value = signal('standard');
  protected readonly eventLog = signal<string[]>([
    'Interact with a radio group to see events here.',
  ]);

  protected setValue(value: unknown): void {
    this.value.set(String(value));
  }

  protected handleSelection(event: PixelRadioSelectionChangeEvent): void {
    this.eventLog.update((entries) => [
      \`Selected \${String(event.value)} via \${event.source}\`,
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

.stack {
  display: grid;
  gap: 0.5rem;
}

.meta {
  margin: 0;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
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
    description: 'Show radio option placeholders while the option list is being fetched from the server. The skeleton row count mirrors the options array length automatically.',
    component: RadioSkeletonExample,
    imports: ['PixelRadioGroupComponent'],
    html: `<pixel-radio-group
  label="Preferred contact"
  [options]="options"
  [showSkeleton]="skeleton()"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelRadioGroupComponent, type PixelRadioOption } from 'pixel-ui';

@Component({ /* … */ })
export class RadioSkeletonExample {
  protected readonly skeleton = signal(true);

  protected readonly options: readonly PixelRadioOption[] = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'post', label: 'Post' },
  ];
}`,
    scss: `/* No styles required */`,
  }),
] as const;
