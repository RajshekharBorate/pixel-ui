import { DocComponentMeta } from '../types';
import { BREADCRUMB_EXAMPLES } from '../../examples/pixel-breadcrumb';

export const BREADCRUMB_META: DocComponentMeta = {
  id: 'pixel-breadcrumb',
  title: 'Breadcrumb',
  selector: 'pixel-breadcrumb',
  category: 'navigation',
  status: 'stable',
  summary:
    'Accessible navigation trail with data-driven, declarative, and router-driven modes plus smart overflow handling.',
  overview: [
    'pixel-breadcrumb renders a semantic nav > ol trail from an items array or projected breadcrumb-item nodes.',
    'Supports icons, badges, custom separators, sizes, variants, and overflow dropdown / ellipsis / scroll.',
    'Responsive mode auto-collapses deep trails on narrow viewports and tightens further when labels overflow the host.',
    'PixelBreadcrumbService auto-generates trails from route data.breadcrumb.',
  ],
  useCases: [
    'Page hierarchy navigation',
    'Deep product catalog trails',
    'Router-synchronized breadcrumbs',
  ],
  themingNotes: [
    'Variants (minimal, soft, solid, filled, outline) map to shared surface tokens.',
    'Separator and link colors inherit from --pixel-sys-outline and --pixel-sys-primary.',
  ],
  accessibilityNotes: [
    'Current page uses aria-current="page".',
    'Overflow dropdown is fully keyboard navigable.',
    'iconOnly mode keeps labels available to screen readers.',
  ],
  imports: ['PixelBreadcrumbComponent', 'PixelBreadcrumbItemComponent'],
  inputs: [
    { name: 'items', type: 'PixelBreadcrumbItem[] | null', defaultValue: 'null', description: 'Data-driven trail.' },
    { name: 'separator', type: 'string', defaultValue: "'/'", description: 'Text separator between nodes.' },
    { name: 'separatorIcon', type: 'string', defaultValue: "''", description: 'Material glyph separator.' },
    { name: 'maxVisibleItems', type: 'number', defaultValue: '0', description: 'Collapse threshold; 0 = off (unless responsive auto-collapse).' },
    { name: 'overflowMode', type: "'dropdown' | 'ellipsis' | 'scroll'", defaultValue: "'dropdown'", description: 'How over-long trails are handled.' },
    { name: 'responsive', type: 'boolean', defaultValue: 'true', description: 'Auto-collapse on narrow viewports / tight containers.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Density scale.' },
    { name: 'variant', type: 'PixelBreadcrumbVariant', defaultValue: "'minimal'", description: 'Visual style preset.' },
    { name: 'routeDriven', type: 'boolean', defaultValue: 'false', description: 'Source trail from PixelBreadcrumbService.' },
  ],
  outputs: [
    { name: 'itemClick', type: 'PixelBreadcrumbClickEvent', description: 'Emits when a node is activated.' },
  ],
  examples: BREADCRUMB_EXAMPLES,
};
