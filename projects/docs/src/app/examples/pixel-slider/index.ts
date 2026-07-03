import { createDocExample } from '../../shared/example-source.util';
import { SliderBasicExample } from './slider-basic.example';
import { SliderDiscreteExample } from './slider-discrete.example';
import { SliderRangeExample } from './slider-range.example';
import { SliderReactiveFormExample } from './slider-reactive-form.example';
import { SliderSizesExample } from './slider-sizes.example';
import { SliderSkeletonExample } from './slider-skeleton.example';
import { SliderStatesExample } from './slider-states.example';

const SLIDER_IMPORTS = ['PixelSliderComponent'] as const;

export const SLIDER_EXAMPLES = [
  // ── Setup ──────────────────────────────────────────────────────────────────
  createDocExample({
    id: 'basic',
    title: 'Basic slider',
    category: 'Setup',
    description: 'Single-thumb slider with label, step, and two-way value binding.',
    component: SliderBasicExample,
    imports: [...SLIDER_IMPORTS],
    html: `<pixel-slider
  label="Volume"
  [min]="0"
  [max]="100"
  [step]="1"
  helperText="Drag or use arrow keys to adjust."
  [(value)]="volume"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSliderComponent } from 'pixel-ui';

@Component({
  selector: 'docs-slider-basic-example',
  standalone: true,
  imports: [PixelSliderComponent],
  templateUrl: './slider-basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderBasicExample {
  protected readonly volume = signal<number>(40);
}`,
    scss: `/* No styles required */`,
  }),

  createDocExample({
    id: 'range',
    title: 'Range slider',
    category: 'Setup',
    description: 'Dual-thumb range selector — mode="range" binds a [start, end] tuple.',
    component: SliderRangeExample,
    imports: [...SLIDER_IMPORTS, 'PixelSliderValue'],
    html: `<pixel-slider
  label="Price range"
  mode="range"
  [min]="0"
  [max]="1000"
  [step]="10"
  [showValue]="true"
  [displayWith]="formatPrice"
  helperText="Select your budget range."
  [(value)]="priceRange"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelSliderComponent, type PixelSliderValue } from 'pixel-ui';

@Component({ /* … */ })
export class SliderRangeExample {
  protected readonly priceRange = signal<PixelSliderValue>([200, 700]);
  protected readonly formatPrice = (v: number) => '$' + v;
}`,
    scss: `/* No styles required */`,
  }),

  // ── Variants ───────────────────────────────────────────────────────────────
  createDocExample({
    id: 'discrete',
    title: 'Discrete slider',
    category: 'Variants',
    description: 'discrete=true renders tick marks at every step and shows a value bubble on the active thumb.',
    component: SliderDiscreteExample,
    imports: [...SLIDER_IMPORTS],
    html: `<pixel-slider
  label="Rating"
  [min]="1" [max]="5" [step]="1"
  [discrete]="true"
  [showValue]="true"
  [displayWith]="formatRating"
  [(value)]="rating"
/>`,
    typescript: `const RATINGS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export class SliderDiscreteExample {
  protected readonly rating = signal<number>(3);
  protected readonly formatRating = (v: number) => RATINGS[v - 1];
}`,
    scss: `:host { display: flex; flex-direction: column; gap: 2rem; }`,
  }),

  createDocExample({
    id: 'sizes',
    title: 'Size variants',
    category: 'Variants',
    description: 'xs, sm, md, and lg scale the track height, thumb diameter, and typography.',
    component: SliderSizesExample,
    imports: [...SLIDER_IMPORTS],
    html: `@for (size of sizes; track size) {
  <pixel-slider [label]="size.toUpperCase()" [size]="size" [value]="50" />
}`,
    typescript: `export class SliderSizesExample {
  protected readonly sizes = ['xs', 'sm', 'md', 'lg'] as const;
}`,
    scss: `:host { display: flex; flex-direction: column; gap: 1.5rem; }`,
  }),

  // ── States ─────────────────────────────────────────────────────────────────
  createDocExample({
    id: 'states',
    title: 'States',
    category: 'States',
    description: 'disabled, readonly, and always-visible value label.',
    component: SliderStatesExample,
    imports: [...SLIDER_IMPORTS],
    html: `<pixel-slider label="Default"  [value]="60" helperText="Interactive slider." />
<pixel-slider label="Disabled" [value]="40" [disabled]="true" />
<pixel-slider label="Readonly" [value]="70" [readonly]="true" />
<pixel-slider label="With value" [value]="55" [showValue]="true" [alwaysShowValue]="true" />`,
    typescript: `@Component({ /* … */ })
export class SliderStatesExample {}`,
    scss: `:host { display: flex; flex-direction: column; gap: 1.5rem; }`,
  }),

  // ── Forms ──────────────────────────────────────────────────────────────────
  createDocExample({
    id: 'reactive-form',
    title: 'Reactive form integration',
    category: 'Forms',
    description: 'formControlName binding with required and min/max validators. Range slider also works with reactive forms.',
    component: SliderReactiveFormExample,
    imports: [...SLIDER_IMPORTS, 'PixelSliderValidationMessages'],
    html: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <pixel-slider
    label="Brightness (required)"
    [min]="0" [max]="100"
    [showValue]="true" [alwaysShowValue]="true"
    formControlName="brightness"
    [validationMessages]="messages"
  />
  <pixel-slider
    label="Contrast"
    mode="range"
    [min]="0" [max]="100"
    formControlName="contrast"
  />
  <pixel-button type="submit" appearance="solid" [disabled]="form.invalid">Apply</pixel-button>
</form>`,
    typescript: `protected readonly form = new FormGroup({
  brightness: new FormControl<number>(60, [Validators.required, Validators.min(10)]),
  contrast:   new FormControl<[number, number]>([20, 80]),
});`,
    scss: `.form { display: flex; flex-direction: column; gap: 1.5rem; max-width: 28rem; }`,
  }),

  // ── Loading ────────────────────────────────────────────────────────────────
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'showSkeleton replaces the slider with a pill placeholder sized to the current size variant.',
    component: SliderSkeletonExample,
    imports: [...SLIDER_IMPORTS],
    html: `<pixel-slider label="Single md" [showSkeleton]="skeleton()" />
<pixel-slider label="Single sm" size="sm" [showSkeleton]="skeleton()" />
<pixel-slider label="Single lg" size="lg" [showSkeleton]="skeleton()" />`,
    typescript: `export class SliderSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `.stack { display: flex; flex-direction: column; gap: 1.25rem; }`,
  }),
] as const;
