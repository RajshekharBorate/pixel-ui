import { piece } from './depth-shared.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const formDepth = {
  [`${lib}/pixel-input`]: piece(
    'The host is the field. The page owns the value through the form. The label always names the field, even when it is visually hidden. The clear button is off until the page asks for it. Loading covers the field, but it does not block typing unless the page also disables the field while loading.',
    `flowchart TB
  subgraph page [Your page]
    Value[Form value]
    LabelPos[Label: top, left, floating, or hidden]
    Busy[Loading, and whether typing stops]
  end
  subgraph field [Input]
    Native[The text field]
    Error[Error text tied to the field]
    Clear[Clear button, only if asked]
    Spinner[Spinner over the field]
  end
  Value --> Native
  LabelPos --> Native
  Native -->|typed value| Value
  Busy --> Spinner
  Busy -->|only if disable-while-loading| Native
  Clear -->|empties the value| Native`,
    [
      '**Label.** Top is the default. A left label stacks under the field on a narrow screen. Hidden still names the field for screen readers.',
      '**Empty is valid** unless the field is required.',
      '**Clear.** It appears only when show-clear is on and the field has text.',
      '**Loading.** The spinner is not inferred from the form, except a pending async validator can show the same spinner. Typing stays possible until the page disables the field while loading.',
      '**Nested errors.** A nested field inherits the parent errors only when that option is on.',
    ],
    [
      {
        title: 'Type',
        diagram: `sequenceDiagram
  participant Page
  participant Input
  participant Form
  Page->>Input: label and value
  Input->>Form: each change
  Note over Form: empty is valid unless required`,
        note: 'Bind the form to this field. Do not read the value only from the DOM. Left labels need room below the field on a small screen.',
      },
      {
        title: 'Error',
        diagram: `sequenceDiagram
  participant Form
  participant Input
  Form->>Input: touched and invalid
  Input->>Input: show the error and point the field at it
  opt a nested field should inherit parent errors
    Note over Input: only when that option is on
  end`,
        note: 'The error text is connected to the field. Do not assume a child control shows the parent message unless inheritance is turned on.',
      },
      {
        title: 'Clear',
        diagram: `sequenceDiagram
  actor User
  participant Input
  participant Page
  Page->>Input: show clear, and the field has text
  User->>Input: press clear
  Input->>Page: the value is empty
  Note over Input: no clear button when the option is off`,
        note: 'Clear is opt-in. An empty field does not show the button even when the option is on.',
      },
      {
        title: 'Loading',
        diagram: `sequenceDiagram
  participant Page
  participant Input
  Page->>Input: loading, or the form is still checking
  Note over Input: a spinner covers the field
  alt the page also disables while loading
    Note over Input: typing stops
  else that flag is off
    Note over Input: typing still works
  end
  Page->>Input: loading ends
  Note over Input: the spinner leaves`,
        note: 'Do not treat the spinner as a disabled field. The default is overlay only. Turn on disable-while-loading when the user must wait.',
      },
    ],
  ),

  [`${lib}/pixel-checkbox`]: piece(
    'The page or the form owns checked. Mixed is a temporary picture for a partial group. The next user toggle clears mixed and writes a real checked or unchecked value. Readonly can be focused and does not change. Disabled cannot be used.',
    `flowchart TB
  subgraph page [Your page or the form]
    Checked[Checked value]
    Mixed[Mixed, for a partial group]
    Lock[Readonly or disabled]
    Err[Error text]
  end
  subgraph box [Checkbox]
    View[The box]
  end
  Checked --> View
  Mixed --> View
  View -->|user toggle clears mixed| page
  Lock -->|readonly: focus, no change| View
  Lock -->|disabled: unavailable| View
  Err --> View`,
    [
      '**Checked is controlled.** Bind checked, or let the form write it. The box emits the next value.',
      '**Mixed is not a third saved value.** The next user toggle clears it.',
      '**Readonly stays in the tab order.** Disabled does not act. An error does not lock the box.',
      '**Error.** The page can force the error text, or the form can mark the control invalid.',
    ],
    [
      {
        title: 'Check',
        diagram: `sequenceDiagram
  actor User
  participant Box as Checkbox
  participant Page
  Page->>Box: checked or not
  User->>Box: click, Enter, or Space
  Box->>Page: the new checked value`,
        note: 'Update the bound value from that event. The box does not keep a private copy.',
      },
      {
        title: 'Mixed',
        diagram: `sequenceDiagram
  participant Page
  participant Box as Checkbox
  Page->>Box: mixed, some children are checked
  actor User
  User->>Box: toggle
  Box->>Page: mixed is cleared, and the value is really checked or not`,
        note: 'Use mixed for a parent of a partial group. Do not save mixed as the form value. The next toggle replaces it.',
      },
      {
        title: 'Readonly or disabled',
        diagram: `sequenceDiagram
  participant Page
  participant Box as Checkbox
  alt readonly
    Page->>Box: focusable, no change
  else disabled
    Page->>Box: unavailable
  end
  Note over Box: no change event`,
        note: 'Readonly is not disabled. The user can still tab to it and hear the current value.',
      },
      {
        title: 'Error',
        diagram: `sequenceDiagram
  participant Page
  participant Box as Checkbox
  Page->>Box: forced error, or the form is invalid
  Note over Box: the error shows
  alt also disabled or readonly
    Note over Box: the value does not change
  else the box is editable
    Note over Box: the user can still toggle it
  end`,
        note: 'An error is a message. It does not block the toggle. Disabled and readonly do.',
      },
    ],
  ),

  [`${lib}/pixel-radio`]: piece(
    'The group owns the one selected value, the arrow keys, and the form binding. Each radio is only an option. Readonly can be focused and does not change. Disabled options are skipped.',
    `flowchart TB
  subgraph page [Your page]
    Value[One value]
  end
  subgraph group [Radio group]
    Keys[Arrow keys]
    Form[The form control]
  end
  subgraph option [One option]
    Radio[A radio]
  end
  Value --> group
  group --> Radio
  Keys --> group
  Radio -->|click or Space| group
  group -->|one value| Form`,
    [
      '**Bind the value on the group.** A single radio does not own the selection.',
      '**Arrows move and select.** Disabled options are skipped.',
      '**Readonly versus disabled.** Readonly can take focus and does not change the value. Disabled options cannot be chosen.',
    ],
    [
      {
        title: 'Pick one',
        diagram: `sequenceDiagram
  actor User
  participant Group as Radio group
  participant Page
  Page->>Group: options and the current value
  User->>Group: click or Space
  Group->>Page: the single new value`,
        note: 'The form sees one control, the group. Do not bind a separate form control on each radio.',
      },
      {
        title: 'Arrow keys',
        diagram: `sequenceDiagram
  actor User
  participant Group as Radio group
  User->>Group: arrow
  alt the next option is disabled
    Group->>Group: skip it
  else it can be chosen
    Group->>Group: select it
  end`,
        note: 'Arrow keys both move and select. That is the radio pattern. Do not require a second Enter to commit.',
      },
      {
        title: 'Readonly or disabled',
        diagram: `sequenceDiagram
  participant Page
  participant Group as Radio group
  alt readonly
    Page->>Group: focus, no new value
  else an option is disabled
    Note over Group: that option is skipped
  end`,
        note: 'A readonly group is still announced. It just refuses the change.',
      },
    ],
  ),

  [`${lib}/pixel-toggle`]: piece(
    'A switch is one boolean. Segments are a radio group: one segment is chosen. The page or the form owns the value. The control emits the next value and does not store it.',
    `flowchart TB
  subgraph page [Your page]
    Value[Boolean or selected segment]
  end
  subgraph toggle [Toggle]
    Switch[Switch]
    Seg[Segments]
  end
  Value -->|boolean mode| Switch
  Value -->|segment mode| Seg
  Switch -->|next boolean| page
  Seg -->|arrow or press| page`,
    [
      '**Switch.** Click or Space flips the boolean. It is not a radio group.',
      '**Segments.** Arrow keys move. Disabled segments are skipped. One segment is selected.',
      '**Write the value back.** If the page ignores the event, the control stays as it was.',
    ],
    [
      {
        title: 'Switch',
        diagram: `sequenceDiagram
  actor User
  participant Switch as Toggle
  participant Page
  Page->>Switch: on or off
  User->>Switch: click or Space
  Switch->>Page: the next boolean
  alt the page writes it back
    Page->>Switch: updated
  else the page ignores it
    Note over Switch: looks unchanged
  end`,
        note: 'Use a switch for a single on or off. Do not use it to pick one of several labels. That is the segmented control.',
      },
      {
        title: 'Segments',
        diagram: `sequenceDiagram
  actor User
  participant Seg as Segments
  participant Page
  Page->>Seg: one selected segment
  User->>Seg: arrow, Enter, or Space
  alt the segment is disabled
    Note over Seg: skipped
  else it can be chosen
    Seg->>Page: the new value
  end`,
        note: 'Segments are one choice, like radios. They are not several independent switches.',
      },
    ],
  ),

  [`${lib}/pixel-select`]: piece(
    'The field is closed until the user opens a list. The page supplies the options. Choosing a row commits it. An empty list is a short message in the panel, not a full empty-state page. Load-more asks for the next page. It does not virtualize the list.',
    `flowchart TB
  subgraph page [Your page]
    Options[Options, and the next page]
    Value[One value or many]
  end
  subgraph field [Select]
    Closed[Closed field]
    List[Open list]
    Tags[Tags, when many]
    Empty[Short empty message]
  end
  Options --> Closed
  Closed -->|open| List
  List -->|one choice| Value
  List -->|toggle a tag| Tags
  List -->|nothing to pick| Empty
  List -->|ask for more| page`,
    [
      '**Open.** Click, Enter, Space, or Arrow Down opens the list. Escape closes it without a new value.',
      '**Single.** Picking a row closes the panel and updates the value.',
      '**Many.** Chosen values stay as tags. Backspace removes the last tag. That is not text editing.',
      '**Empty.** The message is inside the panel. Do not put pixel-empty-state there.',
      '**Skeleton.** It replaces the field until options exist.',
    ],
    [
      {
        title: 'Pick one',
        diagram: `sequenceDiagram
  actor User
  participant Select
  participant Page
  Page->>Select: options and the current label
  User->>Select: open the list
  alt the user picks a row
    Select->>Page: the value, and the panel closes
  else Escape
    Note over Select: close with no new value
  end`,
        note: 'The closed field shows the current label or a placeholder. Do not treat the open list as a dialog. Escape cancels.',
      },
      {
        title: 'Pick many',
        diagram: `sequenceDiagram
  actor User
  participant Select
  participant Page
  User->>Select: toggle a row
  Note over Select: the panel stays useful for another pick
  User->>Select: Backspace
  Select->>Page: the last tag is removed`,
        note: 'The value is a list. Backspace on the field removes a tag. It does not edit the tag text.',
      },
      {
        title: 'No options',
        diagram: `sequenceDiagram
  participant Page
  participant List as List
  Page->>List: open, and there is nothing to pick
  List->>List: short empty message
  opt the page supports another page
    List->>Page: load more
    Note over List: this is paging, not virtual scroll
  end`,
        note: 'Load more means “ask the page for the next page of options”. It does not window a huge list in place.',
      },
      {
        title: 'Skeleton',
        diagram: `sequenceDiagram
  participant Page
  participant Skeleton
  participant Select
  Page->>Skeleton: before options exist
  Note over Select: the field is not shown
  Page->>Select: options arrive`,
        note: 'Do not open an empty list while the skeleton is up. Wait until the field is real.',
      },
    ],
  ),

  [`${lib}/pixel-autocomplete`]: piece(
    'Focus stays in the text field. Arrow keys move a highlight in the panel, announced from the field. They do not move DOM focus into the list. Multiple values are chips, and the panel stays open after a pick. A custom value on every keystroke is single-value only.',
    `flowchart TB
  subgraph page [Your page]
    Suggestions[Suggestions]
  end
  subgraph field [Autocomplete]
    Input[The input keeps focus]
    Panel[Highlighted row]
    Chips[Chips, when many]
    Create[Create row, when allowed]
  end
  Suggestions --> Panel
  Input -->|arrows| Panel
  Panel -->|Enter commits| Input
  Panel -->|many: add a chip, stay open| Chips
  Create -->|new text| Input`,
    [
      '**Focus stays in the input.** The active row is pointed at. Do not move focus into the panel.',
      '**Escape closes the panel** and leaves the typed text.',
      '**Several values.** The value is a list plus chips. Choosing a row does not close the panel.',
      '**Create.** A Create row appears for text that is not in the list, when creatable is on. Committing a custom value on every keystroke is single-value only.',
    ],
    [
      {
        title: 'Pick a suggestion',
        diagram: `sequenceDiagram
  actor User
  participant Field as Autocomplete
  participant Page
  User->>Field: type
  Page->>Field: suggestions
  User->>Field: arrows, focus stays in the input
  alt Enter on a highlighted row
    Field->>Page: that value
  else Escape
    Note over Field: panel closes, text stays
  end`,
        note: 'Do not put a second focusable list on top of this field. The input is the only tab stop.',
      },
      {
        title: 'Several values',
        diagram: `sequenceDiagram
  participant Field as Autocomplete
  participant Page
  Field->>Field: add a chip, keep the panel open
  Field->>Page: the list of values
  Note over Field: not one string`,
        note: 'Removing a chip updates the list. Do not bind a single string to multiple mode.',
      },
      {
        title: 'Create a value',
        diagram: `sequenceDiagram
  participant Field as Autocomplete
  participant Page
  alt creatable, and the text is new
    Field->>Field: show a Create row
    Field->>Page: choosing it commits that text
  else custom value on every keystroke
    Note over Field: single value only, not chips
  end`,
        note: 'Do not turn on “commit as the user types” together with multiple. That path is for one value.',
      },
    ],
  ),

  [`${lib}/pixel-slider`]: piece(
    'The slider is a native range input, so the keyboard and screen readers already work. One thumb is a number. Two thumbs are a start and an end. Discrete mode snaps to the step and can show ticks.',
    `flowchart TB
  subgraph page [Your page]
    Range[Min, max, and step]
    Value[One number, or a start and end]
  end
  subgraph slider [Slider]
    Thumb[One thumb or two]
    Ticks[Ticks, only if discrete]
  end
  Range --> Thumb
  Value --> Thumb
  Thumb -->|arrows, Home, End, Page Up, Page Down| page
  Thumb --> Ticks`,
    [
      '**Do not rebuild the keys on a div.** The native input is the control.',
      '**One value.** Arrows move one step. Home and End jump to the ends. Page Up and Page Down take a larger step.',
      '**Range.** The value is a pair. The two thumbs stay in order.',
      '**Discrete.** The form receives the snapped number, or the snapped pair.',
    ],
    [
      {
        title: 'One value',
        diagram: `sequenceDiagram
  actor User
  participant Slider
  participant Page
  Page->>Slider: min, max, and the value
  User->>Slider: arrows, Home, End, or Page keys
  Slider->>Page: the new number`,
        note: 'Bind a single number. Do not bind a pair unless range mode is on.',
      },
      {
        title: 'Start and end',
        diagram: `sequenceDiagram
  actor User
  participant Slider
  participant Page
  Page->>Slider: a start and an end
  User->>Slider: drag either thumb, or focus it and use the keys
  Slider->>Page: the pair, still in order`,
        note: 'Range mode is a tuple. The start does not pass the end.',
      },
      {
        title: 'Steps and ticks',
        diagram: `sequenceDiagram
  participant Page
  participant Slider
  Page->>Slider: discrete step
  Slider->>Slider: snap, draw ticks, optional value bubble
  Slider->>Page: the snapped value`,
        note: 'The bubble is a display of the snapped value. The form value is the number, not the bubble text.',
      },
    ],
  ),

  [`${lib}/pixel-file-upload`]: piece(
    'The drop zone collects files. It does not upload them. The page, or the file-transfer service, sends the bytes. Analytics may count files and coarse type or size buckets. It never records file names.',
    `flowchart TB
  subgraph page [Your page]
    Rules[Accepted types and max size]
    Upload[Your upload, or file transfer]
  end
  subgraph zone [Drop zone]
    Button[Button plus a hidden file input]
    List[Names on screen only]
    Error[Type or size rejection]
  end
  Rules --> Button
  Button -->|dialog or drop| List
  List -->|the files| Upload
  Button -->|wrong type or too big| Error`,
    [
      '**Enter, Space, or click** opens the system file dialog. A drop skips the dialog.',
      '**Rejection.** That file is not a successful add. The message uses the component labels.',
      '**Names stay on screen** for the user. Do not send them to analytics.',
    ],
    [
      {
        title: 'Pick files',
        diagram: `sequenceDiagram
  actor User
  participant Zone as Drop zone
  participant Page
  Page->>Zone: types and max size
  alt click, Enter, or Space
    Zone->>Zone: system file dialog
  else drop
    Zone->>Zone: use the dropped files
  end
  Zone->>Page: the accepted files
  Note over Zone: names are on screen, not in analytics`,
        note: 'Hand the files to your upload code. This control stops once the page has the File list.',
      },
      {
        title: 'Reject a file',
        diagram: `sequenceDiagram
  participant Zone as Drop zone
  participant Page
  Zone->>Zone: wrong type or over the size limit
  Note over Page: that file is not added`,
        note: 'Show the component’s own message. Do not log the file name.',
      },
    ],
  ),

  [`${lib}/pixel-editor`]: piece(
    'Import the editor from pixel-ui/editor, not the main barrel. The toolbar runs commands. The writing area is a multiline text box. Analytics records the command id only, never the document.',
    `flowchart TB
  subgraph page [Your page]
    Doc[The document]
  end
  subgraph editor [Editor]
    Bar[Toolbar]
    Surface[Writing surface]
  end
  Doc --> Surface
  Bar -->|command id| Surface
  Surface -->|updated document| page
  Bar -.->|analytics: command id only| page`,
    [
      '**The page owns the document.** The editor reports the update. The text is not an analytics payload.',
      '**Toolbar.** Bold and the other commands change the selection. If analytics is on, only the command id is recorded.',
      '**Not included.** Find-and-replace and a table toolbar are not in this control yet.',
    ],
    [
      {
        title: 'Edit',
        diagram: `sequenceDiagram
  actor User
  participant Editor
  participant Page
  Page->>Editor: the document
  User->>Editor: type
  Editor->>Page: the updated document
  Note over Page: the text stays in the page, not in analytics`,
        note: 'Read the document from the editor output. Do not scrape the DOM for the saved value.',
      },
      {
        title: 'Toolbar command',
        diagram: `sequenceDiagram
  actor User
  participant Bar as Toolbar
  participant Doc as Document
  User->>Bar: a command, such as bold
  Bar->>Doc: change the selection
  Note over Bar: analytics gets the command id only`,
        note: 'Do not put the document, a search string, a link URL, or pasted text into analytics.',
      },
    ],
  ),

  [`${lib}/pixel-query-builder`]: piece(
    'The builder edits a nested rule tree. It does not run the query. The page saves the tree and runs it. An empty nested group is always invalid. The root may be empty unless the page marks the builder required. Export drops internal ids.',
    `flowchart TB
  subgraph page [Your page]
    Save[Save the tree]
    Run[Run the query yourself]
  end
  subgraph builder [Query builder]
    Group[AND or OR group]
    Rule[Field, operator, value]
    Alert[Empty-group alert]
  end
  page --> Group
  Group --> Rule
  Rule -->|Pixel field| Group
  Group -->|empty nested group| Alert
  Group -->|export without internal ids| Save`,
    [
      '**Variant is layout only.** Ruleset, tree, card, and compact are the same tree.',
      '**Value editors are normal Pixel fields.**',
      '**Depth.** Nesting stops at the configured max.',
      '**Empty.** A nested group with no children always shows an alert. That alert is not pixel-empty-state. The root is invalid only when required is on.',
      '**Export.** Call export when you need the payload. Internal ids stay in the component and are omitted from the payload.',
    ],
    [
      {
        title: 'Add a rule',
        diagram: `sequenceDiagram
  actor User
  participant Builder as Query builder
  participant Page
  User->>Builder: add a rule, pick field and operator
  User->>Builder: edit the value in a Pixel field
  Builder->>Page: the rule tree`,
        note: 'The page stores the tree. The builder does not call your API.',
      },
      {
        title: 'Nest a group',
        diagram: `sequenceDiagram
  actor User
  participant Builder as Query builder
  User->>Builder: add a nested group and pick AND or OR
  alt under the max depth
    Builder->>Builder: the group joins the tree
  else at the max depth
    Note over Builder: another group is not added
  end
  Note over Builder: export omits internal ids`,
        note: 'The page should save the nested shape from export, not a private copy of the component’s ids. Those ids are regenerated on import.',
      },
      {
        title: 'No rules',
        diagram: `sequenceDiagram
  participant Builder as Query builder
  alt a nested group is empty
    Builder->>Builder: always show the alert
  else the root is empty
    alt the page marked the builder required
      Builder->>Builder: the root is invalid
    else required is off
      Note over Builder: an empty root is valid
    end
  end`,
        note: 'Do not replace this alert with pixel-empty-state. Incomplete rules, missing a field or a value, are still validated in both modes.',
      },
    ],
  ),
};
