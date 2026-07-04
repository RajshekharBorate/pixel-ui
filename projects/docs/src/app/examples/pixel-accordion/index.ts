import { createDocExample } from '../../shared/example-source.util';
import { AccordionControlledExample } from './accordion-controlled.example';
import { AccordionSkeletonExample } from './accordion-skeleton.example';
import { AccordionLazyExample } from './accordion-lazy.example';
import { AccordionMultiExample } from './accordion-multi.example';
import { AccordionSingleExample } from './accordion-single.example';
import { AccordionSizesExample } from './accordion-sizes.example';
import { AccordionVariantsExample } from './accordion-variants.example';

const ACCORDION_IMPORTS = ['PixelAccordionComponent', 'PixelExpansionPanelComponent'] as const;

export const ACCORDION_EXAMPLES = [
  createDocExample({
    id: 'single',
    title: 'Single-open accordion',
    category: 'Setup',
    description:
      'Default coordinator: opening one panel collapses the rest. Supports icon, description, and badge.',
    component: AccordionSingleExample,
    imports: [...ACCORDION_IMPORTS],
    html: `<pixel-accordion>
  <pixel-expansion-panel title="Billing" icon="receipt_long" [badge]="2">
    <p>…</p>
  </pixel-expansion-panel>
  <pixel-expansion-panel title="Security" icon="security">…</pixel-expansion-panel>
</pixel-accordion>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAccordionComponent, PixelExpansionPanelComponent } from 'pixel-ui';

@Component({ /* … */ })
export class AccordionSingleExample {
  protected readonly faqs = [ /* title, icon, badge, body */ ];
}`,
  }),
  createDocExample({
    id: 'multi',
    title: 'Multi-open',
    category: 'Behavior',
    description:
      'Set multi="true" and call expandAll() / collapseAll() on a template reference.',
    component: AccordionMultiExample,
    imports: [...ACCORDION_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-button (click)="accordion.expandAll()">Expand all</pixel-button>
<pixel-accordion #accordion [multi]="true">
  <pixel-expansion-panel title="Profile" icon="person">…</pixel-expansion-panel>
</pixel-accordion>`,
    typescript: `import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { PixelAccordionComponent, PixelExpansionPanelComponent } from 'pixel-ui';

@Component({ /* … */ })
export class AccordionMultiExample {
  private readonly accordionRef = viewChild<PixelAccordionComponent>('accordion');
  protected expandAll(): void { this.accordionRef()?.expandAll(); }
}`,
    scss: `.controls {
  display: flex;
  gap: 0.5rem;
  margin-block-end: 1rem;
}`,
  }),
  createDocExample({
    id: 'variants',
    title: 'Variants',
    category: 'Variants',
    description: 'variant="default" | "flush" | "elevated" changes panel chrome and spacing.',
    component: AccordionVariantsExample,
    imports: [...ACCORDION_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-accordion variant="elevated" [multi]="true">
  <pixel-expansion-panel title="Billing" icon="receipt_long">…</pixel-expansion-panel>
</pixel-accordion>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAccordionComponent, PixelExpansionPanelComponent } from 'pixel-ui';

@Component({ /* … */ })
export class AccordionVariantsExample {}`,
  }),
  createDocExample({
    id: 'controlled',
    title: 'Controlled panel',
    category: 'Behavior',
    description: 'A standalone pixel-expansion-panel with two-way expanded binding.',
    component: AccordionControlledExample,
    imports: ['PixelExpansionPanelComponent', 'PixelButtonComponent'],
    html: `<pixel-expansion-panel
  title="Advanced configuration"
  icon="tune"
  [(expanded)]="open"
>
  …
</pixel-expansion-panel>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelExpansionPanelComponent } from 'pixel-ui';

@Component({ /* … */ })
export class AccordionControlledExample {
  protected readonly open = signal(true);
}`,
    scss: `.controls {
  display: flex;
  gap: 0.5rem;
  margin-block-end: 1rem;
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'Size presets sm, md (default), and lg control trigger padding and type scale.',
    component: AccordionSizesExample,
    imports: [...ACCORDION_IMPORTS, 'PixelButtonComponent'],
    html: `<pixel-accordion [size]="'lg'">
  <pixel-expansion-panel title="Profile settings" icon="person">…</pixel-expansion-panel>
</pixel-accordion>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelAccordionComponent, type PixelAccordionSize } from 'pixel-ui';

@Component({ /* … */ })
export class AccordionSizesExample {
  protected readonly activeSize = signal<PixelAccordionSize>('md');
}`,
    scss: `.controls {
  display: flex;
  gap: 0.5rem;
  margin-block-end: 1rem;
}`,
  }),
  createDocExample({
    id: 'lazy',
    title: 'Lazy content rendering',
    category: 'Advanced',
    description:
      'With [lazy]="true" projected content is not created until the panel is first opened — ideal for heavy charts or grids.',
    component: AccordionLazyExample,
    imports: ['PixelExpansionPanelComponent'],
    html: `<pixel-expansion-panel
  title="Heavy chart panel"
  icon="area_chart"
  [lazy]="true"
  [(expanded)]="open"
>
  …expensive content…
</pixel-expansion-panel>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelExpansionPanelComponent } from 'pixel-ui';

@Component({ /* … */ })
export class AccordionLazyExample {
  protected readonly open = signal(false);
}`,
    scss: `.lazy-body {
  display: flex;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'States',
    description: 'showSkeleton replaces the panel header with a placeholder that matches the trigger height, padding, and icon layout for each size.',
    component: AccordionSkeletonExample,
    imports: [...ACCORDION_IMPORTS],
    html: `<pixel-expansion-panel
  title="Account settings"
  [showSkeleton]="skeleton()"
>…</pixel-expansion-panel>

<pixel-expansion-panel
  title="Notifications"
  description="Email and push preferences"
  [showSkeleton]="skeleton()"
>…</pixel-expansion-panel>

<pixel-expansion-panel
  title="Security"
  icon="lock"
  [showSkeleton]="skeleton()"
>…</pixel-expansion-panel>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelExpansionPanelComponent } from 'pixel-ui';

@Component({
  selector: 'docs-accordion-skeleton-example',
  imports: [PixelExpansionPanelComponent],
  templateUrl: './accordion-skeleton.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `.stack { display: flex; flex-direction: column; }`,
  }),
] as const;
