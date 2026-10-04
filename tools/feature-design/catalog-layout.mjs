import { feature, n, st } from './helpers.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const layoutFeatures = [
  feature({
    dir: `${lib}/pixel-app-shell`,
    title: 'pixel-app-shell',
    summary: 'The page frame. It has no inputs. It places a header, a sidenav, and a footer by their tags, and puts everything else in main. It draws one shared toolbar line and asks the header and sidenav not to draw a second border.',
    does: [
      ['Composes header, sidenav, footer, and main', 'Take configuration inputs of its own'],
      ['Keeps a short page stuck to the footer and a long page scrolling', 'Fix the shell to the viewport height'],
    ],
    nodes: [
      n('page', 'Your page', 'Projects the regions', null, 0, 0),
      n('shell', 'App shell', 'The frame', 'pixel-app-shell', 1, 0),
      n('header', 'Header', 'By tag', 'pixel-header', 2, 0),
      n('nav', 'Sidenav', 'By tag', 'pixel-sidenav', 0, 1),
      n('main', 'Main', 'The rest', null, 1, 1),
      n('footer', 'Footer', 'By tag', 'pixel-footer', 2, 1),
    ],
    stories: {
      compose: {
        label: 'Compose the frame',
        steps: [
          st(['page', 'shell', 'header', 'nav', 'main', 'footer'], ['page>shell', 'shell>header', 'shell>nav', 'shell>main', 'shell>footer'], 'The page projects the four regions. The sidenav spans the shell height. Header and footer sit in the other column.'),
          st(['shell', 'header', 'nav'], ['shell>header', 'shell>nav'], 'One toolbar divider is drawn. The header drops its own sticky border. The sidenav drops its brand border.'),
        ],
      },
      scroll: {
        label: 'Short and long pages',
        steps: [
          st(['shell', 'main', 'footer'], ['shell>main', 'shell>footer'], 'Use a minimum height, not a fixed height. A short page keeps the footer at the bottom.'),
          st(['main'], [], 'A long page scrolls the document. The shell does not trap that scroll.', ['nav']),
        ],
      },
    },
    states: [
      'With or without each region. Missing tags simply leave a gap in that slot.',
      'Toolbar divider measured from the real header height, including a wrapped mobile header.',
    ],
    mistakes: [
      'Do not set a fixed height on the shell. Use the minimum height so short and long pages both work.',
      'Do not turn header sticky or sidenav brand border back on inside the shell. The shell already draws that line.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-header`,
    title: 'pixel-header',
    summary: 'The top landmark. It is a real header element. Sticky and a bottom border apply when the header is used on its own. Inside the app shell those are suppressed so the shell can draw one line.',
    does: [
      ['Renders the top bar as a header landmark', 'Replace the app shell'],
      ['Can stick and show a border when standalone', 'Draw that border again inside the shell'],
    ],
    nodes: [
      n('page', 'Your page', 'Fills the bar', null, 0, 0),
      n('header', 'Header', 'The landmark', 'pixel-header', 1, 0),
      n('shell', 'App shell', 'May contain it', 'pixel-app-shell', 2, 0),
      n('bar', 'Toolbar', 'Title and actions', null, 1, 1),
    ],
    stories: {
      alone: {
        label: 'On its own',
        steps: [
          st(['page', 'header', 'bar'], ['page>header', 'header>bar'], 'The page uses the header without a shell. Sticky and the border follow the page settings.'),
          st(['header'], [], 'It is a header landmark. Do not add a second banner role.', ['shell']),
        ],
      },
      inside: {
        label: 'Inside the shell',
        steps: [
          st(['shell', 'header'], ['shell>header'], 'The shell measures the header and draws the shared divider.'),
          st(['header', 'bar'], ['header>bar'], 'Sticky and the extra border stay off so the line is not doubled.'),
        ],
      },
    },
    states: [
      'Standalone: sticky and border as set.',
      'Inside the shell: those chrome flags forced off.',
    ],
    mistakes: [
      'Do not wrap it in another header. It is already the landmark.',
      'Inside the shell, do not fight the shared divider.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-footer`,
    title: 'pixel-footer',
    summary: 'The bottom landmark. It is a real footer element. Inside the app shell it sits at the end of the column beside the sidenav.',
    does: [
      ['Renders the bottom bar as a footer landmark', 'Replace the app shell'],
      ['Holds links and status for the page', 'Become a sticky toolbar by itself'],
    ],
    nodes: [
      n('page', 'Your page', 'Fills the bar', null, 0, 0),
      n('footer', 'Footer', 'The landmark', 'pixel-footer', 1, 0),
      n('shell', 'App shell', 'May contain it', 'pixel-app-shell', 2, 0),
    ],
    stories: {
      alone: {
        label: 'On its own',
        steps: [
          st(['page', 'footer'], ['page>footer'], 'The page uses the footer as the bottom landmark.'),
          st(['footer'], [], 'It is a footer element. Do not add another contentinfo role.', ['shell']),
        ],
      },
      inside: {
        label: 'Inside the shell',
        steps: [
          st(['shell', 'footer'], ['shell>footer'], 'The shell places the footer under main, beside the sidenav.'),
          st(['page', 'footer'], ['page>footer'], 'A short page keeps it at the bottom because the shell uses a minimum height, not a fixed height.'),
        ],
      },
    },
    states: [
      'Present with projected links or status.',
      'Inside the shell, at the end of the content column.',
    ],
    mistakes: [
      'Do not nest another footer inside it.',
      'Do not give the shell a fixed height or the footer will cover long pages.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-container`,
    title: 'pixel-container',
    summary: 'A width constraint for page content. It is not a landmark. Max width steps from small to full, plus a fluid option. Padding gutters are optional.',
    does: [
      ['Caps the content width and can add gutters', 'Create a header, nav, or main landmark'],
      ['Centers a column in the page', 'Replace the app shell'],
    ],
    nodes: [
      n('page', 'Your page', 'Chooses the width', null, 0, 0),
      n('box', 'Container', 'The column', 'pixel-container', 1, 0),
      n('content', 'Content', 'Whatever you project', null, 2, 0),
    ],
    stories: {
      width: {
        label: 'Cap the width',
        steps: [
          st(['page', 'box', 'content'], ['page>box', 'box>content'], 'The page picks a max width. The content stays in that column on a wide screen.'),
          st(['box'], [], 'Full and fluid are the wide options. Padding adds the gutter. The container has no landmark role.', ['content']),
        ],
      },
    },
    states: [
      'Max width from small through extra-large, full, or fluid.',
      'Padded or edge to edge.',
    ],
    mistakes: [
      'Do not use this as main or nav. Put landmarks in the shell, header, sidenav, and footer.',
      'Do not invent a custom width. Use the documented steps.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-sidenav`,
    title: 'pixel-sidenav',
    summary: 'The side navigation. It can sit beside the page or cover it. Below the breakpoint it is forced to cover. It can collapse to a rail or hide. Cover mode has a scrim, a focus trap, and Escape.',
    does: [
      ['Shows navigation beside the page or over it', 'Replace the router'],
      ['Collapses to a rail or hides', 'Keep side-by-side mode on a small screen'],
    ],
    nodes: [
      n('page', 'Your page', 'Supplies the links', null, 0, 0),
      n('nav', 'Sidenav', 'The panel', 'pixel-sidenav', 1, 0),
      n('rail', 'Rail', 'Icons only', null, 2, 0),
      n('scrim', 'Scrim', 'Cover mode', null, 3, 0),
      n('shell', 'App shell', 'Drops the brand border', 'pixel-app-shell', 1, 1),
    ],
    stories: {
      side: {
        label: 'Beside the page',
        steps: [
          st(['page', 'nav'], ['page>nav'], 'Side mode sits next to the content. The page still scrolls normally.'),
          st(['nav', 'rail'], ['nav>rail'], 'The user or the page can collapse it to a rail, or hide it.'),
        ],
      },
      over: {
        label: 'Cover the page',
        steps: [
          st(['page', 'nav', 'scrim'], ['page>nav', 'nav>scrim'], 'Over mode, and any viewport below the breakpoint, covers the page. Focus is trapped. A scrim is shown.'),
          st(['scrim', 'nav'], ['scrim>nav'], 'Escape or the scrim closes it and restores the trigger.'),
        ],
      },
      shell: {
        label: 'Inside the shell',
        steps: [
          st(['shell', 'nav'], ['shell>nav'], 'When a header is present, the shell suppresses the sidenav brand border.'),
          st(['nav'], [], 'The sidenav still spans the full shell height.', ['scrim']),
        ],
      },
    },
    states: [
      'Side, cover, rail, or hidden.',
      'Forced cover below the breakpoint.',
      'Cover: scrim, focus trap, Escape.',
      'Brand border off inside the shell when a header exists.',
    ],
    mistakes: [
      'Do not expect side-by-side layout on a small screen. It becomes a cover.',
      'Put the actual navigation landmark in the sidenav content. The shell does not add a nav for you.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-tabs`,
    title: 'pixel-tabs',
    summary: 'A tab list and panels. Arrow keys move, Home and End jump, and disabled tabs are skipped. The tab list needs an accessible name. Lazy panels skip creating the DOM until the tab is chosen. They do not skip loading scripts.',
    does: [
      ['Shows one panel at a time', 'Lazy-load JavaScript. Lazy only skips creating the panel DOM'],
      ['Scrolls the tab list when it overflows', 'Leave the tab list unnamed'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the selected tab', null, 0, 0),
      n('tabs', 'Tabs', 'The widget', 'pixel-tabs', 1, 0),
      n('tab', 'Tab', 'One label', null, 2, 0),
      n('panel', 'Panel', 'The visible page', null, 3, 0),
      n('more', 'Chevrons', 'When tabs overflow', null, 1, 1),
      n('skeleton', 'Skeleton', 'Placeholder', 'pixel-skeleton', 2, 1),
    ],
    stories: {
      select: {
        label: 'Select a tab',
        steps: [
          st(['page', 'tabs', 'tab', 'panel'], ['page>tabs', 'tabs>tab', 'tab>panel'], 'The page names the tab list. One tab is selected and its panel is shown.'),
          st(['tab', 'tabs', 'panel'], ['tab>tabs', 'tabs>panel'], 'Click, Enter, or Space selects a tab. Arrows move. Disabled tabs are skipped.'),
        ],
      },
      lazy: {
        label: 'Lazy panel',
        steps: [
          st(['tabs', 'panel'], ['tabs>panel'], 'A lazy panel is not created in the DOM until the first time it is selected.'),
          st(['page'], [], 'Heavy work inside the panel should use the page’s own defer. Lazy does not split JavaScript.', ['more']),
        ],
      },
      overflow: {
        label: 'Too many tabs',
        steps: [
          st(['tabs', 'more'], ['tabs>more'], 'When the labels do not fit, the list scrolls and chevrons appear.'),
          st(['more', 'tab'], ['more>tab'], 'The user scrolls to the hidden tab and selects it. The panel still follows the selection.', ['skeleton']),
        ],
      },
      skeleton: {
        label: 'Skeleton',
        steps: [
          st(['page', 'skeleton'], ['page>skeleton'], 'Before tabs are known, the skeleton replaces the list.', ['tab', 'panel']),
          st(['page', 'tabs', 'tab'], ['page>tabs', 'tabs>tab'], 'Labels arrive. The real tab list is shown.'),
        ],
      },
    },
    states: [
      'One selected tab, the rest unselected.',
      'Disabled tab: skipped by the keyboard.',
      'Overflow: scroll and chevrons.',
      'Lazy panel: not in the DOM until selected.',
      'Skeleton while loading.',
    ],
    mistakes: [
      'Give the tab list an accessible name. It is required.',
      'Lazy skips DOM creation, not code loading.',
      'Do not put a tab panel’s only content behind a control the user cannot reach.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-accordion`,
    title: 'pixel-accordion',
    summary: 'Stacked sections. Each header is a button that expands or collapses its panel. Lazy panels are not created until the first expand. Analytics, if on, records the panel id, never the title.',
    does: [
      ['Expands and collapses sections', 'Send the section title to analytics'],
      ['Can keep one section open, or several', 'Lazy-load JavaScript. Lazy only skips DOM'],
    ],
    nodes: [
      n('page', 'Your page', 'Supplies sections', null, 0, 0),
      n('acc', 'Accordion', 'The stack', 'pixel-accordion', 1, 0),
      n('header', 'Section button', 'Expanded or not', null, 2, 0),
      n('panel', 'Panel', 'The body', null, 3, 0),
    ],
    stories: {
      toggle: {
        label: 'Open a section',
        steps: [
          st(['page', 'acc', 'header'], ['page>acc', 'acc>header'], 'Each header is a button with expanded state and a pointer to its panel.'),
          st(['header', 'panel'], ['header>panel'], 'Enter or Space toggles it. Disabled sections do nothing.'),
        ],
      },
      lazy: {
        label: 'Lazy body',
        steps: [
          st(['header'], [], 'A lazy panel is not in the DOM until the first expand.', ['panel']),
          st(['header', 'panel'], ['header>panel'], 'The first expand creates it. Later collapses keep it created. Heavy content should still defer at the page level.'),
        ],
      },
    },
    states: [
      'Collapsed or expanded, per section.',
      'Disabled section.',
      'Lazy body not created yet.',
    ],
    mistakes: [
      'Analytics uses the panel id, never the visible title.',
      'Lazy is not a code split.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-stepper`,
    title: 'pixel-stepper',
    summary: 'A sequence of steps. Linear mode blocks later steps until earlier ones are done. Free mode lets the user jump. If an access check is required and none is provided, the step stays closed. The chrome does not have a skeleton mode.',
    does: [
      ['Moves through steps in order or freely', 'Show a skeleton for the step chrome'],
      ['Fails closed when access is required but missing', 'Treat orientation as a color. It is only layout'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the index', null, 0, 0),
      n('stepper', 'Stepper', 'The sequence', 'pixel-stepper', 1, 0),
      n('step', 'One step', 'Header and body', null, 2, 0),
      n('access', 'Access check', 'Fail closed', null, 3, 0),
      n('keys', 'Keyboard', 'The step list', null, 1, 1),
    ],
    stories: {
      linear: {
        label: 'In order',
        steps: [
          st(['page', 'stepper', 'step'], ['page>stepper', 'stepper>step'], 'Linear mode shows the current step. Later steps are not available yet.'),
          st(['step', 'page', 'stepper'], ['step>page', 'page>stepper'], 'The page marks the step complete and moves forward. The user cannot skip ahead.'),
        ],
      },
      free: {
        label: 'Jump around',
        steps: [
          st(['keys', 'stepper', 'step'], ['keys>stepper', 'stepper>step'], 'Free mode lets the user activate any step from the keyboard list.'),
          st(['step', 'page'], ['step>page'], 'The page follows the selected index. Labels can collapse automatically when space is tight.'),
        ],
      },
      denied: {
        label: 'Access missing',
        steps: [
          st(['step', 'access'], ['step>access'], 'A step that requires access, with no evaluator provided, stays closed.'),
          st(['access'], [], 'The user cannot open that step until the page provides a real decision.', ['keys']),
        ],
      },
    },
    states: [
      'Current, complete, and upcoming.',
      'Linear lock on later steps.',
      'Free selection.',
      'Access fail-closed.',
    ],
    mistakes: [
      'Orientation and type change layout, not the color set.',
      'There is no skeleton for the stepper chrome.',
      'A missing access evaluator does not mean "allow". It means the step stays shut.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-breadcrumb`,
    title: 'pixel-breadcrumb',
    summary: 'The path back up the page. The current page is text, not a link. Separators default to a slash. Icons or a template can replace that. When the path is too long, the hidden crumbs go into a menu. Analytics records the path only, never the labels.',
    does: [
      ['Shows the path and links to parents', 'Link the current page'],
      ['Collapses overflow into a menu', 'Send crumb labels to analytics'],
    ],
    nodes: [
      n('page', 'Your page', 'Passes the crumbs', null, 0, 0),
      n('trail', 'Breadcrumb', 'The path', 'pixel-breadcrumb', 1, 0),
      n('link', 'Parent link', 'Goes up', null, 2, 0),
      n('here', 'Current page', 'Not a link', null, 3, 0),
      n('menu', 'Overflow menu', 'Hidden crumbs', 'pixel-menu', 1, 1),
    ],
    stories: {
      path: {
        label: 'A short path',
        steps: [
          st(['page', 'trail', 'link', 'here'], ['page>trail', 'trail>link', 'trail>here'], 'Parents are links. The current crumb is marked as the current page and is not a link.'),
          st(['link', 'page'], ['link>page'], 'The user follows a parent. The separator is a slash unless the page sets an icon or a template.'),
        ],
      },
      overflow: {
        label: 'A long path',
        steps: [
          st(['trail', 'menu'], ['trail>menu'], 'Crumbs that do not fit move into a menu.'),
          st(['menu', 'link'], ['menu>link'], 'The user opens the menu and picks a hidden parent. Analytics, if on, records the path, not the words.', ['here']),
        ],
      },
    },
    states: [
      'Full path visible.',
      'Overflow collapsed into a menu.',
      'Current page is text.',
    ],
    mistakes: [
      'Do not make the current page a link.',
      'Do not send labels to analytics. Send the path only.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-paginator`,
    title: 'pixel-paginator',
    summary: 'Page controls for a list. It is a navigation landmark. On a small screen the page numbers and the "items per page" words hide, but the page-size select keeps its name. A live region announces the range. Analytics records indexes and page size only.',
    does: [
      ['Changes the page index and the page size', 'Slice the data. The page does that'],
      ['Announces the visible range', 'Send row text to analytics'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the index', null, 0, 0),
      n('pager', 'Paginator', 'The controls', 'pixel-paginator', 1, 0),
      n('pages', 'Page numbers', 'Hidden when narrow', null, 2, 0),
      n('size', 'Page size', 'Keeps its name', null, 3, 0),
      n('live', 'Range', 'Announced', null, 1, 1),
    ],
    stories: {
      next: {
        label: 'Next page',
        steps: [
          st(['page', 'pager', 'pages'], ['page>pager', 'pager>pages'], 'The page passes the length and the current index. The paginator shows previous, next, and page numbers.'),
          st(['pager', 'page', 'live'], ['pager>page', 'pager>live'], 'The user goes to another page. The page loads that slice. The live region reads the new range.'),
        ],
      },
      size: {
        label: 'Page size',
        steps: [
          st(['size', 'pager', 'page'], ['size>pager', 'pager>page'], 'The user changes how many rows per page. The index resets as the page decides.'),
          st(['pager'], [], 'On a narrow screen the numbers and the "items per page" label hide. The select still has an accessible name.', ['pages']),
        ],
      },
    },
    states: [
      'First page: previous is unavailable.',
      'Last page: next is unavailable.',
      'Narrow: numbers hidden, size select still named.',
      'Live range after a change.',
    ],
    mistakes: [
      'The paginator does not slice your array. Listen for the new index and slice in the page.',
      'Analytics gets indexes and page size, never the row contents.',
    ],
  }),
];
