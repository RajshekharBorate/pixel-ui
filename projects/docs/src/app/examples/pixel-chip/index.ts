import { createDocExample } from '../../shared/example-source.util';
import { ChipSkeletonExample } from './chip-skeleton.example';
import { ChipBasicExample } from './chip-basic.example';
import { ChipFilterSetExample } from './chip-filter-set.example';
import { ChipInputTagsExample } from './chip-input-tags.example';
import { ChipSemanticColorsExample } from './chip-semantic-colors.example';
import { ChipSizesExample } from './chip-sizes.example';
import { ChipSelectableExample } from './chip-selectable.example';
import { ChipReorderableExample } from './chip-reorderable.example';
import { ChipOverflowCompactExample } from './chip-overflow-compact.example';
import { ChipDisabledReadonlyExample } from './chip-disabled-readonly.example';
import { ChipDraggableExample } from './chip-draggable.example';

export const CHIP_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic chip',
    category: 'Setup',
    description: 'A removable status chip with prefix icon and soft variant.',
    component: ChipBasicExample,
    imports: ['PixelChipComponent'],
    html: `<pixel-chip
  label="Release ready"
  type="status"
  variant="soft"
  semantic="success"
  prefixIcon="verified"
  [removable]="true"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelChipComponent } from 'pixel-ui';

@Component({
  selector: 'docs-chip-basic-example',
  imports: [PixelChipComponent],
  templateUrl: './chip-basic.example.html',
  styleUrl: './chip-basic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipBasicExample {}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'filter-set',
    title: 'Filter chip set',
    category: 'Behavior',
    description: 'Multi-select filter chips with selection change events.',
    component: ChipFilterSetExample,
    imports: ['PixelChipSetComponent'],
    html: `<pixel-chip-set
  [chips]="filters()"
  selectionMode="multiple"
  [multiple]="true"
  (valueChange)="filters.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-filter-set-example',
  imports: [PixelChipSetComponent],
  templateUrl: './chip-filter-set.example.html',
  styleUrl: './chip-filter-set.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipFilterSetExample {
  protected readonly filters = signal<readonly PixelChipItem[]>([
    { label: 'Open', value: 'open', type: 'filter', selected: true, removable: true },
    { label: 'Assigned', value: 'assigned', type: 'filter', selected: true, removable: true },
    { label: 'Blocked', value: 'blocked', type: 'filter', removable: true, semantic: 'warning' },
    { label: 'Escalated', value: 'escalated', type: 'filter', removable: true, semantic: 'error' },
  ]);
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'input-tags',
    title: 'Input chips',
    category: 'Forms',
    description: 'Dynamic tag entry with Enter, comma, and semicolon separators.',
    component: ChipInputTagsExample,
    imports: ['PixelChipSetComponent'],
    html: `<pixel-chip-set
  [chips]="tags()"
  chipInput
  [separatorKeys]="['Enter', ',', ';']"
  [preventDuplicates]="true"
  (valueChange)="tags.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-input-tags-example',
  imports: [PixelChipSetComponent],
  templateUrl: './chip-input-tags.example.html',
  styleUrl: './chip-input-tags.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipInputTagsExample {
  protected readonly tags = signal<readonly PixelChipItem[]>([
    { label: 'Angular', value: 'angular', type: 'input', removable: true },
    { label: 'Signals', value: 'signals', type: 'input', removable: true },
  ]);
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}`,
  }),
  createDocExample({
    id: 'semantic-colors',
    title: 'Semantic colors',
    category: 'Variants',
    description: 'Toast-aligned semantic colors across soft, solid, and outline variants.',
    component: ChipSemanticColorsExample,
    imports: ['PixelChipComponent'],
    html: `@for (item of semantics; track item.semantic) {
  <div class="group">
    <span class="group-label">{{ item.label }}</span>
    <div class="group-row">
      @for (variant of variants; track variant) {
        <pixel-chip
          [label]="item.label + ' · ' + variant"
          [semantic]="item.semantic"
          [variant]="variant"
          type="status"
          [prefixIcon]="item.icon"
        />
      }
    </div>
  </div>
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelChipComponent, type PixelChipSemantic, type PixelChipVariant } from 'pixel-ui';

@Component({
  selector: 'docs-chip-semantic-colors-example',
  imports: [PixelChipComponent],
  templateUrl: './chip-semantic-colors.example.html',
  styleUrl: './chip-semantic-colors.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSemanticColorsExample {
  protected readonly variants: readonly PixelChipVariant[] = ['soft', 'solid', 'outline'];
  protected readonly semantics: readonly { semantic: PixelChipSemantic; label: string; icon: string }[] = [
    { semantic: 'success', label: 'Success', icon: 'check_circle' },
    { semantic: 'error', label: 'Error', icon: 'error' },
    { semantic: 'warning', label: 'Warning', icon: 'warning' },
    { semantic: 'info', label: 'Info', icon: 'info' },
  ];
}`,
    scss: `:host {
  display: grid;
  gap: 1rem;
}

.group-label {
  display: block;
  margin-block-end: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pixel-sys-outline);
}

.group-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}`,
  }),
  createDocExample({
    id: 'sizes',
    title: 'Size scale',
    category: 'Sizes',
    description: 'xs through lg control height, font size, and padding.',
    component: ChipSizesExample,
    imports: ['PixelChipComponent'],
    html: `@for (size of sizes; track size) {
  <pixel-chip [label]="size" [size]="size" type="default" variant="soft" [removable]="true" prefixIcon="label" />
}`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelChipComponent, type PixelChipSize } from 'pixel-ui';

@Component({
  selector: 'docs-chip-sizes-example',
  imports: [PixelChipComponent],
  templateUrl: './chip-sizes.example.html',
  styleUrl: './chip-sizes.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSizesExample {
  protected readonly sizes: readonly PixelChipSize[] = ['xs', 'sm', 'md', 'lg'];
}`,
    scss: `:host {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'selectable',
    title: 'Single selection',
    category: 'Behavior',
    description: 'Selectable chips in a single-selection chip set.',
    component: ChipSelectableExample,
    imports: ['PixelChipSetComponent'],
    html: `<pixel-chip-set
  [chips]="selectable()"
  selectionMode="single"
  [multiple]="false"
  (valueChange)="selectable.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-selectable-example',
  imports: [PixelChipSetComponent],
  templateUrl: './chip-selectable.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipSelectableExample {
  protected readonly selectable = signal<readonly PixelChipItem[]>([
    { label: 'Design', value: 'design', type: 'selectable' },
    { label: 'Engineering', value: 'engineering', type: 'selectable' },
  ]);
}`,
    scss: `:host {
  display: block;
}`,
  }),
  createDocExample({
    id: 'reorderable',
    title: 'Reorderable set',
    category: 'Behavior',
    description: 'Drag chips within a set to change order.',
    component: ChipReorderableExample,
    imports: ['PixelChipSetComponent'],
    html: `<pixel-chip-set
  [chips]="chips()"
  reorderable
  (valueChange)="chips.set($event)"
/>`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-reorderable-example',
  imports: [PixelChipSetComponent],
  templateUrl: './chip-reorderable.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipReorderableExample {
  protected readonly chips = signal<readonly PixelChipItem[]>([
    { label: 'Backlog', value: 'backlog', type: 'choice', removable: true },
    { label: 'Done', value: 'done', type: 'choice', removable: true },
  ]);
}`,
    scss: `:host {
  display: block;
}`,
  }),
  createDocExample({
    id: 'overflow-compact',
    title: 'Overflow & compact',
    category: 'Layout',
    description: 'Collapse excess chips into +N and use compact density.',
    component: ChipOverflowCompactExample,
    imports: ['PixelChipSetComponent'],
    html: `<pixel-chip-set [chips]="overflow()" [maxVisible]="4" [showOverflow]="true" />
<pixel-chip-set [chips]="compact()" compact size="sm" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-overflow-compact-example',
  imports: [PixelChipSetComponent],
  templateUrl: './chip-overflow-compact.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipOverflowCompactExample {
  protected readonly overflow = signal<readonly PixelChipItem[]>([]);
  protected readonly compact = signal<readonly PixelChipItem[]>([]);
}`,
    scss: `:host {
  display: grid;
  gap: 1rem;
}`,
  }),
  createDocExample({
    id: 'disabled-readonly',
    title: 'Disabled & readonly',
    category: 'States',
    description: 'Non-interactive chips suppress remove and selection.',
    component: ChipDisabledReadonlyExample,
    imports: ['PixelChipSetComponent'],
    html: `<pixel-chip-set [chips]="chips()" (valueChange)="chips.set($event)" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-disabled-readonly-example',
  imports: [PixelChipSetComponent],
  templateUrl: './chip-disabled-readonly.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDisabledReadonlyExample {
  protected readonly chips = signal<readonly PixelChipItem[]>([
    { label: 'Disabled', value: 'disabled', type: 'default', disabled: true, removable: true },
    { label: 'Readonly', value: 'readonly', type: 'default', readonly: true, removable: true },
  ]);
}`,
    scss: `:host {
  display: block;
}`,
  }),
  createDocExample({
    id: 'draggable',
    title: 'Draggable chips',
    category: 'Advanced',
    description: 'Drag chips between custom drop zones.',
    component: ChipDraggableExample,
    imports: ['PixelChipComponent'],
    html: `<pixel-chip label="Design spec" value="design-spec" type="input" [draggable]="true" />
<div class="zone" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">Drop here</div>`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelChipComponent } from 'pixel-ui';

@Component({
  selector: 'docs-chip-draggable-example',
  imports: [PixelChipComponent],
  templateUrl: './chip-draggable.example.html',
  styleUrl: './chip-draggable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDraggableExample {
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
  }
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
    description: 'Show pill placeholders while tag lists or filter options are being fetched. The skeleton count mirrors the chips array length automatically.',
    component: ChipSkeletonExample,
    imports: ['PixelChipSetComponent'],
    html: `<pixel-chip-set [chips]="chips" [showSkeleton]="skeleton()" />`,
    typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PixelChipSetComponent, type PixelChipItem } from 'pixel-ui';

@Component({ /* … */ })
export class ChipSkeletonExample {
  protected readonly skeleton = signal(true);

  protected readonly chips: readonly PixelChipItem[] = [
    { label: 'Design' },
    { label: 'Engineering' },
    { label: 'Product' },
    { label: 'Marketing' },
  ];
}`,
    scss: `/* No styles required */`,
  }),
] as const;
