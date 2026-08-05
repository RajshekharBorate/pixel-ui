import { createDocExample } from '../../shared/example-source.util';
import { BreadcrumbSkeletonExample } from './breadcrumb-skeleton.example';
import { BreadcrumbBasicExample } from './breadcrumb-basic.example';
import { BreadcrumbBadgesExample } from './breadcrumb-badges.example';
import { BreadcrumbDeclarativeExample } from './breadcrumb-declarative.example';
import { BreadcrumbIconsExample } from './breadcrumb-icons.example';
import { BreadcrumbMobileExample } from './breadcrumb-mobile.example';
import { BreadcrumbOverflowExample } from './breadcrumb-overflow.example';
import { BreadcrumbScrollOverflowExample } from './breadcrumb-scroll-overflow.example';
import { BreadcrumbSizesExample } from './breadcrumb-sizes.example';
import { BreadcrumbVariantsExample } from './breadcrumb-variants.example';

const BREADCRUMB_IMPORTS = ['PixelBreadcrumbComponent'] as const;

export const BREADCRUMB_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Data-driven trail',
    category: 'Setup',
    description: 'Pass a typed items array. The last node is the current page with aria-current.',
    component: BreadcrumbBasicExample,
    imports: [...BREADCRUMB_IMPORTS],
    html: `<pixel-breadcrumb [items]="trail" (itemClick)="onClick($event)" />

<!-- trail: PixelBreadcrumbItem[] -->
[
  { label: 'Home', link: '/' },
  { label: 'Products', link: '/products' },
  { label: 'Laptops' },
]`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbBasicExample {
  protected readonly trail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/' },
    { label: 'Products', link: '/products' },
    { label: 'Laptops' },
  ];
}`,
  }),
  createDocExample({
    id: 'icons',
    title: 'Icons & separators',
    category: 'Layout',
    description: 'Per-item icons with chevron_right or custom text separators.',
    component: BreadcrumbIconsExample,
    imports: [...BREADCRUMB_IMPORTS],
    html: `<pixel-breadcrumb [items]="trail" separatorIcon="chevron_right" />
<pixel-breadcrumb [items]="trail" separator="›" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbIconsExample {
  protected readonly trail: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/', icon: 'home' },
    { label: 'Products', link: '/products', icon: 'inventory_2' },
    { label: 'Laptops', icon: 'laptop_mac' },
  ];
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'declarative',
    title: 'Declarative items',
    category: 'Setup',
    description: 'Author the trail in markup with pixel-breadcrumb-item children.',
    component: BreadcrumbDeclarativeExample,
    imports: [...BREADCRUMB_IMPORTS, 'PixelBreadcrumbItemComponent'],
    html: `<pixel-breadcrumb separatorIcon="chevron_right" showHomeIcon>
  <pixel-breadcrumb-item label="Dashboard" link="/" icon="home" />
  <pixel-breadcrumb-item label="Users" link="/users" />
  <pixel-breadcrumb-item label="User details" active />
</pixel-breadcrumb>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PixelBreadcrumbComponent,
  PixelBreadcrumbItemComponent,
} from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbDeclarativeExample {}`,
  }),
  createDocExample({
    id: 'overflow',
    title: 'Overflow dropdown',
    category: 'Behavior',
    description:
      'Long trails collapse middle nodes into an interactive dropdown when maxVisibleItems is exceeded.',
    component: BreadcrumbOverflowExample,
    imports: [...BREADCRUMB_IMPORTS],
    html: `<pixel-breadcrumb
  [items]="deepTrail"
  [maxVisibleItems]="4"
  overflowMode="dropdown"
  separatorIcon="chevron_right"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbOverflowExample {
  protected readonly deepTrail: readonly PixelBreadcrumbItem[] = [ /* 6+ levels */ ];
}`,
  }),
  createDocExample({
    id: 'mobile',
    title: 'Mobile / constrained width',
    category: 'Behavior',
    description:
      'With responsive (default), narrow viewports and tight containers auto-collapse to Home … parent / current and tighten further if labels still overflow.',
    component: BreadcrumbMobileExample,
    imports: [...BREADCRUMB_IMPORTS],
    html: `<div class="phone-frame">
  <pixel-breadcrumb [items]="deepTrail" separatorIcon="chevron_right" />
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbMobileExample {
  protected readonly deepTrail: readonly PixelBreadcrumbItem[] = [ /* deep trail */ ];
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Sizes',
    category: 'Sizes',
    description: 'Four density tiers — xs, sm, md (default), and lg — scale type and spacing.',
    component: BreadcrumbSizesExample,
    imports: [...BREADCRUMB_IMPORTS],
    html: `<pixel-breadcrumb [items]="trail" [size]="'sm'" separatorIcon="chevron_right" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbSize } from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbSizesExample {
  protected readonly sizes: readonly PixelBreadcrumbSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'variants',
    title: 'Visual variants',
    category: 'Variants',
    description: 'variant switches chrome: minimal, soft, solid, filled, or outline.',
    component: BreadcrumbVariantsExample,
    imports: [...BREADCRUMB_IMPORTS],
    html: `<pixel-breadcrumb [items]="trail" variant="soft" separatorIcon="chevron_right" />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbVariant } from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbVariantsExample {
  protected readonly variants: readonly PixelBreadcrumbVariant[] = ['minimal', 'soft', 'solid'];
}`,
    scss: `.stack {
  display: grid;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'badges',
    title: 'Badge counts',
    category: 'Layout',
    description: 'Surface inline counts on any node using the reused pixel-badge.',
    component: BreadcrumbBadgesExample,
    imports: [...BREADCRUMB_IMPORTS],
    html: `<pixel-breadcrumb [items]="trail" separatorIcon="chevron_right" />

<!-- trail item: { label: 'Orders', link: '/orders', badge: 5 } -->`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbBadgesExample {
  protected readonly trail: readonly PixelBreadcrumbItem[] = [
    { label: 'Orders', link: '/orders', badge: 5 },
  ];
}`,
  }),
  createDocExample({
    id: 'scroll-overflow',
    title: 'Scrollable overflow',
    category: 'Behavior',
    description:
      'overflowMode="scroll" keeps the full trail and scrolls horizontally with edge chevrons when constrained.',
    component: BreadcrumbScrollOverflowExample,
    imports: [...BREADCRUMB_IMPORTS],
    html: `<pixel-breadcrumb
  [items]="deepTrail"
  overflowMode="scroll"
  separatorIcon="chevron_right"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbScrollOverflowExample {
  protected readonly deepTrail: readonly PixelBreadcrumbItem[] = [ /* long trail */ ];
}`,
    scss: `.scroll-box {
  max-width: 18rem;
  overflow: hidden;
}`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'Loading',
    description: 'Show breadcrumb pill placeholders while route data or navigation config is being fetched. Item count mirrors the items array length automatically.',
    component: BreadcrumbSkeletonExample,
    imports: ['PixelBreadcrumbComponent'],
    html: `<pixel-breadcrumb [items]="items" separatorIcon="chevron_right" [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelBreadcrumbComponent, type PixelBreadcrumbItem } from 'pixel-ui';

@Component({ /* … */ })
export class BreadcrumbSkeletonExample {
  protected readonly skeleton = signal(true);

  protected readonly items: readonly PixelBreadcrumbItem[] = [
    { label: 'Home', link: '/' },
    { label: 'Components', link: '/components' },
    { label: 'Breadcrumb', active: true },
  ];
}`,
    scss: `/* No styles required */`,
  }),
] as const;
