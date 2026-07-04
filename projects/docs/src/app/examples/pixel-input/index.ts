import { createDocExample } from '../../shared/example-source.util';
import { InputSkeletonExample } from './input-skeleton.example';
import { InputAffixesExample } from './input-affixes.example';
import { InputAsyncValidationExample } from './input-async-validation.example';
import { InputBasicExample } from './input-basic.example';
import { InputCharacterCounterExample } from './input-character-counter.example';
import { InputKeyboardEventsExample } from './input-keyboard-events.example';
import { InputLabelPositionsExample } from './input-label-positions.example';
import { InputMultilineExample } from './input-multiline.example';
import { InputReactiveFormExample } from './input-reactive-form.example';
import { InputSizesExample } from './input-sizes.example';
import { InputStatesExample } from './input-states.example';
import { InputTemplateFormExample } from './input-template-form.example';
import { InputTypesExample } from './input-types.example';

const INPUT_IMPORTS = ['PixelInputComponent'] as const;

export const INPUT_EXAMPLES = [
createDocExample({
    id: 'basic',
    title: 'Basic input',
    category: 'Setup',
    description: 'Controlled text field with explicit value and valueChange bindings.',
    component: InputBasicExample,
    imports: [...INPUT_IMPORTS],
    html: `<pixel-input
  label="City"
  placeholder="e.g. San Francisco"
  [value]="city()"
  helperText="Controlled value with explicit valueChange."
  (valueChange)="city.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-basic-example',
  imports: [PixelInputComponent],
  templateUrl: './input-basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputBasicExample {
  protected readonly city = signal('San Francisco');
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'reactive-form',
    title: 'Reactive form',
    category: 'Forms',
    description: 'Bind a FormControl; errors and aria-invalid follow touched/dirty state.',
    component: InputReactiveFormExample,
    imports: [...INPUT_IMPORTS, 'ReactiveFormsModule'],
    html: `<pixel-input
  label="Work email"
  type="email"
  helperText="Errors appear when the control is touched or dirty."
  [formControl]="emailControl"
  [validationMessages]="emailMessages"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelInputComponent, PixelInputValidationMessages } from 'pixel-ui';

@Component({
  selector: 'docs-input-reactive-form-example',
  imports: [ReactiveFormsModule, PixelInputComponent],
  templateUrl: './input-reactive-form.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputReactiveFormExample {
  protected readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  protected readonly emailMessages: PixelInputValidationMessages = {
    required: 'Work email is required.',
    email: 'Enter a valid email address.',
  };
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'affixes',
    title: 'Prefix, suffix, password, clear',
    category: 'Layout',
    description: 'Affix slots, password visibility toggle, and a clear button.',
    component: InputAffixesExample,
    imports: [...INPUT_IMPORTS],
    html: `<div class="stack">
  <pixel-input
    label="Amount"
    type="number"
    prefixText="$"
    suffixText="USD"
    placeholder="0.00"
    helperText="Static prefix and suffix slots."
  />
  <pixel-input
    label="Passphrase"
    type="password"
    [showPasswordToggle]="true"
    [value]="password()"
    (valueChange)="password.set($event)"
  />
  <pixel-input
    label="Clearable note"
    [value]="note()"
    [showClear]="true"
    (valueChange)="note.set($event)"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-affixes-example',
  imports: [PixelInputComponent],
  templateUrl: './input-affixes.example.html',
  styleUrl: './input-affixes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputAffixesExample {
  protected readonly password = signal('secret');
  protected readonly note = signal('Clear me');
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 22rem;
}`,
  }),
createDocExample({
    id: 'multiline',
    title: 'Multiline textarea',
    category: 'Variants',
    description: 'Same component with multiline, counter, and autoResize modes.',
    component: InputMultilineExample,
    imports: [...INPUT_IMPORTS],
    html: `<div class="stack">
  <pixel-input
    label="Notes"
    [multiline]="true"
    [rows]="4"
    [maxLength]="280"
    [showClear]="true"
    [value]="notes()"
    (valueChange)="notes.set($event)"
  />
  <pixel-input
    label="Description"
    [multiline]="true"
    [autoResize]="true"
    [value]="description()"
    (valueChange)="description.set($event)"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-multiline-example',
  imports: [PixelInputComponent],
  templateUrl: './input-multiline.example.html',
  styleUrl: './input-multiline.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputMultilineExample {
  protected readonly notes = signal('Same component with [multiline]="true".');
  protected readonly description = signal('');
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 24rem;
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'Density scale from xs through lg with matching padding and type.',
    component: InputSizesExample,
    imports: [...INPUT_IMPORTS],
    html: `<div class="grid">
  @for (item of sizes; track item.size) {
    <pixel-input
      [label]="item.label"
      [size]="item.size"
      [value]="'Size ' + item.size"
      helperText="Padding and type scale follow the size token."
    />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelInputComponent, PixelInputSize } from 'pixel-ui';

interface SizeDemo {
  readonly size: PixelInputSize;
  readonly label: string;
}

@Component({
  selector: 'docs-input-sizes-example',
  imports: [PixelInputComponent],
  template: \`
    <div class="grid">
      @for (item of sizes; track item.size) {
        <pixel-input
          [label]="item.label"
          [size]="item.size"
          [value]="'Size ' + item.size"
          helperText="Padding and type scale follow the size token."
        />
      }
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
export class InputSizesExample {
  protected readonly sizes: readonly SizeDemo[] = [
    { size: 'xs', label: 'Extra small' },
    { size: 'sm', label: 'Small' },
    { size: 'md', label: 'Medium' },
    { size: 'lg', label: 'Large' },
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
    id: 'types',
    title: 'Input types',
    category: 'Variants',
    description: 'Native input types including email, password, number, tel, url, and search.',
    component: InputTypesExample,
    imports: [...INPUT_IMPORTS],
    html: `<div class="grid">
  @for (item of types; track item.type) {
    <pixel-input
      [label]="item.label"
      [type]="item.type"
      [placeholder]="item.placeholder"
      [name]="'demo-' + item.type"
      [showPasswordToggle]="item.type === 'password'"
    />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelInputComponent, PixelInputType } from 'pixel-ui';

interface TypeDemo {
  readonly type: PixelInputType;
  readonly label: string;
  readonly placeholder: string;
}

@Component({
  selector: 'docs-input-types-example',
  imports: [PixelInputComponent],
  template: \`
    <div class="grid">
      @for (item of types; track item.type) {
        <pixel-input
          [label]="item.label"
          [type]="item.type"
          [placeholder]="item.placeholder"
          [name]="'demo-' + item.type"
          [showPasswordToggle]="item.type === 'password'"
        />
      }
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
export class InputTypesExample {
  protected readonly types: readonly TypeDemo[] = [
    { type: 'text', label: 'Text', placeholder: 'Plain text' },
    { type: 'email', label: 'Email', placeholder: 'you@example.com' },
    { type: 'password', label: 'Password', placeholder: '••••••••' },
    { type: 'number', label: 'Number', placeholder: '42' },
    { type: 'tel', label: 'Telephone', placeholder: '+1 415 555 0100' },
    { type: 'url', label: 'URL', placeholder: 'https://example.com' },
    { type: 'search', label: 'Search', placeholder: 'Search…' },
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
    id: 'states',
    title: 'States',
    category: 'States',
    description: 'Disabled, readonly, loading, disabledWhileLoading, and validation error states.',
    component: InputStatesExample,
    imports: [...INPUT_IMPORTS, 'ReactiveFormsModule'],
    html: `<div class="grid">
  <pixel-input
    label="Default"
    value="Plain value"
    helperText="No form control; neutral styling."
  />
  <pixel-input
    label="Disabled"
    value="Locked"
    [disabled]="true"
    helperText="Native disabled via [disabled]."
  />
  <pixel-input
    label="Read only"
    value="Selectable copy"
    [readonly]="true"
    helperText="Native readonly via [readonly]."
  />
  <pixel-input
    label="Loading (editable)"
    value="Saving…"
    [loading]="true"
    helperText="Spinner only; input stays enabled."
  />
  <pixel-input
    label="Loading (blocked)"
    value="Saving…"
    [loading]="true"
    [disabledWhileLoading]="true"
    helperText="Field is disabled while loading."
  />
  <pixel-input
    label="Validation error"
    helperText="Hints stay neutral; errors use validationMessages."
    [validationMessages]="errorMessages"
    [formControl]="errorControl"
  />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelInputComponent, PixelInputValidationMessages } from 'pixel-ui';

@Component({
  selector: 'docs-input-states-example',
  imports: [ReactiveFormsModule, PixelInputComponent],
  template: \`
    <div class="grid">
      <pixel-input
        label="Default"
        value="Plain value"
        helperText="No form control; neutral styling."
      />
      <pixel-input
        label="Disabled"
        value="Locked"
        [disabled]="true"
        helperText="Native disabled via [disabled]."
      />
      <pixel-input
        label="Read only"
        value="Selectable copy"
        [readonly]="true"
        helperText="Native readonly via [readonly]."
      />
      <pixel-input
        label="Loading (editable)"
        value="Saving…"
        [loading]="true"
        helperText="Spinner only; input stays enabled."
      />
      <pixel-input
        label="Loading (blocked)"
        value="Saving…"
        [loading]="true"
        [disabledWhileLoading]="true"
        helperText="Field is disabled while loading."
      />
      <pixel-input
        label="Validation error"
        helperText="Hints stay neutral; errors use validationMessages."
        [validationMessages]="errorMessages"
        [formControl]="errorControl"
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
export class InputStatesExample {
  protected readonly errorControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly errorMessages: PixelInputValidationMessages = {
    required: 'This field is required.',
  };
}`,
    scss: `.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  max-width: 36rem;
}`,
  }),
  createDocExample({
    id: 'label-positions',
    title: 'Label positions',
    category: 'Layout',
    description: 'Top, left, floating, and visually hidden label layouts.',
    component: InputLabelPositionsExample,
    imports: [...INPUT_IMPORTS],
    html: `<div class="grid">
  @for (position of labelPositions; track position) {
    <pixel-input
      [labelPosition]="position"
      [label]="labelFor(position)"
      [placeholder]="position === 'floating' ? 'Focus or type to float' : 'Sample text'"
      [helperText]="helperFor(position)"
      [value]="position === 'floating' ? floatingValue() : 'Sample value'"
      (valueChange)="handleChange(position, $event)"
    />
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent, PixelInputLabelPosition } from 'pixel-ui';

@Component({
  selector: 'docs-input-label-positions-example',
  imports: [PixelInputComponent],
  template: \`
    <div class="grid">
      @for (position of labelPositions; track position) {
        <pixel-input
          [labelPosition]="position"
          [label]="labelFor(position)"
          [placeholder]="position === 'floating' ? 'Focus or type to float' : 'Sample text'"
          [helperText]="helperFor(position)"
          [value]="position === 'floating' ? floatingValue() : 'Sample value'"
          (valueChange)="handleChange(position, $event)"
        />
      }
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
export class InputLabelPositionsExample {
  protected readonly floatingValue = signal('');
  protected readonly labelPositions: readonly PixelInputLabelPosition[] = [
    'top',
    'left',
    'floating',
    'hidden',
  ];

  protected labelFor(position: PixelInputLabelPosition): string {
    switch (position) {
      case 'floating':
        return 'Floating label';
      case 'hidden':
        return 'Hidden label';
      case 'left':
        return 'Left label';
      default:
        return 'Top label';
    }
  }

  protected helperFor(position: PixelInputLabelPosition): string {
    return position === 'hidden'
      ? 'The label is visually hidden but still associated for screen readers.'
      : \`Demonstrates \${position} layout.\`;
  }

  protected handleChange(position: PixelInputLabelPosition, value: string): void {
    if (position === 'floating') {
      this.floatingValue.set(value);
    }
  }
}`,
    scss: `.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  max-width: 36rem;
}`,
  }),
  createDocExample({
    id: 'character-counter',
    title: 'Character counter',
    category: 'Behavior',
    description: 'maxLength enables a live character counter below the field.',
    component: InputCharacterCounterExample,
    imports: [...INPUT_IMPORTS],
    html: `<pixel-input
  label="Short bio"
  [maxLength]="40"
  [value]="bio()"
  helperText="Character counter appears when maxLength is set."
  (valueChange)="bio.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-character-counter-example',
  imports: [PixelInputComponent],
  template: \`
    <pixel-input
      label="Short bio"
      [maxLength]="40"
      [value]="bio()"
      helperText="Character counter appears when maxLength is set."
      (valueChange)="bio.set($event)"
    />
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputCharacterCounterExample {
  protected readonly bio = signal('Hello');
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'template-form',
    title: 'Template-driven form',
    category: 'Forms',
    description: 'ngModel with required, email, minlength, pattern, and maxlength validators.',
    component: InputTemplateFormExample,
    imports: [...INPUT_IMPORTS, 'FormsModule'],
    html: `<form class="stack" #profileForm="ngForm" (ngSubmit)="onSubmit(profileForm)">
  <pixel-input
    label="Email"
    name="email"
    [(ngModel)]="email"
    type="email"
    required
    email
    helperText="We only use this for sign-in."
    [validationMessages]="emailMessages"
  />
  <pixel-input
    label="Username"
    name="username"
    [(ngModel)]="username"
    required
    minlength="3"
    pattern="^[a-zA-Z0-9_]+$"
    helperText="Letters, numbers, underscore; min 3 characters."
    [validationMessages]="usernameMessages"
  />
  <pixel-input
    label="Password"
    name="password"
    [(ngModel)]="password"
    type="password"
    required
    minlength="8"
    [showPasswordToggle]="true"
    helperText="At least 8 characters."
    [validationMessages]="passwordMessages"
  />
  <pixel-input
    label="Notes"
    name="notes"
    [(ngModel)]="notes"
    [maxLength]="120"
    maxlength="120"
    [loading]="notesLoading()"
    helperText="Counter + max length validator."
    [validationMessages]="notesMessages"
  />
  <pixel-input
    label="Disabled (template)"
    name="locked"
    [(ngModel)]="lockedValue"
    [disabled]="true"
    helperText="Uses [disabled] on the field."
  />
  <p class="meta">Form valid: {{ profileForm.valid }}</p>
</form>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { PixelInputComponent, PixelInputValidationMessages } from 'pixel-ui';

@Component({
  selector: 'docs-input-template-form-example',
  imports: [FormsModule, PixelInputComponent],
  template: \`
    <form class="stack" #profileForm="ngForm" (ngSubmit)="onSubmit(profileForm)">
      <pixel-input
        label="Email"
        name="email"
        [(ngModel)]="email"
        type="email"
        required
        email
        helperText="We only use this for sign-in."
        [validationMessages]="emailMessages"
      />
      <pixel-input
        label="Username"
        name="username"
        [(ngModel)]="username"
        required
        minlength="3"
        pattern="^[a-zA-Z0-9_]+$"
        helperText="Letters, numbers, underscore; min 3 characters."
        [validationMessages]="usernameMessages"
      />
      <pixel-input
        label="Password"
        name="password"
        [(ngModel)]="password"
        type="password"
        required
        minlength="8"
        [showPasswordToggle]="true"
        helperText="At least 8 characters."
        [validationMessages]="passwordMessages"
      />
      <pixel-input
        label="Notes"
        name="notes"
        [(ngModel)]="notes"
        [maxLength]="120"
        maxlength="120"
        [loading]="notesLoading()"
        helperText="Counter + max length validator."
        [validationMessages]="notesMessages"
      />
      <pixel-input
        label="Disabled (template)"
        name="locked"
        [(ngModel)]="lockedValue"
        [disabled]="true"
        helperText="Uses [disabled] on the field."
      />
      <p class="meta">Form valid: {{ profileForm.valid }}</p>
    </form>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
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
export class InputTemplateFormExample {
  protected email = '';
  protected username = '';
  protected password = '';
  protected notes = '';
  protected lockedValue = 'Cannot edit this';
  protected readonly notesLoading = signal(false);

  protected readonly emailMessages: PixelInputValidationMessages = {
    required: 'Work email is required.',
    email: 'Enter a valid email address.',
  };

  protected readonly usernameMessages: PixelInputValidationMessages = {
    required: 'Choose a username.',
    minlength: 'Use at least {requiredLength} characters.',
    pattern: 'Use only letters, numbers, and underscores.',
  };

  protected readonly passwordMessages: PixelInputValidationMessages = {
    required: 'Password is required.',
    minlength: 'Use at least {requiredLength} characters.',
  };

  protected readonly notesMessages: PixelInputValidationMessages = {
    maxlength: 'Stay within {requiredLength} characters.',
  };

  protected onSubmit(form: NgForm): void {
    if (form.invalid) {
      return;
    }
  }
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
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
    description: 'Enter, Escape, focusChange, blurChange, and clearClick outputs.',
    component: InputKeyboardEventsExample,
    imports: [...INPUT_IMPORTS],
    html: `<div class="split">
  <pixel-input
    label="Try Enter and Escape"
    placeholder="Type, press Enter, press Escape when clear is on"
    [showClear]="true"
    helperText="Tab into the field, press Enter to log, press Escape to clear."
    (enterPress)="log('Enter pressed')"
    (focusChange)="log('Focus changed: ' + $event)"
    (blurChange)="log('Blur emitted')"
    (clearClick)="log('Clear clicked')"
  />
  <aside class="log" aria-label="Event log">
    <p class="log-title">Events</p>
    @for (entry of eventLog(); track $index) {
      <p>{{ entry }}</p>
    }
  </aside>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({
  selector: 'docs-input-keyboard-events-example',
  imports: [PixelInputComponent],
  template: \`
    <div class="split">
      <pixel-input
        label="Try Enter and Escape"
        placeholder="Type, press Enter, press Escape when clear is on"
        [showClear]="true"
        helperText="Tab into the field, press Enter to log, press Escape to clear."
        (enterPress)="log('Enter pressed')"
        (focusChange)="log('Focus changed: ' + $event)"
        (blurChange)="log('Blur emitted')"
        (clearClick)="log('Clear clicked')"
      />
      <aside class="log" aria-label="Event log">
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
export class InputKeyboardEventsExample {
  protected readonly eventLog = signal<string[]>([
    'Focus the field and press Enter or Escape.',
  ]);

  protected log(message: string): void {
    this.eventLog.update((entries) => [message, ...entries].slice(0, 8));
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
    id: 'async-validation',
    title: 'Async validation',
    category: 'Advanced',
    description: 'AsyncValidatorFn with pending spinner while the handle check resolves.',
    component: InputAsyncValidationExample,
    imports: [...INPUT_IMPORTS, 'ReactiveFormsModule'],
    html: `<pixel-input
  label="Public handle"
  [formControl]="handleControl"
  autocomplete="nickname"
  helperText="Async check (~0.9s). Try taken, admin, or system — spinner shows while pending."
  [validationMessages]="handleMessages"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Observable, delay, map, of } from 'rxjs';
import { PixelInputComponent, PixelInputValidationMessages } from 'pixel-ui';

function simulateAsyncHandleValidator(
  delayMs: number,
  reserved: readonly string[],
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const raw = String(control.value ?? '').trim();
    if (raw.length < 2) {
      return of(null);
    }
    return of(raw).pipe(
      delay(delayMs),
      map((handle) =>
        reserved.includes(handle.toLowerCase()) ? { handleTaken: true } : null,
      ),
    );
  };
}

@Component({
  selector: 'docs-input-async-validation-example',
  imports: [ReactiveFormsModule, PixelInputComponent],
  template: \`
    <pixel-input
      label="Public handle"
      [formControl]="handleControl"
      autocomplete="nickname"
      helperText="Async check (~0.9s). Try taken, admin, or system — spinner shows while pending."
      [validationMessages]="handleMessages"
    />
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputAsyncValidationExample {
  protected readonly handleControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
    asyncValidators: [simulateAsyncHandleValidator(900, ['taken', 'admin', 'system'])],
  });

  protected readonly handleMessages: PixelInputValidationMessages = {
    required: 'Handle is required.',
    minlength: 'Use at least {requiredLength} characters.',
    handleTaken: 'That handle is reserved — try another.',
  };
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Replace fields with shimmer placeholders while data or form config loads. Bind [showSkeleton] to any boolean signal — including a reactive FormControl\'s .pending for async validators.',
    component: InputSkeletonExample,
    imports: [...INPUT_IMPORTS],
    html: `<pixel-input label="First name" [showSkeleton]="skeleton()" />
<pixel-input label="Last name" [showSkeleton]="skeleton()" />
<pixel-input label="Email" type="email" helperText="We'll never share your email." [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelInputComponent } from 'pixel-ui';

@Component({ /* … */ })
export class InputSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
