# pixel-app-shell — design

This page explains **pixel-app-shell** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

The page frame. It has no inputs. It places a header, a sidenav, and a footer by their tags, and puts everything else in main. It draws one shared toolbar line and asks the header and sidenav not to draw a second border.

| This piece does | It does not |
| --- | --- |
| Composes header, sidenav, footer, and main | Take configuration inputs of its own |
| Keeps a short page stuck to the footer and a long page scrolling | Fix the shell to the viewport height |

## 2. Who talks to whom

```mermaid
flowchart LR
  page["Your page"]
  shell["App shell"]
  header["Header"]
  nav["Sidenav"]
  main["Main"]
  footer["Footer"]
  page --> shell
  shell --> header
  shell --> nav
  shell --> main
  shell --> footer
```

## 3. Flows

### Compose the frame

1. The page projects the four regions. The sidenav spans the shell height. Header and footer sit in the other column.
2. One toolbar divider is drawn. The header drops its own sticky border. The sidenav drops its brand border.

### Short and long pages

1. Use a minimum height, not a fixed height. A short page keeps the footer at the bottom.
2. A long page scrolls the document. The shell does not trap that scroll.

## 4. Step by step

### Compose the frame

```mermaid
sequenceDiagram
  participant page as "Your page"
  participant shell as "App shell"
  participant header as "Header"
  participant nav as "Sidenav"
  participant main as "Main"
  participant footer as "Footer"
  page->>shell: The page projects the four regions.
  shell->>header: One toolbar divider is drawn.
```

### Short and long pages

```mermaid
sequenceDiagram
  participant shell as "App shell"
  participant main as "Main"
  participant footer as "Footer"
  shell->>main: Use a minimum height, not a fixed height.
  main->>main: A long page scrolls the document.
```

## 5. States

- With or without each region. Missing tags simply leave a gap in that slot.
- Toolbar divider measured from the real header height, including a wrapped mobile header.

## 6. Easy to get wrong

- Do not set a fixed height on the shell. Use the minimum height so short and long pages both work.
- Do not turn header sticky or sidenav brand border back on inside the shell. The shell already draws that line.

## 7. Files

- `pixel-app-shell.html`
- `pixel-app-shell.scss`
- `pixel-app-shell.tokens.ts`
- `pixel-app-shell.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
