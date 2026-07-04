import { createDocExample } from '../../shared/example-source.util';
import { EmptyStateSizesExample } from './empty-state-sizes.example';
import { EmptyStateActionsExample } from './empty-state-actions.example';

export const EMPTY_STATE_EXAMPLES = [
  createDocExample({
    id: 'sizes',
    title: 'Sizes & alignment',
    category: 'Basics',
    description: 'sm/md/lg density presets; start alignment for dense list and table bodies.',
    component: EmptyStateSizesExample,
    imports: ['PixelEmptyStateComponent'],
    html: `<pixel-empty-state size="sm" align="start" icon="inbox"
  heading="Nothing here yet" description="Small, start-aligned — fits table and list bodies." />
<pixel-empty-state icon="cloud_off"
  heading="No connected sources" description="Default size for panel and card bodies." />
<pixel-empty-state size="lg" icon="folder_open"
  heading="Your workspace is empty" description="Large size for full-page first-use states." />`,
    typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelEmptyStateComponent } from 'pixel-ui';

@Component({ /* … */ })
export class EmptyStateSizesExample {}`,
  }),
  createDocExample({
    id: 'filter-no-results',
    title: 'No results after filtering (announced)',
    category: 'Patterns',
    description:
      'The announce input adds role="status" + aria-live="polite" so screen readers hear the ' +
      'empty outcome when filtering wipes a list; the action resets the filter.',
    component: EmptyStateActionsExample,
    imports: ['PixelEmptyStateComponent'],
    html: `@if (filtered().length > 0) {
  <ul>…</ul>
} @else {
  <pixel-empty-state
    announce
    icon="search_off"
    heading="No members match"
    [description]="'Nothing matches “' + query() + '”.'"
  >
    <pixel-button pixelEmptyStateActions appearance="tonal" (click)="query.set('')">
      Clear filter
    </pixel-button>
  </pixel-empty-state>
}`,
    typescript: `import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PixelButtonComponent, PixelEmptyStateComponent } from 'pixel-ui';

@Component({ /* … */ })
export class EmptyStateActionsExample {
  readonly query = signal('');
  readonly filtered = computed(() => /* filter by query() */ []);
}`,
  }),
] as const;
