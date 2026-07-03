import { DocComponentMeta } from '../types';
import { DRAWER_EXAMPLES } from '../../examples/pixel-drawer';

export const DRAWER_META: DocComponentMeta = {
  id: 'pixel-drawer',
  title: 'Drawer',
  selector: 'pixel-drawer',
  category: 'layout',
  status: 'stable',
  summary:
    'Accessible slide-in side panel with four positions, size presets, focus trap, and PixelDrawerService.',
  overview: [
    'pixel-drawer two-way binds open and slides in from any viewport edge.',
    'Header and footer slots pin actions around independently scrollable body content.',
    'PixelDrawerService.open() launches imperative drawer flows from menus or table rows.',
  ],
  useCases: [
    'Filter and refinement panels',
    'Create / edit wizards',
    'Notification and activity feeds',
  ],
  themingNotes: [
    'Sizes sm–xl control width for horizontal edges and height for top/bottom.',
    'Scroll-aware dividers appear on header and footer when body overflows.',
  ],
  accessibilityNotes: [
    'Traps focus while open and locks body scroll without layout shift.',
    'Escape and scrim dismiss when dismissable is true.',
    'Set title or ariaLabel for screen reader context.',
  ],
  imports: ['PixelDrawerComponent', 'PixelDrawerService'],
  serviceName: 'PixelDrawerService',
  serviceApi: [
    { name: 'open', signature: '<T, D, R>(component: Type<T>, config?: PixelDrawerConfig<D>) => PixelDrawerRef<R, T>', description: 'Open any component in a drawer shell; inject PixelDrawerRef and PIXEL_DRAWER_DATA in the opened component.' },
    { name: 'closeAll', signature: '() => void', description: 'Close every open drawer.' },
    { name: 'openDrawers', signature: 'readonly PixelDrawerRef[]', description: 'All currently-open drawer refs in open order.' },
  ],
  inputs: [
    { name: 'open', type: 'boolean', defaultValue: 'false', description: 'Open state (two-way bindable).' },
    { name: 'title', type: 'string', defaultValue: "''", description: 'Default header title.' },
    { name: 'position', type: "'start' | 'end' | 'top' | 'bottom'", defaultValue: "'end'", description: 'Edge the panel slides in from.' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", defaultValue: "'md'", description: 'Panel width or height preset.' },
    { name: 'dismissable', type: 'boolean', defaultValue: 'true', description: 'Allow scrim, Escape, and close dismissal.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible label when title is omitted.' },
    { name: 'panelClass', type: 'string', defaultValue: "''", description: 'Extra class on the drawer surface.' },
  ],
  outputs: [
    { name: 'openChange', type: 'boolean', description: 'Emits when open state changes.' },
    { name: 'closed', type: 'void', description: 'Emits when the drawer closes.' },
  ],
  examples: DRAWER_EXAMPLES,
};
