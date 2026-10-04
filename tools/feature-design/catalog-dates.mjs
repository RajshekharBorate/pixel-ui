import { feature, n, st } from './helpers.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const dateFeatures = [
  feature({
    dir: `${lib}/pixel-datepicker`,
    title: 'pixel-datepicker',
    summary: 'A date field. The host is the form control. The inner text is only a display. Typed text stays a draft until blur or Enter. Picking a day in the calendar commits immediately unless the page turned on action buttons. Values are ISO dates.',
    does: [
      ['Edits one date and commits a draft safely', 'Treat the inner input as the form control'],
      ['Parses ISO dates', 'Emit null while the user is still typing a partial date'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the date', null, 0, 0),
      n('field', 'Date field', 'The form control', 'pixel-datepicker', 1, 0),
      n('text', 'Draft text', 'Not committed yet', null, 2, 0),
      n('cal', 'Calendar', 'Commits on pick', 'pixel-calendar', 3, 0),
    ],
    stories: {
      type: {
        label: 'Type a date',
        steps: [
          st(['page', 'field', 'text'], ['page>field', 'field>text'], 'The page sets an ISO date. The user edits the text. That text is only a draft.'),
          st(['text', 'field', 'page'], ['text>field', 'field>page'], 'Blur or Enter commits a valid date. Escape closes the popup and restores focus. An invalid draft does not wipe the last good value.'),
        ],
      },
      pick: {
        label: 'Pick a day',
        steps: [
          st(['field', 'cal'], ['field>cal'], 'Opening the field shows the calendar. Choosing a day commits at once.'),
          st(['cal', 'field'], ['cal>field'], 'If the page shows action buttons, the day stays a draft until OK. Cancel restores the previous date.', ['text']),
        ],
      },
    },
    states: [
      'Empty, draft text, and committed ISO date.',
      'Calendar open or closed.',
      'Disabled, readonly, and error.',
    ],
    mistakes: [
      'Bind the form to the host, not the inner input.',
      'Do not commit on every keystroke. Wait for blur, Enter, or a calendar pick.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-date-range-picker`,
    title: 'pixel-date-range-picker',
    summary: 'A start date and an end date in one field. The host owns the combined text. The separator is an en dash, em dash, or a spaced hyphen so the hyphens inside an ISO date stay safe. Commit rules match the single date field.',
    does: [
      ['Edits a start and an end', 'Use a bare hyphen with no spaces as the separator'],
      ['Commits on blur, Enter, or a calendar pick', 'Write a partial range as null while the user is typing'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the range', null, 0, 0),
      n('field', 'Range field', 'The form control', 'pixel-date-range-picker', 1, 0),
      n('text', 'Combined text', 'Start and end', null, 2, 0),
      n('cal', 'Calendar', 'Two days', 'pixel-calendar', 3, 0),
    ],
    stories: {
      type: {
        label: 'Type a range',
        steps: [
          st(['page', 'field', 'text'], ['page>field', 'field>text'], 'The field shows both dates with a safe separator. The user edits the draft.'),
          st(['text', 'field', 'page'], ['text>field', 'field>page'], 'Blur or Enter commits when both dates parse. Escape closes and restores focus.'),
        ],
      },
      pick: {
        label: 'Pick two days',
        steps: [
          st(['field', 'cal'], ['field>cal'], 'The user picks a start, then an end, in the calendar.'),
          st(['cal', 'field'], ['cal>field'], 'Without action buttons, the complete range commits. With action buttons, OK commits and Cancel restores the last range.'),
        ],
      },
    },
    states: [
      'Empty, partial draft, and a committed start plus end.',
      'Calendar choosing the start, then the end.',
      'Disabled, readonly, and error.',
    ],
    mistakes: [
      'Do not use a plain hyphen as the separator. ISO dates already contain hyphens.',
      'The host is the form control. The visible text is the draft.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-datetime-picker`,
    title: 'pixel-datetime-picker',
    summary: 'A date and a time together. The form value is an ISO instant in UTC, or null. The time zone comes from the input, then PIXEL_TIMEZONE, then the browser. A half-finished draft must not emit null, or the saved date would be wiped.',
    does: [
      ['Edits a date and a time as one UTC value', 'Emit null just because the time is half typed'],
      ['Shows the instant in the chosen zone', 'Store a local wall time as the form value'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the instant', null, 0, 0),
      n('field', 'Date time field', 'The form control', 'pixel-datetime-picker', 1, 0),
      n('zone', 'Time zone', 'Input, then app, then browser', null, 2, 0),
      n('draft', 'Draft', 'Date and time parts', null, 3, 0),
    ],
    stories: {
      write: {
        label: 'Set from the form',
        steps: [
          st(['page', 'field', 'zone'], ['page>field', 'field>zone'], 'The form writes an ISO UTC value. The field splits it into a local date and time in the active zone.'),
          st(['field', 'draft'], ['field>draft'], 'The user sees that local date and time. The stored value stays UTC.'),
        ],
      },
      edit: {
        label: 'Edit',
        steps: [
          st(['draft', 'field'], ['draft>field'], 'The user changes the date or the time. A partial draft stays a draft.'),
          st(['field', 'page'], ['field>page'], 'A complete valid value commits as UTC. A partial draft does not emit null.', ['zone']),
        ],
      },
    },
    states: [
      'Empty, partial draft, and a committed UTC instant.',
      'Time zone from the field, the app token, or the browser.',
      'Disabled, readonly, and error.',
    ],
    mistakes: [
      'Never emit null while the draft is incomplete. That would clear a date the user already had.',
      'The form value is UTC. Do not store the wall-clock text as the value.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-timepicker`,
    title: 'pixel-timepicker',
    summary: 'A time control with a clock. Choosing an hour, then a minute, updates a draft only. OK commits. Cancel, Escape, or a click outside restores the last committed time.',
    does: [
      ['Picks a time and commits on OK', 'Commit the hour before the minute is chosen'],
      ['Restores the last time on cancel', 'Write the draft into the form on every tick'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the time', null, 0, 0),
      n('field', 'Time field', 'The form control', 'pixel-timepicker', 1, 0),
      n('dial', 'Clock', 'Hour then minute', null, 2, 0),
      n('draft', 'Draft', 'Not saved yet', null, 3, 0),
    ],
    stories: {
      pick: {
        label: 'Pick a time',
        steps: [
          st(['page', 'field', 'dial'], ['page>field', 'field>dial'], 'The page sets the last committed time. The user opens the clock.'),
          st(['dial', 'draft'], ['dial>draft'], 'The hour updates the draft. The minute updates the draft. The form value is still the old time.'),
          st(['draft', 'field', 'page'], ['draft>field', 'field>page'], 'OK commits the draft. The page receives the new time.'),
        ],
      },
      cancel: {
        label: 'Cancel',
        steps: [
          st(['dial', 'draft'], ['dial>draft'], 'The user has changed the draft.'),
          st(['field', 'page'], ['field>page'], 'Cancel, Escape, or an outside click throws the draft away and restores the last committed time.', ['draft']),
        ],
      },
    },
    states: [
      'Closed with a committed time.',
      'Open on the hour, then on the minute.',
      'Draft dirty, then committed or restored.',
    ],
    mistakes: [
      'Do not write the form value when the hour is picked. Wait for OK.',
      'Cancel must restore the previous time, not leave the draft in place.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-calendar`,
    title: 'pixel-calendar',
    summary: 'A month grid. Days outside the month are hidden by default (empty cells, not selectable). The grid is a grid for screen readers. The host is capped so it does not stretch the page.',
    does: [
      ['Lets the user pick a day in a month', 'Select days that belong to the previous or next month, unless the page shows them'],
      ['Moves with arrow keys', 'Replace the date field. The field owns the form value'],
    ],
    nodes: [
      n('page', 'Your page', 'Listens for a day', null, 0, 0),
      n('cal', 'Calendar', 'The month', 'pixel-calendar', 1, 0),
      n('day', 'A day', 'In this month', null, 2, 0),
      n('out', 'Outside day', 'Hidden by default', null, 3, 0),
    ],
    stories: {
      pick: {
        label: 'Pick a day',
        steps: [
          st(['page', 'cal', 'day'], ['page>cal', 'cal>day'], 'The page shows a month. The user clicks a day or moves with arrows and presses Enter or Space.'),
          st(['day', 'page'], ['day>page'], 'The chosen day is emitted. The calendar does not own the form control by itself.'),
        ],
      },
      outside: {
        label: 'Outside days',
        steps: [
          st(['cal'], [], 'By default, days from the other months are empty placeholders. They cannot be selected.', ['out']),
          st(['page', 'cal', 'out'], ['page>cal', 'cal>out'], 'If the page turns outside days on, those days can be selected and they may change the visible month.'),
        ],
      },
    },
    states: [
      'A month with focus on one day.',
      'Disabled days skipped.',
      'Outside days hidden, or shown when the page asks.',
    ],
    mistakes: [
      'Outside days are off by default. Empty cells are not a broken grid.',
      'Do not let the calendar grow past its host cap.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-timestamp`,
    title: 'pixel-timestamp',
    summary: 'Shows a moment as a time element with an ISO datetime. Relative text such as "5 minutes ago" refreshes about every 30 seconds. A date-only string is UTC midnight, so use a date picker for dates that have no time.',
    does: [
      ['Renders one instant for people and for machines', 'Edit a date'],
      ['Refreshes relative text', 'Treat a date-only value as a local calendar day'],
    ],
    nodes: [
      n('page', 'Your page', 'Passes the instant', null, 0, 0),
      n('stamp', 'Timestamp', 'The time element', 'pixel-timestamp', 1, 0),
      n('abs', 'Absolute', 'The machine value', null, 2, 0),
      n('rel', 'Relative', 'Refreshes', null, 3, 0),
    ],
    stories: {
      show: {
        label: 'Show a time',
        steps: [
          st(['page', 'stamp', 'abs'], ['page>stamp', 'stamp>abs'], 'The page passes an ISO instant. The element exposes that datetime.'),
          st(['stamp', 'rel'], ['stamp>rel'], 'Relative mode shows a phrase and updates it on a short timer. Absolute mode shows the formatted clock time instead.'),
        ],
      },
      dateOnly: {
        label: 'Date only',
        steps: [
          st(['page'], [], 'A date with no time is UTC midnight. This control will show a time you may not want.', ['stamp']),
          st(['page'], [], 'Use pixel-datepicker for a calendar day. Use this control when you have a real instant.'),
        ],
      },
    },
    states: [
      'Absolute formatted time.',
      'Relative text that refreshes.',
      'Invalid or empty when the page passes nothing usable.',
    ],
    mistakes: [
      'Do not pass a date-only string if you mean a calendar day. It is read as UTC midnight.',
      'This is not an editor.',
    ],
  }),
];
