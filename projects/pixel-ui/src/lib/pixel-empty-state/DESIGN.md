# pixel-empty-state — design

This page explains **pixel-empty-state** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

What the page shows when there is nothing to list. If you pass no content, it renders nothing. It announces itself only when it replaces something that was already on screen. A first paint that is empty should stay quiet. Loading is a skeleton or a loader, then either data or this state.

| This piece does | It does not |
| --- | --- |
| Explains an empty list and offers an action | Show a skeleton. Loading is a different control |
| Announces a dynamic empty result | Announce on the first paint of a page that loads empty |

## 2. Who talks to whom

The empty state replaces a blank region when there is nothing to show. If you give it no content, it renders nothing. Announce it only when it replaces a list that was there before. A static first paint should stay quiet. It has no skeleton, and it is not the empty message inside a select.

```mermaid
flowchart TB
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
  Message -->|no content at all| Nothing[Renders nothing]
```

**How to read the picture**

- **No content means nothing is rendered.** No announcement and no action button.
- **First paint** of an empty page should not use the live announcement. The user did not lose a list.
- **Replacing a list** should announce, so a screen reader hears that the rows are gone.
- **Select panels** use their own short message. Do not put this component inside the select list.

## 3. Flows

### First paint

1. While data is loading, show a loader or a skeleton. Do not show the empty state yet.
2. The request finishes with no rows. The empty state appears. It does not announce, because this is the first result.

### Replaces a list

1. The user filtered a list down to nothing. The empty state replaces rows and announces that, politely.
2. An optional button lets the user clear the filter or create the first item.

### No content

1. The page passes no title, text, or action into the empty state.
2. The empty state renders nothing. There is no announcement and no action button.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### First paint

```mermaid
sequenceDiagram
  participant Page
  participant Empty as Empty state
  Page->>Empty: title, and maybe an action
  Note over Empty: shown, not announced
  Note over Empty: there is no skeleton
```

Use this when the page loads empty. Do not also fire a live region with the same sentence.

### Replaces a list

```mermaid
sequenceDiagram
  participant Page
  participant Empty as Empty state
  Page->>Empty: the list just became empty
  Note over Empty: announce it
  opt the page passed an action
    Note over Empty: that action is the way forward
  end
```

Turn the announcement on only for this case. A filter that clears every row is the usual one.

### No content

```mermaid
sequenceDiagram
  participant Page
  participant Empty as Empty state
  Page->>Empty: no title, no body, no action
  Note over Empty: renders nothing
  Note over Empty: no announcement
```

Do not use an empty component as a spacer. If there is nothing to say, do not mount it.

## 5. States

- Not rendered when there is no content.
- Visible and quiet on first paint.
- Visible and announced when it replaces existing content.

## 6. Easy to get wrong

- Do not use this as a loading state.
- Do not announce a static empty first paint.
- Do not use this inside a select panel. Select has its own short empty message.

## 7. Files

- `pixel-empty-state.html`
- `pixel-empty-state.scss`
- `pixel-empty-state.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
