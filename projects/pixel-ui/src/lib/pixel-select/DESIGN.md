# pixel-select — design

This page explains **pixel-select** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A closed field that opens a list. One or many options can be chosen. The empty list is a short message inside the panel, not a full empty-state page. Loading more rows is paging, not virtualization.

| This piece does | It does not |
| --- | --- |
| Opens a list and commits a choice | Create a brand-new value (use pixel-autocomplete when you need that) |
| Supports single and multiple | Virtualize the list. Load-more only asks for the next page |

## 2. Who talks to whom

The field is closed until the user opens a list. The page supplies the options. Choosing a row commits it. An empty list is a short message in the panel, not a full empty-state page. Load-more asks for the next page. It does not virtualize the list.

```mermaid
flowchart TB
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
  List -->|ask for more| page
```

**How to read the picture**

- **Open.** Click, Enter, Space, or Arrow Down opens the list. Escape closes it without a new value.
- **Single.** Picking a row closes the panel and updates the value.
- **Many.** Chosen values stay as tags. Backspace removes the last tag. That is not text editing.
- **Empty.** The message is inside the panel. Do not put pixel-empty-state there.
- **Skeleton.** It replaces the field until options exist.

## 3. Flows

### Pick one

1. The page passes options. The field shows the current label or a placeholder.
2. The user opens it with click, Enter, Space, or Arrow Down. Focus moves in the list.
3. The user picks a row. The panel closes and the value updates. Escape closes without a new value.

### Pick many

1. Multiple mode keeps the chosen values as tags. Picking a row toggles it.
2. Backspace removes the last tag from the field. The page receives the new list.

### No options

1. The list is open and there is nothing to pick. A short empty message is shown in the panel.
2. If the page supports paging, the list asks for more. That is not a virtual scroll window.

### Skeleton

1. Before options exist, the skeleton replaces the field.
2. Options arrive. The field is shown and can be opened.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Pick one

```mermaid
sequenceDiagram
  actor User
  participant Select
  participant Page
  Page->>Select: options and the current label
  User->>Select: open the list
  alt the user picks a row
    Select->>Page: the value, and the panel closes
  else Escape
    Note over Select: close with no new value
  end
```

The closed field shows the current label or a placeholder. Do not treat the open list as a dialog. Escape cancels.

### Pick many

```mermaid
sequenceDiagram
  actor User
  participant Select
  participant Page
  User->>Select: toggle a row
  Note over Select: the panel stays useful for another pick
  User->>Select: Backspace
  Select->>Page: the last tag is removed
```

The value is a list. Backspace on the field removes a tag. It does not edit the tag text.

### No options

```mermaid
sequenceDiagram
  participant Page
  participant List as List
  Page->>List: open, and there is nothing to pick
  List->>List: short empty message
  opt the page supports another page
    List->>Page: load more
    Note over List: this is paging, not virtual scroll
  end
```

Load more means “ask the page for the next page of options”. It does not window a huge list in place.

### Skeleton

```mermaid
sequenceDiagram
  participant Page
  participant Skeleton
  participant Select
  Page->>Skeleton: before options exist
  Note over Select: the field is not shown
  Page->>Select: options arrive
```

Do not open an empty list while the skeleton is up. Wait until the field is real.

## 5. States

- Closed, open, and loading more.
- Single value or tags.
- Empty list: a message in the panel.
- Disabled, readonly, and error from the form.
- Skeleton before the field is ready.

## 6. Easy to get wrong

- The empty panel is not pixel-empty-state. It is a short message in the list.
- Load more is paging. It does not virtualize a huge list.
- Backspace on a multiple field removes a tag. Do not treat that as text editing.

## 7. Files

- `pixel-select.html`
- `pixel-select.scss`
- `pixel-select.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
