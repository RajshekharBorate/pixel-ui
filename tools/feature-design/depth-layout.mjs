import { piece } from './depth-shared.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const layoutDepth = {
  [`${lib}/pixel-app-shell`]: piece(
    'The shell is a frame with no inputs. It finds a header, a sidenav, and a footer by their tags and puts everything else in the main area. It does not decide routes or permissions. It only lines the pieces up and shares one toolbar divider.',
    `flowchart TB
  subgraph page [Your page]
    Header[Header]
    Nav[Sidenav]
    Main[Everything else]
    Foot[Footer]
  end
  subgraph shell [App shell]
    Frame[The frame]
    Divider[One shared toolbar divider]
  end
  Header --> Frame
  Nav --> Frame
  Main --> Frame
  Foot --> Frame
  Frame --> Divider
  Divider -->|suppress sticky, border, and brand border| Header
  Divider -->|suppress brand border| Nav`,
    [
      '**No inputs.** Compose by putting the pieces inside the shell. Do not pass a config object for the frame.',
      '**Main is the rest.** Anything that is not the header, sidenav, or footer goes in the main landmark.',
      '**Shared divider.** Inside the shell, the header drops its own sticky bar and border, and the sidenav drops its brand border, so the frame has one line.',
      '**Height.** The shell uses a minimum block size. It is not a fixed viewport height, so a long page can grow.',
    ],
    [
      {
        title: 'Compose the frame',
        diagram: `sequenceDiagram
  participant Page
  participant Shell as App shell
  participant Main as Main
  Page->>Shell: header, sidenav, footer, and the page
  Shell->>Main: the page content
  Note over Shell: one toolbar divider, not three borders`,
        note: 'Put pixel-header, pixel-sidenav, and pixel-footer inside the shell. The shell recognizes them by tag. Do not wrap them in extra divs that hide the tag.',
      },
      {
        title: 'Short and long pages',
        diagram: `sequenceDiagram
  participant Shell as App shell
  participant Main as Main
  alt the page is short
    Note over Shell: the frame still fills at least the screen
  else the page is long
    Note over Main: the page grows
    Note over Shell: it is not locked to one screen height
  end`,
        note: 'Do not set a fixed height on the shell to “make it full screen”. The minimum size already does that, and a fixed height would clip a long page.',
      },
    ],
  ),

  [`${lib}/pixel-header`]: piece(
    'The header is a real banner landmark. Sticky and bordered apply when it stands alone. Inside the app shell those are turned off so the shell can draw one shared divider.',
    `flowchart TB
  subgraph page [Your page]
    Title[Title and actions]
    Place[Alone, or inside the shell]
  end
  subgraph header [Header]
    Banner[Banner landmark]
  end
  Title --> Banner
  Place -->|alone: sticky and bordered| Banner
  Place -->|inside the shell: those are suppressed| Banner`,
    [
      '**Use the header component** so the page has a banner. Do not style a div as the banner.',
      '**Standalone.** Sticky and bordered are the header’s own chrome.',
      '**Inside the shell.** The shell suppresses that chrome. Do not fight it with a second border.',
    ],
    [
      {
        title: 'On its own',
        diagram: `sequenceDiagram
  participant Page
  participant Header
  Page->>Header: title and actions, not inside the shell
  Note over Header: sticky and bordered`,
        note: 'This is the right setup for a page that does not use the app shell.',
      },
      {
        title: 'Inside the shell',
        diagram: `sequenceDiagram
  participant Shell as App shell
  participant Header
  Shell->>Header: you are inside the frame
  Note over Header: sticky and bordered are off
  Note over Shell: one shared divider`,
        note: 'Do not re-enable the header border inside the shell. The frame already has the line.',
      },
    ],
  ),

  [`${lib}/pixel-footer`]: piece(
    'The footer is a real content-info landmark. On its own it can carry its own edge. Inside the app shell it sits in the frame and does not invent a second app bar.',
    `flowchart TB
  subgraph page [Your page]
    Links[Links and notes]
    Place[Alone, or inside the shell]
  end
  subgraph footer [Footer]
    Info[Content info landmark]
  end
  Links --> Info
  Place --> Info`,
    [
      '**The landmark is the footer element,** not a styled div.',
      '**Inside the shell** it is part of the frame. The shell still owns the shared divider at the top of the frame.',
      '**On its own** it is just the page footer.',
    ],
    [
      {
        title: 'On its own',
        diagram: `sequenceDiagram
  participant Page
  participant Footer
  Page->>Footer: links and notes
  Note over Footer: a real footer landmark`,
        note: 'Use it at the end of a page that is not inside the app shell.',
      },
      {
        title: 'Inside the shell',
        diagram: `sequenceDiagram
  participant Shell as App shell
  participant Footer
  Shell->>Footer: place it in the frame
  Note over Shell: the header and sidenav share one divider
  Note over Footer: it stays the content-info landmark`,
        note: 'Do not turn the footer into a second header. Actions that belong in the toolbar stay in the header.',
      },
    ],
  ),

  [`${lib}/pixel-container`]: piece(
    'The container caps how wide the content grows and, by default, adds padding. It is not a landmark. Full width, or fluid, skips the cap. Turn padding off when the content must run edge to edge.',
    `flowchart TB
  subgraph page [Your page]
    Width[sm, md, lg, xl, or full]
    Pad[Padding, on by default]
  end
  subgraph box [Container]
    Cap[Width cap]
    Gutter[Padding gutter]
  end
  Width -->|full or fluid skips the cap| Cap
  Pad -->|on| Gutter
  Pad -->|off| Edge[Edge to edge]`,
    [
      '**Padding defaults on.** You turn it off. You do not turn it on.',
      '**Max width** is a named size. Full and fluid both skip the cap.',
      '**Not a landmark.** Do not use it as main, nav, or banner. Put those elements inside or around it.',
    ],
    [
      {
        title: 'Cap the width',
        diagram: `sequenceDiagram
  participant Page
  participant Box as Container
  Page->>Box: a max width
  alt full or fluid
    Note over Box: no width cap
  else a named size
    Note over Box: content stops at that width
  end`,
        note: 'Use a named size for a reading column. Use full or fluid when the content should use the whole frame.',
      },
      {
        title: 'Padding gutter',
        diagram: `sequenceDiagram
  participant Page
  participant Box as Container
  alt padding left on
    Note over Box: the default gutter
  else the page turns padding off
    Note over Box: edge to edge
  end`,
        note: 'Turn padding off for a full-bleed map or a table that should touch the edges. Leave it on for text.',
      },
    ],
  ),

  [`${lib}/pixel-sidenav`]: piece(
    'The sidenav is either beside the page or covering it. Below the breakpoint it is forced to cover. The page supplies the navigation landmark inside it. An overlay locks focus, shows a scrim, and closes on Escape. Inside the app shell, the brand border is dropped when a header is present.',
    `flowchart TB
  subgraph page [Your page]
    Links[The nav landmark]
    Mode[Beside, or cover]
  end
  subgraph nav [Sidenav]
    Rail[Beside the page]
    Over[Covering overlay]
  end
  Links --> nav
  Mode -->|wide| Rail
  Mode -->|narrow, or cover| Over
  Over -->|scrim, trap, Escape| page`,
    [
      '**The page owns the links.** The sidenav is the panel. Put a real nav element in it.',
      '**Beside** is the docked rail. **Cover** is the overlay: scrim, focus trap, Escape.',
      '**Narrow screens force cover,** even if the page asked for beside.',
      '**Inside the shell,** the brand border is suppressed when the header is there, so the frame has one divider.',
    ],
    [
      {
        title: 'Beside the page',
        diagram: `sequenceDiagram
  participant Page
  participant Nav as Sidenav
  Page->>Nav: beside the page
  Note over Nav: the page stays usable
  Note over Page: put the nav landmark inside`,
        note: 'Use beside for an app that keeps the nav visible. The sidenav does not replace the page content.',
      },
      {
        title: 'Cover the page',
        diagram: `sequenceDiagram
  actor User
  participant Nav as Sidenav
  participant Page
  Page->>Nav: cover
  Note over Nav: scrim and focus trap
  User->>Nav: Escape
  Nav->>Page: close and return focus`,
        note: 'Cover is modal. Do not also open a dialog from the same control without deciding which one owns focus.',
      },
      {
        title: 'Inside the shell',
        diagram: `sequenceDiagram
  participant Shell as App shell
  participant Nav as Sidenav
  Shell->>Nav: header is present
  Note over Nav: brand border is off
  alt the screen is narrow
    Note over Nav: forced to cover
  end`,
        note: 'Do not draw a second brand border inside the shell. The shell already shares one divider with the header.',
      },
    ],
  ),

  [`${lib}/pixel-tabs`]: piece(
    'Tabs are a tab list, tabs, and panels. Only one panel is selected. Roving focus skips disabled tabs. Every tab needs an accessible name. Lazy skips creating the panel DOM until the tab is chosen. It does not skip the tab button itself.',
    `flowchart TB
  subgraph page [Your page]
    Names[A name for every tab]
    Panels[Panel content]
  end
  subgraph tabs [Tabs]
    List[Tab list]
    Panel[Selected panel]
    More[Scroll and chevrons]
  end
  Names --> List
  List -->|arrows, Home, End| Panel
  Panels -->|lazy: create on first select| Panel
  List -->|too many| More`,
    [
      '**Keyboard.** Arrows, Home, and End move through the tabs. Disabled tabs are skipped. Delete closes a tab when that tab can be closed. The group always needs an accessible name.',
      '**Lazy** skips creating the panel DOM until that tab is selected. It does not keep the panel’s code out of the bundle. Heavy bodies should be deferred by the page.',
      '**Overflow.** Extra tabs scroll, with chevrons. They do not wrap into a second unlabeled row.',
      '**Skeleton** replaces the tab list until the tabs are known.',
    ],
    [
      {
        title: 'Select a tab',
        diagram: `sequenceDiagram
  actor User
  participant Tabs
  participant Page
  Page->>Tabs: tabs, each with a name
  User->>Tabs: arrow to a tab
  Tabs->>Page: that panel is selected
  Note over Tabs: disabled tabs are skipped`,
        note: 'Do not leave a tab without a name. The tab list cannot announce it.',
      },
      {
        title: 'Lazy panel',
        diagram: `sequenceDiagram
  participant Page
  participant Tabs
  Page->>Tabs: lazy panel
  Note over Tabs: the panel DOM waits
  actor User
  User->>Tabs: select it
  Note over Tabs: the panel is created now`,
        note: 'Lazy skips creating the panel DOM. The component code is already in the page bundle. If the body is heavy, defer it in the page as well.',
      },
      {
        title: 'Too many tabs',
        diagram: `sequenceDiagram
  participant Tabs
  Note over Tabs: the row scrolls
  Note over Tabs: chevrons move the row`,
        note: 'Keep the selected tab reachable. Do not hide overflow tabs in a second control unless you are replacing this pattern.',
      },
      {
        title: 'Skeleton',
        diagram: `sequenceDiagram
  participant Page
  participant Tabs
  Page->>Tabs: skeleton
  Note over Tabs: the tab list is not shown yet
  Page->>Tabs: the real tabs`,
        note: 'Use the skeleton while the tab names are loading. Do not render empty tabs and call that loading.',
      },
    ],
  ),

  [`${lib}/pixel-accordion`]: piece(
    'Each section header is a button. Enter or Space expands or collapses it. Lazy skips creating the body until the first expand. Analytics records expand or collapse with the panel id, not the title.',
    `flowchart TB
  subgraph page [Your page]
    Sections[Sections and panel ids]
  end
  subgraph acc [Accordion]
    Button[Section button]
    Body[Body]
  end
  Sections --> Button
  Button -->|Enter or Space| Body
  Body -->|lazy: created on expand| page`,
    [
      '**The header is a button** with expanded state. Do not make the whole card a second button.',
      '**Lazy** waits to create the body. The header still exists.',
      '**Analytics** gets the panel id and whether it expanded or collapsed. It does not get the title text.',
    ],
    [
      {
        title: 'Open a section',
        diagram: `sequenceDiagram
  actor User
  participant Acc as Accordion
  participant Page
  User->>Acc: Enter or Space on the header
  Acc->>Page: expanded or collapsed
  Note over Page: analytics uses the panel id, not the title`,
        note: 'Give each panel a stable id if you record analytics. The title can change with translation. The id should not.',
      },
      {
        title: 'Lazy body',
        diagram: `sequenceDiagram
  participant Acc as Accordion
  Note over Acc: body is not created yet
  actor User
  User->>Acc: expand
  Note over Acc: the body is created now`,
        note: 'Do not expect a lazy body to run its setup before the user opens it.',
      },
    ],
  ),

  [`${lib}/pixel-stepper`]: piece(
    'The stepper is a list of steps. Linear mode walks them in order. Free mode lets the user jump. The orientation and the type are layout, not a color appearance. If a step is gated and the app has no authorization evaluator, the step fails closed. The chrome has no skeleton.',
    `flowchart TB
  subgraph page [Your page]
    Steps[Steps]
    Mode[Linear or free]
    Gate[Optional access check]
  end
  subgraph stepper [Stepper]
    List[Step list]
  end
  Steps --> List
  Mode -->|in order| List
  Mode -->|jump| List
  Gate -->|no evaluator: fail closed| List`,
    [
      '**Linear.** The user cannot skip ahead.',
      '**Free.** Any step can be chosen.',
      '**Access.** A protected step calls the evaluator. If the app never provided one, the step stays closed.',
      '**Labels** can collapse on their own when space is tight. That is layout, not a missing step.',
      '**No skeleton** on the stepper chrome. Load the steps before you render it, or accept the real labels.',
    ],
    [
      {
        title: 'In order',
        diagram: `sequenceDiagram
  actor User
  participant Stepper
  User->>Stepper: next
  Note over Stepper: the following step opens
  User->>Stepper: a later step
  Note over Stepper: skipped steps stay closed`,
        note: 'Use linear when a later step is meaningless until the earlier ones are done.',
      },
      {
        title: 'Jump around',
        diagram: `sequenceDiagram
  actor User
  participant Stepper
  participant Page
  Page->>Stepper: free navigation
  User->>Stepper: any step
  Stepper->>Page: that step is current`,
        note: 'Free mode is still a step list. It is not a set of tabs with hidden panels unless you build the panels that way.',
      },
      {
        title: 'Access missing',
        diagram: `sequenceDiagram
  participant Step
  participant App
  Step->>App: this step needs an access check
  alt the evaluator exists
    App->>Step: allow or deny
  else no evaluator
    Note over Step: fail closed
  end`,
        note: 'Do not treat a missing evaluator as “allow”. Provide the evaluator in the app, or do not mark the step as gated.',
      },
    ],
  ),

  [`${lib}/pixel-breadcrumb`]: piece(
    'The breadcrumb is a path. The current page is not a link. The separator defaults to a slash. A long path collapses into a menu. Analytics records the path only, never the labels.',
    `flowchart TB
  subgraph page [Your page]
    Path[The crumbs]
  end
  subgraph crumb [Breadcrumb]
    Links[Earlier crumbs are links]
    Here[Current page]
    Menu[Overflow menu]
  end
  Path --> Links
  Path --> Here
  Path -->|too long| Menu`,
    [
      '**Current page** is marked as the current page and is not a link.',
      '**Separator** defaults to a slash. Change it only when the path needs a different mark.',
      '**Overflow** is a menu of the hidden crumbs, not a truncated string with no way back.',
      '**Analytics** may record the href path. It does not record the visible labels.',
    ],
    [
      {
        title: 'A short path',
        diagram: `sequenceDiagram
  participant Page
  participant Crumb as Breadcrumb
  Page->>Crumb: a few crumbs
  Note over Crumb: earlier ones are links
  Note over Crumb: the last one is the current page`,
        note: 'Do not link the current page to itself.',
      },
      {
        title: 'A long path',
        diagram: `sequenceDiagram
  participant Crumb as Breadcrumb
  participant Menu as Overflow menu
  Crumb->>Menu: the crumbs that do not fit
  Note over Crumb: analytics may store the path, not the labels`,
        note: 'Keep the current page visible. The menu is for the ancestors that were collapsed.',
      },
    ],
  ),

  [`${lib}/pixel-paginator`]: piece(
    'The paginator tells the page which page and which page size the user wants. It does not slice the rows. On a narrow screen it hides the page-number list and the “items per page” words. The select keeps its own name. A live region speaks the range. Analytics records indexes and page size only.',
    `flowchart TB
  subgraph page [Your page]
    Rows[Your sliced rows]
  end
  subgraph pager [Paginator]
    Next[Next, previous, and page numbers]
    Size[Page size]
    Live[Live range]
  end
  pager -->|page index and page size| page
  page --> Rows
  Size --> Live`,
    [
      '**You slice the data.** The paginator only reports the index and the size.',
      '**Narrow screens** drop the page numbers and the “items per page” label. The select still has an accessible name.',
      '**The live region** announces the visible range. Do not duplicate that sentence in a second status.',
      '**Analytics** is the index and the page size. Not the row contents.',
    ],
    [
      {
        title: 'Next page',
        diagram: `sequenceDiagram
  actor User
  participant Pager as Paginator
  participant Page
  User->>Pager: next, previous, or a page number
  Pager->>Page: the new index
  Note over Page: the page slices the rows
  Pager->>Pager: announce the range`,
        note: 'Listen for the page change and load or slice that page. The paginator will not hide rows for you.',
      },
      {
        title: 'Page size',
        diagram: `sequenceDiagram
  actor User
  participant Pager as Paginator
  participant Page
  User->>Pager: a new page size
  Pager->>Page: the size
  Note over Pager: on a narrow screen the words hide, the select keeps its name`,
        note: 'Reset to the first page when the size changes if your list would otherwise point past the end. That reset belongs in the page.',
      },
    ],
  ),
};
