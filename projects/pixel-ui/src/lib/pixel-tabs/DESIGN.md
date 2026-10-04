# pixel-tabs — design

This page explains **pixel-tabs** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A tab list and panels. Arrow keys move, Home and End jump, and disabled tabs are skipped. The tab list needs an accessible name. Lazy panels skip creating the DOM until the tab is chosen. They do not skip loading scripts.

| This piece does | It does not |
| --- | --- |
| Shows one panel at a time | Lazy-load JavaScript. Lazy only skips creating the panel DOM |
| Scrolls the tab list when it overflows | Leave the tab list unnamed |

## 2. Who talks to whom

Tabs are a tab list, tabs, and panels. Only one panel is selected. Roving focus skips disabled tabs. Every tab needs an accessible name. Lazy skips creating the panel DOM until the tab is chosen. It does not skip the tab button itself.

```mermaid
flowchart TB
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
  List -->|too many| More
```

**How to read the picture**

- **Keyboard.** Arrows, Home, and End move through the tabs. Disabled tabs are skipped. Delete closes a tab when that tab can be closed. The group always needs an accessible name.
- **Lazy** skips creating the panel DOM until that tab is selected. It does not keep the panel’s code out of the bundle. Heavy bodies should be deferred by the page.
- **Overflow.** Extra tabs scroll, with chevrons. They do not wrap into a second unlabeled row.
- **Skeleton** replaces the tab list until the tabs are known.

## 3. Flows

### Select a tab

1. The page names the tab list. One tab is selected and its panel is shown.
2. Click, Enter, or Space selects a tab. Arrows move. Disabled tabs are skipped.

### Lazy panel

1. A lazy panel is not created in the DOM until the first time it is selected.
2. Heavy work inside the panel should use the page’s own defer. Lazy does not split JavaScript.

### Too many tabs

1. When the labels do not fit, the list scrolls and chevrons appear.
2. The user scrolls to the hidden tab and selects it. The panel still follows the selection.

### Skeleton

1. Before tabs are known, the skeleton replaces the list.
2. Labels arrive. The real tab list is shown.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Select a tab

```mermaid
sequenceDiagram
  actor User
  participant Tabs
  participant Page
  Page->>Tabs: tabs, each with a name
  User->>Tabs: arrow to a tab
  Tabs->>Page: that panel is selected
  Note over Tabs: disabled tabs are skipped
```

Do not leave a tab without a name. The tab list cannot announce it.

### Lazy panel

```mermaid
sequenceDiagram
  participant Page
  participant Tabs
  Page->>Tabs: lazy panel
  Note over Tabs: the panel DOM waits
  actor User
  User->>Tabs: select it
  Note over Tabs: the panel is created now
```

Lazy skips creating the panel DOM. The component code is already in the page bundle. If the body is heavy, defer it in the page as well.

### Too many tabs

```mermaid
sequenceDiagram
  participant Tabs
  Note over Tabs: the row scrolls
  Note over Tabs: chevrons move the row
```

Keep the selected tab reachable. Do not hide overflow tabs in a second control unless you are replacing this pattern.

### Skeleton

```mermaid
sequenceDiagram
  participant Page
  participant Tabs
  Page->>Tabs: skeleton
  Note over Tabs: the tab list is not shown yet
  Page->>Tabs: the real tabs
```

Use the skeleton while the tab names are loading. Do not render empty tabs and call that loading.

## 5. States

- One selected tab, the rest unselected.
- Disabled tab: skipped by the keyboard.
- Overflow: scroll and chevrons.
- Lazy panel: not in the DOM until selected.
- Skeleton while loading.

## 6. Easy to get wrong

- Give the tab list an accessible name. It is required.
- Lazy skips DOM creation, not code loading.
- Do not put a tab panel’s only content behind a control the user cannot reach.

## 7. Files

- `_tabs-styles.scss`
- `pixel-tab-label.ts`
- `pixel-tab-link.scss`
- `pixel-tab-link.ts`
- `pixel-tab-nav.scss`
- `pixel-tab-nav.token.ts`
- `pixel-tab-nav.ts`
- `pixel-tab.ts`
- `pixel-tabs.scss`
- `pixel-tabs.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
