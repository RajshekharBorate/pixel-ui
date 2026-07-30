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

  if (path === '/charts') {
    return [
      { label: 'Home', link: '/' },
      { label: 'Charts', active: true },
    ];
  }

  const match = path.match(/^\/(components|charts)\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) {
    return [{ label: 'Home', link: '/' }, { label: 'Documentation', active: true }];
  }

  const requestedSection = match[1] ?? 'components';
  const componentId = match[2] ?? '';
  const tabId = (match[3] as DocTabId | undefined) ?? 'overview';
  const component = nav.getComponent(componentId);
  const tabLabel = DOC_TABS.find((tab) => tab.id === tabId)?.label ?? tabId;

  if (!component) {
    const sectionLabel = requestedSection === 'charts' ? 'Charts' : 'Components';
    const sectionLink = requestedSection === 'charts' ? '/charts' : '/components';
    return [
      { label: 'Home', link: '/' },
      { label: sectionLabel, link: sectionLink },
      { label: 'Not found', active: true },
    ];
  }

  const sectionLabel = nav.isChartComponent(component) ? 'Charts' : 'Components';
  const sectionLink = nav.isChartComponent(component) ? '/charts' : '/components';

  return [
    { label: 'Home', link: '/' },
    { label: sectionLabel, link: sectionLink },
    { label: nav.displayTitle(component), link: nav.docPath(component) },
    { label: tabLabel, active: true },
  ];
}
