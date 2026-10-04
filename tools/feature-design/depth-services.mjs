import { piece } from './depth-shared.mjs';

const lib = 'projects/pixel-ui/src/lib/services';

export const serviceDepth = {
  [`${lib}/authorization`]: piece(
    'Pixel is the data plane and the policy enforcement point. It is not the identity system. The app tells Pixel who the person is and which facts the rules need. A persona is a preview label, not a role. can() is for chrome and stays allowed while the rules are still loading. A real gate calls evaluate(). authorize() is the call that writes an audit.',
    `flowchart TB
  subgraph app [Your app]
    Person[The person and the facts]
    Now[The current time, when a rule needs it]
  end
  subgraph auth [Authorization]
    Can[can for chrome]
    Gate[evaluate for a real gate]
    Audit[authorize for an audit]
  end
  subgraph control [The control]
    Show[Shown]
    Hide[Removed from assistive tech]
    Off[Disabled]
    Busy[Busy while pending]
  end
  Person --> auth
  Now --> Gate
  Can -->|true while hydrating| Show
  Gate -->|deny and hide| Hide
  Gate -->|deny and disable| Off
  auth -->|pending| Busy`,
    [
      '**can() is chrome.** It stays true while rules are loading so buttons do not flash off. Do not use it to protect a step, a tab, or a column.',
      '**evaluate() is silent** and safe inside a computed value. Gates call this.',
      '**authorize() records the decision.** Use it when the attempt itself must be audited.',
      '**Missing facts fail closed.** If a deny rule needs an attribute and that attribute is absent, the answer is deny.',
      '**Denied and hide** removes the control from the accessibility tree. Pending is busy, not hidden. Denied and disable uses aria-disabled.',
      '**Time.** The app passes now. The rule does not call the clock.',
      '**Wildcards.** The longest prefix wins. A bare star is ignored.',
      '**Remote checks** time out after about four seconds. A synchronous gate still uses the local result and does not wait on the network.',
    ],
    [
      {
        title: 'Show or hide',
        diagram: `sequenceDiagram
  participant App
  participant Auth as Authorization
  participant Control
  App->>Auth: the person and the rules
  Auth->>Control: can
  alt the rules are still loading
    Note over Control: can stays true
    Note over Control: pending is busy, not hidden
  else a later denial says hide
    Note over Control: removed from assistive tech
  end`,
        note: 'Use can() for buttons and other chrome. A hide denial must leave the accessibility tree. Do not leave a disabled-looking control that is still exposed when the rule said hide.',
      },
      {
        title: 'A real gate',
        diagram: `sequenceDiagram
  participant App
  participant Gate as evaluate
  participant Control
  App->>Gate: a step, a tab, or a column
  alt the rule allows
    Gate->>Control: allow
  else the rule denies, or a required fact is missing
    Note over Control: deny
    Note over Control: hide or disable as the rule says
  end`,
        note: 'Do not call can() here. can() is the wrong answer while the rules are loading, and it is the wrong answer when a required fact is missing. evaluate() fails closed.',
      },
      {
        title: 'Audit',
        diagram: `sequenceDiagram
  participant App
  participant Audit as authorize
  participant Auth as Authorization
  App->>Audit: the attempt
  Audit->>Auth: record the decision
  opt the check is remote
    Note over Auth: about four seconds, then stop waiting
    Note over Auth: a synchronous gate still uses the local result
  end`,
        note: 'authorize() is the audited call. evaluate() stays quiet so it can run from a computed value. Do not make a synchronous gate wait on the network.',
      },
      {
        title: 'Time rules',
        diagram: `sequenceDiagram
  participant App
  participant Auth as Authorization
  participant Gate as evaluate
  App->>Auth: now, from the app
  Note over Auth: the rule does not read the clock
  Auth->>Gate: the decision
  Note over Auth: longest prefix wins
  Note over Auth: a bare star is ignored
  Note over Auth: a persona is not a role`,
        note: 'Pass the app’s clock. A test can then freeze time. Do not treat a persona preview label as a permission.',
      },
    ],
  ),

  [`${lib}/export`]: piece(
    'Export builds a CSV, TSV, JSON, or spreadsheet in memory and hands it to the browser download. It does not call the network, and it does not read the table in the DOM. The data grid toolbar uses this service. Filter the columns before you call it.',
    `flowchart TB
  subgraph page [Your page]
    Rows[Columns and rows you allow]
  end
  subgraph exp [Export]
    File[In-memory file]
  end
  subgraph browser [Browser]
    Save[Download]
  end
  Rows --> File
  File --> Save`,
    [
      '**You pass the rows.** The service does not scrape the grid.',
      '**You pass the columns.** Hidden or forbidden columns stay out because you never passed them.',
      '**No HTTP.** Uploads and remote downloads belong to file transfer.',
    ],
    [
      {
        title: 'Download rows',
        diagram: `sequenceDiagram
  participant Page
  participant Export
  participant Browser
  Page->>Export: columns and rows
  Export->>Export: build the file in memory
  Export->>Browser: download
  Note over Browser: no request is sent`,
        note: 'Use this for a grid export or any in-memory table. Do not point it at a URL.',
      },
      {
        title: 'Only allowed columns',
        diagram: `sequenceDiagram
  participant Page
  participant Export
  Page->>Export: the columns this person may see
  Note over Export: nothing else is discovered from the DOM
  Note over Export: the file contains that list only`,
        note: 'Filter columns before the call. The service will not drop a column you included, even if the grid had hidden it.',
      },
    ],
  ),

  [`${lib}/file-transfer`]: piece(
    'File transfer is a queue. The page adds an upload or a download. An adapter moves the bytes. Each item can pause, resume, retry, or cancel. Saving a finished blob reuses the export download helper. A zip is built only when the app supplies a zipper. This queue is not a table export.',
    `flowchart TB
  subgraph page [Your page]
    Ask[Add a transfer]
  end
  subgraph queue [Transfer queue]
    Item[One item]
  end
  subgraph adapter [Adapter]
    Bytes[The bytes]
  end
  subgraph save [Save]
    Blob[Blob download via export]
  end
  Ask --> Item
  Item --> Bytes
  Bytes --> Item
  Bytes --> Blob`,
    [
      '**The adapter does the network.** The queue tracks progress and the commands.',
      '**Pause, resume, retry, and cancel** act on one item.',
      '**A failed item stays failed** until retry or cancel.',
      '**Zip** needs a zipper from the app. The service does not include one.',
      '**Grid export** is the export service, not this queue.',
    ],
    [
      {
        title: 'Upload',
        diagram: `sequenceDiagram
  participant Page
  participant Queue as Transfer queue
  participant Adapter
  Page->>Queue: add a file
  Queue->>Adapter: send the bytes
  Adapter->>Queue: progress
  opt the page pauses, resumes, retries, or cancels
    Page->>Queue: that command
  end`,
        note: 'Show progress from the item. Do not start a second upload beside the queue for the same file.',
      },
      {
        title: 'Download',
        diagram: `sequenceDiagram
  participant Page
  participant Queue as Transfer queue
  participant Adapter
  participant Save as Save blob
  Page->>Queue: ask for a download
  Queue->>Adapter: fetch it
  Adapter->>Save: the blob
  Note over Save: the same download helper export uses`,
        note: 'The download helper only saves the blob. It does not build a CSV. If you have rows, use export.',
      },
      {
        title: 'Retry or cancel',
        diagram: `sequenceDiagram
  participant Adapter
  participant Item
  participant Queue as Transfer queue
  Adapter->>Item: failed
  alt retry
    Queue->>Adapter: run it again
  else cancel
    Note over Queue: leave the active queue
  end
  opt the app did not pass a zipper
    Note over Queue: a zip is not built
  end`,
        note: 'Cancel is not retry. A zip of several files waits until the app provides a zipper.',
      },
    ],
  ),

  [`${lib}/navigate`]: piece(
    'Navigate moves the user to a place in the app. It can change the route, then wait, scroll, focus, and highlight. It is not a second router, and it is not a tour. A missing target is a soft failure: the result is not ok, an optional toast can explain it, and the call does not throw.',
    `flowchart TB
  subgraph page [Your page]
    Request[go]
  end
  subgraph nav [Navigate]
    Route[Optional route change]
    Wait[Wait]
    Move[Scroll, focus, highlight]
  end
  subgraph target [Target]
    Found[Anchor or selector]
    Miss[Soft failure]
  end
  Request --> Route
  Route --> Wait
  Wait --> Move
  Move --> Found
  Move --> Miss
  Miss -->|optional toast| page`,
    [
      '**Order.** Optional route, then wait, then scroll, focus, and highlight.',
      '**Sticky offset** defaults to the toolbar height so the target is not hidden under the header.',
      '**Highlight** respects reduced motion.',
      '**Lookup.** Adapters, then a pixel anchor, then a CSS selector.',
      '**Links.** The canonical deep link is the nav query. A hash is only for a simple section. If both exist, the query wins.',
      '**Wizards** do not open by themselves. An unregistered wizard adapter reports that the adapter is missing.',
    ],
    [
      {
        title: 'Go to a target',
        diagram: `sequenceDiagram
  participant Page
  participant Nav as Navigate
  participant Router
  participant Target
  Page->>Nav: go
  opt a route change is needed
    Nav->>Router: navigate first
  end
  Nav->>Target: wait, scroll, focus, highlight
  Note over Target: sticky offset defaults to the toolbar
  Note over Target: highlight respects reduced motion`,
        note: 'Use this when a link must land on a control, not only on a route. Do not also start a tour for the same landing.',
      },
      {
        title: 'Target missing',
        diagram: `sequenceDiagram
  participant Nav as Navigate
  participant Target
  participant Toast
  Nav->>Target: adapters, then a pixel anchor, then a selector
  Note over Target: nothing matches
  Nav->>Nav: result is not ok
  opt a toast was requested
    Nav->>Toast: explain the miss
  end
  Note over Nav: the call does not throw`,
        note: 'Handle the soft failure. Do not wrap go() in a try/catch expecting an exception.',
      },
      {
        title: 'Which link wins',
        diagram: `sequenceDiagram
  participant Page
  participant Nav as Navigate
  participant Target
  Page->>Nav: a nav query, a hash, or both
  alt both are present
    Note over Nav: the query wins
  else only a hash
    Note over Nav: a simple section only
  end
  Nav->>Target: that target
  opt the wizard adapter was never registered
    Note over Nav: adapter missing
    Note over Nav: wizards do not open by themselves
  end`,
        note: 'Register a wizard adapter before a deep link should open that wizard. Otherwise the result is adapter-missing, not an opened wizard.',
      },
    ],
  ),

  [`${lib}/title`]: piece(
    'One service writes the browser tab title. Turn on router sync and do not also leave the default title strategy subscribed. The title is the leaf title of the primary route, not a chain of parent titles. An explicit title or an error title is a deliberate override. A count waits about a second, and a page change flushes it.',
    `flowchart TB
  subgraph sources [Sources]
    Leaf[Leaf route title]
    Explicit[Explicit or error title]
    Count[Unread count]
  end
  subgraph writer [Title service]
    One[The one writer]
  end
  subgraph tab [Browser tab]
    Doc[Document title]
  end
  Leaf --> One
  Explicit --> One
  Count --> One
  One --> Doc`,
    [
      '**One writer.** Router sync on means the default strategy stays off.',
      '**Leaf only.** Do not build “child · parent · brand”.',
      '**fromTrail()** is the explicit path when you really want a trail. Do not also run router sync on top of it.',
      '**Count.** Zero or below is omitted. A positive count waits about a second so it does not flicker. A page change flushes immediately.',
      '**Do not announce the title** in a live region. The tab title is not a status message.',
      '**Error pages** should set an error title. Otherwise the previous page’s title stays.',
    ],
    [
      {
        title: 'Route title',
        diagram: `sequenceDiagram
  participant Router
  participant Title as Title service
  participant Tab as Browser tab
  Router->>Title: the leaf title of the primary route
  Title->>Tab: write it
  Note over Title: the default strategy is not also subscribed`,
        note: 'Two writers will overwrite each other. Pick router sync and leave the default strategy off.',
      },
      {
        title: 'Explicit title',
        diagram: `sequenceDiagram
  participant Page
  participant Title as Title service
  participant Tab as Browser tab
  Page->>Title: a title, or an error title
  Title->>Tab: write it
  Note over Page: do not also rebuild a parent chain`,
        note: 'Use an explicit title when the route title is wrong for this moment, including error pages. Do not concatenate parent titles on every navigation if router sync is already on.',
      },
      {
        title: 'Unread count',
        diagram: `sequenceDiagram
  participant Page
  participant Title as Title service
  participant Tab as Browser tab
  Page->>Title: a count
  alt the count is zero or below
    Note over Title: omit it
  else the count is positive
    Note over Title: wait about a second
    Title->>Tab: then include it
  end
  opt the route changes
    Title->>Tab: flush the count into the new title now
  end
  Note over Tab: do not also announce the title`,
        note: 'The debounce avoids flicker while a count chatters. A navigation should not wait that second. Flush on the page change.',
      },
    ],
  ),
};
