import { DocComponentMeta } from '../types';
import { PAGINATOR_EXAMPLES } from '../../examples/pixel-paginator';

export const PAGINATOR_META: DocComponentMeta = {
  id: 'pixel-paginator',
  title: 'Paginator',
  selector: 'pixel-paginator',
  category: 'navigation',
  status: 'stable',
  summary:
    'Accessible pagination control with three variants — full page numbers, compact text, or minimal icon-only — and an optional page-size selector.',
  overview: [
    'Two variants: default (full chrome with page numbers, range label, "Items per page" label + size selector) and minimal (same layout without the numbered page buttons).',
    'Sliding window algorithm matches Angular Material — shows first, current±N, and last page with ellipsis gaps, keeping the DOM compact for large page counts.',
    'Page-size selector is a pixel-select with an auto-generated list from pageSizeOptions — changes recalculate the page index to keep the current first item visible.',
    'Two-way bindable pageIndex and pageSize; the page output provides the full PixelPageEvent payload for server-side pagination.',
    'First/last page buttons are individually toggleable via showFirstLastButtons.',
  ],
  useCases: [
    'Data tables and list views with server-side pagination',
    'Search result navigation',
    'Multi-step content pagination in dashboards',
    'Compact pagination in cards or side panels',
  ],
  themingNotes: [
    'Active page button color comes from --pixel-paginator-btn-active-bg (defaults to --pixel-sys-primary).',
    'Hover and focus states use --pixel-paginator-btn-hover — a semi-transparent on-surface overlay.',
    'All sizes and spacings are driven by --pixel-paginator-btn-size and --pixel-paginator-font-size tokens.',
  ],
  accessibilityNotes: [
    'Host element uses role="navigation" with aria-label for the nav landmark.',
    'Each page button has aria-label ("Page N") and aria-current="page" on the active page.',
    'Range and page labels use aria-live="polite" + aria-atomic="true" for screen-reader announcements.',
    'First/prev/next/last icon buttons have descriptive ariaLabel props.',
    'Disabled state uses pointer-events:none and opacity — native disabled is NOT set on icon buttons to preserve focus for screen readers.',
  ],
  imports: ['PixelPaginatorComponent'],
  inputs: [
    { name: 'length',              type: 'number',                           defaultValue: '0',         description: 'Total number of items.' },
    { name: 'pageIndex',           type: 'number',                           defaultValue: '0',         description: 'Current zero-based page index. Two-way bindable.' },
    { name: 'pageSize',            type: 'number',                           defaultValue: '10',        description: 'Items per page. Two-way bindable.' },
    { name: 'pageSizeOptions',     type: 'readonly number[]',                defaultValue: '[5,10,25,50]', description: 'Available page-size choices shown in the selector.' },
    { name: 'showFirstLastButtons',type: 'boolean',                          defaultValue: 'true',      description: 'Show first-page and last-page navigation buttons.' },
    { name: 'variant',             type: "'default' | 'minimal'",            defaultValue: "'default'", description: 'default = page numbers + range label + size selector; minimal = same without page-number buttons.' },
    { name: 'size',                type: "'xs' | 'sm' | 'md' | 'lg'",       defaultValue: "'md'",      description: 'Density scale.' },
    { name: 'disabled',            type: 'boolean',                          defaultValue: 'false',     description: 'Disables all interaction.' },
    { name: 'maxPageButtons',      type: 'number',                           defaultValue: '3',         description: 'Total page-number buttons shown including first and last (min 3). e.g. 3 → 1 … [cur] … N; 5 → 1 … prev [cur] next … N.' },
    { name: 'ariaLabel',           type: 'string',                           defaultValue: "''",        description: 'Accessible label for the nav landmark.' },
  ],
  outputs: [
    { name: 'page', type: 'PixelPageEvent', description: 'Emits on every page or page-size change with pageIndex, previousPageIndex, pageSize, and length.' },
  ],
  examples: PAGINATOR_EXAMPLES,
};
