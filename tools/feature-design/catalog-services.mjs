import { feature, n, st } from './helpers.mjs';

const lib = 'projects/pixel-ui/src/lib/services';

export const serviceFeatures = [
  feature({
    dir: `${lib}/authorization`,
    title: 'authorization',
    summary: 'Pixel asks "can this person do this?" and can hide or disable a control. It does not store accounts, roles, or passwords. The app tells Pixel who the person is and what they can do. A persona is a label for a preview, not a role.',
    does: [
      ['Checks an action and hides or disables chrome', 'Be the identity system or the admin console'],
      ['Fails closed when a required fact is missing', 'Treat "still loading" as a denial. Loading is busy, not hidden'],
    ],
    nodes: [
      n('app', 'Your app', 'Supplies the person and the rules', null, 0, 0),
      n('auth', 'Authorization', 'The check', 'authorization service', 1, 0),
      n('chrome', 'can()', 'For show and hide', null, 2, 0),
      n('pep', 'evaluate()', 'For real gates', null, 3, 0),
      n('audit', 'authorize()', 'Writes an audit', null, 1, 1),
      n('control', 'Control', 'Hidden or disabled', null, 2, 1),
    ],
    stories: {
      chrome: {
        label: 'Show or hide',
        steps: [
          st(['app', 'auth', 'chrome'], ['app>auth', 'auth>chrome'], 'A button asks can(). While the rules are still loading, can() stays true so the chrome does not flash off.'),
          st(['chrome', 'control'], ['chrome>control'], 'A later denial with hide removes the control from the accessibility tree. Pending stays busy, not hidden.'),
        ],
      },
      gate: {
        label: 'A real gate',
        steps: [
          st(['app', 'pep'], ['app>pep'], 'A step, a tab, or a column that must be protected calls evaluate(), not can(). This is silent and safe to call from a computed value.'),
          st(['pep', 'control'], ['pep>control'], 'Deny disables or hides as the rule says. A missing fact that the rule needs means deny, not allow.'),
        ],
      },
      audit: {
        label: 'Audit',
        steps: [
          st(['app', 'audit', 'auth'], ['app>audit', 'audit>auth'], 'authorize() is the call that records the decision. Use it when the attempt itself must be audited.'),
          st(['auth'], [], 'Remote checks time out (about four seconds). A synchronous gate still uses the local result and does not wait on the network.', ['chrome']),
        ],
      },
      time: {
        label: 'Time rules',
        steps: [
          st(['app', 'auth'], ['app>auth'], 'If a rule depends on time, the app passes now. The rule does not read the clock itself.'),
          st(['auth', 'pep'], ['auth>pep'], 'Wildcards match the longest prefix. A bare star is ignored. A persona is not a role.'),
        ],
      },
    },
    states: [
      'Hydrating: can() is true, and a pending control is busy.',
      'Allowed.',
      'Denied and hidden: removed from assistive tech.',
      'Denied and disabled: the inner control is aria-disabled.',
      'Fail closed when a required attribute is missing.',
    ],
    mistakes: [
      'Do not use can() as a security gate. It is for chrome and stays true while loading. Gates call evaluate().',
      'Do not call the clock inside a rule. Pass now from the app.',
      'A persona is not a role. Do not treat a preview label as permission.',
      'Denied plus hide must leave the accessibility tree. Pending must not.',
    ],
  }),

  feature({
    dir: `${lib}/export`,
    title: 'export',
    summary: 'Builds a CSV, TSV, JSON, or spreadsheet file in memory and downloads it. It does not call the network. The data grid toolbar uses it. It does not read the DOM.',
    does: [
      ['Turns rows into a file and saves it', 'Upload or download from a URL (use file-transfer)'],
      ['Stays in memory', 'Scrape a table from the page'],
    ],
    nodes: [
      n('page', 'Your page', 'Passes rows', null, 0, 0),
      n('export', 'Export', 'Builds the file', 'export service', 1, 0),
      n('file', 'File', 'CSV, TSV, JSON, or spreadsheet', null, 2, 0),
      n('save', 'Download', 'The browser save', null, 3, 0),
    ],
    stories: {
      save: {
        label: 'Download rows',
        steps: [
          st(['page', 'export', 'file'], ['page>export', 'export>file'], 'The page, or the grid toolbar, passes columns and rows. The service builds the file in memory.'),
          st(['file', 'save'], ['file>save'], 'The browser downloads it. No request is sent.'),
        ],
      },
      columns: {
        label: 'Only allowed columns',
        steps: [
          st(['page', 'export'], ['page>export'], 'Pass only the columns the person may see. The service does not discover hidden columns from the DOM.'),
          st(['export', 'file'], ['export>file'], 'The file contains that list and nothing else.', ['save']),
        ],
      },
    },
    states: [
      'Idle.',
      'Building the file.',
      'Download started.',
    ],
    mistakes: [
      'This is not an HTTP client and not the file-transfer queue.',
      'Do not pass columns the user must not see. Filter them before the call.',
    ],
  }),

  feature({
    dir: `${lib}/file-transfer`,
    title: 'file-transfer',
    summary: 'A queue of uploads and downloads. Each item can pause, resume, retry, or cancel. Adapters do the real bytes. Saving a blob reuses the export download helper. A zip needs a zipper the app provides. This is not a table export.',
    does: [
      ['Queues uploads and downloads with pause and retry', 'Build a CSV from rows (use export)'],
      ['Talks to adapters for the real transfer', 'Zip files unless the app supplies a zipper'],
    ],
    nodes: [
      n('page', 'Your page', 'Adds a transfer', null, 0, 0),
      n('queue', 'Transfer queue', 'Pause, resume, retry, cancel', 'file-transfer service', 1, 0),
      n('adapter', 'Adapter', 'Does the bytes', null, 2, 0),
      n('item', 'One item', 'Progress', null, 3, 0),
      n('save', 'Save blob', 'Uses the export helper', null, 1, 1),
    ],
    stories: {
      upload: {
        label: 'Upload',
        steps: [
          st(['page', 'queue', 'item'], ['page>queue', 'queue>item'], 'The page adds a file. The item shows progress.'),
          st(['queue', 'adapter', 'item'], ['queue>adapter', 'adapter>item'], 'The adapter sends the bytes. The page can pause, resume, retry, or cancel.'),
        ],
      },
      download: {
        label: 'Download',
        steps: [
          st(['page', 'queue', 'adapter'], ['page>queue', 'queue>adapter'], 'The page asks for a download. The adapter fetches it.'),
          st(['adapter', 'save'], ['adapter>save'], 'The blob is saved with the same download helper the export service uses.', ['item']),
        ],
      },
      fail: {
        label: 'Retry or cancel',
        steps: [
          st(['adapter', 'item', 'queue'], ['adapter>item', 'item>queue'], 'A failure leaves the item failed. Retry runs it again. Cancel removes it from the active queue.'),
          st(['queue'], [], 'A zip is not built here unless the app passed a zipper.', ['save']),
        ],
      },
    },
    states: [
      'Queued, running, paused, failed, cancelled, and complete.',
      'Progress on the item.',
    ],
    mistakes: [
      'Do not use this to export a grid. That is the export service.',
      'Do not expect zip support until the app provides a zipper.',
    ],
  }),

  feature({
    dir: `${lib}/navigate`,
    title: 'navigate',
    summary: 'Sends the user to a place in the app: optional route change, then wait, scroll, focus, and highlight. It is not a second router and not a tour. A missing target fails softly. It does not throw. The canonical link is a query parameter. A hash is only for a simple section, and the query wins when both exist.',
    does: [
      ['Routes, scrolls, focuses, and highlights a target', 'Replace the Angular router'],
      ['Fails softly when the target is missing', 'Open a wizard by itself'],
    ],
    nodes: [
      n('page', 'Your page', 'Asks to go', null, 0, 0),
      n('nav', 'Navigate', 'The sequence', 'navigate service', 1, 0),
      n('router', 'Router', 'Optional route change', null, 2, 0),
      n('target', 'Target', 'Anchor or selector', null, 3, 0),
      n('toast', 'Toast', 'Optional, on failure', 'pixel-toast', 1, 1),
    ],
    stories: {
      go: {
        label: 'Go to a target',
        steps: [
          st(['page', 'nav', 'router'], ['page>nav', 'nav>router'], 'The page calls go(). If a route change is needed, it happens first.'),
          st(['nav', 'target'], ['nav>target'], 'The service waits, scrolls, focuses, and can highlight. The sticky offset defaults to the toolbar height. Highlight respects reduced motion.'),
        ],
      },
      miss: {
        label: 'Target missing',
        steps: [
          st(['nav', 'target'], ['nav>target'], 'Adapters run, then a pixel anchor, then a CSS selector. Nothing matches.'),
          st(['nav', 'toast'], ['nav>toast'], 'The result is not ok. An optional toast explains it. The call does not throw.', ['router']),
        ],
      },
      link: {
        label: 'Which link wins',
        steps: [
          st(['page', 'nav'], ['page>nav'], 'A nav query parameter is the canonical deep link. A hash is only for a simple section.'),
          st(['nav', 'target'], ['nav>target'], 'If both are present, the query wins. An unregistered wizard adapter reports adapter-missing. Wizards do not open by themselves.'),
        ],
      },
    },
    states: [
      'Idle.',
      'Routing, waiting, scrolling, focusing, highlighting.',
      'Success.',
      'Soft failure: not ok, optional toast, no throw.',
    ],
    mistakes: [
      'Do not use this as a tour. Tours have their own controller.',
      'Do not throw when the element is missing. Handle the soft failure.',
      'Do not auto-open a wizard from a deep link unless a wizard adapter is actually registered.',
    ],
  }),

  feature({
    dir: `${lib}/title`,
    title: 'title',
    summary: 'The one writer of the browser tab title. Turn on router sync and do not also leave the default title strategy subscribed. The title is the deepest page title on the primary route, not a chain of parent titles. Counts in the title wait about a second, and a page change flushes them.',
    does: [
      ['Sets the document title from the route or an explicit call', 'Build "child · parent · brand" chains'],
      ['Can show a count, debounced', 'Announce the title in a live region as well'],
    ],
    nodes: [
      n('router', 'Router', 'Leaf title', null, 0, 0),
      n('title', 'Title service', 'The one writer', 'title service', 1, 0),
      n('doc', 'Browser tab', 'The document title', null, 2, 0),
      n('count', 'Count', 'Debounced', null, 3, 0),
      n('page', 'Your page', 'Explicit title or error', null, 1, 1),
    ],
    stories: {
      route: {
        label: 'Route title',
        steps: [
          st(['router', 'title', 'doc'], ['router>title', 'title>doc'], 'Router sync is on. A navigation writes the leaf title of the primary route.'),
          st(['title'], [], 'Do not also subscribe the default title strategy. Two writers will fight.', ['page']),
        ],
      },
      explicit: {
        label: 'Explicit title',
        steps: [
          st(['page', 'title', 'doc'], ['page>title', 'title>doc'], 'The page sets a title, or an error title, on purpose.'),
          st(['page'], [], 'Do not rebuild the title from the trail on every navigation if router sync is already on.', ['count']),
        ],
      },
      count: {
        label: 'Unread count',
        steps: [
          st(['page', 'count', 'title'], ['page>count', 'count>title'], 'A count at or below zero is omitted. A positive count waits about a second so it does not flicker.'),
          st(['router', 'title', 'doc'], ['router>title', 'title>doc'], 'A page change flushes the count immediately into the new title. Do not also put the title in a live region.'),
        ],
      },
    },
    states: [
      'Following the leaf route title.',
      'Explicit title or error title.',
      'Count pending, then flushed.',
    ],
    mistakes: [
      'One writer only. Router sync on means the default strategy stays off.',
      'Do not concatenate parent titles.',
      'Do not announce the document title in a live region.',
      'Call the error title on error pages instead of leaving the previous page’s title.',
    ],
  }),
];
