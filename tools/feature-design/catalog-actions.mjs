import { feature, n, st } from './helpers.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const actionFeatures = [
  feature({
    dir: `${lib}/pixel-button`,
    title: 'pixel-button',
    summary: 'A button the page uses for an action, a form submit, or a pressed/not-pressed toggle. The page owns the pressed state. The button only reports what the user did.',
    does: [
      ['Runs a click, submit, or reset', 'Open a menu by itself (use pixel-split-button or pixel-menu)'],
      ['Shows loading, success, and error', 'Decide if the person is allowed to press it (the page or access check does that)'],
      ['Announces loading to screen readers', 'Send the button label to analytics'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the action', null, 0, 0),
      n('button', 'Button', 'The control', 'pixel-button', 1, 0),
      n('form', 'Form', 'Submit or reset', null, 2, 0),
      n('access', 'Access check', 'Allow or deny', 'pixelAccess', 3, 0),
      n('loading', 'Loading', 'Busy wins', 'pixel-loader', 1, 1),
      n('toggle', 'Pressed state', 'Page keeps it', 'pressed + change', 2, 1),
      n('live', 'Live region', 'Says "loading"', 'aria-live', 0, 2),
      n('skeleton', 'Skeleton', 'Placeholder', 'pixel-skeleton', 3, 2),
    ],
    stories: {
      click: {
        label: 'Click',
        steps: [
          st(['page', 'button'], ['page>button'], 'The page puts a label on the button. It is a real button, so Enter and Space work.'),
          st(['button', 'page'], ['button>page'], 'The user clicks or presses Enter or Space. The page hears the click and does the work.'),
        ],
      },
      disabled: {
        label: 'Disabled',
        steps: [
          st(['page', 'button'], ['page>button'], 'The page marks the button disabled.'),
          st(['button'], [], 'Clicks and keys do nothing. The button stays in the tab order only as a disabled control.', ['page']),
        ],
      },
      loading: {
        label: 'Loading wins',
        steps: [
          st(['page', 'button', 'loading'], ['page>button', 'button>loading'], 'Work starts. Loading is shown even if the button is also disabled or denied.'),
          st(['button', 'live'], ['button>live'], 'The button is busy. Screen readers hear the loading label. The user cannot press it again.'),
          st(['page', 'button'], ['page>button'], 'Work ends. The page clears loading. Success or error can show on the button if the page sets that state.'),
        ],
      },
      denied: {
        label: 'Access denied',
        steps: [
          st(['access', 'button'], ['access>button'], 'The access check says no. This blocks the button when it is not loading.'),
          st(['button'], [], 'The user cannot run the action. Loading, if it starts later, still wins over this block.', ['page']),
        ],
      },
      toggle: {
        label: 'Toggle',
        steps: [
          st(['page', 'toggle', 'button'], ['page>toggle', 'toggle>button'], 'The page sets pressed or not pressed. The button does not remember this by itself.'),
          st(['button', 'page', 'toggle'], ['button>page', 'page>toggle'], 'The user presses it. The button emits the change. The page updates pressed, and the button follows.'),
        ],
      },
      skeleton: {
        label: 'Skeleton',
        steps: [
          st(['page', 'skeleton'], ['page>skeleton'], 'The page is not ready. A skeleton the size of the button is shown.', ['button']),
          st(['page', 'button'], ['page>button'], 'Data arrives. The skeleton goes away and the real button is shown.'),
        ],
      },
    },
    states: [
      'Default, hover, and keyboard focus (a visible focus ring only for the keyboard).',
      'Pressed, for a toggle.',
      'Disabled: no action.',
      'Loading: busy, announced, and not pressable. Loading wins over disabled and over an access denial.',
      'Success and error: the page sets these after the work.',
      'Skeleton: a placeholder instead of the button.',
    ],
    mistakes: [
      'Do not treat a toggle as self-managed. Bind pressed, and update it when change fires.',
      'Do not put another button inside this button.',
      'Analytics, if turned on, records the action id only. It does not record the label.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-button-group`,
    title: 'pixel-button-group',
    summary: 'A row or column of pixel-button controls that belong together. The group is a label for the set. Each button still owns its own click, loading, and pressed state.',
    does: [
      ['Groups related buttons', 'Replace each button’s own disabled or loading state'],
      ['Can disable the whole group visually', 'Remove buttons from the accessibility tree by itself'],
    ],
    nodes: [
      n('page', 'Your page', 'Places the buttons', null, 0, 0),
      n('group', 'Button group', 'The set', 'pixel-button-group', 1, 0),
      n('one', 'One button', 'Keeps its own state', 'pixel-button', 2, 0),
      n('two', 'Another button', 'Keeps its own state', 'pixel-button', 3, 0),
    ],
    stories: {
      group: {
        label: 'A set of actions',
        steps: [
          st(['page', 'group', 'one', 'two'], ['page>group', 'group>one', 'group>two'], 'The page puts two or more buttons in the group. The group is announced as a group.'),
          st(['one', 'page'], ['one>page'], 'The user presses one button. Only that button reports the click. The other button is unchanged.'),
        ],
      },
      disable: {
        label: 'Disable the set',
        steps: [
          st(['page', 'group'], ['page>group'], 'The page disables the group. Pointers cannot hit the buttons.'),
          st(['page', 'one', 'two'], ['page>one', 'page>two'], 'Also disable each button. Otherwise a screen reader can still reach an enabled button inside a group that only looks off.', ['group']),
        ],
      },
    },
    states: [
      'Each child button still has its own hover, focus, loading, pressed, and disabled states.',
      'A disabled group blocks the pointer. Disable the children too so assistive tech matches.',
    ],
    mistakes: [
      'Do not rely on the group disabled flag alone for screen readers. Disable each pixel-button as well.',
      'Do not use the group as one big button. Each action stays its own button.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-split-button`,
    title: 'pixel-split-button',
    summary: 'One control with two parts: the main action, and a small arrow that opens a menu. The menu is a sibling pixel-menu. The arrow does not run the main action.',
    does: [
      ['Runs the main action from the large part', 'Put the menu items inside the button'],
      ['Opens the menu from the arrow', 'Run the main action when the arrow is pressed'],
    ],
    nodes: [
      n('page', 'Your page', 'Handles the main action', null, 0, 0),
      n('split', 'Split button', 'Two segments', 'pixel-split-button', 1, 0),
      n('main', 'Main segment', 'The action', 'pixel-button', 2, 0),
      n('caret', 'Arrow', 'Opens the menu', null, 1, 1),
      n('menu', 'Menu', 'More actions', 'pixel-menu', 2, 1),
    ],
    stories: {
      main: {
        label: 'Main action',
        steps: [
          st(['page', 'split', 'main'], ['page>split', 'split>main'], 'The page sets the main label. The large part is the action.'),
          st(['main', 'page'], ['main>page'], 'The user clicks the large part. The page runs that action. The menu stays closed.', ['menu', 'caret']),
        ],
      },
      menu: {
        label: 'Open the menu',
        steps: [
          st(['caret', 'menu'], ['caret>menu'], 'The user clicks the arrow, or uses the keyboard on it. The sibling menu opens.'),
          st(['menu', 'page'], ['menu>page'], 'The user picks an item. The page handles that item. The main action does not run.'),
        ],
      },
      busy: {
        label: 'Loading or disabled',
        steps: [
          st(['page', 'split', 'main', 'caret'], ['page>split', 'split>main', 'split>caret'], 'Loading or disabled turns off both parts.'),
          st(['split'], [], 'The user cannot run the action or open the menu until the page clears that state.', ['menu']),
        ],
      },
    },
    states: [
      'Default: both parts ready.',
      'Menu open: the arrow has expanded the menu.',
      'Loading or disabled: both the main part and the arrow are off.',
    ],
    mistakes: [
      'Do not put pixel-menu inside the button. Place it as a sibling and point the split button at it.',
      'Do not expect the arrow click to emit the main action.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-badge`,
    title: 'pixel-badge',
    summary: 'A small status mark: a count, a dot, a status, or a short label. It can be plain text, a button, or a removable chip-like control. The type picks the picture. Clickable and removable pick the behavior.',
    does: [
      ['Shows a count, dot, status, or label', 'Replace a toast or a dialog'],
      ['Can be pressed or removed when asked', 'Navigate by itself'],
    ],
    nodes: [
      n('page', 'Your page', 'Sets the value', null, 0, 0),
      n('badge', 'Badge', 'The mark', 'pixel-badge', 1, 0),
      n('count', 'Count', 'A number', null, 2, 0),
      n('live', 'Status text', 'Read aloud if static', 'role=status', 1, 1),
      n('press', 'Press', 'Only if clickable', null, 2, 1),
    ],
    stories: {
      count: {
        label: 'Count',
        steps: [
          st(['page', 'badge', 'count'], ['page>badge', 'badge>count'], 'The page sets a count. The badge shows the number, or a cap when the number is large.'),
          st(['badge', 'live'], ['badge>live'], 'If the badge is not a button, it is a status. The name is derived, for example "10 notifications".'),
        ],
      },
      press: {
        label: 'Press or remove',
        steps: [
          st(['page', 'badge', 'press'], ['page>badge', 'badge>press'], 'The page marks it clickable or removable. It becomes a real button.'),
          st(['press', 'page'], ['press>page'], 'The user presses it or removes it. The page updates the value. A live status is not used on the button itself.', ['live']),
        ],
      },
    },
    states: [
      'Count, dot, status, or label — the type chooses the picture.',
      'Plain: announced as status.',
      'Clickable or removable: a button, with its own name.',
    ],
    mistakes: [
      'Do not use the type string to mean "clickable". Clickable and removable are separate flags.',
      'Do not announce a static badge twice. The status role is for the non-interactive badge.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-chip`,
    title: 'pixel-chip',
    summary: 'A compact token for a filter, a person, or a typed value. A single chip can be selected, removed, or dragged when those flags are on. A chip set owns a list: selection, overflow, typing a new chip, and reorder.',
    does: [
      ['Shows one token, or a set of them', 'Act as a select menu (use pixel-select)'],
      ['Lets the set handle arrows, delete, and typing', 'Store the list inside one chip'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns the list', null, 0, 0),
      n('set', 'Chip set', 'The list', 'pixel-chip-set', 1, 0),
      n('chip', 'One chip', 'A token', 'pixel-chip', 2, 0),
      n('input', 'Type a chip', 'Adds one', null, 3, 0),
      n('keys', 'Keyboard', 'Arrows and delete', null, 1, 1),
    ],
    stories: {
      select: {
        label: 'Select chips',
        steps: [
          st(['page', 'set', 'chip'], ['page>set', 'set>chip'], 'The page gives the set a list. The set shows one chip per item.'),
          st(['keys', 'set', 'chip'], ['keys>set', 'set>chip'], 'Arrow keys move between chips. Enter or Space selects. The page hears the new selection.'),
        ],
      },
      remove: {
        label: 'Remove',
        steps: [
          st(['keys', 'chip', 'set'], ['keys>chip', 'chip>set'], 'Delete or Backspace removes the focused chip when removal is allowed.'),
          st(['set', 'page'], ['set>page'], 'The set tells the page. The page updates the list. Escape cancels an in-progress edit.'),
        ],
      },
      type: {
        label: 'Type a new chip',
        steps: [
          st(['input', 'set'], ['input>set'], 'The user types in the set’s field and confirms. A new chip is added.'),
          st(['set', 'page'], ['set>page'], 'The page receives the new list. One chip does not own this field by itself.', ['chip']),
        ],
      },
    },
    states: [
      'Default, selected, disabled, and removable.',
      'Overflow: extra chips collapse into a summary the set controls.',
      'Editing: the set’s input is active. Escape leaves it.',
    ],
    mistakes: [
      'Capabilities are booleans (selectable, removable, draggable). They are not the chip type string.',
      'Put selection, overflow, typing, and reorder on the chip set, not on a lone chip.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-avatar`,
    title: 'pixel-avatar',
    summary: 'A person mark. It tries an image first, then initials, then an icon, then a plain placeholder. A clickable avatar is a real button. A group can show a few people and an overflow count.',
    does: [
      ['Shows a person or a group of people', 'Upload a photo (use pixel-file-upload)'],
      ['Falls back when the image fails', 'Invent a name'],
    ],
    nodes: [
      n('page', 'Your page', 'Passes the person', null, 0, 0),
      n('avatar', 'Avatar', 'One person', 'pixel-avatar', 1, 0),
      n('image', 'Image', 'Tried first', null, 2, 0),
      n('initials', 'Initials', 'If no image', null, 3, 0),
      n('group', 'Avatar group', 'Several people', 'pixel-avatar-group', 1, 1),
      n('more', 'Overflow', 'How many more', null, 2, 1),
    ],
    stories: {
      image: {
        label: 'Photo',
        steps: [
          st(['page', 'avatar', 'image'], ['page>avatar', 'avatar>image'], 'The page passes an image. The avatar shows it.'),
          st(['avatar'], [], 'If the image fails, initials are used. If there are no initials, an icon, then a placeholder.', ['image']),
        ],
      },
      press: {
        label: 'Press',
        steps: [
          st(['page', 'avatar'], ['page>avatar'], 'The page makes it clickable. It renders as a button with an accessible name.'),
          st(['avatar', 'page'], ['avatar>page'], 'The user presses it. A decorative avatar is not a button. It is only an image.'),
        ],
      },
      group: {
        label: 'Group',
        steps: [
          st(['page', 'group', 'avatar'], ['page>group', 'group>avatar'], 'The page passes several people. The group shows the first few avatars.'),
          st(['group', 'more'], ['group>more'], 'The rest become an overflow chip on the group, not on a single avatar.'),
        ],
      },
    },
    states: [
      'Image, initials, icon, or placeholder — the first one that works.',
      'Decorative: an image, not a control.',
      'Clickable: a button.',
      'Group overflow: a count of people who did not fit.',
    ],
    mistakes: [
      'Do not put the overflow count on a single avatar. It belongs to pixel-avatar-group.',
      'Give a clickable avatar a name. A decorative one should not be a tab stop.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-card`,
    title: 'pixel-card',
    summary: 'A surface for a title, text, media, and actions. Empty slots disappear. If the whole card is the action, it behaves like a button. Do not put other buttons inside an interactive card.',
    does: [
      ['Groups content on a surface', 'Trap focus (it is not a dialog)'],
      ['Can be selectable or fully clickable', 'Keep showing a header when there is no title'],
    ],
    nodes: [
      n('page', 'Your page', 'Fills the slots', null, 0, 0),
      n('card', 'Card', 'The surface', 'pixel-card', 1, 0),
      n('header', 'Header', 'Title and subtitle', null, 2, 0),
      n('body', 'Body', 'Projected content', null, 3, 0),
      n('press', 'Interactive', 'The card is the button', null, 1, 1),
      n('skeleton', 'Skeleton', 'Placeholder', 'pixel-skeleton', 2, 1),
    ],
    stories: {
      static: {
        label: 'Read-only card',
        steps: [
          st(['page', 'card', 'header', 'body'], ['page>card', 'card>header', 'card>body'], 'The page sets a title and body. The header appears only when there is a title or subtitle.'),
          st(['card'], [], 'Empty slots collapse. Actions in the card are their own buttons.', ['press']),
        ],
      },
      press: {
        label: 'The card is the action',
        steps: [
          st(['page', 'card', 'press'], ['page>card', 'card>press'], 'The page marks the card interactive. Enter on keydown and Space on keyup activate it, like a button.'),
          st(['press', 'page'], ['press>page'], 'The user activates it. Do not nest another button, link, or input inside this card.'),
        ],
      },
      select: {
        label: 'Selectable',
        steps: [
          st(['page', 'card'], ['page>card'], 'Selectable and interactive together use a pressed state so the user can tell it is on.'),
          st(['card', 'page'], ['card>page'], 'The page stores selected. The card does not keep a private copy.'),
        ],
      },
      skeleton: {
        label: 'Skeleton',
        steps: [
          st(['page', 'skeleton'], ['page>skeleton'], 'While loading, the skeleton replaces the card. The card is not a button and has no tab stop.', ['press']),
          st(['page', 'card', 'body'], ['page>card', 'card>body'], 'Content arrives. The skeleton leaves and the card returns.'),
        ],
      },
    },
    states: [
      'Static surface with only the slots that have content.',
      'Interactive: one button for the whole card.',
      'Selectable: pressed when the page says it is selected.',
      'Skeleton: no role and no tab stop until content is ready.',
    ],
    mistakes: [
      'Never nest a button, link, or input inside an interactive card. The card already is the control.',
      'Do not show a header for a card with no title and no subtitle.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-divider`,
    title: 'pixel-divider',
    summary: 'A line that separates regions. Horizontal is the default. Vertical only works when the parent has a height. A label is for horizontal lines only.',
    does: [
      ['Draws a horizontal or vertical rule', 'Replace a heading'],
      ['Can show a short label on a horizontal line', 'Label a vertical line'],
    ],
    nodes: [
      n('page', 'Your page', 'Chooses the direction', null, 0, 0),
      n('line', 'Divider', 'The rule', 'pixel-divider', 1, 0),
      n('label', 'Label', 'Horizontal only', null, 2, 0),
      n('skeleton', 'Skeleton', 'Placeholder', 'pixel-skeleton', 1, 1),
    ],
    stories: {
      horizontal: {
        label: 'Horizontal',
        steps: [
          st(['page', 'line'], ['page>line'], 'The page places a divider. It is horizontal and announced as a separator.'),
          st(['page', 'line', 'label'], ['page>line', 'line>label'], 'A label, if set, sits on that horizontal line. Inset and dashed or dotted styles stay on the same line.'),
        ],
      },
      vertical: {
        label: 'Vertical',
        steps: [
          st(['page', 'line'], ['page>line'], 'The page asks for vertical. The parent must have a height, or the line has nothing to stretch through.'),
          st(['line'], [], 'A label is not used on a vertical line.', ['label']),
        ],
      },
      skeleton: {
        label: 'Skeleton',
        steps: [
          st(['page', 'skeleton'], ['page>skeleton'], 'The page shows a skeleton. The divider is busy and is not the real rule yet.', ['line']),
          st(['page', 'line'], ['page>line'], 'Ready. The skeleton leaves and the rule is shown.'),
        ],
      },
    },
    states: [
      'Horizontal (default) or vertical.',
      'Solid, dashed, or dotted.',
      'With or without a label (label is horizontal only).',
      'Inset, or full bleed.',
      'Skeleton while loading.',
    ],
    mistakes: [
      'A vertical divider in a parent with no height will not show. Give the parent a height.',
      'Do not put a label on a vertical divider.',
    ],
  }),
];
