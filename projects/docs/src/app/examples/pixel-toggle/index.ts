import { createDocExample } from '../../shared/example-source.util';
import { ToggleSkeletonExample } from './toggle-skeleton.example';
import { ToggleImageThumbExample } from './toggle-image-thumb.example';
import { ToggleLabeledSizesExample } from './toggle-labeled-sizes.example';
import { ToggleLabeledSwitchExample } from './toggle-labeled-switch.example';
import { ToggleReactiveFormExample } from './toggle-reactive-form.example';
import { ToggleSegmentedExample } from './toggle-segmented.example';
import { ToggleSegmentedShapesExample } from './toggle-segmented-shapes.example';
import { ToggleSegmentedSizesExample } from './toggle-segmented-sizes.example';
import { ToggleStatesExample } from './toggle-states.example';
import { ToggleSwitchBasicExample } from './toggle-switch-basic.example';
import { ToggleSwitchSizesExample } from './toggle-switch-sizes.example';
import { ToggleThemeScopedExample } from './toggle-theme-scoped.example';

const TOGGLE_IMPORTS = ['PixelToggleComponent', 'PixelToggleCheckedIconDirective', 'PixelToggleUncheckedIconDirective', 'PixelToggleThumbIconComponent'] as const;

export const TOGGLE_EXAMPLES = [
createDocExample({
    id: 'switch-basic',
    title: 'Switch with thumb icons',
    category: 'Setup',
    description: 'Boolean switch with projected Material Symbols on the thumb.',
    component: ToggleSwitchBasicExample,
    imports: [...TOGGLE_IMPORTS],
    html: `<pixel-toggle
  label="Enable Wifi"
  [checked]="wifiEnabled()"
  (checkedChange)="wifiEnabled.set($event)"
>
  <ng-template pixelToggleCheckedIcon>
    <pixel-toggle-thumb-icon icon="check" />
  </ng-template>
  <ng-template pixelToggleUncheckedIcon>
    <pixel-toggle-thumb-icon icon="remove" />
  </ng-template>
</pixel-toggle>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-switch-basic-example',
  standalone: true,
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  templateUrl: './toggle-switch-basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSwitchBasicExample {
  protected readonly wifiEnabled = signal(true);
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'labeled-switch',
    title: 'Labeled track',
    category: 'Layout',
    description: 'In-track ON/OFF labels with optional thumb icons.',
    component: ToggleLabeledSwitchExample,
    imports: [...TOGGLE_IMPORTS],
    html: `<pixel-toggle
  switchAppearance="labeled"
  onLabel="ON"
  offLabel="OFF"
  [checked]="powerOn()"
  (checkedChange)="powerOn.set($event)"
>
  <ng-template pixelToggleCheckedIcon>
    <pixel-toggle-thumb-icon icon="check" />
  </ng-template>
  <ng-template pixelToggleUncheckedIcon>
    <pixel-toggle-thumb-icon icon="close" />
  </ng-template>
</pixel-toggle>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-labeled-switch-example',
  standalone: true,
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  templateUrl: './toggle-labeled-switch.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleLabeledSwitchExample {
  protected readonly powerOn = signal(false);
}`,
    scss: `/* No styles required for this example */`,
  }),
createDocExample({
    id: 'segmented',
    title: 'Segmented control',
    category: 'Variants',
    description: 'Contained pill and surface rounded modes for mutually exclusive choices.',
    component: ToggleSegmentedExample,
    imports: ['PixelToggleComponent'],
    html: `<pixel-toggle
  mode="segmented"
  segmentedAppearance="contained"
  segmentedShape="pill"
  [options]="stayOptions"
  [value]="stayType()"
  (valueChange)="stayType.set(String($event))"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelToggleComponent, PixelToggleOption } from 'pixel-ui';

@Component({
  selector: 'docs-toggle-segmented-example',
  standalone: true,
  imports: [PixelToggleComponent],
  templateUrl: './toggle-segmented.example.html',
  styleUrl: './toggle-segmented.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSegmentedExample {
  protected readonly stayType = signal('hotels');
  // …stayOptions and logicOptions
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 20rem;
}`,
  }),
createDocExample({
    id: 'reactive-form',
    title: 'Reactive form',
    category: 'Forms',
    description: 'Switch mode with Validators.requiredTrue and helper text.',
    component: ToggleReactiveFormExample,
    imports: ['PixelToggleComponent', 'ReactiveFormsModule'],
    html: `<pixel-toggle
  label="I accept the terms"
  helperText="Required before submitting."
  requiredErrorMessage="Please accept the terms to continue."
  required
  [formControl]="termsControl"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PixelToggleComponent } from 'pixel-ui';

@Component({
  selector: 'docs-toggle-reactive-form-example',
  standalone: true,
  imports: [ReactiveFormsModule, PixelToggleComponent],
  templateUrl: './toggle-reactive-form.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleReactiveFormExample {
  protected readonly termsControl = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'switch-sizes',
    title: 'Switch sizes',
    category: 'Sizes',
    description: 'Boolean switch at xs, sm, md, and lg with thumb icons.',
    component: ToggleSwitchSizesExample,
    imports: [...TOGGLE_IMPORTS],
    html: `<div class="stack">
  @for (size of sizes; track size) {
    <pixel-toggle
      [label]="'Size ' + size"
      [size]="size"
      [checked]="size === 'md'"
    >
      <ng-template pixelToggleCheckedIcon>
        <pixel-toggle-thumb-icon icon="check" />
      </ng-template>
      <ng-template pixelToggleUncheckedIcon>
        <pixel-toggle-thumb-icon icon="remove" />
      </ng-template>
    </pixel-toggle>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleSize,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-switch-sizes-example',
  standalone: true,
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: \`
    <div class="stack">
      @for (size of sizes; track size) {
        <pixel-toggle
          [label]="'Size ' + size"
          [size]="size"
          [checked]="size === 'md'"
        >
          <ng-template pixelToggleCheckedIcon>
            <pixel-toggle-thumb-icon icon="check" />
          </ng-template>
          <ng-template pixelToggleUncheckedIcon>
            <pixel-toggle-thumb-icon icon="remove" />
          </ng-template>
        </pixel-toggle>
      }
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 20rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSwitchSizesExample {
  protected readonly sizes: readonly PixelToggleSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 20rem;
}`,
  }),
  createDocExample({
    id: 'labeled-sizes',
    title: 'Labeled switch sizes',
    category: 'Sizes',
    description: 'In-track ON/OFF labels at every size token.',
    component: ToggleLabeledSizesExample,
    imports: [...TOGGLE_IMPORTS],
    html: `<div class="stack">
  @for (size of sizes; track size) {
    <pixel-toggle
      switchAppearance="labeled"
      [label]="'Size ' + size"
      [size]="size"
      onLabel="ON"
      offLabel="OFF"
      [checked]="size === 'md'"
    >
      <ng-template pixelToggleCheckedIcon>
        <pixel-toggle-thumb-icon icon="check" />
      </ng-template>
      <ng-template pixelToggleUncheckedIcon>
        <pixel-toggle-thumb-icon icon="close" />
      </ng-template>
    </pixel-toggle>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleSize,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-labeled-sizes-example',
  standalone: true,
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: \`
    <div class="stack">
      @for (size of sizes; track size) {
        <pixel-toggle
          switchAppearance="labeled"
          [label]="'Size ' + size"
          [size]="size"
          onLabel="ON"
          offLabel="OFF"
          [checked]="size === 'md'"
        >
          <ng-template pixelToggleCheckedIcon>
            <pixel-toggle-thumb-icon icon="check" />
          </ng-template>
          <ng-template pixelToggleUncheckedIcon>
            <pixel-toggle-thumb-icon icon="close" />
          </ng-template>
        </pixel-toggle>
      }
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 20rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleLabeledSizesExample {
  protected readonly sizes: readonly PixelToggleSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 20rem;
}`,
  }),
  createDocExample({
    id: 'segmented-shapes',
    title: 'Segmented shapes',
    category: 'Variants',
    description: 'Rounded vs pill contained and surface segmented controls.',
    component: ToggleSegmentedShapesExample,
    imports: ['PixelToggleComponent'],
    html: `<div class="grid">
  <div class="column">
    <p class="subtitle">Rounded (default)</p>
    <pixel-toggle
      mode="segmented"
      segmentedAppearance="contained"
      segmentedShape="rounded"
      [options]="stayOptions"
      [value]="stayType()"
    />
    <pixel-toggle
      mode="segmented"
      segmentedAppearance="surface"
      segmentedShape="rounded"
      [options]="logicOptions"
      [value]="operator()"
    />
    <p class="subtitle">Disabled</p>
    <pixel-toggle
      mode="segmented"
      segmentedAppearance="contained"
      segmentedShape="rounded"
      disabled
      [options]="stayOptions"
      [value]="stayType()"
    />
  </div>
  <div class="column">
    <p class="subtitle">Pill</p>
    <pixel-toggle
      mode="segmented"
      segmentedAppearance="contained"
      segmentedShape="pill"
      [options]="stayOptions"
      [value]="stayType()"
    />
    <pixel-toggle
      mode="segmented"
      segmentedAppearance="surface"
      segmentedShape="pill"
      [options]="logicOptions"
      [value]="operator()"
    />
    <p class="subtitle">Disabled</p>
    <pixel-toggle
      mode="segmented"
      segmentedAppearance="surface"
      segmentedShape="pill"
      disabled
      [options]="logicOptions"
      [value]="operator()"
    />
  </div>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelToggleComponent, PixelToggleOption } from 'pixel-ui';

@Component({
  selector: 'docs-toggle-segmented-shapes-example',
  standalone: true,
  imports: [PixelToggleComponent],
  template: \`
    <div class="grid">
      <div class="column">
        <p class="subtitle">Rounded (default)</p>
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="contained"
          segmentedShape="rounded"
          [options]="stayOptions"
          [value]="stayType()"
        />
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="surface"
          segmentedShape="rounded"
          [options]="logicOptions"
          [value]="operator()"
        />
        <p class="subtitle">Disabled</p>
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="contained"
          segmentedShape="rounded"
          disabled
          [options]="stayOptions"
          [value]="stayType()"
        />
      </div>
      <div class="column">
        <p class="subtitle">Pill</p>
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="contained"
          segmentedShape="pill"
          [options]="stayOptions"
          [value]="stayType()"
        />
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="surface"
          segmentedShape="pill"
          [options]="logicOptions"
          [value]="operator()"
        />
        <p class="subtitle">Disabled</p>
        <pixel-toggle
          mode="segmented"
          segmentedAppearance="surface"
          segmentedShape="pill"
          disabled
          [options]="logicOptions"
          [value]="operator()"
        />
      </div>
    </div>
  \`,
  styles: \`
    .grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      max-width: 32rem;
    }

    .column {
      display: grid;
      gap: 0.75rem;
    }

    .subtitle {
      margin: 0;
      font-size: 0.8125rem;
      font-weight: 600;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSegmentedShapesExample {
  protected readonly stayType = signal('hotels');
  protected readonly operator = signal<'and' | 'or'>('and');

  protected readonly stayOptions: readonly PixelToggleOption[] = [
    { value: 'hotels', label: 'Hotels' },
    { value: 'apartments', label: 'Apartments' },
  ];

  protected readonly logicOptions: readonly PixelToggleOption[] = [
    { value: 'and', label: 'AND' },
    { value: 'or', label: 'OR' },
  ];
}`,
    scss: `.grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  max-width: 32rem;
}

.column {
  display: grid;
  gap: 0.75rem;
}

.subtitle {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
}`,
  }),
  createDocExample({
    id: 'segmented-sizes',
    title: 'Segmented sizes',
    category: 'Sizes',
    description: 'Segmented control density at xs, sm, md, and lg.',
    component: ToggleSegmentedSizesExample,
    imports: ['PixelToggleComponent'],
    html: `<div class="stack">
  @for (size of sizes; track size) {
    <div class="row">
      <span class="label">{{ size }}</span>
      <pixel-toggle
        mode="segmented"
        segmentedAppearance="contained"
        [size]="size"
        [options]="stayOptions"
        [value]="stayType()"
      />
      <pixel-toggle
        mode="segmented"
        segmentedAppearance="surface"
        [size]="size"
        [options]="logicOptions"
        [value]="operator()"
      />
    </div>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelToggleComponent, PixelToggleOption, PixelToggleSize } from 'pixel-ui';

@Component({
  selector: 'docs-toggle-segmented-sizes-example',
  standalone: true,
  imports: [PixelToggleComponent],
  template: \`
    <div class="stack">
      @for (size of sizes; track size) {
        <div class="row">
          <span class="label">{{ size }}</span>
          <pixel-toggle
            mode="segmented"
            segmentedAppearance="contained"
            [size]="size"
            [options]="stayOptions"
            [value]="stayType()"
          />
          <pixel-toggle
            mode="segmented"
            segmentedAppearance="surface"
            [size]="size"
            [options]="logicOptions"
            [value]="operator()"
          />
        </div>
      }
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 28rem;
    }

    .row {
      display: grid;
      grid-template-columns: 2rem 1fr 1fr;
      gap: 0.75rem;
      align-items: center;
    }

    .label {
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleSegmentedSizesExample {
  protected readonly stayType = signal('hotels');
  protected readonly operator = signal<'and' | 'or'>('and');
  protected readonly sizes: readonly PixelToggleSize[] = ['xs', 'sm', 'md', 'lg'];

  protected readonly stayOptions: readonly PixelToggleOption[] = [
    { value: 'hotels', label: 'Hotels' },
    { value: 'apartments', label: 'Apartments' },
  ];

  protected readonly logicOptions: readonly PixelToggleOption[] = [
    { value: 'and', label: 'AND' },
    { value: 'or', label: 'OR' },
  ];
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 28rem;
}

.row {
  display: grid;
  grid-template-columns: 2rem 1fr 1fr;
  gap: 0.75rem;
  align-items: center;
}

.label {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
}`,
  }),
  createDocExample({
    id: 'states',
    title: 'States',
    category: 'States',
    description: 'Disabled and readonly switch states.',
    component: ToggleStatesExample,
    imports: [...TOGGLE_IMPORTS],
    html: `<div class="stack">
  <pixel-toggle label="Disabled off" disabled />
  <pixel-toggle label="Slide me!" disabled [checked]="true">
    <ng-template pixelToggleCheckedIcon>
      <pixel-toggle-thumb-icon icon="check" />
    </ng-template>
    <ng-template pixelToggleUncheckedIcon>
      <pixel-toggle-thumb-icon icon="remove" />
    </ng-template>
  </pixel-toggle>
  <pixel-toggle label="Readonly on" readonly [checked]="true">
    <ng-template pixelToggleCheckedIcon>
      <pixel-toggle-thumb-icon icon="check" />
    </ng-template>
  </pixel-toggle>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-states-example',
  standalone: true,
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: \`
    <div class="stack">
      <pixel-toggle label="Disabled off" disabled />
      <pixel-toggle label="Slide me!" disabled [checked]="true">
        <ng-template pixelToggleCheckedIcon>
          <pixel-toggle-thumb-icon icon="check" />
        </ng-template>
        <ng-template pixelToggleUncheckedIcon>
          <pixel-toggle-thumb-icon icon="remove" />
        </ng-template>
      </pixel-toggle>
      <pixel-toggle label="Readonly on" readonly [checked]="true">
        <ng-template pixelToggleCheckedIcon>
          <pixel-toggle-thumb-icon icon="check" />
        </ng-template>
      </pixel-toggle>
    </div>
  \`,
  styles: \`
    .stack {
      display: grid;
      gap: 1rem;
      max-width: 20rem;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleStatesExample {}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
  max-width: 20rem;
}`,
  }),
  createDocExample({
    id: 'image-thumb',
    title: 'Image thumb',
    category: 'Layout',
    description: 'Avatar image projected onto the labeled switch thumb.',
    component: ToggleImageThumbExample,
    imports: ['PixelAvatarComponent', ...TOGGLE_IMPORTS],
    html: `<pixel-toggle
  switchAppearance="labeled"
  size="md"
  label="Show profile photo"
  onLabel="ON"
  offLabel="OFF"
  [checked]="profileOn()"
  (checkedChange)="profileOn.set($event)"
>
  <ng-template pixelToggleCheckedIcon>
    <pixel-avatar size="xs" name="Ada Brown" aria-hidden="true" />
  </ng-template>
  <ng-template pixelToggleUncheckedIcon>
    <pixel-toggle-thumb-icon icon="person_off" />
  </ng-template>
</pixel-toggle>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelAvatarComponent,
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-image-thumb-example',
  standalone: true,
  imports: [
    PixelAvatarComponent,
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: \`
    <pixel-toggle
      switchAppearance="labeled"
      size="md"
      label="Show profile photo"
      onLabel="ON"
      offLabel="OFF"
      [checked]="profileOn()"
      (checkedChange)="profileOn.set($event)"
    >
      <ng-template pixelToggleCheckedIcon>
        <pixel-avatar size="xs" name="Ada Brown" aria-hidden="true" />
      </ng-template>
      <ng-template pixelToggleUncheckedIcon>
        <pixel-toggle-thumb-icon icon="person_off" />
      </ng-template>
    </pixel-toggle>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleImageThumbExample {
  protected readonly profileOn = signal(true);
}`,
    scss: `/* No styles required for this example */`,
  }),
  createDocExample({
    id: 'theme-scoped',
    title: 'Theme scoped',
    category: 'Advanced',
    description: 'Per-panel data-theme previews for light and dark tokens.',
    component: ToggleThemeScopedExample,
    imports: [...TOGGLE_IMPORTS],
    html: `<div class="grid">
  @for (theme of themes; track theme.id) {
    <div class="panel" [attr.data-theme]="theme.id">
      <p class="label">{{ theme.label }}</p>
      <pixel-toggle
        switchAppearance="labeled"
        size="sm"
        ariaLabel="Theme mode"
        onLabel="Dark"
        offLabel="Light"
        [checked]="theme.id === 'enterprise-dark'"
      >
        <ng-template pixelToggleCheckedIcon>
          <pixel-toggle-thumb-icon icon="dark_mode" />
        </ng-template>
        <ng-template pixelToggleUncheckedIcon>
          <pixel-toggle-thumb-icon icon="light_mode" />
        </ng-template>
      </pixel-toggle>
    </div>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelToggleCheckedIconDirective,
  PixelToggleComponent,
  PixelToggleThumbIconComponent,
  PixelToggleUncheckedIconDirective,
  type PixelThemeId,
} from 'pixel-ui';

@Component({
  selector: 'docs-toggle-theme-scoped-example',
  standalone: true,
  imports: [
    PixelToggleComponent,
    PixelToggleCheckedIconDirective,
    PixelToggleUncheckedIconDirective,
    PixelToggleThumbIconComponent,
  ],
  template: \`
    <div class="grid">
      @for (theme of themes; track theme.id) {
        <div class="panel" [attr.data-theme]="theme.id">
          <p class="label">{{ theme.label }}</p>
          <pixel-toggle
            switchAppearance="labeled"
            size="sm"
            ariaLabel="Theme mode"
            onLabel="Dark"
            offLabel="Light"
            [checked]="theme.id === 'enterprise-dark'"
          >
            <ng-template pixelToggleCheckedIcon>
              <pixel-toggle-thumb-icon icon="dark_mode" />
            </ng-template>
            <ng-template pixelToggleUncheckedIcon>
              <pixel-toggle-thumb-icon icon="light_mode" />
            </ng-template>
          </pixel-toggle>
        </div>
      }
    </div>
  \`,
  styles: \`
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
      max-width: 24rem;
    }

    .panel {
      padding: 1rem;
      border-radius: 0.75rem;
      background: var(--pixel-sys-surface);
      border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 24%, transparent);
    }

    .label {
      margin: 0 0 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleThemeScopedExample {
  protected readonly themes: ReadonlyArray<{ readonly id: PixelThemeId; readonly label: string }> = [
    { id: 'enterprise-light', label: 'Enterprise light' },
    { id: 'enterprise-dark', label: 'Enterprise dark' },
  ];
}`,
    scss: `.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  max-width: 24rem;
}

.panel {
  padding: 1rem;
  border-radius: 0.75rem;
  background: var(--pixel-sys-surface);
  border: 1px solid color-mix(in srgb, var(--pixel-sys-outline) 24%, transparent);
}

.label {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show toggle placeholders while user preferences or feature flags are being loaded.',
    component: ToggleSkeletonExample,
    imports: ['PixelToggleComponent'],
    html: `<pixel-toggle label="Dark mode" [showSkeleton]="skeleton()" />
<pixel-toggle label="Email notifications" [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelToggleComponent } from 'pixel-ui';

@Component({ /* … */ })
export class ToggleSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
