# pixel-chart-area — design

This page explains **pixel-chart-area** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A filled line. It follows the same host, theme, time axis, and large-series rules as the line chart. Stacked areas add the series together.

| This piece does | It does not |
| --- | --- |
| Draws its series through the shared chart host | Ship inside the main barrel. Import from pixel-ui/charts |
| Shows volume under a line | Use a separate color system. Colors come from the theme |

## 2. Who talks to whom

Area chart does not draw itself. It registers only its own chart modules, then the shared host creates the canvas, applies the theme, resizes, and disposes. Import it from pixel-ui/charts. Colors come from the design tokens. A chart that starts below the fold should wait until it is near the screen, inside a placeholder that already has a size.

```mermaid
flowchart TB
  subgraph page [Your page]
    Data[The data]
  end
  subgraph plot [Area chart]
    Modules[Only this chart's modules]
  end
  subgraph host [Chart host]
    Canvas[Canvas]
    Theme[Token colors]
  end
  Data --> plot
  Modules --> Canvas
  Theme --> Canvas
  page -->|off screen| Wait[Sized placeholder, then draw]
```

**How to read the picture**

- **Page → Area chart.** The page owns the rows. The plot does not fetch them.
- **Plot → host.** The host is the only place that creates, resizes, and destroys the canvas.
- **Theme → canvas.** Light and dark follow the page tokens. Do not hardcode series colors.
- **Empty data** should be the shell’s empty state, not a blank card.
- **Area follows the line chart** for the time axis, the theme, and large-series sampling. Stacked areas add the series. Do not create a second host.

## 3. Flows

### Draw

1. The page passes data. The plot registers only its chart modules, then the host draws.
2. Colors come from the theme bridge, so light and dark follow the page tokens.

### No data

1. An empty series should show the shell empty state, not a blank card.
2. When data arrives, the host draws again.

### Resize

1. The container changes size. The host resizes the canvas. Below-the-fold charts should defer until they are near the screen, with a sized placeholder.
2. A theme change redraws with the new tokens. Dispose happens when the view goes away.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Draw

```mermaid
sequenceDiagram
  participant Page
  participant Plot as Area chart
  participant Host as Chart host
  Page->>Plot: the series
  Plot->>Host: only this chart's modules, then draw
  Note over Host: colors come from the token bridge
```

Import Area chart from pixel-ui/charts. Do not pull the canvas library through the main component barrel.

### No data

```mermaid
sequenceDiagram
  participant Page
  participant Plot as Area chart
  participant Host as Chart host
  Page->>Plot: an empty series
  Note over Plot: show the shell empty state
  Page->>Plot: data arrives
  Plot->>Host: draw again
```

Do not leave a blank card. The shell already has the empty state. When rows arrive, the host draws. It does not need a new component.

### Resize

```mermaid
sequenceDiagram
  participant Host as Chart host
  participant Plot as Area chart
  Host->>Plot: the container changed size
  Note over Host: resize the canvas
  opt the theme changes
    Note over Host: redraw with the new tokens
  end
  Note over Host: dispose when the view goes away
```

A chart below the fold should be deferred by the page until it is near the screen. Give the placeholder a size so the page does not jump when the canvas appears.

## 5. States

- Loading or skeleton, usually from the shell.
- Empty.
- Drawn.
- Resized or themed again.
- Stacked area.

## 6. Easy to get wrong

- Import from pixel-ui/charts.
- Defer charts that start off screen. Give the placeholder a size so the page does not jump.
- Treat area like line for time axes and sampling. Do not invent a second host.

## 7. Files

- `pixel-chart-area.html`
- `pixel-chart-area.scss`
- `pixel-chart-area.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
