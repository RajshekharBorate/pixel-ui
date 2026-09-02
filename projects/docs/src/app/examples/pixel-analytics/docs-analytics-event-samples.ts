/**
 * Canonical `PixelAnalyticsEvent` envelope samples for docs analytics examples.
 * Dynamic fields use placeholders; live capture normalizes to the same placeholders.
 */

export type DocsAnalyticsExampleId =
  | 'analytics-basic'
  | 'analytics-consent'
  | 'analytics-privacy'
  | 'analytics-page'
  | 'analytics-http'
  | 'analytics-error'
  | 'analytics-performance'
  | 'analytics-directive'
  | 'analytics-form-controls'
  | 'analytics-nav'
  | 'analytics-overlays'
  | 'analytics-data'
  | 'analytics-button-bridge'
  | 'analytics-dialog'
  | 'analytics-data-grid';

const SDK = { name: 'pixel-analytics', version: '0.0.1' } as const;

const DYNAMIC = {
  id: '<uuid>',
  timestamp: '<iso8601>',
  anonymousId: '<uuid>',
  sessionId: '<uuid>',
  traceId: '<32-char-hex>',
  spanId: '<16-char-hex>',
} as const;

const DOCS_CLAIM_ENTITY = { type: 'claim', id: 'CLM-42' } as const;

const EXPORT_MENU_TRACE = '<export-menu-trace-32-chars-placeholder>';
const EXPORT_MENU_OPEN_SPAN = '<menu-open-span>';
const EXPORT_MENU_SELECT_SPAN = '<menu-select-span>';
const EXPORT_DATA_EXPORT_SPAN = '<export-span>';
const EXPORT_MENU_CLOSE_SPAN = '<menu-close-span>';

function correlation(): Record<string, unknown> {
  return { traceId: DYNAMIC.traceId, spanId: DYNAMIC.spanId };
}

function exportMenuCorrelation(
  spanId: string,
  parentSpanId?: string,
): Record<string, unknown> {
  return {
    traceId: EXPORT_MENU_TRACE,
    spanId,
    ...(parentSpanId ? { parentSpanId } : {}),
    interactionId: 'menu:docs-claims-grid-export',
  };
}

function docsMeta(consent: 'granted' | 'unknown' | 'denied' = 'granted'): Record<string, unknown> {
  return { consent, sampled: true, sdk: SDK };
}

function docsEnvelope(input: {
  name: string;
  category: string;
  properties?: Record<string, unknown>;
  application?: Record<string, unknown>;
  identity?: Record<string, unknown>;
  context?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  eventVersion?: string;
}): Record<string, unknown> {
  const envelope: Record<string, unknown> = {
    id: DYNAMIC.id,
    name: input.name,
    category: input.category,
    timestamp: DYNAMIC.timestamp,
    schemaVersion: '1',
    application: { id: 'docs-demo', environment: 'docs', ...input.application },
    identity: {
      anonymousId: DYNAMIC.anonymousId,
      sessionId: DYNAMIC.sessionId,
      ...input.identity,
    },
    context: {
      correlation: correlation(),
      ...input.context,
    },
    meta: { ...docsMeta(), ...input.meta },
  };
  if (input.eventVersion) {
    envelope['eventVersion'] = input.eventVersion;
  }
  if (input.properties !== undefined) {
    envelope['properties'] = input.properties;
  }
  return envelope;
}

function uiComponent(name: string): Record<string, unknown> {
  return { component: { name } };
}

export const DOCS_ANALYTICS_EVENT_SAMPLES: Record<
  DocsAnalyticsExampleId,
  readonly Record<string, unknown>[]
> = {
  'analytics-basic': [
    docsEnvelope({
      name: 'ui.button.click',
      category: 'interaction',
      properties: { action: 'demo', feature: 'analytics-basic' },
    }),
    docsEnvelope({
      name: 'navigation.page.view',
      category: 'navigation',
      application: { id: 'docs-demo', name: 'Pixel Docs', version: '0.0.0', environment: 'docs' },
      context: {
        page: { path: '<docs-path>', url: '<docs-path>' },
      },
      properties: { demo: true },
      meta: docsMeta('granted'),
    }),
    docsEnvelope({
      name: 'identity.user.identify',
      category: 'application',
      application: { id: 'docs-demo', name: 'Pixel Docs', version: '0.0.0', environment: 'docs' },
      identity: { anonymousId: DYNAMIC.anonymousId, sessionId: DYNAMIC.sessionId, userId: 'docs-user-42' },
      properties: { userId: 'docs-user-42' },
      meta: docsMeta('granted'),
    }),
    docsEnvelope({
      name: 'custom.identity.linked',
      category: 'custom',
      application: { id: 'docs-demo', name: 'Pixel Docs', version: '0.0.0', environment: 'docs' },
      identity: { anonymousId: DYNAMIC.anonymousId, sessionId: DYNAMIC.sessionId, userId: 'docs-user-42' },
      properties: { userId: 'docs-user-42' },
      meta: docsMeta('granted'),
    }),
  ],
  'analytics-consent': [
    docsEnvelope({
      name: 'ui.button.click',
      category: 'interaction',
      properties: { action: 'consent-demo' },
      meta: docsMeta('granted'),
    }),
  ],
  'analytics-privacy': [
    docsEnvelope({
      name: 'form.submit',
      category: 'form',
      properties: {
        formId: 'profile',
        email: 'ad***om',
        phone: '55***00',
        action: 'save',
      },
      meta: docsMeta('granted'),
    }),
  ],
  'analytics-page': [
    docsEnvelope({
      name: 'navigation.page.view',
      category: 'navigation',
      context: { page: { path: '<docs-path>', url: '<docs-path>' } },
      properties: { demo: 'manual-page' },
    }),
    docsEnvelope({
      name: 'navigation.route.change',
      category: 'navigation',
      properties: { path: '/docs/pixel-analytics', durationMs: 42 },
    }),
    docsEnvelope({
      name: 'performance.route.transition',
      category: 'performance',
      properties: { path: '/docs/pixel-analytics', durationMs: 42 },
    }),
  ],
  'analytics-http': [
    docsEnvelope({
      name: 'api.request',
      category: 'application',
      properties: {
        method: 'GET',
        path: '/api/claims',
        durationMs: 118,
        status: 200,
        ok: true,
      },
    }),
    docsEnvelope({
      name: 'api.error',
      category: 'application',
      properties: {
        method: 'GET',
        path: '/api/docs-analytics-missing-endpoint',
        durationMs: 42,
        status: 404,
        statusText: 'Not Found',
      },
    }),
  ],
  'analytics-error': [
    docsEnvelope({
      name: 'application.error',
      category: 'application',
      properties: {
        message: 'Validation failed',
        name: 'Error',
        handled: true,
        component: 'docs-analytics-error',
        code: 'VALIDATION',
      },
    }),
    docsEnvelope({
      name: 'application.error',
      category: 'application',
      properties: {
        message: 'Unexpected boom',
        name: 'Error',
        handled: false,
      },
    }),
  ],
  'analytics-performance': [
    docsEnvelope({
      name: 'performance.custom',
      category: 'performance',
      properties: {
        measurement: 'dashboard-load',
        durationMs: '<ms>',
        route: '/docs/analytics',
      },
    }),
  ],
  'analytics-directive': [
    docsEnvelope({
      name: 'ui.button.click',
      category: 'interaction',
      context: { ...uiComponent('docs-native-button') },
      properties: { action: 'native-save', surface: 'directive' },
    }),
  ],
  'analytics-form-controls': [
    docsEnvelope({
      name: 'ui.select.open',
      category: 'interaction',
      context: uiComponent('pixel-select'),
      properties: { selectId: 'status', multiple: false },
    }),
    docsEnvelope({
      name: 'ui.select.change',
      category: 'interaction',
      context: uiComponent('pixel-select'),
      properties: {
        selectId: 'status',
        multiple: false,
        hasValue: true,
        selectedCount: 1,
        source: 'mouse',
      },
    }),
    docsEnvelope({
      name: 'ui.checkbox.toggle',
      category: 'interaction',
      context: uiComponent('pixel-checkbox'),
      properties: { checkboxId: 'terms', checked: true, source: 'mouse' },
    }),
    docsEnvelope({
      name: 'ui.radio.select',
      category: 'interaction',
      context: uiComponent('pixel-radio'),
      properties: { groupId: 'priority', hasValue: true, source: 'mouse' },
    }),
    docsEnvelope({
      name: 'ui.toggle.change',
      category: 'interaction',
      context: uiComponent('pixel-toggle'),
      properties: { toggleId: 'alerts', mode: 'boolean', checked: true, source: 'mouse' },
    }),
  ],
  'analytics-nav': [
    docsEnvelope({
      name: 'ui.tabs.change',
      category: 'interaction',
      context: uiComponent('pixel-tabs'),
      properties: { tabsId: 'detail', tabId: 'history', index: 1 },
    }),
    docsEnvelope({
      name: 'ui.menu.open',
      category: 'interaction',
      context: uiComponent('pixel-menu'),
      properties: { menuId: 'row-actions' },
    }),
    docsEnvelope({
      name: 'ui.menu.select',
      category: 'interaction',
      context: uiComponent('pixel-menu-item'),
      properties: { action: 'export', variant: 'default' },
    }),
    docsEnvelope({
      name: 'ui.paginator.page',
      category: 'interaction',
      context: uiComponent('pixel-paginator'),
      properties: {
        paginatorId: 'list',
        pageIndex: 1,
        previousPageIndex: 0,
        pageSize: 10,
        length: 80,
        reason: 'navigate',
      },
    }),
  ],
  'analytics-overlays': [
    docsEnvelope({
      name: 'ui.drawer.open',
      category: 'interaction',
      context: uiComponent('pixel-drawer'),
      properties: { drawerId: 'filters', position: 'end', size: 'md' },
    }),
    docsEnvelope({
      name: 'ui.popover.open',
      category: 'interaction',
      context: uiComponent('pixel-popover'),
      properties: { popoverId: 'help-tip', position: 'bottom', align: 'center' },
    }),
    docsEnvelope({
      name: 'ui.toast.show',
      category: 'interaction',
      context: uiComponent('pixel-toast'),
      properties: {
        toastId: '<uuid>',
        type: 'info',
        size: 'md',
        variant: 'solid',
        placement: 'top-end',
        position: 'overlay',
        role: 'status',
      },
    }),
  ],
  'analytics-data': [
    docsEnvelope({
      name: 'ui.date.open',
      category: 'interaction',
      context: uiComponent('pixel-datepicker'),
      properties: { pickerId: 'due-date', hasValue: false },
    }),
    docsEnvelope({
      name: 'ui.date.select',
      category: 'interaction',
      context: uiComponent('pixel-datepicker'),
      properties: { pickerId: 'due-date', hasValue: true },
    }),
    docsEnvelope({
      name: 'ui.file.select',
      category: 'interaction',
      context: uiComponent('pixel-file-upload'),
      properties: {
        uploadId: 'claim-docs',
        fileCount: 1,
        mimeCategories: { pdf: 1 },
        sizeBuckets: { lt_100kb: 1 },
      },
    }),
  ],
  'analytics-button-bridge': [
    docsEnvelope({
      name: 'ui.button.click',
      category: 'interaction',
      context: uiComponent('pixel-button'),
      properties: {
        feature: 'claims',
        appearance: 'solid',
        size: 'md',
        source: 'mouse',
        action: 'save',
      },
    }),
    docsEnvelope({
      name: 'ui.button.click',
      category: 'interaction',
      context: uiComponent('pixel-button'),
      properties: {
        appearance: 'outline',
        size: 'md',
        source: 'mouse',
        action: 'cancel',
      },
    }),
  ],
  'analytics-dialog': [
    docsEnvelope({
      name: 'ui.modal.open',
      category: 'interaction',
      context: uiComponent('pixel-dialog'),
      properties: { dialogId: 'docs-analytics-dialog', size: 'sm', position: 'center' },
    }),
    docsEnvelope({
      name: 'ui.modal.close',
      category: 'interaction',
      context: uiComponent('pixel-dialog'),
      properties: {
        dialogId: 'docs-analytics-dialog',
        size: 'sm',
        position: 'center',
        reason: 'escape',
      },
    }),
  ],
  'analytics-data-grid': [
    docsEnvelope({
      name: 'ui.menu.open',
      category: 'interaction',
      context: {
        ...uiComponent('pixel-menu'),
        correlation: exportMenuCorrelation(EXPORT_MENU_OPEN_SPAN),
        entity: DOCS_CLAIM_ENTITY,
      },
      properties: { menuId: 'docs-claims-grid-export' },
    }),
    docsEnvelope({
      name: 'ui.menu.select',
      category: 'interaction',
      context: {
        ...uiComponent('pixel-menu-item'),
        correlation: exportMenuCorrelation(EXPORT_MENU_SELECT_SPAN, EXPORT_MENU_OPEN_SPAN),
        entity: DOCS_CLAIM_ENTITY,
      },
      properties: {
        menuId: 'docs-claims-grid-export',
        action: 'export-clipboard',
        variant: 'default',
      },
    }),
    docsEnvelope({
      name: 'data.export',
      category: 'data',
      context: {
        ...uiComponent('pixel-data-grid'),
        correlation: exportMenuCorrelation(EXPORT_DATA_EXPORT_SPAN, EXPORT_MENU_SELECT_SPAN),
        entity: DOCS_CLAIM_ENTITY,
      },
      properties: {
        gridId: 'docs-claims-grid',
        format: 'clipboard',
        scope: 'all',
        rowCount: 3,
        columnCount: 3,
        hasActiveFilters: false,
        source: 'toolbar',
        outcome: 'success',
      },
    }),
    docsEnvelope({
      name: 'ui.menu.close',
      category: 'interaction',
      context: {
        ...uiComponent('pixel-menu'),
        correlation: exportMenuCorrelation(EXPORT_MENU_CLOSE_SPAN, EXPORT_DATA_EXPORT_SPAN),
        entity: DOCS_CLAIM_ENTITY,
      },
      properties: { menuId: 'docs-claims-grid-export', reason: 'select' },
    }),
    docsEnvelope({
      name: 'ui.select.open',
      category: 'interaction',
      context: uiComponent('pixel-select'),
      properties: { selectId: 'docs-claims-grid-filter-status-operator', multiple: false },
    }),
    docsEnvelope({
      name: 'ui.select.change',
      category: 'interaction',
      context: uiComponent('pixel-select'),
      properties: {
        selectId: 'docs-claims-grid-filter-status-value',
        multiple: false,
        hasValue: true,
        selectedCount: 1,
        source: 'mouse',
      },
    }),
    docsEnvelope({
      name: 'data.table.filter',
      category: 'data',
      context: uiComponent('pixel-data-grid'),
      properties: {
        gridId: 'docs-claims-grid',
        field: 'status',
        operator: 'equals',
        filterType: 'select',
      },
    }),
    docsEnvelope({
      name: 'data.table.sort',
      category: 'data',
      context: uiComponent('pixel-data-grid'),
      properties: {
        gridId: 'docs-claims-grid',
        field: 'amount',
        direction: 'desc',
        columnCount: 1,
        additive: false,
        source: 'header',
      },
    }),
    docsEnvelope({
      name: 'data.table.page',
      category: 'data',
      context: uiComponent('pixel-data-grid'),
      properties: {
        gridId: 'docs-claims-grid',
        pageIndex: 1,
        pageSize: 10,
      },
    }),
  ],
};
