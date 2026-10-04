import { feature, n, st } from './helpers.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const dataFeatures = [
  feature({
    dir: `${lib}/pixel-data-grid`,
    title: 'pixel-data-grid',
    summary: 'A table for rows the page owns. Density picks the row height and the size of editors inside the cells. Do not pass a separate control size. Date filters and date editors use the date picker. Analytics records table events and export events, never the raw filter text.',
    does: [
      ['Shows, sorts, filters, and edits rows', 'Send filter text or query text to analytics'],
      ['Exports through the export service when the toolbar asks', 'Pick its own density and a second control size'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the rows', null, 0, 0),
      n('grid', 'Data grid', 'The table', 'pixel-data-grid', 1, 0),
      n('row', 'Rows', 'The data', null, 2, 0),
      n('filter', 'Filter', 'Date uses the date picker', 'pixel-datepicker', 3, 0),
      n('export', 'Export', 'The toolbar action', 'export service', 1, 1),
      n('busy', 'Loading', 'Table is busy', null, 2, 1),
    ],
    stories: {
      show: {
        label: 'Show rows',
        steps: [
          st(['page', 'grid', 'row'], ['page>grid', 'grid>row'], 'The page passes rows and columns. The grid is a table. Density sets comfortable, standard, or compact rows.'),
          st(['grid', 'busy'], ['grid>busy'], 'While rows load, the table is busy. When the list is empty, show an empty state the page provides, not a blank body.'),
        ],
      },
      filter: {
        label: 'Filter',
        steps: [
          st(['filter', 'grid', 'page'], ['filter>grid', 'grid>page'], 'The user filters. A date filter opens the date picker. The page applies the filter to the rows.'),
          st(['grid'], [], 'Analytics may record that a filter changed. It does not record the typed value.', ['export']),
        ],
      },
      edit: {
        label: 'Edit a cell',
        steps: [
          st(['row', 'grid'], ['row>grid'], 'The user edits a cell. A date cell uses the date picker. The control size follows density. Do not pass another size.'),
          st(['grid', 'page'], ['grid>page'], 'The page saves the new value. Sort and page changes keep using the page’s row list.'),
        ],
      },
      export: {
        label: 'Export',
        steps: [
          st(['grid', 'export'], ['grid>export'], 'The export toolbar builds a file through the export service. Columns the user is not allowed to see stay out.'),
          st(['export', 'page'], ['export>page'], 'The file downloads. Analytics records the export event, not the cell text.', ['filter']),
        ],
      },
    },
    states: [
      'Loading: the table is busy.',
      'Empty: the page shows an empty state.',
      'Density: comfortable, standard, or compact, which also sizes cell editors.',
      'Filtered, sorted, and paged.',
      'Cell editing.',
    ],
    mistakes: [
      'Do not pass a separate size for inputs inside cells. Density already chooses md, sm, or xs.',
      'Do not put raw filter or query text in analytics.',
      'Date cells use pixel-datepicker. Do not invent a second date field.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-tree`,
    title: 'pixel-tree',
    summary: 'A tree of rows. Only the expanded rows are shown. Arrow Right expands a branch or moves into it. Arrow Left collapses it or jumps to the parent. Checkbox mode can be checked, unchecked, or mixed. Focus is a highlight, not a browser outline.',
    does: [
      ['Shows a nested list and expands branches', 'Render every nested node when its parent is closed'],
      ['Supports a tri-state checkbox', 'Use a focus ring. The hover surface is the focus cue'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the nodes', null, 0, 0),
      n('tree', 'Tree', 'The widget', 'pixel-tree', 1, 0),
      n('row', 'Visible row', 'One open node', null, 2, 0),
      n('keys', 'Arrow keys', 'Expand and move', null, 3, 0),
      n('check', 'Checkbox', 'On, off, or mixed', null, 1, 1),
    ],
    stories: {
      expand: {
        label: 'Expand',
        steps: [
          st(['page', 'tree', 'row'], ['page>tree', 'tree>row'], 'The page passes the tree. Only visible rows are in the list. Closed children are not rendered.'),
          st(['keys', 'row', 'tree'], ['keys>row', 'row>tree'], 'Arrow Right expands a closed branch, or moves to the first child if it is already open. Arrow Left collapses, or moves to the parent.'),
        ],
      },
      check: {
        label: 'Checkboxes',
        steps: [
          st(['page', 'tree', 'check'], ['page>tree', 'tree>check'], 'Checkbox mode shows a box on each row. A parent can be mixed when only some children are checked.'),
          st(['check', 'page'], ['check>page'], 'The user toggles a row. The page updates checked, unchecked, or mixed. Space activates the focused row.'),
        ],
      },
    },
    states: [
      'Collapsed or expanded branch.',
      'Focused row: highlighted, no extra outline.',
      'Checkbox: checked, unchecked, or mixed.',
      'Disabled row.',
    ],
    mistakes: [
      'Do not render closed children. The tree only lists visible rows.',
      'Do not add a focus outline. The row highlight is the focus cue.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-empty-state`,
    title: 'pixel-empty-state',
    summary: 'What the page shows when there is nothing to list. If you pass no content, it renders nothing. It announces itself only when it replaces something that was already on screen. A first paint that is empty should stay quiet. Loading is a skeleton or a loader, then either data or this state.',
    does: [
      ['Explains an empty list and offers an action', 'Show a skeleton. Loading is a different control'],
      ['Announces a dynamic empty result', 'Announce on the first paint of a page that loads empty'],
    ],
    nodes: [
      n('page', 'Your page', 'Decides it is empty', null, 0, 0),
      n('empty', 'Empty state', 'The message', 'pixel-empty-state', 1, 0),
      n('action', 'Action', 'Optional button', 'pixel-button', 2, 0),
      n('live', 'Announcement', 'Only after a change', null, 1, 1),
      n('loader', 'Loader', 'Comes first', 'pixel-loader', 2, 1),
    ],
    stories: {
      first: {
        label: 'First paint',
        steps: [
          st(['page', 'loader'], ['page>loader'], 'While data is loading, show a loader or a skeleton. Do not show the empty state yet.', ['empty']),
          st(['page', 'empty'], ['page>empty'], 'The request finishes with no rows. The empty state appears. It does not announce, because this is the first result.'),
        ],
      },
      replace: {
        label: 'Replaces a list',
        steps: [
          st(['page', 'empty', 'live'], ['page>empty', 'empty>live'], 'The user filtered a list down to nothing. The empty state replaces rows and announces that, politely.'),
          st(['empty', 'action', 'page'], ['empty>action', 'action>page'], 'An optional button lets the user clear the filter or create the first item.'),
        ],
      },
      blank: {
        label: 'No content',
        steps: [
          st(['page'], [], 'If the page passes no title, text, or action, the empty state renders nothing.', ['empty', 'live']),
        ],
      },
    },
    states: [
      'Not rendered when there is no content.',
      'Visible and quiet on first paint.',
      'Visible and announced when it replaces existing content.',
    ],
    mistakes: [
      'Do not use this as a loading state.',
      'Do not announce a static empty first paint.',
      'Do not use this inside a select panel. Select has its own short empty message.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-loader`,
    title: 'pixel-loader',
    summary: 'A busy indicator. It can wait a moment before showing, and it can stay up for a minimum time so it does not flash. A loading service counts overlapping jobs. Full screen locks scroll. An HTTP interceptor and route loading can turn it on. A request can opt out with a skip header.',
    does: [
      ['Shows progress for a job, a request, or a route', 'Replace an empty state'],
      ['Reference-counts overlapping work', 'Hide in the middle of a job that is still running'],
    ],
    nodes: [
      n('page', 'Your page', 'Starts work', null, 0, 0),
      n('service', 'Loading service', 'Counts jobs', 'PixelLoadingService', 1, 0),
      n('loader', 'Loader', 'The indicator', 'pixel-loader', 2, 0),
      n('http', 'HTTP or route', 'Can start it', null, 3, 0),
      n('screen', 'Full screen', 'Locks scroll', null, 1, 1),
    ],
    stories: {
      job: {
        label: 'One job',
        steps: [
          st(['page', 'service', 'loader'], ['page>service', 'service>loader'], 'The page tracks a promise. The loader waits for the show delay, then appears, and stays at least the minimum time.'),
          st(['service', 'loader'], ['service>loader'], 'The promise finishes. The count drops to zero and the loader hides. It is a status, not an alert.'),
        ],
      },
      overlap: {
        label: 'Two jobs',
        steps: [
          st(['page', 'service'], ['page>service'], 'A second job starts before the first ends. The count is 2. The loader stays.'),
          st(['service', 'loader'], ['service>loader'], 'Each finish decrements. The loader hides only at zero.'),
        ],
      },
      http: {
        label: 'Request or route',
        steps: [
          st(['http', 'service', 'loader'], ['http>service', 'service>loader'], 'The interceptor or route loading turns the loader on for a request or a navigation.'),
          st(['http'], [], 'A request with the skip header does not join the count. Full screen mode locks scroll until the count is zero.', ['page']),
        ],
      },
    },
    states: [
      'Hidden during the show delay.',
      'Visible, including a minimum time so it does not flicker.',
      'Full screen with scroll locked.',
      'Idle when the count is zero.',
    ],
    mistakes: [
      'Do not hide the loader when one of two jobs ends.',
      'Use the skip header for requests that must not flash the loader.',
      'This is not the empty state. Show the loader first, then data or the empty state.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-progress`,
    title: 'pixel-progress',
    summary: 'A bar for a known amount, an unknown amount, a buffer, or a query. At 100 percent it emits completed once. It is not a stepper. Indeterminate mode drops the numeric value and marks itself busy.',
    does: [
      ['Shows how far a job has gone', 'Step through a wizard (use pixel-stepper)'],
      ['Emits completed once at the end', 'Keep announcing a number while the amount is unknown'],
    ],
    nodes: [
      n('page', 'Your page', 'Sets the amount', null, 0, 0),
      n('bar', 'Progress', 'The bar', 'pixel-progress', 1, 0),
      n('value', 'Known amount', 'A number', null, 2, 0),
      n('busy', 'Unknown amount', 'No number', null, 3, 0),
    ],
    stories: {
      known: {
        label: 'Known amount',
        steps: [
          st(['page', 'bar', 'value'], ['page>bar', 'bar>value'], 'The page sets a value between the min and the max. The bar exposes that value.'),
          st(['bar', 'page'], ['bar>page'], 'When the value reaches the end, completed fires once. Later updates do not fire it again until the job restarts.'),
        ],
      },
      unknown: {
        label: 'Unknown amount',
        steps: [
          st(['page', 'bar', 'busy'], ['page>bar', 'bar>busy'], 'Indeterminate, buffer, or query mode means the end is not known. The numeric value is removed and the bar is busy.'),
          st(['page', 'bar', 'value'], ['page>bar', 'bar>value'], 'When the page learns the amount, it switches back to a determinate value.', ['busy']),
        ],
      },
    },
    states: [
      'Determinate with a value.',
      'Indeterminate, buffer, or query: busy, no current number.',
      'Complete: the completed event has fired once.',
    ],
    mistakes: [
      'This is not a stepper and not a loader overlay.',
      'Do not leave aria-valuenow on an indeterminate bar.',
      'Do not treat completed as a repeating tick. It fires once per run to 100 percent.',
    ],
  }),
];
