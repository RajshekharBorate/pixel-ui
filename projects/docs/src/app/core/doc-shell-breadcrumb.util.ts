import { DocNavigationService } from './doc-navigation.service';
import { DOC_TABS, DocTabId } from '../registry/types';

export interface DocShellCrumb {
  readonly label: string;
  readonly link?: string;
  readonly active?: boolean;
}

export function buildShellBreadcrumbs(url: string, nav: DocNavigationService): readonly DocShellCrumb[] {
  const path = url.split('?')[0]?.split('#')[0] ?? '/';

  if (path === '/' || path === '') {
    return [{ label: 'Home', active: true }];
  }

  if (path === '/components') {
    return [
      { label: 'Home', link: '/' },
      { label: 'Components', active: true },
    ];
  }

  const match = path.match(/^\/components\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) {
    return [{ label: 'Home', link: '/' }, { label: 'Documentation', active: true }];
  }

  const componentId = match[1] ?? '';
  const tabId = (match[2] as DocTabId | undefined) ?? 'overview';
  const component = nav.getComponent(componentId);
  const tabLabel = DOC_TABS.find((tab) => tab.id === tabId)?.label ?? tabId;

  if (!component) {
    return [
      { label: 'Home', link: '/' },
      { label: 'Components', link: '/components' },
      { label: 'Not found', active: true },
    ];
  }

  return [
    { label: 'Home', link: '/' },
    { label: 'Components', link: '/components' },
    { label: component.title, link: `/components/${component.id}/overview` },
    { label: tabLabel, active: true },
  ];
}
