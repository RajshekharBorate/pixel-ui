# pixel-autocomplete — design

This page explains **pixel-autocomplete** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A text field with a suggestion panel. Focus stays in the field. The highlighted row is pointed at with aria-activedescendant. Multiple values become chips and the panel can stay open. A custom value is only for a single field.

| This piece does | It does not |
| --- | --- |
| Filters suggestions as the user types | Move focus into the panel. Focus stays in the input |
| Can add a new row when creatable | Commit a custom value on every keystroke when multiple is on |

## 2. Who talks to whom

Focus stays in the text field. Arrow keys move a highlight in the panel, announced from the field. They do not move DOM focus into the list. Multiple values are chips, and the panel stays open after a pick. A custom value on every keystroke is single-value only.

```mermaid
flowchart TB
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
  Create -->|new text| Input
```

**How to read the picture**

- **Focus stays in the input.** The active row is pointed at. Do not move focus into the panel.
- **Escape closes the panel** and leaves the typed text.
- **Several values.** The value is a list plus chips. Choosing a row does not close the panel.
- **Create.** A Create row appears for text that is not in the list, when creatable is on. Committing a custom value on every keystroke is single-value only.

## 3. Flows

### Pick a suggestion

1. The user focuses the field and types. Suggestions update.
2. Arrow keys move the highlight. Focus stays in the input. The active row is announced.
3. Enter commits the highlighted row. Escape closes the panel and leaves the text.

### Several values

1. Multiple mode stores a list. Choosing a row adds a chip. The panel stays open.
2. Removing a chip updates the list. The value is a list, not one string.

### Create a value

1. When creatable, a Create row appears for text that is not in the list.
2. Choosing Create commits that text. A custom value on every keystroke is single-value only, not multiple.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Pick a suggestion

```mermaid
sequenceDiagram
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
  end
```

Do not put a second focusable list on top of this field. The input is the only tab stop.

### Several values

```mermaid
sequenceDiagram
  participant Field as Autocomplete
  participant Page
  Field->>Field: add a chip, keep the panel open
  Field->>Page: the list of values
  Note over Field: not one string
```

Removing a chip updates the list. Do not bind a single string to multiple mode.

### Create a value

```mermaid
sequenceDiagram
  participant Field as Autocomplete
  participant Page
  alt creatable, and the text is new
    Field->>Field: show a Create row
    Field->>Page: choosing it commits that text
  else custom value on every keystroke
    Note over Field: single value only, not chips
  end
```

Do not turn on “commit as the user types” together with multiple. That path is for one value.

## 5. States

- Closed, open, and highlighted row.
- Single value, or chips for many.
- Create row when the typed text is new and creatable is on.
- Disabled, readonly, and error.

## 6. Easy to get wrong

- Do not move DOM focus into the panel. The input keeps focus.
- allowCustomValue commits as the user types, and only for a single value.
- Multiple mode is a list of values plus chips. The panel stays open after a pick.

## 7. Files

- `pixel-autocomplete.html`
- `pixel-autocomplete.scss`
- `pixel-autocomplete.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
