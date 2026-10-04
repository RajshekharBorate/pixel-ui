import { feature, n, st } from './helpers.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const formFeatures = [
  feature({
    dir: `${lib}/pixel-input`,
    title: 'pixel-input',
    summary: 'A single text field with a label, helper text, and errors. It works with reactive forms and template forms. The label can sit on top, on the left, float, or be hidden (still named for screen readers).',
    does: [
      ['Edits one text value', 'Pick from a list (use pixel-select or pixel-autocomplete)'],
      ['Shows required, error, and loading', 'Clear the field unless the page asks for a clear button'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the value', null, 0, 0),
      n('input', 'Input', 'The field', 'pixel-input', 1, 0),
      n('label', 'Label', 'Names the field', null, 2, 0),
      n('form', 'Form', 'Touched and invalid', null, 3, 0),
      n('clear', 'Clear', 'Only if asked', null, 1, 1),
      n('loading', 'Loading', 'Covers the field', 'pixel-loader', 2, 1),
    ],
    stories: {
      type: {
        label: 'Type',
        steps: [
          st(['page', 'input', 'label'], ['page>input', 'input>label'], 'The page sets the label. Top is the default. Left stacks under the field on a narrow screen. Hidden still names the field.'),
          st(['input', 'form', 'page'], ['input>form', 'form>page'], 'The user types. The form value updates. Empty is valid unless the field is required.'),
        ],
      },
      error: {
        label: 'Error',
        steps: [
          st(['form', 'input'], ['form>input'], 'The form marks the control touched and invalid. The error text is shown and tied to the field.'),
          st(['input'], [], 'A nested field can inherit the parent errors only when that option is on. Otherwise it keeps its own errors.', ['clear']),
        ],
      },
      clear: {
        label: 'Clear',
        steps: [
          st(['page', 'input', 'clear'], ['page>input', 'input>clear'], 'The clear button appears only when the page turns it on and the field has text.'),
          st(['clear', 'input', 'page'], ['clear>input', 'input>page'], 'The user clears it. The value becomes empty. Loading, if shown, overlays the field and blocks editing.'),
        ],
      },
    },
    states: [
      'Empty, filled, focused, disabled, and readonly.',
      'Required. Empty is valid until required says otherwise.',
      'Error after the form says the control is invalid.',
      'Loading overlay while the page is busy.',
      'Label positions: top, left, floating, or hidden.',
    ],
    mistakes: [
      'The clear button is off until the page sets it. Do not expect it by default.',
      'Left labels wrap below the field on small screens. Plan for that stack.',
      'Do not treat a nested control as inheriting parent errors unless that option is on.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-checkbox`,
    title: 'pixel-checkbox',
    summary: 'A checked, unchecked, or mixed checkbox. The page can bind checked, or the form can own it. Mixed (indeterminate) clears the next time the user toggles.',
    does: [
      ['Toggles a boolean, or shows a mixed state', 'Choose one of many (use pixel-radio)'],
      ['Works with forms', 'Change the value while readonly'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns checked', null, 0, 0),
      n('box', 'Checkbox', 'The control', 'pixel-checkbox', 1, 0),
      n('form', 'Form', 'Or the form owns it', null, 2, 0),
      n('mixed', 'Mixed', 'Clears on the next toggle', null, 1, 1),
      n('error', 'Error', 'Page can force it', null, 2, 1),
    ],
    stories: {
      toggle: {
        label: 'Check',
        steps: [
          st(['page', 'box'], ['page>box'], 'The page binds checked, or the form writes the value. The box shows the current state.'),
          st(['box', 'page', 'form'], ['box>page', 'box>form'], 'The user toggles with click, Enter, or Space. The new checked value is emitted.'),
        ],
      },
      mixed: {
        label: 'Mixed',
        steps: [
          st(['page', 'box', 'mixed'], ['page>box', 'box>mixed'], 'The page sets indeterminate for a parent of a partial group.'),
          st(['box', 'page'], ['box>page'], 'The next user toggle clears mixed and sets a real checked or unchecked value.'),
        ],
      },
      locked: {
        label: 'Readonly or disabled',
        steps: [
          st(['page', 'box'], ['page>box'], 'Readonly can be focused but does not change. Disabled cannot be used.'),
          st(['box'], [], 'No change event. An error override from the page can still show an error.', ['form']),
        ],
      },
    },
    states: [
      'Unchecked, checked, and mixed.',
      'Disabled: unavailable.',
      'Readonly: focusable, no change.',
      'Error, including a page-forced error.',
      'Full width is the default.',
    ],
    mistakes: [
      'Mixed is not a third saved value. The next user toggle clears it.',
      'Readonly is not disabled. The user can still tab to it.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-radio`,
    title: 'pixel-radio',
    summary: 'A set of options where one is selected. The group owns the value, the arrow keys, and the form binding. Each radio is an option inside that group.',
    does: [
      ['Picks one option in a group', 'Pick many (use pixel-checkbox)'],
      ['Moves with arrow keys', 'Change the value while readonly'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the value', null, 0, 0),
      n('group', 'Radio group', 'One value', 'pixel-radio-group', 1, 0),
      n('option', 'One option', 'A radio', 'pixel-radio', 2, 0),
      n('keys', 'Arrow keys', 'Move the selection', null, 3, 0),
      n('form', 'Form', 'The group is the control', null, 1, 1),
    ],
    stories: {
      pick: {
        label: 'Pick one',
        steps: [
          st(['page', 'group', 'option'], ['page>group', 'group>option'], 'The page lists options and sets the current value on the group.'),
          st(['option', 'group', 'page'], ['option>group', 'group>page'], 'The user clicks an option or presses Space. The group updates the single value.'),
        ],
      },
      arrows: {
        label: 'Arrow keys',
        steps: [
          st(['keys', 'group', 'option'], ['keys>group', 'group>option'], 'Arrow keys move between options and select the next one. Disabled options are skipped.'),
          st(['group', 'form'], ['group>form'], 'The form sees one value for the group, not one value per option.'),
        ],
      },
      locked: {
        label: 'Readonly or disabled',
        steps: [
          st(['page', 'group'], ['page>group'], 'Readonly can be focused but does not change the value. Disabled options are skipped and cannot be chosen.'),
          st(['group'], [], 'No new value is written.', ['option']),
        ],
      },
    },
    states: [
      'None selected, or one selected.',
      'Disabled option: skipped.',
      'Readonly group: focusable, no change.',
      'Error on the group when the form is invalid.',
    ],
    mistakes: [
      'Bind the value on the group. A single radio does not own the selection.',
      'Readonly and disabled are different. Readonly still allows focus.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-toggle`,
    title: 'pixel-toggle',
    summary: 'Either a boolean switch, or a segmented control where one segment is chosen. The switch is on or off. The segmented control is a radio group. Both work with forms.',
    does: [
      ['Switches on or off, or picks one segment', 'Pick several segments at once'],
      ['Uses arrow keys on segments', 'Save the value inside the control when the page wants to own it'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the value', null, 0, 0),
      n('toggle', 'Toggle', 'Switch or segments', 'pixel-toggle', 1, 0),
      n('sw', 'Switch', 'On or off', null, 2, 0),
      n('seg', 'Segments', 'One of several', null, 3, 0),
      n('form', 'Form', 'Reads the value', null, 1, 1),
    ],
    stories: {
      switch: {
        label: 'Switch',
        steps: [
          st(['page', 'toggle', 'sw'], ['page>toggle', 'toggle>sw'], 'Boolean mode is a switch. The page sets on or off.'),
          st(['sw', 'page', 'form'], ['sw>page', 'sw>form'], 'The user clicks or presses Space. The new boolean is emitted. The page updates the value.'),
        ],
      },
      segments: {
        label: 'Segments',
        steps: [
          st(['page', 'toggle', 'seg'], ['page>toggle', 'toggle>seg'], 'Segmented mode is a radio group. One segment is selected.'),
          st(['seg', 'page'], ['seg>page'], 'Arrow keys move. Enter or Space selects. Disabled segments are skipped.'),
        ],
      },
    },
    states: [
      'Switch: off or on, plus disabled and readonly.',
      'Segments: one selected, keyboard focus on the active segment.',
      'Error when the form says the control is invalid.',
    ],
    mistakes: [
      'A switch is not a radio group. Segments are not several independent switches.',
      'Keep the value on the page or the form. Update it from the change event.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-select`,
    title: 'pixel-select',
    summary: 'A closed field that opens a list. One or many options can be chosen. The empty list is a short message inside the panel, not a full empty-state page. Loading more rows is paging, not virtualization.',
    does: [
      ['Opens a list and commits a choice', 'Create a brand-new value (use pixel-autocomplete when you need that)'],
      ['Supports single and multiple', 'Virtualize the list. Load-more only asks for the next page'],
    ],
    nodes: [
      n('page', 'Your page', 'Supplies options', null, 0, 0),
      n('select', 'Select', 'The field', 'pixel-select', 1, 0),
      n('list', 'List', 'The open panel', null, 2, 0),
      n('empty', 'Empty message', 'When there are no options', null, 3, 0),
      n('more', 'Load more', 'Next page of options', null, 1, 1),
      n('tags', 'Tags', 'Multiple values', null, 2, 1),
      n('skeleton', 'Skeleton', 'Placeholder', 'pixel-skeleton', 3, 1),
    ],
    stories: {
      single: {
        label: 'Pick one',
        steps: [
          st(['page', 'select'], ['page>select'], 'The page passes options. The field shows the current label or a placeholder.'),
          st(['select', 'list'], ['select>list'], 'The user opens it with click, Enter, Space, or Arrow Down. Focus moves in the list.'),
          st(['list', 'select', 'page'], ['list>select', 'select>page'], 'The user picks a row. The panel closes and the value updates. Escape closes without a new value.'),
        ],
      },
      multi: {
        label: 'Pick many',
        steps: [
          st(['select', 'list', 'tags'], ['select>list', 'list>tags'], 'Multiple mode keeps the chosen values as tags. Picking a row toggles it.'),
          st(['tags', 'select'], ['tags>select'], 'Backspace removes the last tag from the field. The page receives the new list.'),
        ],
      },
      empty: {
        label: 'No options',
        steps: [
          st(['page', 'select', 'list', 'empty'], ['page>select', 'select>list', 'list>empty'], 'The list is open and there is nothing to pick. A short empty message is shown in the panel.'),
          st(['more', 'page', 'list'], ['list>more', 'more>page'], 'If the page supports paging, the list asks for more. That is not a virtual scroll window.', ['empty']),
        ],
      },
      skeleton: {
        label: 'Skeleton',
        steps: [
          st(['page', 'skeleton'], ['page>skeleton'], 'Before options exist, the skeleton replaces the field.', ['select', 'list']),
          st(['page', 'select'], ['page>select'], 'Options arrive. The field is shown and can be opened.'),
        ],
      },
    },
    states: [
      'Closed, open, and loading more.',
      'Single value or tags.',
      'Empty list: a message in the panel.',
      'Disabled, readonly, and error from the form.',
      'Skeleton before the field is ready.',
    ],
    mistakes: [
      'The empty panel is not pixel-empty-state. It is a short message in the list.',
      'Load more is paging. It does not virtualize a huge list.',
      'Backspace on a multiple field removes a tag. Do not treat that as text editing.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-autocomplete`,
    title: 'pixel-autocomplete',
    summary: 'A text field with a suggestion panel. Focus stays in the field. The highlighted row is pointed at with aria-activedescendant. Multiple values become chips and the panel can stay open. A custom value is only for a single field.',
    does: [
      ['Filters suggestions as the user types', 'Move focus into the panel. Focus stays in the input'],
      ['Can add a new row when creatable', 'Commit a custom value on every keystroke when multiple is on'],
    ],
    nodes: [
      n('page', 'Your page', 'Supplies suggestions', null, 0, 0),
      n('field', 'Autocomplete', 'The input', 'pixel-autocomplete', 1, 0),
      n('panel', 'Suggestions', 'Highlighted row', null, 2, 0),
      n('chips', 'Chips', 'Multiple values', null, 3, 0),
      n('create', 'Create row', 'Only if creatable', null, 1, 1),
    ],
    stories: {
      pick: {
        label: 'Pick a suggestion',
        steps: [
          st(['page', 'field'], ['page>field'], 'The user focuses the field and types. Suggestions update.'),
          st(['field', 'panel'], ['field>panel'], 'Arrow keys move the highlight. Focus stays in the input. The active row is announced.'),
          st(['panel', 'field', 'page'], ['panel>field', 'field>page'], 'Enter commits the highlighted row. Escape closes the panel and leaves the text.'),
        ],
      },
      multi: {
        label: 'Several values',
        steps: [
          st(['field', 'panel', 'chips'], ['field>panel', 'panel>chips'], 'Multiple mode stores a list. Choosing a row adds a chip. The panel stays open.'),
          st(['chips', 'page'], ['chips>page'], 'Removing a chip updates the list. The value is a list, not one string.'),
        ],
      },
      create: {
        label: 'Create a value',
        steps: [
          st(['field', 'panel', 'create'], ['field>create', 'create>panel'], 'When creatable, a Create row appears for text that is not in the list.'),
          st(['create', 'field', 'page'], ['create>field', 'field>page'], 'Choosing Create commits that text. A custom value on every keystroke is single-value only, not multiple.', ['chips']),
        ],
      },
    },
    states: [
      'Closed, open, and highlighted row.',
      'Single value, or chips for many.',
      'Create row when the typed text is new and creatable is on.',
      'Disabled, readonly, and error.',
    ],
    mistakes: [
      'Do not move DOM focus into the panel. The input keeps focus.',
      'allowCustomValue commits as the user types, and only for a single value.',
      'Multiple mode is a list of values plus chips. The panel stays open after a pick.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-slider`,
    title: 'pixel-slider',
    summary: 'A slider on a native range input, so keyboard and screen readers work. One thumb is a single value. Two thumbs are a start and end. Discrete mode snaps to steps and shows ticks.',
    does: [
      ['Sets a number, or a start and end', 'Type a free-form date (use a date picker)'],
      ['Moves with arrows, Home, End, and Page Up or Down', 'Hide the native input. The native input is the control'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the value', null, 0, 0),
      n('slider', 'Slider', 'The control', 'pixel-slider', 1, 0),
      n('thumb', 'Thumb', 'One or two', null, 2, 0),
      n('form', 'Form', 'Reads the value', null, 3, 0),
      n('ticks', 'Ticks', 'Only if discrete', null, 1, 1),
    ],
    stories: {
      single: {
        label: 'One value',
        steps: [
          st(['page', 'slider', 'thumb'], ['page>slider', 'slider>thumb'], 'The page sets min, max, and the current value. The thumb sits on that value.'),
          st(['thumb', 'slider', 'form'], ['thumb>slider', 'slider>form'], 'Arrows nudge by one step. Home and End jump to the ends. Page Up and Page Down take a larger step.'),
        ],
      },
      range: {
        label: 'Start and end',
        steps: [
          st(['page', 'slider', 'thumb'], ['page>slider', 'slider>thumb'], 'Range mode has two thumbs. The value is a start and an end.'),
          st(['thumb', 'page'], ['thumb>page'], 'The user drags either thumb, or focuses it and uses the keys. The two values stay in order.'),
        ],
      },
      discrete: {
        label: 'Steps and ticks',
        steps: [
          st(['page', 'slider', 'ticks'], ['page>slider', 'slider>ticks'], 'Discrete mode snaps to the step and draws ticks. A bubble can show the value.'),
          st(['slider', 'form'], ['slider>form'], 'The form receives the snapped number, or the snapped pair in range mode.', ['thumb']),
        ],
      },
    },
    states: [
      'Single thumb or two thumbs.',
      'Dragging, keyboard focus on a thumb, disabled.',
      'Discrete: snapped value, ticks, and an optional value bubble.',
      'Invalid when the form validator fails.',
    ],
    mistakes: [
      'The slider is a native range input with role slider. Do not rebuild keyboard behavior on a div.',
      'Range mode is a pair. Do not bind a single number to it.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-file-upload`,
    title: 'pixel-file-upload',
    summary: 'A drop zone and a hidden file input. The user can drop files or press Enter or Space to open the system file dialog. Analytics may count files and coarse type or size buckets. It never records file names.',
    does: [
      ['Accepts dropped or picked files', 'Upload bytes by itself (the page or file-transfer service does that)'],
      ['Rejects the wrong type or a file that is too large', 'Send file names to analytics'],
    ],
    nodes: [
      n('page', 'Your page', 'Receives the files', null, 0, 0),
      n('zone', 'Drop zone', 'The control', 'pixel-file-upload', 1, 0),
      n('picker', 'File dialog', 'Hidden input', null, 2, 0),
      n('list', 'Chosen files', 'Names on screen only', null, 3, 0),
      n('error', 'Rejection', 'Type or size', null, 1, 1),
    ],
    stories: {
      pick: {
        label: 'Pick files',
        steps: [
          st(['page', 'zone'], ['page>zone'], 'The page sets accepted types and the max size. The zone is a button plus a hidden file input.'),
          st(['zone', 'picker', 'list'], ['zone>picker', 'picker>list'], 'Enter, Space, or a click opens the system dialog. Dropping files skips the dialog.'),
          st(['list', 'page'], ['list>page'], 'The page receives the files. Names stay on screen for the user. They are not sent to analytics.'),
        ],
      },
      reject: {
        label: 'Reject a file',
        steps: [
          st(['zone', 'error'], ['zone>error'], 'A file with the wrong type or a size over the limit is rejected. The message uses the component labels.'),
          st(['error'], [], 'The page does not receive that file as a successful add.', ['list']),
        ],
      },
    },
    states: [
      'Idle, drag-over, and disabled.',
      'Files listed after a successful pick.',
      'Error for type or size.',
      'Busy if the page shows progress while it uploads.',
    ],
    mistakes: [
      'This control collects files. It does not run the HTTP upload. Hand the files to your upload code or the file-transfer service.',
      'Never log file names in analytics. Counts and coarse buckets only.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-editor`,
    title: 'pixel-editor',
    summary: 'A rich text surface with a toolbar. Import it from pixel-ui/editor, not the main barrel. The toolbar is a toolbar. The writing area is a multiline textbox. Analytics records the command id only, never the document text.',
    does: [
      ['Edits formatted text', 'Send the document, a find query, or a pasted URL to analytics'],
      ['Runs toolbar commands', 'Include find-and-replace or a table toolbar (those are not in this control yet)'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the document', null, 0, 0),
      n('editor', 'Editor', 'The surface', 'pixel-editor', 1, 0),
      n('bar', 'Toolbar', 'Commands', null, 2, 0),
      n('doc', 'Document', 'What the user wrote', null, 3, 0),
    ],
    stories: {
      edit: {
        label: 'Edit',
        steps: [
          st(['page', 'editor', 'doc'], ['page>editor', 'editor>doc'], 'The page gives the editor a document. The user types in the textbox.'),
          st(['doc', 'page'], ['doc>page'], 'The page reads the updated document from the editor output. The text stays in the page, not in analytics.'),
        ],
      },
      command: {
        label: 'Toolbar command',
        steps: [
          st(['bar', 'doc'], ['bar>doc'], 'The user presses a toolbar button, such as bold. The command changes the selection in the document.'),
          st(['bar'], [], 'If analytics is on, only the command id is recorded. Not the text, not a search string, not a link URL.', ['page']),
        ],
      },
    },
    states: [
      'Ready, focused textbox, and disabled toolbar buttons when a command does not apply.',
      'Empty document.',
      'Read-only when the page disallows edits.',
    ],
    mistakes: [
      'Import from pixel-ui/editor.',
      'Do not expect a find toolbar or a table toolbar. They are deferred.',
      'Do not put document text in analytics.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-query-builder`,
    title: 'pixel-query-builder',
    summary: 'A form that builds a set of rules: field, operator, and value. The variant is only layout. An empty rule set is a validation alert, not an empty-state illustration. Value editors are normal Pixel fields.',
    does: [
      ['Builds a rule tree the page can save', 'Run the query against a server'],
      ['Uses Pixel inputs for values', 'Show pixel-empty-state when there are no rules'],
    ],
    nodes: [
      n('page', 'Your page', 'Saves the rules', null, 0, 0),
      n('builder', 'Query builder', 'The rule form', 'pixel-query-builder', 1, 0),
      n('rule', 'One rule', 'Field, operator, value', null, 2, 0),
      n('value', 'Value field', 'A Pixel input', 'pixel-input', 3, 0),
      n('alert', 'Empty alert', 'Validation, not an illustration', null, 1, 1),
    ],
    stories: {
      add: {
        label: 'Add a rule',
        steps: [
          st(['page', 'builder', 'rule'], ['page>builder', 'builder>rule'], 'The page shows the builder. The user adds a rule and picks a field and an operator.'),
          st(['rule', 'value', 'page'], ['rule>value', 'value>page'], 'The value is edited in a Pixel field. The page receives the rule tree.'),
        ],
      },
      empty: {
        label: 'No rules',
        steps: [
          st(['builder', 'alert'], ['builder>alert'], 'An empty rule set that is invalid shows an alert. It is not pixel-empty-state.'),
          st(['page', 'builder', 'rule'], ['page>builder', 'builder>rule'], 'The user adds a rule. The alert clears when the set is valid again.', ['alert']),
        ],
      },
    },
    states: [
      'Has rules, or empty and invalid.',
      'A rule mid-edit: field chosen, value not filled.',
      'Disabled when the page locks the builder.',
    ],
    mistakes: [
      'The variant changes layout only. It is not a different product.',
      'Do not replace the empty-rules alert with pixel-empty-state.',
    ],
  }),
];
