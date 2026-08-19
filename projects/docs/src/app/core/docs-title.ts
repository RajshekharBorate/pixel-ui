import { inject } from '@angular/core';
import { type ResolveFn } from '@angular/router';
import { PIXEL_TITLE_DEFAULT_LABELS } from 'pixel-ui';
import { DocNavigationService } from './doc-navigation.service';
import { DOC_TABS, type DocTabId } from '../registry/types';

/**
 * Route `title` for `/components/:id/:tab` and `/charts/:id/:tab`.
 * Overview omits the tab label; other tabs append ` · API` (etc.). Unknown ids use
 * the title service's not-found copy. PixelTitleStrategy adds the brand suffix.
 */
export const docsComponentTitle: ResolveFn<string> = (route) => {
  const nav = inject(DocNavigationService);
  const componentId = route.paramMap.get('componentId') ?? '';
  const tabId = (route.paramMap.get('tab') as DocTabId | null) ?? 'overview';
  const component = nav.getComponent(componentId);
  if (!component) {
    return PIXEL_TITLE_DEFAULT_LABELS.notFound;
  }

  const page = nav.displayTitle(component);
  if (tabId === 'overview') {
    return page;
  }
  const tabLabel = DOC_TABS.find((tab) => tab.id === tabId)?.label ?? tabId;
  return `${page} · ${tabLabel}`;
};
