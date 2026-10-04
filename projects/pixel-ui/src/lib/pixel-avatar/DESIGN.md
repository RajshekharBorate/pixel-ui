# pixel-avatar — design

This page explains **pixel-avatar** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A person mark. It tries an image first, then initials, then an icon, then a plain placeholder. A clickable avatar is a real button. A group can show a few people and an overflow count.

| This piece does | It does not |
| --- | --- |
| Shows a person or a group of people | Upload a photo (use pixel-file-upload) |
| Falls back when the image fails | Invent a name |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  avatar["Avatar"]
  image["Image"]
  initials["Initials"]
  group["Avatar group"]
  more["Overflow"]
  page --> avatar
  avatar --> image
  avatar --> initials
  avatar --> page
  page --> group
  group --> avatar
  group --> more
```

## 3. Flows

### Photo

1. The page passes an image. The avatar shows it.
2. If the image fails, initials are used. If there are no initials, an icon, then a placeholder.

### Press

1. The page makes it clickable. It renders as a button with an accessible name.
2. The user presses it. A decorative avatar is not a button. It is only an image.

### Group

1. The page passes several people. The group shows the first few avatars.
2. The rest become an overflow chip on the group, not on a single avatar.

## 4. Step by step

### Photo

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant avatar as "Avatar"
  participant image as "Image"
  participant initials as "Initials"
  page->>avatar: The page passes an image.
  avatar->>initials: If the image fails, initials are used.
```

### Press

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant avatar as "Avatar"
  page->>avatar: The page makes it clickable.
  avatar->>page: The user presses it. A decorative avatar is not a button. It is only an image.
```

### Group

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant group as "Avatar group"
  participant avatar as "Avatar"
  participant more as "Overflow"
  page->>group: The page passes several people.
  group->>more: The rest become an overflow chip on the group, not on a single avatar.
```

## 5. States

- Image, initials, icon, or placeholder — the first one that works.
- Decorative: an image, not a control.
- Clickable: a button.
- Group overflow: a count of people who did not fit.

## 6. Easy to get wrong

- Do not put the overflow count on a single avatar. It belongs to pixel-avatar-group.
- Give a clickable avatar a name. A decorative one should not be a tab stop.

## 7. Files

- `pixel-avatar-group.html`
- `pixel-avatar-group.scss`
- `pixel-avatar-group.ts`
- `pixel-avatar.html`
- `pixel-avatar.scss`
- `pixel-avatar.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
