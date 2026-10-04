import { piece } from './depth-shared.mjs';

const lib = 'projects/pixel-ui/src/lib';

const buttonWho = `The page decides what the button means. The button decides whether that action is allowed to run right now, then reports what the user did. It does not remember a toggle, and it does not decide permissions.

\`\`\`mermaid
flowchart TB
  subgraph owners [Your page owns the meaning]
    Label[Label, icons, and accessible name]
    Asked[Asked state: loading, disabled, success, error]
    Pressed[Pressed value, only when it is a toggle]
    Type[Type: button, submit, or reset]
  end

  subgraph button [The button owns the moment of the click]
    Resolve[Which state actually wins]
    Native[Native button]
    Live[Hidden live region]
    Report[Click event, and toggle events]
  end

  subgraph neighbors [Neighbors]
    Access[Access check on this button]
    Form[Surrounding form]
    Skeleton[Skeleton]
  end

  Label --> Native
  Asked --> Resolve
  Access -->|deny disables the button| Resolve
  Resolve --> Native
  Resolve -->|loading text| Live
  Pressed --> Native
  Native --> Report
  Report -->|what the user did| owners
  Type --> Form
  Native -->|submit or reset, when the click is allowed| Form
  owners -->|not ready yet| Skeleton
\`\`\`

**How to read the picture**

- **Page → button.** The page passes the label, the type, the asked state, and, for a toggle, the pressed value. Changing those inputs is the only way the button changes its mind.
- **Access check → which state wins.** A rule that disables this button is treated like the disabled input. A rule that hides it removes the button from the page. That hide is the access directive, not a third button style.
- **Which state wins → native button.** Loading is checked first. While loading, the button is busy and cannot be pressed, even if it is also disabled or denied. After that, disabled and an access denial are the same result: the button is off. Success and error are colors the page sets. They do not block the click.
- **Native button → form.** \`type="submit"\` or \`type="reset"\` uses the browser’s normal form behavior. Loading or disabled cancels that, so a busy submit button does not submit.
- **Native button → your page.** A successful press emits \`click\`. A toggle also emits the next pressed value. The button does not store that value. If the page does not write it back, the button stays as it was.
- **Page → skeleton.** While the skeleton is on, the native button is not created. There is no tab stop and no click.

The click does not bubble to a parent. Listen on the button itself.`;

const buttonSteps = `Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Click

\`\`\`mermaid
sequenceDiagram
  actor User
  participant Page
  participant Button

  Page->>Button: label, type, and appearance
  User->>Button: click, Enter, or Space
  alt loading or disabled
    Button->>Button: cancel the event
    Note over Button: no click event, and a submit does not submit
  else the press is allowed
    Button->>Page: click event
    opt an analytics action id is set
      Button-->>Button: record the action id, appearance, size, and mouse or keyboard
    end
  end
\`\`\`

The button is a real \`<button>\`, so Enter and Space work without extra key handlers. The focus ring appears for the keyboard, not for a mouse press.

Analytics is off unless the app provides the analytics token and the button has an action id. The event records that id, the appearance, the size, and whether the press came from the mouse or the keyboard. It never records the label. An icon-only button still needs its own accessible name, because the icon is decorative.

### Disabled

\`\`\`mermaid
sequenceDiagram
  participant Page
  participant Access as Access check
  participant Button

  alt the page sets disabled, or state disabled
    Page->>Button: disabled
  else the access rule disables this button
    Access->>Button: deny
  end
  Note over Button: both end as the same disabled button
  Button->>Button: click and keys do nothing
\`\`\`

Disabled and an access denial look the same on the button: it stays in the tab order, and it does not run. Hiding is different. A hide rule removes the control. It is not a faded button.

The button is still disabled if the page sets the disabled input, or if it sets the state to disabled. Either one is enough.

### Loading wins

\`\`\`mermaid
sequenceDiagram
  actor User
  participant Page
  participant Button
  participant Live as Live region

  Page->>Button: state loading
  Note over Button: loading beats disabled and an access denial
  Button->>Live: say the loading label
  User->>Button: click or key
  Button->>Button: cancel the event
  Page->>Button: clear loading
  opt the page sets success or error
    Page->>Button: success or error color
    Note over Button: the click works again
  end
\`\`\`

Set loading when the work starts, and clear it when the work ends. The button will not clear itself. Success and error are only colors. They do not mean the work is finished, and they do not block the next click.

The live region is hidden text. Screen readers hear the loading label (default “Loading”). The visible button shows a spinner sized to the button.

### Access denied

\`\`\`mermaid
sequenceDiagram
  participant Access as Access check
  participant Button
  participant Page

  alt the rule hides the button
    Access->>Button: remove it from the page
    Note over Button: not a faded button, and not a tab stop
  else the rule disables the button
    Access->>Button: same result as disabled
  end
  opt the page sets loading while the button is still denied
    Page->>Button: loading
    Note over Button: loading wins until the page clears it
  end
\`\`\`

Use the access check for chrome on this button. A real security decision still belongs on the server. The button only reflects the answer it is given.

### Toggle

\`\`\`mermaid
sequenceDiagram
  actor User
  participant Page
  participant Button

  Page->>Button: toggleable, and the current pressed value
  User->>Button: press
  Button->>Page: click, plus the next pressed value
  alt the page writes that value back
    Page->>Button: pressed updated
    Note over Button: aria-pressed matches the page
  else the page ignores the event
    Note over Button: the button looks unchanged
  end
\`\`\`

This is a controlled toggle. The button calculates the next value and emits it. It never stores it. Bind the pressed input, and update it from the change event.

Do not use a toggle to open a menu. A split button is the control with a main action and a menu.

### Skeleton

\`\`\`mermaid
sequenceDiagram
  participant Page
  participant Skeleton
  participant Button

  Page->>Skeleton: show skeleton
  Note over Button: the native button is not created
  Page->>Button: hide skeleton when the label is known
  Note over Button: the button enters the tab order now
\`\`\`

The skeleton matches the button’s size: a short bar for a text button, a square for an icon button. It is not a disabled button. Users cannot focus it or press it.

### Submit or reset

\`\`\`mermaid
sequenceDiagram
  actor User
  participant Page
  participant Button
  participant Form

  Page->>Button: type submit or reset, inside a form
  User->>Button: activate
  alt loading or disabled
    Button->>Button: cancel the event
    Note over Form: the form does not submit or reset
  else the press is allowed
    Button->>Page: click event
    Button->>Form: browser submits or resets
  end
\`\`\`

The button does not submit the form itself. The browser does, because the native type is submit or reset. That is also why a loading submit button must cancel the event: otherwise the form would send while the work from the previous press is still running.

A button with the default type does not submit. Put the submit type only on the button that should send the form.`;

export const actionDepth = {
  [`${lib}/pixel-button`]: { who: buttonWho, steps: buttonSteps },

  [`${lib}/pixel-button-group`]: piece(
    'The group is only a label for a set of buttons. Each button still owns its own click, loading, and pressed state. Disabling the group stops the pointer. It does not, by itself, tell a screen reader that the buttons are off.',
    `flowchart TB
  subgraph page [Your page]
    List[Which buttons belong together]
    Off[Whether the whole set is off]
  end
  subgraph group [Button group]
    Name[Group name]
  end
  subgraph children [Each pixel-button]
    One[First action]
    Two[Second action]
  end
  List --> Name
  Name --> One
  Name --> Two
  Off -->|pointer only| group
  Off -->|also set disabled on each child| children`,
    [
      '**Page → group.** The group announces the set. It does not replace the buttons.',
      '**Group → each button.** A press hits one button. The other buttons do not change.',
      '**Disable the set.** Turning the group off blocks the pointer. Also disable each child, or a screen reader can still reach an enabled button inside a group that only looks off.',
    ],
    [
      {
        title: 'A set of actions',
        diagram: `sequenceDiagram
  participant Page
  participant Group as Button group
  participant One as One button
  participant Two as Another button
  Page->>Group: related buttons
  Group->>One: first action
  Group->>Two: second action
  One->>Page: only this click
  Note over Two: the other button is unchanged`,
        note: 'Use the group when the actions belong together, such as a toolbar cluster. Do not make the group itself the button. Each action stays a pixel-button, with its own loading and toggle.',
      },
      {
        title: 'Disable the set',
        diagram: `sequenceDiagram
  participant Page
  participant Group as Button group
  participant One as One button
  participant Two as Another button
  Page->>Group: group disabled
  Note over Group: pointer cannot hit the children
  Page->>One: disable this button too
  Page->>Two: disable this button too`,
        note: 'The group flag is visual and pointer-only. Assistive tech still walks the children. Disable every pixel-button in the set when the whole set is unavailable.',
      },
    ],
  ),

  [`${lib}/pixel-split-button`]: piece(
    'One control, two jobs. The large part runs the main action. The arrow only opens a sibling menu. The menu is not inside the button.',
    `flowchart TB
  subgraph page [Your page]
    Action[Main action handler]
    Items[Menu item handlers]
  end
  subgraph split [Split button]
    Main[Large segment]
    Caret[Arrow]
  end
  subgraph menu [Sibling pixel-menu]
    List[Menu items]
  end
  Action --> Main
  Main -->|click| Action
  Caret -->|opens| List
  List -->|chosen item| Items
  page -->|loading or disabled| split`,
    [
      '**Large segment → page.** That click is the main action. The menu stays closed.',
      '**Arrow → menu.** The arrow does not emit the main action. Place pixel-menu as a sibling and point the split button at it.',
      '**Loading or disabled → both parts.** Neither the action nor the menu can run until the page clears that state.',
    ],
    [
      {
        title: 'Main action',
        diagram: `sequenceDiagram
  actor User
  participant Split as Split button
  participant Page
  participant Menu
  User->>Split: press the large part
  Split->>Page: main action
  Note over Menu: stays closed`,
        note: 'Put the primary label on the large part. Do not expect the arrow click to run the same action.',
      },
      {
        title: 'Open the menu',
        diagram: `sequenceDiagram
  actor User
  participant Caret as Arrow
  participant Menu
  participant Page
  User->>Caret: click or keyboard
  Caret->>Menu: open the sibling menu
  User->>Menu: pick an item
  Menu->>Page: that item only
  Note over Page: the main action did not run`,
        note: 'The menu lives beside the split button, not inside it. Closing the menu does not activate the large segment.',
      },
      {
        title: 'Loading or disabled',
        diagram: `sequenceDiagram
  participant Page
  participant Split as Split button
  participant Menu
  Page->>Split: loading or disabled
  Note over Split: large part and arrow are both off
  Note over Menu: cannot open`,
        note: 'Do not disable only the large part. A user could still open the menu and run a second action while the main work is busy.',
      },
    ],
  ),

  [`${lib}/pixel-badge`]: piece(
    'The type picks the picture: a count, a dot, a status, or a short label. Clickable and removable are separate flags. They turn the badge into a button. A plain badge is a status, not a control.',
    `flowchart TB
  subgraph page [Your page]
    Value[Count, status, or label]
    Flags[Clickable or removable]
  end
  subgraph badge [Badge]
    Picture[The mark]
    Name[Accessible name]
  end
  Value --> Picture
  Picture -->|not a button| Name
  Flags -->|becomes a button| Picture
  Picture -->|press or remove| page`,
    [
      '**Type → picture.** Do not use the type string to mean clickable. That is a separate flag.',
      '**Plain badge → status.** A non-interactive badge is announced as a status. The name is derived, for example “10 notifications”.',
      '**Clickable or removable → button.** The page hears the press and updates the value. Do not also treat that button as a live status.',
    ],
    [
      {
        title: 'Count',
        diagram: `sequenceDiagram
  participant Page
  participant Badge
  Page->>Badge: count
  alt the number is within the cap
    Badge->>Badge: show the number
  else the number is over the cap
    Badge->>Badge: show the cap
  end
  Note over Badge: announced as a status when it is not a button`,
        note: 'A static badge should be announced once. Do not wrap it in a second live region that repeats the same number.',
      },
      {
        title: 'Press or remove',
        diagram: `sequenceDiagram
  actor User
  participant Badge
  participant Page
  Page->>Badge: clickable or removable
  Note over Badge: this is a button, not a status
  User->>Badge: press or remove
  Badge->>Page: the page updates the value`,
        note: 'The button needs a name of its own. Removing the badge does not navigate. The page decides what the removal means.',
      },
    ],
  ),

  [`${lib}/pixel-chip`]: piece(
    'One chip is a token. The chip set owns the list: which chips are selected, which are hidden in the overflow, typing a new chip, and reorder. Do not put that list behavior on a single chip.',
    `flowchart TB
  subgraph page [Your page]
    Items[The list of values]
  end
  subgraph set [Chip set]
    Keys[Arrows, Enter, Delete, Escape]
    Field[Type a new chip]
    Overflow[Overflow summary]
  end
  subgraph chip [One chip]
    Token[The token]
  end
  Items --> set
  set --> Token
  Keys --> set
  Field --> set
  set -->|new list| page`,
    [
      '**Page → set.** The page owns the array. The set renders it.',
      '**Keys → set.** Arrows move. Enter or Space selects. Delete or Backspace removes when removal is allowed. Escape cancels an edit.',
      '**Type-a-chip field.** That field belongs to the set. A lone chip does not have it.',
      '**Flags, not the type string.** Selectable, removable, and draggable are booleans.',
    ],
    [
      {
        title: 'Select chips',
        diagram: `sequenceDiagram
  actor User
  participant Set as Chip set
  participant Page
  Page->>Set: the list
  User->>Set: arrow, then Enter or Space
  Set->>Page: the new selection`,
        note: 'Selection lives on the set. One chip only shows whether it is in that selection.',
      },
      {
        title: 'Remove',
        diagram: `sequenceDiagram
  actor User
  participant Set as Chip set
  participant Page
  User->>Set: Delete or Backspace on the focused chip
  alt removal is allowed
    Set->>Page: the list without that chip
  else removal is off
    Note over Set: the chip stays
  end`,
        note: 'Do not remove a chip from inside the chip component’s own click if the set is managing the list. Let the set report the new array.',
      },
      {
        title: 'Type a new chip',
        diagram: `sequenceDiagram
  actor User
  participant Field as Type a chip
  participant Set as Chip set
  participant Page
  User->>Field: type and confirm
  Field->>Set: add one chip
  Set->>Page: the new list
  User->>Field: Escape
  Note over Field: the edit is cancelled`,
        note: 'The input is part of the set. Confirming adds a chip. Escape leaves the edit without adding one.',
      },
    ],
  ),

  [`${lib}/pixel-avatar`]: piece(
    'The avatar tries a photo first, then initials, then an icon, then a plain placeholder. A clickable avatar is a real button. The overflow count belongs to the group, not to one person.',
    `flowchart TB
  subgraph page [Your page]
    Person[Image, initials, or icon]
    Press[Whether it is clickable]
    People[Several people]
  end
  subgraph one [One avatar]
    Photo[Image]
    Letters[Initials]
    Mark[Icon or placeholder]
  end
  subgraph many [Avatar group]
    More[Overflow count]
  end
  Person --> Photo
  Photo -->|image fails| Letters
  Letters -->|no initials| Mark
  Press -->|real button| one
  People --> many
  many --> More`,
    [
      '**Image → initials → icon → placeholder.** The first one that works is shown. A failed image is not a broken layout.',
      '**Clickable → button.** Give it an accessible name. A decorative avatar is not a tab stop.',
      '**Group → overflow.** The “and N more” chip is on pixel-avatar-group. Do not put that count on a single avatar.',
    ],
    [
      {
        title: 'Photo',
        diagram: `sequenceDiagram
  participant Page
  participant Avatar
  Page->>Avatar: image
  alt the image loads
    Avatar->>Avatar: show the photo
  else the image fails
    Avatar->>Avatar: initials, then icon, then placeholder
  end`,
        note: 'Pass initials when you have a name, so the fallback is readable. Do not invent a name in the avatar.',
      },
      {
        title: 'Press',
        diagram: `sequenceDiagram
  actor User
  participant Avatar
  participant Page
  alt clickable
    Page->>Avatar: button with a name
    User->>Avatar: press
    Avatar->>Page: the click
  else decorative
    Note over Avatar: image only, not a tab stop
  end`,
        note: 'A decorative avatar must not be a button. A clickable one must have a name, because the image may not load.',
      },
      {
        title: 'Group',
        diagram: `sequenceDiagram
  participant Page
  participant Group as Avatar group
  participant More as Overflow
  Page->>Group: several people
  Group->>Group: show the first few
  Group->>More: the rest as a count`,
        note: 'The overflow chip is part of the group. It is not another person and it is not a badge you add by hand.',
      },
    ],
  ),

  [`${lib}/pixel-card`]: piece(
    'A card is a surface. Empty slots disappear. If the whole card is the action, it is the button, and you must not put another button, link, or input inside it.',
    `flowchart TB
  subgraph page [Your page]
    Slots[Title, body, media, actions]
    Mode[Static, interactive, or selectable]
  end
  subgraph card [Card]
    Header[Header, only with a title or subtitle]
    Body[Projected content]
    Press[The card as one button]
  end
  Slots --> Header
  Slots --> Body
  Mode -->|interactive| Press
  Press -->|activate| page
  page -->|not ready| Skeleton[Skeleton replaces the card]`,
    [
      '**Empty slots collapse.** A header appears only when there is a title or a subtitle.',
      '**Interactive card.** Enter on key down and Space on key up activate it, like a button. Do not nest another control inside it.',
      '**Selectable.** The page stores selected. Together with interactive, the card exposes a pressed state.',
      '**Skeleton.** The card is not a button and has no tab stop until the content is ready.',
    ],
    [
      {
        title: 'Read-only card',
        diagram: `sequenceDiagram
  participant Page
  participant Card
  Page->>Card: title and body
  alt there is a title or subtitle
    Card->>Card: show the header
  else no title and no subtitle
    Note over Card: the header slot collapses
  end`,
        note: 'Actions in a static card are their own buttons. The card surface itself is not one of them.',
      },
      {
        title: 'The card is the action',
        diagram: `sequenceDiagram
  actor User
  participant Card
  participant Page
  Page->>Card: interactive
  User->>Card: Enter or Space
  Card->>Page: the card activated
  Note over Card: do not put a button, link, or input inside`,
        note: 'The card is already the control. A nested button steals the click and breaks the keyboard behavior.',
      },
      {
        title: 'Selectable',
        diagram: `sequenceDiagram
  participant Page
  participant Card
  Page->>Card: selected or not
  Card->>Page: the user toggles it
  alt the page writes selected back
    Page->>Card: pressed state updates
  else the page ignores it
    Note over Card: the card does not keep its own selected copy
  end`,
        note: 'Selectable is controlled. The card shows pressed when the page says it is selected. It does not store that on its own.',
      },
      {
        title: 'Skeleton',
        diagram: `sequenceDiagram
  participant Page
  participant Skeleton
  participant Card
  Page->>Skeleton: show skeleton
  Note over Card: no role and no tab stop
  Page->>Card: content arrives
  Note over Skeleton: the placeholder leaves`,
        note: 'Do not leave the interactive role on while the skeleton is showing. The skeleton replaces the card.',
      },
    ],
  ),

  [`${lib}/pixel-divider`]: piece(
    'A divider is a separator, not a heading. Horizontal is the default. Vertical only works when the parent has a height. A label is allowed only on a horizontal line.',
    `flowchart TB
  subgraph page [Your page]
    Direction[Horizontal or vertical]
    Words[Optional label]
  end
  subgraph line [Divider]
    Rule[The rule]
  end
  Direction --> Rule
  Words -->|horizontal only| Rule
  page -->|parent has no height| Fail[Vertical line has nothing to stretch through]`,
    [
      '**Horizontal is the default.** It is announced as a separator.',
      '**Vertical.** The parent must have a height. Otherwise the line does not show.',
      '**Label.** Only on a horizontal line. Inset, dashed, and dotted stay on that same line.',
      '**Skeleton.** The placeholder replaces the rule until the page is ready.',
    ],
    [
      {
        title: 'Horizontal',
        diagram: `sequenceDiagram
  participant Page
  participant Line as Divider
  Page->>Line: horizontal separator
  opt a label is set
    Page->>Line: label sits on the line
  end`,
        note: 'Use a label for a short section name on the line. Do not use the divider as the page heading.',
      },
      {
        title: 'Vertical',
        diagram: `sequenceDiagram
  participant Page
  participant Line as Divider
  Page->>Line: vertical
  alt the parent has a height
    Line->>Line: the rule stretches
  else the parent has no height
    Note over Line: nothing to draw
  end
  Note over Line: a label is not used`,
        note: 'Give the parent a height before you ask for a vertical divider. Do not add a label to it.',
      },
      {
        title: 'Skeleton',
        diagram: `sequenceDiagram
  participant Page
  participant Skeleton
  participant Line as Divider
  Page->>Skeleton: placeholder
  Note over Line: the real rule is not shown yet
  Page->>Line: ready`,
        note: 'The skeleton uses the same shimmer as other placeholders. It is not a second style of rule.',
      },
    ],
  ),
};
