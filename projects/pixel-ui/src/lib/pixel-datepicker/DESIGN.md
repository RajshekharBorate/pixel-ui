# pixel-datepicker — design

This page explains **pixel-datepicker** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A date field. The host is the form control. The inner text is only a display. Typed text stays a draft until blur or Enter. Picking a day in the calendar commits immediately unless the page turned on action buttons. Values are ISO dates.

| This piece does | It does not |
| --- | --- |
| Edits one date and commits a draft safely | Treat the inner input as the form control |
| Parses ISO dates | Emit null while the user is still typing a partial date |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  field["Date field"]
  text["Draft text"]
  cal["Calendar"]
  page --> field
  field --> text
  text --> field
  field --> page
  field --> cal
  cal --> field
```

## 3. Flows

### Type a date

1. The page sets an ISO date. The user edits the text. That text is only a draft.
2. Blur or Enter commits a valid date. Escape closes the popup and restores focus. An invalid draft does not wipe the last good value.

### Pick a day

1. Opening the field shows the calendar. Choosing a day commits at once.
2. If the page shows action buttons, the day stays a draft until OK. Cancel restores the previous date.

## 4. Step by step

### Type a date

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant field as "Date field"
  participant text as "Draft text"
  page->>field: The page sets an ISO date.
  text->>field: Blur or Enter commits a valid date.
```

### Pick a day

```mermaid
sequenceDiagram
  participant field as "Date field"
  participant cal as "Calendar"
  field->>cal: Opening the field shows the calendar.
  cal->>field: If the page shows action buttons, the day stays a draft until OK.
```

## 5. States

- Empty, draft text, and committed ISO date.
- Calendar open or closed.
- Disabled, readonly, and error.

## 6. Easy to get wrong

- Bind the form to the host, not the inner input.
- Do not commit on every keystroke. Wait for blur, Enter, or a calendar pick.

## 7. Files

- `pixel-datepicker.html`
- `pixel-datepicker.scss`
- `pixel-datepicker.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
