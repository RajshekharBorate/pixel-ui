import { DocComponentMeta } from '../types';
import { TABS_EXAMPLES } from '../../examples/pixel-tabs';

export const TABS_META: DocComponentMeta = {
  id: 'pixel-tabs',
  title: 'Tabs',
  selector: 'pixel-tabs',
  category: 'navigation',
  status: 'stable',
  summary:
    'Accessible tab group with underline and pill appearances, keyboard navigation, badges, closable tabs, and lazy panel rendering.',
  overview: [
    'pixel-tabs coordinates pixel-tab children with animated indicators and full keyboard support.',
    'Supports controlled selectedIndex, addable/closable tabs, and rich label templates via pixelTabLabel.',
    'Pair pixel-tab-nav with pixelTabLink for URL-driven, deep-linkable navigation.',
  ],
  useCases: [
    'In-page section switching without routing',
    'Document-style closable tab strips',
    'Settings and account sub-navigation',
    'Routed tabs with router-outlet integration',
  ],
  themingNotes: [
    'Indicator, label, and badge colors derive from shared --pixel-sys-* tokens.',
    'Tune animation with animationDuration or disable with animated="false".',
  ],
  accessibilityNotes: [
    'Implements tablist / tab / tabpanel roles with roving focus.',
    'Disabled tabs are skipped during keyboard navigation.',
    'Always set ariaLabel on the tab group.',
  ],
  imports: ['PixelTabsComponent', 'PixelTabComponent'],
  inputs: [
    { name: 'appearance', type: "'underline' | 'pill'", defaultValue: "'underline'", description: 'Visual style of the tab header.' },
    { name: 'align', type: "'start' | 'center' | 'end' | 'stretch'", defaultValue: "'start'", description: 'Header alignment.' },
    { name: 'selectedIndex', type: 'number', defaultValue: '0', description: 'Active tab index (two-way bindable).' },
    { name: 'lazy', type: 'boolean', defaultValue: 'false', description: 'Defer panel creation until first activation.' },
    { name: 'addable', type: 'boolean', defaultValue: 'false', description: 'Show a trailing add-tab button.' },
    { name: 'animated', type: 'boolean', defaultValue: 'true', description: 'Animate indicator and content transitions.' },
    { name: 'animationDuration', type: 'number', defaultValue: '250', description: 'Transition duration in milliseconds.' },
    { name: 'ariaLabel', type: 'string', defaultValue: "''", description: 'Accessible label for the tablist.' },
  ],
  outputs: [
    { name: 'selectedIndexChange', type: 'number', description: 'Emits when the active tab changes.' },
    { name: 'tabClose', type: 'number', description: 'Emits the index of a closable tab that was dismissed.' },
    { name: 'tabAdd', type: 'void', description: 'Emits when the add-tab button is activated.' },
  ],
  examples: TABS_EXAMPLES,
};
