import { QUERY_BUILDER_EXAMPLES } from '../../examples/pixel-query-builder';
import { DocComponentMeta } from '../types';

export const QUERY_BUILDER_META: DocComponentMeta = {
  id: 'pixel-query-builder',
  title: 'Query builder',
  selector: 'pixel-query-builder',
  category: 'advanced',
  status: 'stable',
  summary:
    'Enterprise nested visual query builder with AND/OR rulesets, field-aware operators, and reactive-form integration.',
  overview: [
    'Compose filter trees with nested rulesets, field operators, and dynamic value editors.',
    'Default ruleset variant includes toolbar, query preview, drag reorder, and empty-ruleset validation.',
    'Implements ControlValueAccessor and Validator; date fields require nativeDateAdapterProviders().',
  ],
  useCases: [
    'CRM and opportunity filters with nested conditions',
    'E-commerce catalog search with live result lists',
    'Admin dashboards with export/import of filter JSON',
    'Reactive-form filter panels with required validation',
  ],
  themingNotes: [
    'Density scales via size input, mapping to shared form control sizes.',
    'Reuses pixel-select, pixel-input, pixel-datepicker, pixel-button, and pixel-tooltip internally.',
    'Query preview supports basic and advanced summary modes.',
  ],
  accessibilityNotes: [
    'Toolbar actions are keyboard reachable with semantic button labels.',
    'Drag handles expose aria-label and tooltip guidance.',
    'Empty ruleset errors use inline toast alerts with semantic styling.',
    'Form validation integrates with Angular reactive form status.',
  ],
  imports: [
    'PixelQueryBuilderComponent',
    'PixelQueryBuilderConfig',
    'createEmptyQuery',
    'exportQuery',
    'importQuery',
    'nativeDateAdapterProviders',
  ],
  inputs: [
    { name: 'config', type: 'PixelQueryBuilderConfig', description: 'Field definitions, max depth, and defaults.' },
    { name: 'query', type: 'PixelQueryGroup', description: 'Two-way bound query tree state.' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'Density scale.' },
    { name: 'variant', type: "'ruleset' | 'tree' | 'card' | 'compact'", defaultValue: "'ruleset'", description: 'Layout variant.' },
    { name: 'disabled', type: 'boolean', defaultValue: 'false', description: 'Disables all interactions.' },
    { name: 'readOnly', type: 'boolean', defaultValue: 'false', description: 'Read-only presentation.' },
    { name: 'required', type: 'boolean', defaultValue: 'false', description: 'Requires at least one valid rule.' },
    { name: 'showSummary', type: 'boolean', defaultValue: 'true', description: 'Show collapsible query preview.' },
    { name: 'summaryPreview', type: "'basic' | 'advanced'", defaultValue: "'advanced'", description: 'Preview detail level.' },
  ],
  outputs: [
    { name: 'queryUpdated', type: 'PixelQueryGroup', description: 'Emits when the query tree changes.' },
    { name: 'runQuery', type: 'PixelQueryRunEvent', description: 'Emits when the user runs the query.' },
  ],
  examples: QUERY_BUILDER_EXAMPLES,
};
