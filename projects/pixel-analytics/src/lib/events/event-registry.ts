import { InjectionToken } from '@angular/core';
import type { PixelAnalyticsEventCategory } from '../core/analytics.types';

export interface PixelAnalyticsPropertyDefinition {
  readonly type: 'string' | 'number' | 'boolean';
  readonly required?: boolean;
  readonly description?: string;
  readonly piiClass?: 'none' | 'low' | 'high';
}

export interface PixelAnalyticsEventDefinition {
  readonly name: string;
  readonly version: string;
  readonly category: PixelAnalyticsEventCategory;
  readonly description: string;
  readonly owner?: string;
  readonly piiClass?: 'none' | 'low' | 'high';
  readonly properties?: Readonly<Record<string, PixelAnalyticsPropertyDefinition>>;
  readonly deprecated?: { readonly replacedBy?: string; readonly sunset?: string };
}

/** MVP standard catalog — seed for app-scoped {@link PixelAnalyticsRegistry}. */
export const PIXEL_ANALYTICS_EVENT_CATALOG: Readonly<
  Record<string, PixelAnalyticsEventDefinition>
> = {
  'navigation.page.view': {
    name: 'navigation.page.view',
    version: '1',
    category: 'navigation',
    description: 'Page or route became active.',
  },
  'navigation.route.change': {
    name: 'navigation.route.change',
    version: '1',
    category: 'navigation',
    description: 'Angular route transition completed.',
  },
  'ui.button.click': {
    name: 'ui.button.click',
    version: '1',
    category: 'interaction',
    description: 'Button activation.',
    properties: {
      action: { type: 'string', description: 'Semantic action id.' },
    },
  },
  'ui.select.open': {
    name: 'ui.select.open',
    version: '1',
    category: 'interaction',
    description: 'Select panel opened.',
  },
  'ui.select.close': {
    name: 'ui.select.close',
    version: '1',
    category: 'interaction',
    description: 'Select panel closed.',
  },
  'ui.select.change': {
    name: 'ui.select.change',
    version: '1',
    category: 'interaction',
    description: 'Select value committed (no option labels/values).',
  },
  'ui.autocomplete.open': {
    name: 'ui.autocomplete.open',
    version: '1',
    category: 'interaction',
    description: 'Autocomplete suggestions panel opened.',
  },
  'ui.autocomplete.close': {
    name: 'ui.autocomplete.close',
    version: '1',
    category: 'interaction',
    description: 'Autocomplete suggestions panel closed.',
  },
  'ui.autocomplete.select': {
    name: 'ui.autocomplete.select',
    version: '1',
    category: 'interaction',
    description: 'Autocomplete suggestion chosen (no option text/value).',
  },
  'ui.autocomplete.clear': {
    name: 'ui.autocomplete.clear',
    version: '1',
    category: 'interaction',
    description: 'Autocomplete value cleared.',
  },
  'ui.checkbox.toggle': {
    name: 'ui.checkbox.toggle',
    version: '1',
    category: 'interaction',
    description: 'Checkbox checked state toggled.',
  },
  'ui.radio.select': {
    name: 'ui.radio.select',
    version: '1',
    category: 'interaction',
    description: 'Radio group selection changed (no option labels).',
  },
  'ui.toggle.change': {
    name: 'ui.toggle.change',
    version: '1',
    category: 'interaction',
    description: 'Toggle switch or segmented control changed.',
  },
  'ui.tabs.change': {
    name: 'ui.tabs.change',
    version: '1',
    category: 'interaction',
    description: 'Active tab changed (index / optional tabId; never label).',
  },
  'ui.menu.open': {
    name: 'ui.menu.open',
    version: '1',
    category: 'interaction',
    description: 'Menu panel opened.',
  },
  'ui.menu.close': {
    name: 'ui.menu.close',
    version: '1',
    category: 'interaction',
    description: 'Menu panel closed.',
    properties: {
      menuId: { type: 'string', description: 'Stable menu id.' },
      reason: {
        type: 'string',
        description: 'Close reason: select, escape, outside, tab, programmatic.',
      },
    },
  },
  'ui.menu.select': {
    name: 'ui.menu.select',
    version: '1',
    category: 'interaction',
    description: 'Menu item activated (action/itemId only; never label).',
    properties: {
      menuId: { type: 'string', description: 'Parent menu id (inherited from pixel-menu).' },
      action: { type: 'string', description: 'Semantic action id.' },
      itemId: { type: 'string', description: 'Stable item id when action is not set.' },
      variant: { type: 'string', description: 'Menu item variant.' },
    },
  },
  'ui.sidenav.open': {
    name: 'ui.sidenav.open',
    version: '1',
    category: 'interaction',
    description: 'Sidenav opened.',
  },
  'ui.sidenav.close': {
    name: 'ui.sidenav.close',
    version: '1',
    category: 'interaction',
    description: 'Sidenav closed.',
  },
  'ui.breadcrumb.navigate': {
    name: 'ui.breadcrumb.navigate',
    version: '1',
    category: 'interaction',
    description: 'Breadcrumb node activated (index / path-only href; never label).',
  },
  'ui.stepper.next': {
    name: 'ui.stepper.next',
    version: '1',
    category: 'interaction',
    description: 'Stepper advanced to the next step.',
  },
  'ui.stepper.back': {
    name: 'ui.stepper.back',
    version: '1',
    category: 'interaction',
    description: 'Stepper moved to the previous step.',
  },
  'ui.stepper.goto': {
    name: 'ui.stepper.goto',
    version: '1',
    category: 'interaction',
    description: 'Stepper jumped to a step index.',
  },
  'ui.paginator.page': {
    name: 'ui.paginator.page',
    version: '1',
    category: 'interaction',
    description: 'Standalone paginator page or page size changed.',
  },
  'ui.accordion.expand': {
    name: 'ui.accordion.expand',
    version: '1',
    category: 'interaction',
    description: 'Expansion panel expanded.',
  },
  'ui.accordion.collapse': {
    name: 'ui.accordion.collapse',
    version: '1',
    category: 'interaction',
    description: 'Expansion panel collapsed.',
  },
  'ui.modal.open': {
    name: 'ui.modal.open',
    version: '1',
    category: 'interaction',
    description: 'Modal or dialog opened.',
  },
  'ui.modal.close': {
    name: 'ui.modal.close',
    version: '1',
    category: 'interaction',
    description: 'Modal or dialog closed.',
    properties: {
      reason: {
        type: 'string',
        description: 'escape | scrim | close | programmatic',
      },
    },
  },
  'ui.drawer.open': {
    name: 'ui.drawer.open',
    version: '1',
    category: 'interaction',
    description: 'Drawer opened.',
  },
  'ui.drawer.close': {
    name: 'ui.drawer.close',
    version: '1',
    category: 'interaction',
    description: 'Drawer closed.',
    properties: {
      reason: {
        type: 'string',
        description: 'escape | scrim | close | programmatic',
      },
    },
  },
  'ui.popover.open': {
    name: 'ui.popover.open',
    version: '1',
    category: 'interaction',
    description: 'Popover opened.',
  },
  'ui.popover.close': {
    name: 'ui.popover.close',
    version: '1',
    category: 'interaction',
    description: 'Popover closed.',
  },
  'ui.toast.show': {
    name: 'ui.toast.show',
    version: '1',
    category: 'interaction',
    description: 'Toast shown (no title/message).',
  },
  'ui.toast.dismiss': {
    name: 'ui.toast.dismiss',
    version: '1',
    category: 'interaction',
    description: 'Toast dismissed.',
    properties: {
      reason: { type: 'string', description: 'timeout | manual | tap | swipe | escape | action | clear' },
    },
  },
  'ui.notification.show': {
    name: 'ui.notification.show',
    version: '1',
    category: 'interaction',
    description: 'Notification published (no title/message).',
  },
  'ui.notification.action': {
    name: 'ui.notification.action',
    version: '1',
    category: 'interaction',
    description: 'Notification action invoked.',
  },
  'ui.notification.dismiss': {
    name: 'ui.notification.dismiss',
    version: '1',
    category: 'interaction',
    description: 'Notification removed or archived.',
  },
  'ui.tour.start': {
    name: 'ui.tour.start',
    version: '1',
    category: 'interaction',
    description: 'Product tour started.',
  },
  'ui.tour.step': {
    name: 'ui.tour.step',
    version: '1',
    category: 'interaction',
    description: 'Tour step became active.',
  },
  'ui.tour.complete': {
    name: 'ui.tour.complete',
    version: '1',
    category: 'interaction',
    description: 'Tour completed.',
  },
  'ui.tour.skip': {
    name: 'ui.tour.skip',
    version: '1',
    category: 'interaction',
    description: 'Tour skipped or aborted.',
  },
  'ui.date.open': {
    name: 'ui.date.open',
    version: '1',
    category: 'interaction',
    description: 'Date/time picker opened.',
  },
  'ui.date.close': {
    name: 'ui.date.close',
    version: '1',
    category: 'interaction',
    description: 'Date/time picker closed.',
  },
  'ui.date.select': {
    name: 'ui.date.select',
    version: '1',
    category: 'interaction',
    description: 'Date/time value committed (hasValue by default; ISO only if analyticsEmitValue).',
  },
  'ui.date.clear': {
    name: 'ui.date.clear',
    version: '1',
    category: 'interaction',
    description: 'Date/time value cleared.',
  },
  'ui.calendar.select': {
    name: 'ui.calendar.select',
    version: '1',
    category: 'interaction',
    description: 'Calendar day selected (hasValue by default).',
  },
  'ui.file.select': {
    name: 'ui.file.select',
    version: '1',
    category: 'interaction',
    description: 'Files accepted by file upload (counts/buckets only; never filenames).',
  },
  'ui.file.remove': {
    name: 'ui.file.remove',
    version: '1',
    category: 'interaction',
    description: 'File removed from upload control.',
  },
  'ui.file.reject': {
    name: 'ui.file.reject',
    version: '1',
    category: 'interaction',
    description: 'Files rejected by validation (counts only).',
  },
  'ui.query.rule_add': {
    name: 'ui.query.rule_add',
    version: '1',
    category: 'interaction',
    description: 'Query builder rule added.',
  },
  'ui.query.group_add': {
    name: 'ui.query.group_add',
    version: '1',
    category: 'interaction',
    description: 'Query builder group added.',
  },
  'ui.query.node_remove': {
    name: 'ui.query.node_remove',
    version: '1',
    category: 'interaction',
    description: 'Query builder rule or group removed.',
  },
  'ui.editor.command': {
    name: 'ui.editor.command',
    version: '1',
    category: 'interaction',
    description: 'Editor toolbar/command invoked (commandId only; never document content).',
  },
  'ui.editor.find_open': {
    name: 'ui.editor.find_open',
    version: '1',
    category: 'interaction',
    description: 'Editor find bar opened.',
  },
  'ui.chart.legend_toggle': {
    name: 'ui.chart.legend_toggle',
    version: '1',
    category: 'interaction',
    description: 'Chart legend series toggled.',
  },
  'ui.chart.point_click': {
    name: 'ui.chart.point_click',
    version: '1',
    category: 'interaction',
    description: 'Chart data point clicked (seriesId/categoryIndex; never labels).',
  },
  'data.table.sort': {
    name: 'data.table.sort',
    version: '1',
    category: 'data',
    description: 'Table column sort changed.',
    properties: {
      gridId: { type: 'string', description: 'Stable grid id.' },
      field: { type: 'string', description: 'Column field key.' },
      direction: { type: 'string', description: 'asc or desc when sorted.' },
      columnCount: { type: 'number', description: 'Active sort column count.' },
      additive: { type: 'boolean', description: 'Whether sort was additive (header path).' },
      source: { type: 'string', description: 'header or column-menu.' },
    },
  },
  'data.table.filter': {
    name: 'data.table.filter',
    version: '1',
    category: 'data',
    description: 'Table filter applied.',
    properties: {
      gridId: { type: 'string', description: 'Stable grid id.' },
      field: { type: 'string', description: 'Column field key (schema id).' },
      operator: { type: 'string', description: 'Filter operator.' },
      filterType: { type: 'string', description: 'select, text, number, date, or boolean.' },
    },
  },
  'data.table.filter.clear': {
    name: 'data.table.filter.clear',
    version: '1',
    category: 'data',
    description: 'Table column filter cleared.',
  },
  'data.table.search': {
    name: 'data.table.search',
    version: '1',
    category: 'data',
    description: 'Quick filter / search changed (no query text).',
  },
  'data.table.page': {
    name: 'data.table.page',
    version: '1',
    category: 'data',
    description: 'Table page or page size changed.',
  },
  'data.export': {
    name: 'data.export',
    version: '1',
    category: 'data',
    description: 'Tabular data exported from a grid or similar surface.',
    properties: {
      gridId: { type: 'string', description: 'Stable grid id.' },
      format: { type: 'string', description: 'csv, json, excel, or clipboard.' },
      scope: { type: 'string', description: 'all, selected, or page.' },
      rowCount: { type: 'number', description: 'Rows exported.' },
      columnCount: { type: 'number', description: 'Exportable visible columns.' },
      hasActiveFilters: { type: 'boolean', description: 'Whether filters/search were active.' },
      source: { type: 'string', description: 'toolbar, api, or row-action.' },
      outcome: { type: 'string', description: 'success, failure, or empty.' },
      partial: { type: 'boolean', description: 'True when fetch returned fewer rows than requested.' },
    },
  },
  'form.submit': {
    name: 'form.submit',
    version: '1',
    category: 'form',
    description: 'Form submitted.',
  },
  'form.validation.error': {
    name: 'form.validation.error',
    version: '1',
    category: 'form',
    description: 'Client-side validation failed.',
  },
  'application.error': {
    name: 'application.error',
    version: '1',
    category: 'application',
    description: 'Unhandled or handled application error.',
  },
  'performance.page.load': {
    name: 'performance.page.load',
    version: '1',
    category: 'performance',
    description: 'Page load timing.',
  },
  'performance.custom': {
    name: 'performance.custom',
    version: '1',
    category: 'performance',
    description: 'Custom performance measurement.',
  },
  'performance.route.transition': {
    name: 'performance.route.transition',
    version: '1',
    category: 'performance',
    description: 'Angular route transition duration.',
  },
  'performance.web_vitals': {
    name: 'performance.web_vitals',
    version: '1',
    category: 'performance',
    description: 'Browser Web Vital sample (LCP / CLS).',
  },
  'api.request': {
    name: 'api.request',
    version: '1',
    category: 'application',
    description: 'HTTP request observed (metadata only).',
  },
  'api.error': {
    name: 'api.error',
    version: '1',
    category: 'application',
    description: 'HTTP request failed.',
  },
  'identity.user.identify': {
    name: 'identity.user.identify',
    version: '1',
    category: 'application',
    description: 'User identified (userId attached; traits sanitized).',
    piiClass: 'low',
  },
  'identity.group.identify': {
    name: 'identity.group.identify',
    version: '1',
    category: 'application',
    description: 'Account / organization group attached for B2B analytics.',
  },
};

/** @deprecated Use {@link PIXEL_ANALYTICS_EVENT_CATALOG}. */
export const PIXEL_ANALYTICS_EVENT_REGISTRY = PIXEL_ANALYTICS_EVENT_CATALOG;

/** App-scoped mutable event registry (provided by `createPixelAnalyticsProviders`). */
export class PixelAnalyticsRegistry {
  private readonly definitions: Record<string, PixelAnalyticsEventDefinition>;

  constructor(
    seed: Readonly<Record<string, PixelAnalyticsEventDefinition>> = PIXEL_ANALYTICS_EVENT_CATALOG,
  ) {
    this.definitions = { ...seed };
  }

  register(definitions: readonly PixelAnalyticsEventDefinition[]): void {
    for (const definition of definitions) {
      this.definitions[definition.name] = definition;
    }
  }

  get(name: string): PixelAnalyticsEventDefinition | undefined {
    return this.definitions[name];
  }

  has(name: string): boolean {
    return name in this.definitions;
  }

  snapshot(): Readonly<Record<string, PixelAnalyticsEventDefinition>> {
    return { ...this.definitions };
  }
}

export const PIXEL_ANALYTICS_REGISTRY = new InjectionToken<PixelAnalyticsRegistry>(
  'PIXEL_ANALYTICS_REGISTRY',
);

/** @deprecated Prefer injecting {@link PIXEL_ANALYTICS_REGISTRY}. Mutates a process fallback. */
const fallbackRegistry = new PixelAnalyticsRegistry();

export function registerPixelAnalyticsEvents(
  definitions: readonly PixelAnalyticsEventDefinition[],
): void {
  fallbackRegistry.register(definitions);
}

export function getPixelAnalyticsEventDefinition(
  name: string,
  registry?: PixelAnalyticsRegistry,
): PixelAnalyticsEventDefinition | undefined {
  return (registry ?? fallbackRegistry).get(name);
}

export function isRegisteredPixelAnalyticsEvent(
  name: string,
  registry?: PixelAnalyticsRegistry,
): boolean {
  return (registry ?? fallbackRegistry).has(name);
}

export function inferPixelAnalyticsCategory(
  name: string,
  registry?: PixelAnalyticsRegistry,
): PixelAnalyticsEventCategory {
  const registered = getPixelAnalyticsEventDefinition(name, registry);
  if (registered) {
    return registered.category;
  }
  const prefix = name.split('.')[0];
  switch (prefix) {
    case 'navigation':
      return 'navigation';
    case 'ui':
      return 'interaction';
    case 'form':
      return 'form';
    case 'data':
      return 'data';
    case 'performance':
      return 'performance';
    case 'api':
    case 'application':
    case 'identity':
      return 'application';
    default:
      return 'custom';
  }
}
