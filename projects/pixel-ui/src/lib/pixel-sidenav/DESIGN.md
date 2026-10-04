# pixel-sidenav — design

This page explains **pixel-sidenav** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

The side navigation. It can sit beside the page or cover it. Below the breakpoint it is forced to cover. It can collapse to a rail or hide. Cover mode has a scrim, a focus trap, and Escape.

| This piece does | It does not |
| --- | --- |
| Shows navigation beside the page or over it | Replace the router |
| Collapses to a rail or hides | Keep side-by-side mode on a small screen |

## 2. Who talks to whom

The sidenav is either beside the page or covering it. Below the breakpoint it is forced to cover. The page supplies the navigation landmark inside it. An overlay locks focus, shows a scrim, and closes on Escape. Inside the app shell, the brand border is dropped when a header is present.

```mermaid
flowchart TB
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
  Over -->|scrim, trap, Escape| page
```

**How to read the picture**

- **The page owns the links.** The sidenav is the panel. Put a real nav element in it.
- **Beside** is the docked rail. **Cover** is the overlay: scrim, focus trap, Escape.
- **Narrow screens force cover,** even if the page asked for beside.
- **Inside the shell,** the brand border is suppressed when the header is there, so the frame has one divider.

## 3. Flows

### Beside the page

1. Side mode sits next to the content. The page still scrolls normally.
2. The user or the page can collapse it to a rail, or hide it.

### Cover the page

1. Over mode, and any viewport below the breakpoint, covers the page. Focus is trapped. A scrim is shown.
2. Escape or the scrim closes it and restores the trigger.

### Inside the shell

1. When a header is present, the shell suppresses the sidenav brand border.
2. The sidenav still spans the full shell height.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Beside the page

```mermaid
sequenceDiagram
  participant Page
  participant Nav as Sidenav
  Page->>Nav: beside the page
  Note over Nav: the page stays usable
  Note over Page: put the nav landmark inside
```

Use beside for an app that keeps the nav visible. The sidenav does not replace the page content.

### Cover the page

```mermaid
sequenceDiagram
  actor User
  participant Nav as Sidenav
  participant Page
  Page->>Nav: cover
  Note over Nav: scrim and focus trap
  User->>Nav: Escape
  Nav->>Page: close and return focus
```

Cover is modal. Do not also open a dialog from the same control without deciding which one owns focus.

### Inside the shell

```mermaid
sequenceDiagram
  participant Shell as App shell
  participant Nav as Sidenav
  Shell->>Nav: header is present
  Note over Nav: brand border is off
  alt the screen is narrow
    Note over Nav: forced to cover
  end
```

Do not draw a second brand border inside the shell. The shell already shares one divider with the header.

## 5. States

- Side, cover, rail, or hidden.
- Forced cover below the breakpoint.
- Cover: scrim, focus trap, Escape.
- Brand border off inside the shell when a header exists.

## 6. Easy to get wrong

- Do not expect side-by-side layout on a small screen. It becomes a cover.
- Put the actual navigation landmark in the sidenav content. The shell does not add a nav for you.

## 7. Files

- `pixel-sidenav.html`
- `pixel-sidenav.scss`
- `pixel-sidenav.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
