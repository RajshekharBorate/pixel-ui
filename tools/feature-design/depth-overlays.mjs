import { piece } from './depth-shared.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const overlayDepth = {
  [`${lib}/pixel-dialog`]: piece(
    'The dialog is modal. While it is open, focus stays inside, the page behind does not scroll, and focus returns to the trigger on close. A confirm dialog has no close button. The user must use the actions. Analytics records why it closed, never the title.',
    `flowchart TB
  subgraph page [Your page]
    OpenAsk[Open or close]
    Content[Title and body]
  end
  subgraph dialog [Dialog]
    Trap[Focus trap]
    Lock[Scroll lock]
    Scrim[Scrim]
  end
  OpenAsk -->|open| dialog
  Content --> dialog
  Trap --> dialog
  Scrim -->|dismiss, if allowed| page
  dialog -->|escape, scrim, close, or programmatic| page`,
    [
      '**Open.** Focus moves inside. Body scroll is locked.',
      '**Dismissable.** Escape or the scrim closes it and restores focus.',
      '**Must choose.** A confirm dialog is an alert dialog. Escape, the scrim, and a close button do not dismiss it.',
      '**Long body.** The body scrolls inside the dialog. The footer stays put.',
      '**Analytics.** Open and close, with a reason. Never the title or the body text.',
    ],
    [
      {
        title: 'Open and close',
        diagram: `sequenceDiagram
  actor User
  participant Page
  participant Dialog
  Page->>Dialog: open
  Note over Dialog: focus moves in, page stops scrolling
  User->>Dialog: press close
  Dialog->>Page: closed, focus returns to the trigger
  Note over Page: analytics may record the reason, never the title`,
        note: 'Keep the trigger in the page so focus has somewhere to return. Do not destroy the trigger while the dialog is open.',
      },
      {
        title: 'Escape or scrim',
        diagram: `sequenceDiagram
  actor User
  participant Dialog
  participant Page
  alt dismissable
    User->>Dialog: Escape or scrim
    Dialog->>Page: close and restore focus
  else not dismissable
    Note over Dialog: Escape and the scrim do nothing
  end`,
        note: 'Turn dismissable off when the user must pick an action. The close button follows the same rule.',
      },
      {
        title: 'Must choose',
        diagram: `sequenceDiagram
  actor User
  participant Dialog
  participant Page
  Note over Dialog: alert dialog, no close button
  User->>Dialog: confirm or cancel
  Dialog->>Page: that result only`,
        note: 'Confirm and cancel are the only exits. Do not also listen for Escape as a cancel unless the dialog is dismissable.',
      },
    ],
  ),

  [`${lib}/pixel-drawer`]: piece(
    'A drawer is a modal panel on one edge. It uses the same focus trap, scroll lock, and focus return as a dialog. Horizontal drawers are as tall as the screen. Analytics records open and close with a reason, never the title.',
    `flowchart TB
  subgraph page [Your page]
    Edge[Which edge and which size]
  end
  subgraph drawer [Drawer]
    Panel[Panel]
    Footer[Footer slot]
    Trap[Focus trap and scroll lock]
  end
  Edge --> Panel
  page -->|open| Trap
  Trap -->|escape, scrim, or close| page
  Panel --> Footer`,
    [
      '**Position and size come from the page.** A left or right drawer uses the full screen height.',
      '**Dismiss.** Escape, the scrim, or close, when allowed. Focus returns to the trigger.',
      '**Footer.** Project actions there so they stay while the body scrolls.',
    ],
    [
      {
        title: 'Open',
        diagram: `sequenceDiagram
  participant Page
  participant Drawer
  Page->>Drawer: open on an edge
  Note over Drawer: focus moves in, page stops scrolling`,
        note: 'Do not open a drawer and a dialog on the same trigger without a plan for which one owns focus.',
      },
      {
        title: 'Close',
        diagram: `sequenceDiagram
  actor User
  participant Drawer
  participant Page
  User->>Drawer: Escape, scrim, or close
  Drawer->>Page: closed, focus returns
  Note over Page: the reason can be recorded, not the title`,
        note: 'The footer actions should close through the page, the same way the close button does, so focus still returns.',
      },
    ],
  ),

  [`${lib}/pixel-popover`]: piece(
    'A popover is not modal. There is no focus trap and no scrim. Escape closes it and returns focus to the trigger. A click outside closes it and leaves focus where the user clicked. Tabbing out closes it. A nested menu does not close the popover.',
    `flowchart TB
  subgraph page [Your page]
    Trigger[Trigger]
  end
  subgraph pop [Popover]
    Panel[Panel]
  end
  subgraph menu [Nested menu]
    Sub[Submenu]
  end
  Trigger -->|open, close, or toggle| Panel
  Panel -->|Escape restores the trigger| Trigger
  Panel -->|outside press does not move focus| page
  Sub -->|stays open| Panel`,
    [
      '**Do not trap focus.** The rest of the page stays usable.',
      '**Escape** restores the trigger. An outside press does not.',
      '**Nested menu.** Opening it must not dismiss the popover.',
    ],
    [
      {
        title: 'Open',
        diagram: `sequenceDiagram
  participant Page
  participant Pop as Popover
  Page->>Pop: open, close, or toggle
  Note over Pop: no focus trap, no scrim`,
        note: 'Call open, close, or toggle. Do not treat this like a dialog that locks the page.',
      },
      {
        title: 'Dismiss',
        diagram: `sequenceDiagram
  actor User
  participant Pop as Popover
  participant Trigger
  alt Escape
    User->>Pop: Escape
    Pop->>Trigger: close and restore focus
  else click outside
    User->>Pop: outside press
    Note over Trigger: popover closes, focus stays where the user clicked
  else Tab leaves
    Note over Pop: close
  end`,
        note: 'These three dismissals are different. Do not restore focus on an outside click, or you will steal the click the user just made.',
      },
      {
        title: 'Nested menu',
        diagram: `sequenceDiagram
  actor User
  participant Pop as Popover
  participant Menu
  User->>Menu: open a menu inside the popover
  Note over Pop: the popover stays open`,
        note: 'The menu handles its own Escape. That should not be treated as “click outside the popover”.',
      },
    ],
  ),

  [`${lib}/pixel-menu`]: piece(
    'The menu is a sibling of the trigger, then it is moved to the body and given a copy of the theme. A click trigger and a right-click trigger are different. There is no skeleton and no virtual list. Nested menus open to the side.',
    `flowchart TB
  subgraph page [Your page]
    Click[Click trigger]
    Right[Right-click trigger]
  end
  subgraph menu [Menu]
    Items[Items]
    Sub[Submenu]
  end
  Click -->|click or Enter| Items
  Right -->|context menu| Items
  Items -->|Arrow Right or hover| Sub
  Items -->|Escape restores the trigger| page`,
    [
      '**Point the trigger at the menu.** The menu is not inside the button.',
      '**Theme.** Because the menu is moved to the body, the theme is copied onto it. Otherwise it would lose the page colors.',
      '**Keys.** Arrows move. Enter or Space picks. Escape closes and restores the trigger. Arrow Right opens a submenu. Arrow Left returns.',
      '**No skeleton.** Do not show a placeholder menu.',
    ],
    [
      {
        title: 'Click to open',
        diagram: `sequenceDiagram
  actor User
  participant Trigger
  participant Menu
  User->>Trigger: click, Enter, or Space
  Trigger->>Menu: open
  User->>Menu: arrows, then Enter
  Menu->>Menu: Escape restores the trigger`,
        note: 'Use this for a button menu. The trigger is a normal control, not a right-click target.',
      },
      {
        title: 'Right-click',
        diagram: `sequenceDiagram
  actor User
  participant Trigger
  participant Menu
  User->>Trigger: context menu
  Trigger->>Menu: open at that point
  Note over Menu: not the same as a click trigger`,
        note: 'Do not put both trigger types on the same element unless you mean both gestures. They are separate.',
      },
      {
        title: 'Submenu',
        diagram: `sequenceDiagram
  actor User
  participant Menu
  participant Sub as Submenu
  User->>Menu: hover or Arrow Right
  Menu->>Sub: open beside the item
  User->>Sub: Arrow Left
  Note over Menu: back to the parent item`,
        note: 'Submenus are part of the same menu tree. They are not a second popover.',
      },
    ],
  ),

  [`${lib}/pixel-tooltip`]: piece(
    'A tooltip is a hint, not a second label. An empty message turns it off, unless the page asked to show it only when the host text is clipped. The description is exposed only while the tip is visible. Click or drag dismisses it. It flips if it would overflow the screen.',
    `flowchart TB
  subgraph page [Your page]
    Message[Message]
    Clip[Only when clipped]
  end
  subgraph tip [Tooltip]
    Visible[Visible tip]
    Described[Description, only while visible]
  end
  Message -->|empty, and not the clip mode| Off[Tooltip stays off]
  Message -->|has text| Visible
  Clip -->|use the clipped host text| Visible
  Visible --> Described
  Visible -->|flip if needed| Visible`,
    [
      '**Empty message disables the tooltip.** The exception is overflow mode, which uses the clipped host text.',
      '**Show.** Hover or keyboard focus. Hide on blur, Escape, click, or drag.',
      '**aria-describedby** exists only while the tip is visible. Do not leave it on a hidden tip.',
    ],
    [
      {
        title: 'Show and hide',
        diagram: `sequenceDiagram
  actor User
  participant Tip as Tooltip
  User->>Tip: hover or keyboard focus
  Tip->>Tip: show, and point the host at the tip
  alt blur, Escape, click, or drag
    Tip->>Tip: hide, and drop the description link
  end
  opt the tip would leave the screen
    Tip->>Tip: flip
  end`,
        note: 'Mouse focus does not count as keyboard focus for the ring, but keyboard focus does open the tip. A click dismisses it so it does not cover the thing the user pressed.',
      },
      {
        title: 'Empty message',
        diagram: `sequenceDiagram
  participant Page
  participant Tip as Tooltip
  Page->>Tip: empty message
  Note over Tip: stays off
  Note over Tip: no description link`,
        note: 'Do not render an empty bubble. Leave the host unlabeled by the tooltip.',
      },
      {
        title: 'Only when clipped',
        diagram: `sequenceDiagram
  participant Page
  participant Host
  participant Tip as Tooltip
  Page->>Tip: show only when clipped, no message
  alt the host text is clipped
    Host->>Tip: use that text
  else the text fits
    Note over Tip: stay off
  end`,
        note: 'This is the one case where a missing message still shows a tip. The text is the host’s own text, not a second string you forgot to pass.',
      },
    ],
  ),

  [`${lib}/pixel-toast`]: piece(
    'Mount one toast container. The service queues toasts into it. Error and warning interrupt. The others are polite. Loading and a promise toast stay until the page closes them. Analytics never includes the title or the message.',
    `flowchart TB
  subgraph page [Your page]
    Service[Toast service]
  end
  subgraph host [One container]
    Queue[Queue]
    Toast[One toast]
  end
  Service --> Queue
  Queue --> Toast
  Toast -->|error or warning: interrupt| page
  Toast -->|others: polite| page
  Toast -->|Escape while focused| Queue`,
    [
      '**One container.** A second mount will not receive the queue.',
      '**Auto-dismiss** is for ordinary toasts. Loading and promise toasts wait.',
      '**Escape** closes the toast that has focus.',
      '**Inline** is a different placement. It is not the corner queue.',
    ],
    [
      {
        title: 'Show a toast',
        diagram: `sequenceDiagram
  participant Page
  participant Service as Toast service
  participant Host as Container
  Page->>Service: show
  Service->>Host: enqueue
  Note over Host: polite status
  alt auto-dismiss
    Host->>Host: leave on its own
  else the user presses Escape while it is focused
    Host->>Host: close now
  end`,
        note: 'Put the container once, high in the app. Do not mount it inside the button that calls show.',
      },
      {
        title: 'Error or warning',
        diagram: `sequenceDiagram
  participant Service as Toast service
  participant Toast
  Service->>Toast: error or warning
  Note over Toast: alert, interrupts
  Note over Toast: title and message stay out of analytics`,
        note: 'These are the loud toasts. Do not also push the same sentence into a live region.',
      },
      {
        title: 'Loading',
        diagram: `sequenceDiagram
  participant Page
  participant Toast
  Page->>Toast: loading or a promise
  Note over Toast: stays until the page closes it
  Page->>Toast: close when the work ends`,
        note: 'Do not set a short timeout on a loading toast. The page must close it when the work finishes or fails.',
      },
    ],
  ),

  [`${lib}/pixel-tour`]: piece(
    'A tour is a spotlight and a card. It is not a wizard. Starting a tour stops any tour already running, remembers focus, and copies the theme onto the card. Escape aborts. Focus returns when it ends. Do not start a tour from a wizard step.',
    `flowchart TB
  subgraph page [Your page]
    Steps[Steps]
  end
  subgraph tour [Tour]
    Spot[Spotlight]
    Card[Card, focus trapped inside]
  end
  Steps -->|start| tour
  Card -->|next, back, or finish| page
  Card -->|Escape aborts| page`,
    [
      '**start replaces a running tour.** It does not stack.',
      '**The card traps focus.** Arrow keys move between steps when the card allows it.',
      '**Escape aborts** and focus goes back.',
      '**Custom card.** The page can replace the card content. The spotlight behavior stays.',
    ],
    [
      {
        title: 'Start',
        diagram: `sequenceDiagram
  participant Page
  participant Tour
  Page->>Tour: start
  Note over Tour: stop any running tour, remember focus, copy the theme
  Tour->>Tour: spotlight and card`,
        note: 'Call start from an explicit user action. A wizard must not call it when a step changes.',
      },
      {
        title: 'Next and back',
        diagram: `sequenceDiagram
  actor User
  participant Card as Tour card
  participant Page
  User->>Card: next, back, or an arrow
  alt more steps
    Card->>Card: move the spotlight
  else the last step
    Card->>Page: finish, restore focus
  end
  User->>Card: Escape
  Note over Page: abort, restore focus`,
        note: 'Finish and abort both return focus. Do not leave the spotlight up after the last step.',
      },
      {
        title: 'Custom card',
        diagram: `sequenceDiagram
  participant Page
  participant Card as Tour card
  Page->>Card: replace the card content
  Note over Card: the spotlight and focus trap stay`,
        note: 'Custom content still lives inside the card. Do not move the spotlight logic into the page.',
      },
    ],
  ),
};
