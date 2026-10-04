import { piece } from './depth-shared.mjs';

const lib = 'projects/pixel-ui/src/lib';

export const dataDepth = {
  [`${lib}/pixel-data-grid`]: piece(
    'The grid shows rows the page gives it. Density picks the row height and the size of the controls inside the cells. Do not pass a separate size. Filters, cell editors, and selection are controlled by the page. Analytics records table and export events without the raw filter text.',
    `flowchart TB
  subgraph page [Your page]
    Rows[Rows and columns]
    Density[Comfortable, standard, or compact]
  end
  subgraph grid [Data grid]
    Table[The table]
    Filter[Filters]
    Editor[Cell editor]
    Pick[Selection]
    Export[Export]
  end
  Rows --> Table
  Density -->|row height and control size| Table
  Filter -->|the page applies it| page
  Editor -->|date cells use the datepicker| Table
  Pick -->|selected row objects| page
  Export -->|all, selected, or this page| page`,
    [
      '**Density** is comfortable, standard, or compact. That sets the row height and the embedded control size. There is no extra size input.',
      '**The grid is a table.** It is busy while loading.',
      '**Date filters and date editors** use the datepicker. Do not put a plain text date in those cells.',
      '**Selection** is none, one row, or many. Many uses a checkbox column, a header checkbox for the current page, shift-click for a range, then a banner to select every row in the result. The value is the row objects, kept across paging, sort, and filter. The change event emits those rows.',
      '**Export** can be all rows, the selection, or the current page. Analytics never includes the raw query or the filter values.',
    ],
    [
      {
        title: 'Show rows',
        diagram: `sequenceDiagram
  participant Page
  participant Grid as Data grid
  Page->>Grid: rows, columns, and a density
  Note over Grid: density sets row height and the size of controls in the cells
  alt still loading
    Note over Grid: the table is busy
  else rows are ready
    Note over Grid: the table shows them
  end`,
        note: 'Do not pass a separate size for buttons inside the grid. Change the density.',
      },
      {
        title: 'Filter',
        diagram: `sequenceDiagram
  actor User
  participant Grid as Data grid
  participant Page
  User->>Grid: a filter
  Grid->>Page: the filter change
  Note over Page: you apply it and pass the new rows
  Note over Grid: analytics does not include the filter text`,
        note: 'A date filter uses the datepicker. The grid does not query your API by itself.',
      },
      {
        title: 'Edit a cell',
        diagram: `sequenceDiagram
  actor User
  participant Grid as Data grid
  participant Page
  User->>Grid: edit a cell
  alt the column is a date
    Note over Grid: the datepicker is the editor
  else another editor
    Note over Grid: that editor commits the cell
  end
  Grid->>Page: the updated row`,
        note: 'Write the edited row back from the page. The grid shows what you pass in.',
      },
      {
        title: 'Select rows',
        diagram: `sequenceDiagram
  actor User
  participant Grid as Data grid
  participant Page
  Page->>Grid: none, one, or many
  alt many
    User->>Grid: row checkbox, header checkbox for this page, or shift-click
    opt the user wants every row in the result
      Note over Grid: the banner selects all of them
    end
    Grid->>Page: the selected row objects
    Note over Grid: the same rows stay selected across paging, sort, and filter
  else one
    Grid->>Page: that one row
  end`,
        note: 'The selection is the row objects, keyed so they survive paging. It is not a list of ids, and the grid does not invent bulk actions. If you need an action on the selection, put that action in the page.',
      },
      {
        title: 'Export',
        diagram: `sequenceDiagram
  participant Page
  participant Grid as Data grid
  Page->>Grid: all, the selection, or this page
  Grid->>Page: those rows only
  Note over Page: analytics records the export, not the cell text`,
        note: '“Only selected” uses the current selection. Filter the columns before you export if some columns must not leave the page. The grid does not upload the file.',
      },
    ],
  ),

  [`${lib}/pixel-tree`]: piece(
    'The tree shows only the rows that are currently visible. Right expands a branch or moves into it. Left collapses it or moves to the parent. A checkbox can be mixed when some children are checked. There is no focus ring. Hover is the focus cue.',
    `flowchart TB
  subgraph page [Your page]
    Nodes[The tree data]
  end
  subgraph tree [Tree]
    Visible[Visible rows only]
    Keys[Right and Left]
    Box[Checkbox, including mixed]
  end
  Nodes --> Visible
  Keys --> Visible
  Box -->|checked, unchecked, or mixed| page`,
    [
      '**Do not render collapsed children.** Only the open path is in the list.',
      '**Right** expands or enters. **Left** collapses or goes to the parent.',
      '**Mixed** means some children are checked. It is a real mixed checkbox, not a third saved value you invent.',
      '**Focus.** The row does not draw a focus outline. The hover surface is the cue. Keep that, so the tree matches the rest of the library.',
    ],
    [
      {
        title: 'Expand',
        diagram: `sequenceDiagram
  actor User
  participant Tree
  User->>Tree: Right on a collapsed row
  Tree->>Tree: show its children
  User->>Tree: Left
  Note over Tree: collapse, or move to the parent`,
        note: 'Arrow keys walk the visible rows. Do not add a second click target that expands without the keyboard path.',
      },
      {
        title: 'Checkboxes',
        diagram: `sequenceDiagram
  actor User
  participant Tree
  participant Page
  User->>Tree: check a row
  alt every child is checked
    Tree->>Page: checked
  else some children are checked
    Tree->>Page: mixed
  else none are checked
    Tree->>Page: unchecked
  end`,
        note: 'Bind the checked state from the page if the tree is controlled. Mixed is the partial state, announced as mixed.',
      },
    ],
  ),

  [`${lib}/pixel-empty-state`]: piece(
    'The empty state replaces a blank region when there is nothing to show. If you give it no content, it renders nothing. Announce it only when it replaces a list that was there before. A static first paint should stay quiet. It has no skeleton, and it is not the empty message inside a select.',
    `flowchart TB
  subgraph page [Your page]
    Reason[Why it is empty]
    Action[Optional action]
  end
  subgraph empty [Empty state]
    Message[Title and body]
    Live[Announce, only if it replaces something]
  end
  Reason --> Message
  Action --> Message
  Message -->|dynamic replacement| Live
  Message -->|no content at all| Nothing[Renders nothing]`,
    [
      '**No content means nothing is rendered.** No announcement and no action button.',
      '**First paint** of an empty page should not use the live announcement. The user did not lose a list.',
      '**Replacing a list** should announce, so a screen reader hears that the rows are gone.',
      '**Select panels** use their own short message. Do not put this component inside the select list.',
    ],
    [
      {
        title: 'First paint',
        diagram: `sequenceDiagram
  participant Page
  participant Empty as Empty state
  Page->>Empty: title, and maybe an action
  Note over Empty: shown, not announced
  Note over Empty: there is no skeleton`,
        note: 'Use this when the page loads empty. Do not also fire a live region with the same sentence.',
      },
      {
        title: 'Replaces a list',
        diagram: `sequenceDiagram
  participant Page
  participant Empty as Empty state
  Page->>Empty: the list just became empty
  Note over Empty: announce it
  opt the page passed an action
    Note over Empty: that action is the way forward
  end`,
        note: 'Turn the announcement on only for this case. A filter that clears every row is the usual one.',
      },
      {
        title: 'No content',
        diagram: `sequenceDiagram
  participant Page
  participant Empty as Empty state
  Page->>Empty: no title, no body, no action
  Note over Empty: renders nothing
  Note over Empty: no announcement`,
        note: 'Do not use an empty component as a spacer. If there is nothing to say, do not mount it.',
      },
    ],
  ),

  [`${lib}/pixel-loader`]: piece(
    'The loader shows that work is in progress. The service counts jobs by id and hides the global loader only when the count is zero. Show delay and a minimum time still apply. A fullscreen container locks body scroll while that overlay is showing. That lock is not the service count.',
    `flowchart TB
  subgraph page [Your page]
    Job[One job id]
    More[Another job id]
  end
  subgraph loader [Loader]
    Mark[The indicator]
    Delay[Show delay and minimum time]
  end
  subgraph full [Fullscreen container]
    Lock[Scroll lock while the overlay is showing]
  end
  Job --> Mark
  More --> Mark
  Delay --> Mark
  full --> Lock
  page -->|HTTP or route helpers| Mark`,
    [
      '**One job.** Show it, then hide it when that job ends.',
      '**Two jobs.** The indicator stays until both ids are released. Hiding one does not clear the other.',
      '**track** wraps a promise so the count rises and falls with it.',
      '**HTTP and route helpers** can show the loader for you. Skip a call with the skip header when that request should stay quiet.',
      '**Fullscreen scroll lock** belongs to the fullscreen container, and only while its overlay is visible. The service count is a different mechanism.',
      '**The status is polite.** It is not an alert.',
    ],
    [
      {
        title: 'One job',
        diagram: `sequenceDiagram
  participant Page
  participant Loader
  Page->>Loader: show this job
  Note over Loader: wait out the show delay
  Page->>Loader: the job ends
  Note over Loader: stay at least the minimum time, then hide`,
        note: 'Do not hide on the same tick you show, if the delay has not elapsed. The loader will not flash for a fast job.',
      },
      {
        title: 'Two jobs',
        diagram: `sequenceDiagram
  participant Page
  participant Service as Loading service
  participant Loader
  Page->>Service: job A and job B
  Note over Loader: visible
  Page->>Service: job A ends
  Note over Loader: still visible
  Page->>Service: job B ends
  Note over Loader: hide, because the count is zero`,
        note: 'Release the same id you showed. A mismatched id leaves the loader up.',
      },
      {
        title: 'Request or route',
        diagram: `sequenceDiagram
  participant App
  participant Service as Loading service
  App->>Service: an HTTP call or a route change
  Note over Service: the helper shows the loader
  opt the call sets the skip header
    Note over Service: that call stays quiet
  end`,
        note: 'Use the skip header for background polling. Do not wrap those calls in track as well, or you will show the loader twice.',
      },
      {
        title: 'Full screen',
        diagram: `sequenceDiagram
  participant Page
  participant Overlay as Fullscreen container
  participant Service as Loading service
  Page->>Overlay: scope fullscreen, overlay showing
  Note over Overlay: body scroll locks
  Note over Service: the service count is separate
  Page->>Overlay: overlay hides
  Note over Overlay: scroll unlocks`,
        note: 'Do not describe the service count as the scroll lock. The lock follows the fullscreen overlay. The count only decides when the global indicator is allowed to hide.',
      },
    ],
  ),

  [`${lib}/pixel-progress`]: piece(
    'Progress is a bar, not a stepper. Determinate shows a known amount and announces the value. At 100 percent it emits completed once. Indeterminate, buffer, and query do not pretend to know the amount. Indeterminate drops the numeric value and marks itself busy.',
    `flowchart TB
  subgraph page [Your page]
    Amount[A known amount, or none]
  end
  subgraph bar [Progress]
    Known[Determinate]
    Unknown[Indeterminate, buffer, or query]
  end
  Amount -->|0 to 100| Known
  Known -->|100 percent, once| page
  Amount -->|no amount| Unknown`,
    [
      '**Determinate** needs a value. The bar exposes that value.',
      '**Completed fires once** when the value reaches 100. Do not expect it on every later change detection.',
      '**Indeterminate** removes the numeric value and sets busy. Buffer and query are the other unknown modes.',
      '**Not a stepper.** Steps are the stepper. This is only the bar.',
    ],
    [
      {
        title: 'Known amount',
        diagram: `sequenceDiagram
  participant Page
  participant Bar as Progress
  Page->>Bar: a percent
  Note over Bar: the value is announced
  alt the value reaches 100
    Bar->>Page: completed, once
  end`,
        note: 'Drive the value from the page. The bar does not estimate the work.',
      },
      {
        title: 'Unknown amount',
        diagram: `sequenceDiagram
  participant Page
  participant Bar as Progress
  Page->>Bar: indeterminate, buffer, or query
  Note over Bar: no numeric value
  Note over Bar: indeterminate is busy`,
        note: 'Use indeterminate when you cannot know the percent. Do not pass 0 and hope it looks unknown.',
      },
    ],
  ),
};
