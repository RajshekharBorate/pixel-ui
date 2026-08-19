import { DocComponentCategory } from './types';

export const DOC_CATEGORIES: readonly DocComponentCategory[] = [
  {
    id: 'form-controls',
    label: 'Form controls',
    description: 'Buttons, inputs, selects, and other data-entry components.',
  },
  {
    id: 'data-display',
    label: 'Data display',
    description: 'Tables, badges, avatars, chips, and progress indicators.',
  },
  {
    id: 'navigation',
    label: 'Navigation',
    description: 'Tabs, menus, breadcrumbs, and steppers.',
  },
  {
    id: 'layout',
    label: 'Layout',
    description: 'Dividers, accordions, dialogs, and drawers.',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    description: 'Toasts, tooltips, and loading states.',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Complex composed UI (data grid, query builder, tour).',
  },
  {
    id: 'services',
    label: 'Services',
    description:
      'Headless injectables (export, file-transfer, navigate, title) — no pixel-* chrome; see lib/services/.',
  },
  {
    id: 'charts',
    label: 'Charts',
    description: 'ECharts-backed chart families, shell, and sparklines (`pixel-ui/charts`).',
  },
] as const;
