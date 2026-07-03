import { createDocExample } from '../../shared/example-source.util';
import { ProgressSkeletonExample } from './progress-skeleton.example';
import { ProgressLinearBarExample } from './progress-linear-bar.example';
import { ProgressIndeterminateExample } from './progress-indeterminate.example';
import { ProgressCircularGaugeExample } from './progress-circular-gauge.example';
import { ProgressThresholdsExample } from './progress-thresholds.example';
import { ProgressBufferedExample } from './progress-buffered.example';
import { ProgressVariantsExample } from './progress-variants.example';
import { ProgressMilestonesExample } from './progress-milestones.example';
import { ProgressMultiSegmentExample } from './progress-multi-segment.example';

export const PROGRESS_EXAMPLES = [
  createDocExample({
    id: 'linear-bar',
    title: 'Linear progress',
    category: 'Setup',
    description: 'Determinate bars with labels, percentage, and size scale.',
    component: ProgressLinearBarExample,
    imports: ['PixelProgressBarComponent'],
    html: `<pixel-progress-bar [value]="35" showLabel showPercentage label="Downloading" />
<pixel-progress-bar [value]="68" size="sm" showPercentage />
<pixel-progress-bar [value]="82" size="lg" showValue showPercentage label="Sync" showLabel />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-linear-bar-example',
  standalone: true,
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-linear-bar.example.html',
  styleUrl: './progress-linear-bar.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressLinearBarExample {}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'indeterminate',
    title: 'Indeterminate modes',
    category: 'States',
    description: 'Use when progress cannot be measured; query reverses the sweep.',
    component: ProgressIndeterminateExample,
    imports: ['PixelProgressBarComponent'],
    html: `<pixel-progress-bar mode="indeterminate" />
<pixel-progress-bar mode="query" />
<pixel-progress-bar mode="indeterminate" status="info" loading />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-indeterminate-example',
  standalone: true,
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-indeterminate.example.html',
  styleUrl: './progress-indeterminate.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressIndeterminateExample {}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'circular-gauge',
    title: 'Circular gauge',
    category: 'Variants',
    description: 'SVG ring gauges with centered percentage and indeterminate spinner.',
    component: ProgressCircularGaugeExample,
    imports: ['PixelProgressCircleComponent'],
    html: `<pixel-progress-circle [value]="25" showPercentage />
<pixel-progress-circle [value]="50" showPercentage status="info" />
<pixel-progress-circle [value]="75" size="lg" showPercentage label="Storage" />
<pixel-progress-circle indeterminate size="md" ariaLabel="Loading" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressCircleComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-circular-gauge-example',
  standalone: true,
  imports: [PixelProgressCircleComponent],
  templateUrl: './progress-circular-gauge.example.html',
  styleUrl: './progress-circular-gauge.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressCircularGaugeExample {}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'thresholds',
    title: 'Threshold colors',
    category: 'Behavior',
    description: 'Status bands switch automatically as the value crosses each threshold.',
    component: ProgressThresholdsExample,
    imports: ['PixelProgressBarComponent', 'PixelButtonComponent'],
    html: `<pixel-progress-bar
  [value]="value()"
  [thresholds]="thresholds"
  size="lg"
  showPercentage
  showStatus
/>
<div class="controls">
  <pixel-button appearance="outline" size="sm" leadingIcon="remove" (click)="step(-10)">-10</pixel-button>
  <pixel-button appearance="tonal" size="sm" leadingIcon="add" (click)="step(10)">+10</pixel-button>
  <span class="meta">Value: {{ value() }}</span>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelButtonComponent, PixelProgressBarComponent, type PixelProgressThreshold } from 'pixel-ui';

@Component({
  selector: 'docs-progress-thresholds-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelProgressBarComponent],
  templateUrl: './progress-thresholds.example.html',
  styleUrl: './progress-thresholds.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressThresholdsExample {
  protected readonly value = signal(35);
  protected readonly thresholds: readonly PixelProgressThreshold[] = [
    { from: 0, status: 'success', label: 'Healthy' },
    { from: 61, status: 'warning', label: 'Filling up' },
    { from: 81, status: 'error', label: 'Critical' },
  ];

  protected step(delta: number): void {
    this.value.update((current) => Math.min(100, Math.max(0, current + delta)));
  }
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.meta {
  font-size: 0.8125rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 70%, transparent);
}`,
  }),
  createDocExample({
    id: 'buffered',
    title: 'Buffered progress',
    category: 'Behavior',
    description: 'Primary fill plus translucent buffer track for streaming.',
    component: ProgressBufferedExample,
    imports: ['PixelProgressBarComponent'],
    html: `<pixel-progress-bar mode="buffer" [value]="40" [buffer]="65" showPercentage />
<pixel-progress-bar mode="buffer" [value]="55" [buffer]="85" size="lg" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-buffered-example',
  standalone: true,
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-buffered.example.html',
  styleUrl: './progress-buffered.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBufferedExample {}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'variants',
    title: 'Variants',
    category: 'Variants',
    description: 'Solid, striped, and pulse fill treatments.',
    component: ProgressVariantsExample,
    imports: ['PixelProgressBarComponent'],
    html: `<pixel-progress-bar [value]="70" variant="solid" size="lg" />
<pixel-progress-bar [value]="70" variant="striped" size="lg" />
<pixel-progress-bar [value]="70" variant="pulse" size="lg" status="info" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-variants-example',
  standalone: true,
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-variants.example.html',
  styleUrl: './progress-variants.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressVariantsExample {}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'milestones',
    title: 'Milestone markers',
    category: 'Advanced',
    description: 'Mark checkpoints along the track; reached markers light up.',
    component: ProgressMilestonesExample,
    imports: ['PixelProgressBarComponent', 'PixelButtonComponent'],
    html: `<pixel-progress-bar
  [value]="value()"
  [milestones]="milestones"
  showMilestones
  size="lg"
  showPercentage
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelProgressBarComponent } from 'pixel-ui';

@Component({
  selector: 'docs-progress-milestones-example',
  standalone: true,
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-milestones.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressMilestonesExample {
  protected readonly value = signal(60);
  protected readonly milestones = [
    { at: 25, label: 'Draft' },
    { at: 50, label: 'Review' },
    { at: 100, label: 'Published' },
  ];
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'multi-segment',
    title: 'Multi-segment',
    category: 'Advanced',
    description: 'Stack categorized usage slices into one bar.',
    component: ProgressMultiSegmentExample,
    imports: ['PixelProgressBarComponent', 'PixelChipComponent'],
    html: `<pixel-progress-bar [segments]="segments" size="xl" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelProgressBarComponent, type PixelProgressSegment } from 'pixel-ui';

@Component({
  selector: 'docs-progress-multi-segment-example',
  standalone: true,
  imports: [PixelProgressBarComponent],
  templateUrl: './progress-multi-segment.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressMultiSegmentExample {
  protected readonly segments: readonly PixelProgressSegment[] = [
    { label: 'Documents', value: 32, status: 'info' },
    { label: 'Media', value: 24, status: 'warning' },
    { label: 'Backups', value: 14, status: 'success' },
  ];
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show bar and circle placeholders while progress data is being fetched. Sizes are inherited from the component\'s size input.',
    component: ProgressSkeletonExample,
    imports: ['PixelProgressBarComponent', 'PixelProgressCircleComponent'],
    html: `<pixel-progress-bar [showSkeleton]="skeleton()" size="md" />
<pixel-progress-circle [showSkeleton]="skeleton()" size="md" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelProgressBarComponent, PixelProgressCircleComponent } from 'pixel-ui';

@Component({ /* … */ })
export class ProgressSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `/* No styles required */`,
  }),
] as const;
