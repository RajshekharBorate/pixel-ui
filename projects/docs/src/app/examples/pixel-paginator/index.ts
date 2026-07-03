import { createDocExample } from '../../shared/example-source.util';
import { PaginatorBasicExample } from './paginator-basic.example';
import { PaginatorVariantsExample } from './paginator-variants.example';
import { PaginatorSizesExample } from './paginator-sizes.example';
import { PaginatorShapesExample } from './paginator-shapes.example';
import { PaginatorSkeletonExample } from './paginator-skeleton.example';
import { PaginatorStatesExample } from './paginator-states.example';

const PAGINATOR_IMPORTS = ['PixelPaginatorComponent'] as const;

export const PAGINATOR_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic paginator',
    category: 'Setup',
    description: 'Full default variant with page-size selector, range label, page-number buttons, and first/last navigation.',
    component: PaginatorBasicExample,
    imports: [...PAGINATOR_IMPORTS, 'PixelPageEvent'],
    html: `<pixel-paginator
  [length]="total"
  [(pageIndex)]="page"
  [(pageSize)]="size"
  (page)="onPage($event)"
/>`,
    typescript: `protected readonly total = 100;
protected readonly page  = signal(0);
protected readonly size  = signal(10);

protected onPage(event: PixelPageEvent): void {
  console.log('Page event:', event);
}`,
    scss: `/* No styles required */`,
  }),

  createDocExample({
    id: 'variants',
    title: 'Variants',
    category: 'Variants',
    description: 'default = full chrome with page numbers and range label; minimal = same layout without page-number buttons.',
    component: PaginatorVariantsExample,
    imports: [...PAGINATOR_IMPORTS, 'PixelPaginatorVariant'],
    html: `<!-- default -->
<pixel-paginator [length]="200" [pageIndex]="2" variant="default" />



<!-- minimal -->
<pixel-paginator [length]="200" [pageIndex]="2" variant="minimal" />`,
    typescript: `protected readonly variants: readonly PixelPaginatorVariant[] = ['default', 'minimal'];`,
    scss: `.stack { display: flex; flex-direction: column; gap: 1.5rem; }`,
  }),

  createDocExample({
    id: 'sizes',
    title: 'Size variants',
    category: 'Variants',
    description: 'xs, sm, md, and lg scale the page-number button size and label typography.',
    component: PaginatorSizesExample,
    imports: [...PAGINATOR_IMPORTS],
    html: `@for (size of sizes; track size) {
  <pixel-paginator [length]="100" [pageIndex]="1" [size]="size" />
}`,
    typescript: `protected readonly sizes = ['xs', 'sm', 'md', 'lg'] as const;`,
    scss: `.stack { display: flex; flex-direction: column; gap: 1.25rem; }`,
  }),

  createDocExample({
    id: 'states',
    title: 'States',
    category: 'States',
    description: 'Default, disabled, and without first/last buttons.',
    component: PaginatorStatesExample,
    imports: [...PAGINATOR_IMPORTS],
    html: `<pixel-paginator [length]="100" [pageIndex]="1" />
<pixel-paginator [length]="100" [pageIndex]="1" [disabled]="true" />
<pixel-paginator [length]="100" [pageIndex]="1" [showFirstLastButtons]="false" />`,
    typescript: `@Component({ /* … */ }) export class PaginatorStatesExample {}`,
    scss: `.stack { display: flex; flex-direction: column; gap: 1.25rem; }`,
  }),
  createDocExample({
    id: 'shapes',
    title: 'Button shapes',
    category: 'Variants',
    description: 'buttonShape controls the corner radius of both the page-number buttons and the navigation icon buttons — rounded (default), square, or circle.',
    component: PaginatorShapesExample,
    imports: [...PAGINATOR_IMPORTS, 'PixelPaginatorButtonShape'],
    html: `<pixel-paginator [length]="100" [pageIndex]="2" buttonShape="rounded" />
<pixel-paginator [length]="100" [pageIndex]="2" buttonShape="circle" />`,
    typescript: `protected readonly shapes = ['rounded', 'circle'] as const;`,
    scss: `.stack { display: flex; flex-direction: column; gap: 1.5rem; }`,
  }),
  createDocExample({
    id: 'skeleton',
    title: 'Skeleton loading',
    category: 'States',
    description: 'showSkeleton replaces the paginator with a full-width pill placeholder — works across all three variants and all size tiers.',
    component: PaginatorSkeletonExample,
    imports: [...PAGINATOR_IMPORTS],
    html: `<pixel-paginator [length]="100" variant="default" [showSkeleton]="skeleton()" />
<pixel-paginator [length]="100" variant="minimal" [showSkeleton]="skeleton()" />`,
    typescript: `export class PaginatorSkeletonExample {
  protected readonly skeleton = signal(true);
}`,
    scss: `.stack { display: flex; flex-direction: column; gap: 1.25rem; }`,
  }),
] as const;
