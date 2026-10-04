import { piece } from './depth-shared.mjs';

const lib = 'projects/pixel-ui/src/lib';

function series(name, owns, extras = []) {
  return piece(
    `${name} does not draw itself. It registers only its own chart modules, then the shared host creates the canvas, applies the theme, resizes, and disposes. Import it from pixel-ui/charts. Colors come from the design tokens. A chart that starts below the fold should wait until it is near the screen, inside a placeholder that already has a size.`,
    `flowchart TB
  subgraph page [Your page]
    Data[The data]
  end
  subgraph plot [${name}]
    Modules[Only this chart's modules]
  end
  subgraph host [Chart host]
    Canvas[Canvas]
    Theme[Token colors]
  end
  Data --> plot
  Modules --> Canvas
  Theme --> Canvas
  page -->|off screen| Wait[Sized placeholder, then draw]`,
    [
      `**Page → ${name}.** The page owns the rows. The plot does not fetch them.`,
      '**Plot → host.** The host is the only place that creates, resizes, and destroys the canvas.',
      '**Theme → canvas.** Light and dark follow the page tokens. Do not hardcode series colors.',
      '**Empty data** should be the shell’s empty state, not a blank card.',
      ...owns,
    ],
    [
      {
        title: 'Draw',
        diagram: `sequenceDiagram
  participant Page
  participant Plot as ${name}
  participant Host as Chart host
  Page->>Plot: the series
  Plot->>Host: only this chart's modules, then draw
  Note over Host: colors come from the token bridge`,
        note: `Import ${name} from pixel-ui/charts. Do not pull the canvas library through the main component barrel.`,
      },
      {
        title: 'No data',
        diagram: `sequenceDiagram
  participant Page
  participant Plot as ${name}
  participant Host as Chart host
  Page->>Plot: an empty series
  Note over Plot: show the shell empty state
  Page->>Plot: data arrives
  Plot->>Host: draw again`,
        note: 'Do not leave a blank card. The shell already has the empty state. When rows arrive, the host draws. It does not need a new component.',
      },
      {
        title: 'Resize',
        diagram: `sequenceDiagram
  participant Host as Chart host
  participant Plot as ${name}
  Host->>Plot: the container changed size
  Note over Host: resize the canvas
  opt the theme changes
    Note over Host: redraw with the new tokens
  end
  Note over Host: dispose when the view goes away`,
        note: 'A chart below the fold should be deferred by the page until it is near the screen. Give the placeholder a size so the page does not jump when the canvas appears.',
      },
      ...extras,
    ],
  );
}

export const chartDepth = {
  [`${lib}/pixel-chart`]: piece(
    'This is the shared core, not a chart the page usually drops in. A facade such as bar or line registers the modules it needs. The host creates the canvas, draws, resizes, and disposes it. The theme bridge maps design tokens to chart colors. Sparkline does not use this canvas. It is SVG.',
    `flowchart TB
  subgraph page [Your page or a facade]
    Options[Chart options]
  end
  subgraph core [Chart core]
    Host[Host: init, draw, resize, dispose]
    Theme[Token bridge]
    Modules[Modules loaded per type]
  end
  Options --> Host
  Modules --> Host
  Theme --> Host`,
    [
      '**The host owns the canvas lifecycle.** Facades must not create a second canvas.',
      '**Modules load per chart type.** A bar chart does not load the map.',
      '**A large series** can switch to progressive draw or sampling after the documented thresholds.',
      '**Time labels** use a pattern, Intl options, a function, or null. Angular names such as mediumDate are not a format here.',
      '**Sparkline is not this host.**',
    ],
    [
      {
        title: 'Draw',
        diagram: `sequenceDiagram
  participant Page
  participant Host as Chart host
  participant Modules as Series modules
  Page->>Host: options
  Modules->>Host: only the modules this chart needs
  Note over Host: the token bridge supplies colors`,
        note: 'Prefer the facades. Reach for the host when you are building a new series, and register only the modules that series needs.',
      },
      {
        title: 'Resize and dispose',
        diagram: `sequenceDiagram
  participant Host as Chart host
  Host->>Host: container resized
  opt the point count crosses the threshold
    Note over Host: progressive draw or sampling
  end
  Note over Host: dispose when the view is destroyed`,
        note: 'Dispose is required. A chart that stays allocated after the view is gone will keep the canvas. Defer off-screen charts in the page, with a sized placeholder.',
      },
      {
        title: 'Time axis',
        diagram: `sequenceDiagram
  participant Page
  participant Host as Chart host
  Page->>Host: real dates
  Note over Host: labels use the date adapter when one is provided
  opt the categories are free text
    Note over Host: leave them as typed
  end`,
        note: 'Do not pass an Angular named format. Use a pattern, Intl options, a function, or null. Free-text categories such as a quarter label are not dates.',
      },
    ],
  ),

  [`${lib}/pixel-chart-shell`]: piece(
    'The shell is the card around a plot: title, description, legend, export, and fullscreen. The card is not a button, because the shell already contains buttons. There is no inline data table. CSV is a download. Loading, skeleton, and empty live here. The plot is projected inside.',
    `flowchart TB
  subgraph page [Your page]
    Plot[The projected plot]
  end
  subgraph shell [Chart shell]
    Title[Title and description]
    Legend[Legend]
    File[Export download]
    Full[Fullscreen]
  end
  Plot --> shell
  Legend -->|series id and visible, never the series name| page
  File -->|download, not an inline table| page
  Full --> Plot`,
    [
      '**Project the plot.** The shell does not draw the series.',
      '**The card is not clickable.** Do not turn the shell into an interactive card.',
      '**Legend toggle** can be recorded as the chart id, the series id, and whether it is visible. Never the series name.',
      '**show values** on the shell must match the plot, except gauge and sparkline, which do not use that toggle.',
      '**Export** downloads a file. It does not render a table under the chart.',
    ],
    [
      {
        title: 'Show a chart',
        diagram: `sequenceDiagram
  participant Page
  participant Shell as Chart shell
  participant Plot
  Page->>Shell: title and the projected plot
  alt loading or skeleton
    Note over Shell: the shell shows that state
  else there is no data
    Note over Shell: the empty state
  else data is ready
    Shell->>Plot: the plot draws inside the card
  end`,
        note: 'Keep loading and empty on the shell. The plot should not invent a second empty card.',
      },
      {
        title: 'Legend',
        diagram: `sequenceDiagram
  actor User
  participant Shell as Chart shell
  participant Plot
  User->>Shell: toggle a series
  Shell->>Plot: that series is shown or hidden
  Note over Shell: analytics is the chart id, the series id, and visible
  Note over Plot: a hidden series keeps its color`,
        note: 'Do not recolor the remaining series when one is hidden. The color stays tied to the series.',
      },
      {
        title: 'Export and expand',
        diagram: `sequenceDiagram
  actor User
  participant Shell as Chart shell
  User->>Shell: export
  Note over Shell: a file download, not an inline table
  User->>Shell: expand
  Note over Shell: fullscreen
  Note over Shell: gauge and sparkline do not use the values toggle`,
        note: 'Bind show-values on the shell to the same input on the plot when the plot supports it. Skip that bind for a gauge or a sparkline.',
      },
    ],
  ),

  [`${lib}/pixel-chart-bar`]: series(
    'Bar chart',
    [
      '**Modes** are single, grouped, stacked, and 100 percent stacked. Value labels hide when the grid is too dense.',
      '**A click reports the point.** The page owns drill-down. The chart does not navigate.',
    ],
    [
      {
        title: 'Drill-down',
        diagram: `sequenceDiagram
  actor User
  participant Plot as Bar chart
  participant Page
  User->>Plot: click a bar
  Plot->>Page: the point
  Page->>Plot: the next categories and series
  Note over Page: the breadcrumb is yours
  Note over Plot: the click is pointer-oriented`,
        note: 'Put the breadcrumb in the chart header and hide it at the root. Keyboard users reach the numbers through the shell, not through the canvas. Analytics for the click is ids and indexes, not a raw coordinate dump.',
      },
    ],
  ),

  [`${lib}/pixel-chart-line`]: series(
    'Line chart',
    [
      '**A time axis needs real dates.** Free-text categories stay as typed.',
      '**Large series** sample or draw progressively only after the documented threshold.',
      '**Point clicks are for the pointer.** Keyboard access to the numbers is the shell.',
    ],
    [
      {
        title: 'Time axis',
        diagram: `sequenceDiagram
  participant Page
  participant Plot as Line chart
  participant Host as Chart host
  Page->>Plot: a time axis with real dates
  Plot->>Host: draw
  Note over Host: tooltip headers use the same date format
  opt the label must include the clock time
    Note over Page: provide a custom formatter
  end`,
        note: 'Do not pass an Angular named date format. If the categories are labels such as a quarter name, leave them alone. They are not dates.',
      },
    ],
  ),

  [`${lib}/pixel-chart-area`]: series('Area chart', [
    '**Area follows the line chart** for the time axis, the theme, and large-series sampling. Stacked areas add the series. Do not create a second host.',
  ]),

  [`${lib}/pixel-chart-pie`]: series(
    'Pie chart',
    [
      '**A slice click is a report.** The page decides whether to drill or filter. The pie does not change the route.',
      '**A hidden slice keeps its color** so the remaining slices do not shift palette.',
    ],
    [
      {
        title: 'Slice click',
        diagram: `sequenceDiagram
  actor User
  participant Plot as Pie chart
  participant Page
  User->>Plot: click a slice
  Plot->>Page: that slice
  Page->>Plot: the next data, if the page wants a drill
  Note over Plot: the pie does not navigate`,
        note: 'Handle the click in the page. Rebind the data if the next view is still a pie. Do not push a route from inside the chart.',
      },
    ],
  ),

  [`${lib}/pixel-chart-gauge`]: series(
    'Gauge',
    [
      '**One number** between a min and a max. There is no legend series to hide.',
      '**Do not bind the shell values toggle.** The gauge does not use it.',
    ],
    [
      {
        title: 'Update the value',
        diagram: `sequenceDiagram
  participant Page
  participant Plot as Gauge
  participant Host as Chart host
  Page->>Plot: the value, min, and max
  Plot->>Host: redraw the dial
  Note over Plot: no legend and no values toggle`,
        note: 'The meaning of the number is the label you put in the shell. The gauge does not invent a second series for it.',
      },
    ],
  ),

  [`${lib}/pixel-chart-scatter`]: series(
    'Scatter chart',
    [
      '**Each point is an x and a y.** A large cloud uses the progressive path past the threshold.',
      '**A click reports ids and indexes.** Do not put the raw coordinates in analytics.',
    ],
    [
      {
        title: 'Point click',
        diagram: `sequenceDiagram
  actor User
  participant Plot as Scatter chart
  participant Page
  User->>Plot: click a point
  Plot->>Page: the point ids and indexes
  Note over Page: you filter or drill
  Note over Plot: a large cloud draws progressively`,
        note: 'The page owns the next view. The chart does not navigate. If the point also has a size, use the bubble chart instead of overloading this one.',
      },
    ],
  ),

  [`${lib}/pixel-chart-bubble`]: series(
    'Bubble chart',
    [
      '**Each point has x, y, and a size.** Size is data. Do not drop it and use the scatter facade.',
      '**The shell can still hide a series** from the legend. A click still belongs to the page.',
    ],
    [
      {
        title: 'Point click',
        diagram: `sequenceDiagram
  participant Page
  participant Plot as Bubble chart
  participant Host as Chart host
  Page->>Plot: points that include a size
  Plot->>Host: draw the bubbles
  actor User
  User->>Plot: click a bubble
  Plot->>Page: that point
  Note over Page: you decide what happens next`,
        note: 'Keep size on the point. A missing size falls through to the value only when the facade already documents that fallback. Do not strip size and call it a scatter.',
      },
    ],
  ),

  [`${lib}/pixel-chart-radar`]: series('Radar chart', [
    '**Each series is a shape on the same spokes.** The page owns the spoke labels. Keep the spoke count small. A long category list belongs on a bar chart.',
    '**The legend can hide a series.** The hidden series keeps its color.',
  ]),

  [`${lib}/pixel-chart-sparkline`]: piece(
    'A sparkline is a short SVG trend with no axes, no legend, and no values toggle. It does not create the chart host and it does not load the canvas library. Put it in a table cell or a compact stat.',
    `flowchart TB
  subgraph page [Your page]
    Numbers[A short list of numbers]
  end
  subgraph plot [Sparkline]
    Svg[SVG line]
  end
  subgraph place [Where it sits]
    Cell[Table cell or stat]
  end
  Numbers --> Svg
  Svg --> Cell`,
    [
      '**No host.** Do not wrap it in the canvas lifecycle.',
      '**No chrome.** No axes, no legend, no values toggle.',
      '**No points** means there is no line. Do not load the canvas library to show nothing.',
    ],
    [
      {
        title: 'Draw',
        diagram: `sequenceDiagram
  participant Page
  participant Plot as Sparkline
  participant Cell as Cell or stat
  Page->>Plot: a short list of numbers
  Note over Plot: SVG only, no chart host
  Plot->>Cell: the trend sits in the cell`,
        note: 'Import it from pixel-ui/charts with the other charts, and stop there. Do not add a legend or the shell values toggle.',
      },
      {
        title: 'No points',
        diagram: `sequenceDiagram
  participant Page
  participant Plot as Sparkline
  Page->>Plot: no numbers
  Note over Plot: nothing to draw
  Page->>Plot: numbers arrive
  Note over Plot: the SVG updates in place`,
        note: 'An empty sparkline is an absence of a line. It is not a reason to mount the chart host.',
      },
    ],
  ),

  [`${lib}/pixel-chart-map`]: piece(
    'The map draws geography the page supplies. The library does not ship a world atlas. The page registers GeoJSON, then binds values. A click reports a region or a point. The page owns any drill or filter. Pan and zoom are pointer actions.',
    `flowchart TB
  subgraph page [Your page]
    Geo[GeoJSON]
    Data[Region values, points, or links]
  end
  subgraph map [Map]
    Regions[Regions]
    Points[Points and heat]
    Routes[Routes and flow]
    Click[Click report]
  end
  subgraph host [Chart host]
    Canvas[Canvas]
  end
  Geo --> map
  Data --> Regions
  Data --> Points
  Data --> Routes
  map --> Canvas
  Click --> page`,
    [
      '**Register GeoJSON yourself.** There is no built-in atlas and no geocoder.',
      '**Region values join on the region key.** The default key is the feature name.',
      '**Variants** are choropleth, area, point, bubble, scatter, symbol, heatmap, route, and flow. Pick the one that matches the data.',
      '**Pan and zoom are pointer-only.** Arrow keys do not roam the map.',
      '**Loading, empty, and export** belong to the shell around the map.',
    ],
    [
      {
        title: 'Regions',
        diagram: `sequenceDiagram
  participant Page
  participant Geo as GeoJSON
  participant Map
  participant Host as Chart host
  Page->>Geo: register a map name, or pass the shapes
  Note over Map: there is no built-in atlas
  Page->>Map: values joined by the region key
  Map->>Host: choropleth or area`,
        note: 'Choropleth paints a scale. Area mode uses category colors and the shell legend. If the join key does not match the feature name, set the region key. Otherwise the map stays blank.',
      },
      {
        title: 'Points and heat',
        diagram: `sequenceDiagram
  participant Page
  participant Map
  participant Host as Chart host
  Page->>Map: a point list
  Note over Map: point, symbol, bubble, or scatter
  Map->>Host: draw
  opt heatmap
    Note over Map: the point value is the intensity
  end
  Note over Map: pan and zoom are pointer only`,
        note: 'Bubble and scatter size comes from the point size, or from the value when size is missing. Labels hide when there are many points. Do not expect the keyboard to pan.',
      },
      {
        title: 'Routes',
        diagram: `sequenceDiagram
  participant Page
  participant Map
  participant Host as Chart host
  Page->>Map: links with a from and a to
  Note over Map: coordinates or point ids, plus optional waypoints
  Map->>Host: route or flow
  Note over Map: flow width follows the link value`,
        note: 'A route without a from and a to is not a line. Arrows show direction. The page supplies the geometry. The map does not look up addresses.',
      },
      {
        title: 'Click',
        diagram: `sequenceDiagram
  actor User
  participant Map
  participant Page
  User->>Map: click a region or a point
  Map->>Page: that hit
  Note over Page: you filter or drill
  Note over Map: the map does not change the route`,
        note: 'Loading, empty, and skeleton stay on the shell. Export PNG, SVG, or CSV from that shell. Do not navigate inside the map component.',
      },
    ],
  ),
};
