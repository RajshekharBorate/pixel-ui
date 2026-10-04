import { feature, n, st } from './helpers.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const overlayFeatures = [
  feature({
    dir: `${lib}/pixel-dialog`,
    title: 'pixel-dialog',
    summary: 'A modal window. Focus is trapped inside until it closes. Escape and the scrim close it only when the page allows dismiss. A confirm dialog is an alert dialog. The body scrolls, not the whole page.',
    does: [
      ['Shows a modal and restores focus to the trigger', 'Close on Escape when the page marked it not dismissable'],
      ['Records open and close reasons if analytics is on', 'Send the dialog title to analytics'],
    ],
    nodes: [
      n('page', 'Your page', 'Opens the dialog', null, 0, 0),
      n('dialog', 'Dialog', 'The modal', 'pixel-dialog', 1, 0),
      n('focus', 'Focus trap', 'Stays inside', null, 2, 0),
      n('scrim', 'Scrim', 'The dim page', null, 3, 0),
      n('confirm', 'Confirm', 'Alert dialog', null, 1, 1),
      n('analytics', 'Analytics', 'Reason only', null, 2, 1),
    ],
    stories: {
      open: {
        label: 'Open and close',
        steps: [
          st(['page', 'dialog', 'focus'], ['page>dialog', 'dialog>focus'], 'The page opens the dialog. Focus moves inside. Tab stays in the dialog. The page behind does not scroll.'),
          st(['dialog', 'page', 'focus'], ['dialog>page'], 'The user closes it with the close control. Focus returns to the trigger.'),
        ],
      },
      dismiss: {
        label: 'Escape or scrim',
        steps: [
          st(['scrim', 'dialog'], ['scrim>dialog'], 'If dismissable, Escape or a scrim click closes the dialog.'),
          st(['dialog', 'analytics', 'page'], ['dialog>analytics', 'dialog>page'], 'The close reason is escape, scrim, close, or programmatic. The title is never recorded.'),
        ],
      },
      locked: {
        label: 'Must choose',
        steps: [
          st(['page', 'dialog', 'confirm'], ['page>dialog', 'dialog>confirm'], 'A confirm dialog is an alert dialog. If it is not dismissable, Escape and the scrim do nothing.'),
          st(['confirm', 'page'], ['confirm>page'], 'The user picks a button. The page closes the dialog and continues.'),
        ],
      },
    },
    states: [
      'Closed.',
      'Open, focus trapped, body scrolling inside the dialog.',
      'Dismissable or locked.',
      'Confirm: alert dialog.',
    ],
    mistakes: [
      'Do not send the title to analytics. Send the close reason only.',
      'A locked dialog must not close on Escape or the scrim.',
      'Restore focus to the trigger. Do not leave focus on the body.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-drawer`,
    title: 'pixel-drawer',
    summary: 'A panel that slides in from an edge. It traps focus and locks page scroll, like a dialog. Escape and the scrim close it when dismiss is allowed. A side drawer uses the viewport height.',
    does: [
      ['Shows a side or edge panel with a footer slot', 'Leave the page scrollable while open'],
      ['Restores focus on close', 'Send the drawer title to analytics'],
    ],
    nodes: [
      n('page', 'Your page', 'Opens the drawer', null, 0, 0),
      n('drawer', 'Drawer', 'The panel', 'pixel-drawer', 1, 0),
      n('focus', 'Focus trap', 'Stays inside', null, 2, 0),
      n('scrim', 'Scrim', 'Closes if allowed', null, 3, 0),
      n('footer', 'Footer', 'Actions', null, 1, 1),
    ],
    stories: {
      open: {
        label: 'Open',
        steps: [
          st(['page', 'drawer', 'focus'], ['page>drawer', 'drawer>focus'], 'The page opens the drawer on the chosen edge. Focus moves inside. The page does not scroll.'),
          st(['drawer', 'footer'], ['drawer>footer'], 'Actions sit in the footer slot. The body of the drawer scrolls if the content is long.'),
        ],
      },
      close: {
        label: 'Close',
        steps: [
          st(['scrim', 'drawer', 'page'], ['scrim>drawer', 'drawer>page'], 'Escape, the scrim, or the close control closes it when dismiss is allowed. Focus returns to the trigger.'),
          st(['drawer'], [], 'If the page forbids dismiss, only an explicit action in the page or footer closes it.', ['scrim']),
        ],
      },
    },
    states: [
      'Closed or open.',
      'Edge: start, end, top, or bottom. Horizontal drawers use the viewport height.',
      'Dismissable or locked.',
    ],
    mistakes: [
      'Do not keep scrolling the page behind an open drawer.',
      'Analytics, if on, records drawer open and close without the title.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-popover`,
    title: 'pixel-popover',
    summary: 'A small panel tied to a trigger. It is not a modal: there is no focus trap and no scrim. Escape returns focus to the trigger. A click outside closes it without moving focus. A nested menu does not close the popover.',
    does: [
      ['Opens a panel next to a trigger', 'Trap focus or dim the page'],
      ['Closes on Escape, outside click, or Tab away', 'Close when a nested menu opens'],
    ],
    nodes: [
      n('page', 'Your page', 'Owns open', null, 0, 0),
      n('trigger', 'Trigger', 'The button', null, 1, 0),
      n('panel', 'Popover', 'The panel', 'pixel-popover', 2, 0),
      n('nested', 'Nested menu', 'Stays inside', 'pixel-menu', 3, 0),
    ],
    stories: {
      open: {
        label: 'Open',
        steps: [
          st(['trigger', 'panel'], ['trigger>panel'], 'The user clicks the trigger, or the page calls open. The panel is a dialog in name only. Focus is not trapped.'),
          st(['panel', 'page'], ['panel>page'], 'The page can also call close or toggle.'),
        ],
      },
      dismiss: {
        label: 'Dismiss',
        steps: [
          st(['panel', 'trigger'], ['panel>trigger'], 'Escape closes the panel and puts focus back on the trigger.'),
          st(['panel'], [], 'A pointer click outside closes it and does not move focus. Tabbing out also closes it.', ['nested']),
        ],
      },
      nested: {
        label: 'Nested menu',
        steps: [
          st(['panel', 'nested'], ['panel>nested'], 'A menu inside the popover can open. That does not dismiss the popover.'),
          st(['nested', 'panel'], ['nested>panel'], 'Closing the nested menu leaves the popover open until Escape, an outside click, or Tab away.'),
        ],
      },
    },
    states: [
      'Closed or open.',
      'Nested overlay open, popover still open.',
      'Dismissed by Escape, outside pointer, or Tab.',
    ],
    mistakes: [
      'Do not add a scrim or a focus trap. This is not a dialog.',
      'Do not close the popover just because a menu inside it opened.',
      'An outside click closes the panel but does not steal focus.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-menu`,
    title: 'pixel-menu',
    summary: 'A list of actions opened from a trigger, or from a right-click. A submenu opens on hover or Arrow Right. Escape closes and returns focus to the trigger. The panel is moved to the document body and keeps the theme.',
    does: [
      ['Opens a menu of actions', 'Show a skeleton or virtualize rows'],
      ['Supports nested menus', 'Trap the whole page like a modal'],
    ],
    nodes: [
      n('trigger', 'Trigger', 'Click or right-click', null, 0, 0),
      n('menu', 'Menu', 'The list', 'pixel-menu', 1, 0),
      n('item', 'Item', 'One action', null, 2, 0),
      n('sub', 'Submenu', 'Arrow Right', null, 3, 0),
      n('theme', 'Theme', 'Copied onto the body panel', null, 1, 1),
    ],
    stories: {
      click: {
        label: 'Click to open',
        steps: [
          st(['trigger', 'menu', 'theme'], ['trigger>menu', 'menu>theme'], 'A click on the trigger opens the menu. The panel is portaled and the current theme is copied so colors still work.'),
          st(['menu', 'item', 'trigger'], ['menu>item'], 'The user picks an item or presses Escape. Escape returns focus to the trigger.'),
        ],
      },
      context: {
        label: 'Right-click',
        steps: [
          st(['trigger', 'menu'], ['trigger>menu'], 'Context-menu mode opens at the pointer when the user right-clicks the trigger.'),
          st(['item', 'menu'], ['item>menu'], 'Choosing an item or pressing Escape closes it.'),
        ],
      },
      nested: {
        label: 'Submenu',
        steps: [
          st(['menu', 'sub'], ['menu>sub'], 'Hover or Arrow Right opens a nested menu. Arrow Left returns to the parent item.'),
          st(['sub', 'trigger'], ['sub>trigger'], 'Escape closes the stack and restores the trigger. There is no skeleton and no virtualized list.', ['theme']),
        ],
      },
    },
    states: [
      'Closed, open, and submenu open.',
      'Keyboard highlight moving with arrows.',
      'Disabled item: skipped.',
    ],
    mistakes: [
      'The open panel is not inside the trigger’s component tree. Theme tokens are copied on purpose.',
      'Do not add a skeleton or row virtualization. The menu is a short action list.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-tooltip`,
    title: 'pixel-tooltip',
    summary: 'A short hint on hover or keyboard focus. An empty message turns the tooltip off. It flips when it would overflow the screen. It hides if the user clicks or drags the host. It can also show only when the label is cut off.',
    does: [
      ['Shows a hint and points at it with aria-describedby', 'Stay open after a click on the host'],
      ['Flips to stay on screen', 'Show when the message is empty'],
    ],
    nodes: [
      n('host', 'Host', 'The control', null, 0, 0),
      n('tip', 'Tooltip', 'The hint', 'pixel-tooltip', 1, 0),
      n('keys', 'Keyboard focus', 'Also reveals it', null, 2, 0),
      n('clip', 'Overflow check', 'Only if asked', null, 1, 1),
    ],
    stories: {
      show: {
        label: 'Show and hide',
        steps: [
          st(['host', 'tip', 'keys'], ['host>tip', 'keys>tip'], 'Hover or keyboard focus shows the tooltip. It is a tooltip role and is described from the host.'),
          st(['tip', 'host'], ['tip>host'], 'It flips if it would overflow. A click or a drag on the host dismisses it. Moving the pointer away hides it too.'),
        ],
      },
      empty: {
        label: 'Empty message',
        steps: [
          st(['host'], [], 'The page leaves the message empty.', ['tip', 'keys']),
          st(['host'], [], 'An empty message turns the tooltip off, so nothing is announced. Show-on-overflow is the exception: a clipped label uses the host text. aria-describedby is set only while a hint is visible.', ['tip']),
        ],
      },
      overflow: {
        label: 'Only when clipped',
        steps: [
          st(['host', 'clip', 'tip'], ['host>clip', 'clip>tip'], 'When show-on-overflow is on, the hint appears only if the label is actually clipped.'),
          st(['host'], [], 'If the full label fits, the tooltip stays off.', ['tip']),
        ],
      },
    },
    states: [
      'Hidden.',
      'Visible on hover or keyboard focus.',
      'Flipped to fit.',
      'Suppressed when the message is empty, or when the label is not clipped.',
    ],
    mistakes: [
      'Do not use a tooltip as the only name of an icon button. Give the button its own label.',
      'Empty text disables the tooltip. Do not leave a blank bubble.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-toast`,
    title: 'pixel-toast',
    summary: 'A short message that stacks on the screen. Mount the container once. The service queues toasts. Loading and promise toasts stay until the page closes them. Error and warning are assertive. The title and message are never sent to analytics.',
    does: [
      ['Shows a temporary message', 'Save the message in the notification inbox'],
      ['Queues several toasts', 'Auto-dismiss a loading toast'],
    ],
    nodes: [
      n('page', 'Your page', 'Asks for a toast', null, 0, 0),
      n('service', 'Toast service', 'The queue', 'PixelToastService', 1, 0),
      n('container', 'Container', 'Mount once', 'pixel-toast-container', 2, 0),
      n('toast', 'Toast', 'One message', 'pixel-toast', 3, 0),
      n('inline', 'Inline toast', 'In the page flow', null, 1, 1),
    ],
    stories: {
      show: {
        label: 'Show a toast',
        steps: [
          st(['page', 'service', 'container'], ['page>service', 'service>container'], 'The page calls the service. The container, mounted once, shows the toast.'),
          st(['toast', 'service'], ['container>toast'], 'Info and success use a polite status. They dismiss on their own unless the page says otherwise.'),
        ],
      },
      alert: {
        label: 'Error or warning',
        steps: [
          st(['service', 'toast'], ['service>toast'], 'Error and warning use an alert and are assertive, so screen readers interrupt.'),
          st(['toast'], [], 'Escape dismisses a toast that has focus. The title and message are not analytics.', ['inline']),
        ],
      },
      sticky: {
        label: 'Loading',
        steps: [
          st(['page', 'service', 'toast'], ['page>service', 'service>toast'], 'A loading toast or a promise toast stays until the work ends. It does not time out.'),
          st(['page', 'service'], ['page>service'], 'The page resolves or dismisses it. An inline toast is a different placement in the page, not the corner stack.', ['container']),
        ],
      },
    },
    states: [
      'Queued, visible, and dismissed.',
      'Info or success: polite.',
      'Error or warning: assertive alert.',
      'Loading or promise: stays until the page ends it.',
    ],
    mistakes: [
      'Mount pixel-toast-container once. A second container fights the queue.',
      'Do not expect a loading toast to vanish on a timer.',
      'Do not put toast text in analytics.',
    ],
  }),

  feature({
    dir: `${lib}/pixel-tour`,
    title: 'pixel-tour',
    summary: 'A guided spotlight over the page. start() stops any tour already running, remembers focus, and shows a card in a shared overlay with the current theme. It is not a wizard. Wizards do not start a tour by themselves.',
    does: [
      ['Walks the user through anchors on the page', 'Replace a multi-step form (that is a wizard or pixel-stepper)'],
      ['Traps focus in the tour card', 'Leave a previous tour running when a new one starts'],
    ],
    nodes: [
      n('page', 'Your page', 'Starts the tour', null, 0, 0),
      n('tour', 'Tour', 'The controller', 'pixel-tour', 1, 0),
      n('spot', 'Spotlight', 'Highlights a target', null, 2, 0),
      n('card', 'Card', 'The step text', null, 3, 0),
      n('focus', 'Saved focus', 'Restored at the end', null, 1, 1),
    ],
    stories: {
      start: {
        label: 'Start',
        steps: [
          st(['page', 'tour', 'focus'], ['page>tour', 'tour>focus'], 'The page calls start(). Any running tour stops. Focus is snapshotted.'),
          st(['tour', 'spot', 'card'], ['tour>spot', 'tour>card'], 'The overlay highlights the step target and shows the card. The theme is copied onto the overlay. The card traps focus. The dialog itself is not a full-page modal.'),
        ],
      },
      next: {
        label: 'Next and back',
        steps: [
          st(['card', 'tour', 'spot'], ['card>tour', 'tour>spot'], 'Arrow keys or the card buttons move to the next or previous step. The spotlight follows.'),
          st(['tour', 'focus'], ['tour>focus'], 'Escape aborts. Finish also ends the tour. Focus returns to the element that had it before the tour.'),
        ],
      },
      custom: {
        label: 'Custom card',
        steps: [
          st(['page', 'tour', 'card'], ['page>tour', 'tour>card'], 'The page can bring its own card, or use the headless mode and render the step itself.'),
          st(['spot', 'tour'], ['tour>spot'], 'The spotlight and the step order still belong to the tour.'),
        ],
      },
    },
    states: [
      'Idle.',
      'Running: spotlight, card, focus trapped in the card.',
      'Aborted with Escape, or finished on the last step.',
      'Focus restored to the pre-tour element.',
    ],
    mistakes: [
      'A wizard is not a tour. Do not auto-start a tour from a wizard.',
      'start() replaces the current tour. It does not stack a second one.',
      'Escape aborts and gives focus back. Do not drop the user on the body.',
    ],
  }),
];
