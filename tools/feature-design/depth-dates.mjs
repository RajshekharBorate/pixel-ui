import { piece } from './depth-shared.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const dateDepth = {
  [`${lib}/pixel-datepicker`]: piece(
    'The host is the form control. The inner input is only the display. A typed date stays a draft until blur or Enter. Picking a day commits at once, unless the page turned on actions, in which case OK commits and Cancel restores. Values are ISO dates. Do not emit null for a half-typed draft.',
    `flowchart TB
  subgraph page [Your page]
    Value[ISO date or null]
  end
  subgraph host [Datepicker host]
    Display[Display input]
    Draft[Draft until commit]
    Cal[Calendar]
  end
  Value --> Display
  Display -->|type| Draft
  Draft -->|blur or Enter| Value
  Cal -->|day commits now, unless actions are on| Value`,
    [
      '**The form binds the host,** not the inner input.',
      '**Typing is a draft.** A partial string is not a cleared value.',
      '**A day click commits immediately** unless show-actions is on. Then OK commits and Cancel or Escape restores the last committed value.',
      '**Escape** closes the panel and returns focus to the field.',
    ],
    [
      {
        title: 'Type a date',
        diagram: `sequenceDiagram
  actor User
  participant Field as Datepicker
  participant Form
  User->>Field: type
  Note over Field: draft only, do not emit null for a partial string
  alt blur or Enter, and the date is valid
    Field->>Form: ISO date
  else blur, and the text is not a date
    Note over Form: the last committed value stays
  end`,
        note: 'Do not push every keystroke into the form as null. Wait for blur or Enter, and only commit a real date.',
      },
      {
        title: 'Pick a day',
        diagram: `sequenceDiagram
  actor User
  participant Cal as Calendar
  participant Form
  User->>Cal: choose a day
  alt actions are off
    Cal->>Form: commit that ISO date now
  else actions are on
    Note over Form: wait for OK
    User->>Cal: Cancel or Escape
    Note over Form: restore the last committed value
  end`,
        note: 'Show actions when the user should be able to back out of a day click. Otherwise the click is the commit.',
      },
    ],
  ),

  [`${lib}/pixel-date-range-picker`]: piece(
    'The host owns one combined range. The two fields are the display. The separator must not be a bare hyphen, because ISO dates already contain hyphens. Use an en dash, an em dash, or a spaced hyphen. Commit rules match the single datepicker.',
    `flowchart TB
  subgraph page [Your page]
    Range[Start and end]
  end
  subgraph host [Range picker]
    Text[Combined text]
    Draft[Draft until commit]
  end
  Range --> Text
  Text --> Draft
  Draft -->|blur, Enter, or two days| Range`,
    [
      '**One control.** The form value is the range, not two unrelated inputs.',
      '**Separator.** En dash, em dash, or a hyphen with spaces. A raw hyphen splits the ISO text in the wrong place.',
      '**Two days.** The second day completes the range and commits, unless actions are on.',
    ],
    [
      {
        title: 'Type a range',
        diagram: `sequenceDiagram
  actor User
  participant Field as Range picker
  participant Form
  User->>Field: type both dates with a safe separator
  Note over Field: draft until blur or Enter
  Field->>Form: the range, not two loose strings`,
        note: 'If you change the separator, keep it unambiguous. Do not use a single hyphen between two ISO dates.',
      },
      {
        title: 'Pick two days',
        diagram: `sequenceDiagram
  actor User
  participant Field as Range picker
  participant Form
  User->>Field: first day
  Note over Field: waiting for the end
  User->>Field: second day
  alt actions are off
    Field->>Form: commit the range
  else actions are on
    Note over Form: wait for OK
  end`,
        note: 'The first day is not a finished value. Do not save the range until the end is chosen or the user commits.',
      },
    ],
  ),

  [`${lib}/pixel-datetime-picker`]: piece(
    'The form value is an ISO instant in UTC, or null. The fields show the local date and time. The zone is the input, then the app time-zone token, then the browser. A partial draft must not be written as null.',
    `flowchart TB
  subgraph page [Your page]
    Instant[UTC instant or null]
  end
  subgraph picker [Datetime picker]
    Local[Local date and time fields]
    Zone[Zone: input, then app, then browser]
  end
  Instant -->|split into local fields| Local
  Local -->|commit| Instant
  Zone --> Local`,
    [
      '**write the instant, show local parts.** When the form sets a value, split that UTC instant into the local date and time.',
      '**Do not emit null** while the user has only filled the date or only the time.',
      '**Zone order is fixed.** Do not read the browser zone first if the page passed one.',
    ],
    [
      {
        title: 'Set from the form',
        diagram: `sequenceDiagram
  participant Form
  participant Picker as Datetime picker
  Form->>Picker: UTC instant
  Picker->>Picker: split into local date and time
  Note over Picker: zone is the input, else the app, else the browser`,
        note: 'Do not show the raw UTC string in the fields. The user edits local parts. The form still stores UTC.',
      },
      {
        title: 'Edit',
        diagram: `sequenceDiagram
  actor User
  participant Picker as Datetime picker
  participant Form
  User->>Picker: change date or time
  alt both parts are complete
    Picker->>Form: a new UTC instant
  else the draft is partial
    Note over Form: do not write null
  end`,
        note: 'Null means “cleared”, not “still typing”. Keep the previous instant until the draft is complete or the user clears it on purpose.',
      },
    ],
  ),

  [`${lib}/pixel-timepicker`]: piece(
    'Hours and minutes update a draft only. OK commits. Cancel, Escape, or an outside press restores the last committed time. The form does not see the draft.',
    `flowchart TB
  subgraph page [Your page]
    Time[Committed time]
  end
  subgraph picker [Timepicker]
    Draft[Draft hour and minute]
  end
  Time --> Draft
  Draft -->|OK| Time
  Draft -->|Cancel, Escape, or outside| Time`,
    [
      '**Stepping the hour or minute is not a commit.**',
      '**OK writes the draft.** The other dismissals throw the draft away.',
      '**Outside press** is the same as Cancel for the value, and it closes the panel.',
    ],
    [
      {
        title: 'Pick a time',
        diagram: `sequenceDiagram
  actor User
  participant Picker as Timepicker
  participant Form
  User->>Picker: change hour or minute
  Note over Form: still the old time
  User->>Picker: OK
  Picker->>Form: commit`,
        note: 'Do not bind the form to the live hour and minute signals. Bind the committed value.',
      },
      {
        title: 'Cancel',
        diagram: `sequenceDiagram
  actor User
  participant Picker as Timepicker
  participant Form
  User->>Picker: Cancel, Escape, or outside press
  Picker->>Picker: restore the last committed time
  Note over Form: unchanged`,
        note: 'All three paths restore. Do not treat Escape as OK.',
      },
    ],
  ),

  [`${lib}/pixel-calendar`]: piece(
    'The calendar paints a month. It does not own the form control. Days outside the month are hidden by default, as empty cells, not as selectable days. The host caps how wide it grows.',
    `flowchart TB
  subgraph page [Your page]
    Month[Visible month]
    Pick[Chosen day]
  end
  subgraph cal [Calendar]
    Grid[Day grid]
  end
  Month --> Grid
  Grid -->|a day in this month| Pick
  Grid -->|outside days off| Hidden[Empty cells, not selectable]`,
    [
      '**The page owns the selected day** if this calendar sits inside a datepicker. The grid only reports the click.',
      '**Outside days default off.** Turn them on only when those days should be selectable.',
      '**Keyboard.** The grid is a grid. Do not put a separate button on every day unless you are replacing this control.',
    ],
    [
      {
        title: 'Pick a day',
        diagram: `sequenceDiagram
  actor User
  participant Cal as Calendar
  participant Page
  User->>Cal: choose a day in the month
  Cal->>Page: that day
  Note over Cal: this is not the form control by itself`,
        note: 'If you need a form value, use the datepicker. The calendar is the grid it opens.',
      },
      {
        title: 'Outside days',
        diagram: `sequenceDiagram
  participant Cal as Calendar
  alt outside days are off
    Note over Cal: empty placeholders, not selectable
  else outside days are on
    Note over Cal: those days can be chosen
  end`,
        note: 'The default is empty cells. Do not style them as disabled days. They are not days in this mode.',
      },
    ],
  ),

  [`${lib}/pixel-timestamp`]: piece(
    'A timestamp is a time element with an ISO datetime. It shows a relative phrase and refreshes about every 30 seconds. It is not an editor. A date-only string is midnight UTC, which is the wrong tool for a calendar date.',
    `flowchart TB
  subgraph page [Your page]
    Instant[ISO datetime]
  end
  subgraph stamp [Timestamp]
    Text[Relative or absolute text]
  end
  Instant --> Text
  Text -->|refresh about every 30 seconds| Text`,
    [
      '**Pass a real instant** when the time of day matters.',
      '**Date only.** Use the datepicker for a calendar date. A date-only string becomes midnight UTC here.',
      '**Not an input.** The user does not edit it.',
    ],
    [
      {
        title: 'Show a time',
        diagram: `sequenceDiagram
  participant Page
  participant Stamp as Timestamp
  Page->>Stamp: ISO datetime
  Stamp->>Stamp: relative text
  Note over Stamp: refresh about every 30 seconds`,
        note: 'The machine-readable value stays on the time element. The visible text is the relative phrase.',
      },
      {
        title: 'Date only',
        diagram: `sequenceDiagram
  participant Page
  participant Stamp as Timestamp
  Page->>Stamp: a date with no time
  Note over Stamp: treated as midnight UTC
  Note over Page: use a datepicker when you mean a calendar date`,
        note: 'Do not use this component to display a birthday or a due date that has no time. The UTC midnight shift will show the wrong day in some zones.',
      },
    ],
  ),
};
