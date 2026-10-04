# pixel-chart-scatter — design

This page explains **pixel-chart-scatter** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

Points on two numeric axes. A large cloud can draw progressively. Clicks report a point. The page owns any drill or filter that follows.

| This piece does | It does not |
| --- | --- |
| Draws its series through the shared chart host | Ship inside the main barrel. Import from pixel-ui/charts |
| Plots x and y points | Become a bubble chart unless a size is part of this facade |

## 2. Who talks to whom

Scatter chart does not draw itself. It registers only its own chart modules, then the shared host creates the canvas, applies the theme, resizes, and disposes. Import it from pixel-ui/charts. Colors come from the design tokens. A chart that starts below the fold should wait until it is near the screen, inside a placeholder that already has a size.

```mermaid
flowchart TB
  subgraph page [Your page]
    Data[The data]
  end
  subgraph plot [Scatter chart]
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

- **Page → Scatter chart.** The page owns the rows. The plot does not fetch them.
- **Plot → host.** The host is the only place that creates, resizes, and destroys the canvas.
- **Theme → canvas.** Light and dark follow the page tokens. Do not hardcode series colors.
- **Empty data** should be the shell’s empty state, not a blank card.
- **Each point is an x and a y.** A large cloud uses the progressive path past the threshold.
- **A click reports ids and indexes.** Do not put the raw coordinates in analytics.

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

### Point click

1. The user clicks a point. The page reads the ids and indexes, not a raw payload in analytics.
2. A large set uses the progressive path past the threshold instead of drawing every point the slow way.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Draw

```mermaid
sequenceDiagram
  participant Page
  participant Plot as Scatter chart
  participant Host as Chart host
  Page->>Plot: the series
  Plot->>Host: only this chart's modules, then draw
  Note over Host: colors come from the token bridge
```

Import Scatter chart from pixel-ui/charts. Do not pull the canvas library through the main component barrel.

### No data

```mermaid
sequenceDiagram
  participant Page
  participant Plot as Scatter chart
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
  participant Plot as Scatter chart
  Host->>Plot: the container changed size
  Note over Host: resize the canvas
  opt the theme changes
    Note over Host: redraw with the new tokens
  end
  Note over Host: dispose when the view goes away
```

A chart below the fold should be deferred by the page until it is near the screen. Give the placeholder a size so the page does not jump when the canvas appears.

### Point click

```mermaid
sequenceDiagram
  actor User
  participant Plot as Scatter chart
  participant Page
  User->>Plot: click a point
  Plot->>Page: the point ids and indexes
  Note over Page: you filter or drill
  Note over Plot: a large cloud draws progressively
```

The page owns the next view. The chart does not navigate. If the point also has a size, use the bubble chart instead of overloading this one.

## 5. States

- Loading or skeleton, usually from the shell.
- Empty.
- Drawn.
- Resized or themed again.
- Progressive draw for a large cloud.

## 6. Easy to get wrong

- Import from pixel-ui/charts.
- Defer charts that start off screen. Give the placeholder a size so the page does not jump.
- Analytics for a point click is ids and indexes, not the raw coordinates text.

## 7. Files

- `pixel-chart-scatter.html`
- `pixel-chart-scatter.scss`
- `pixel-chart-scatter.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
