# pixel-chart-map — design

This page explains **pixel-chart-map** in plain language. The exact input and output names live in [README.md](./README.md). This page does not copy that table.

**Walk through every flow:** open [orchestration.html](./orchestration.html) in a browser (serve the `src/lib` folder so the shared player script can load).

## 1. What this does, and what it does not

A geographic map. The library does not ship a world atlas. The page registers GeoJSON, then binds values. Variants are choropleth, area, point, bubble, scatter, symbol, heatmap, route, and flow. A click does not navigate. The page owns drill-down.

| This piece does | It does not |
| --- | --- |
| Draws a map from GeoJSON the page supplies | Ship a world atlas or geocode addresses |
| Colors regions, plots points, or draws routes | Change the route when a region is clicked |

## 2. Who talks to whom

The map draws geography the page supplies. The library does not ship a world atlas. The page registers GeoJSON, then binds values. A click reports a region or a point. The page owns any drill or filter. Pan and zoom are pointer actions.

```mermaid
flowchart TB
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
  Click --> page
```

**How to read the picture**

- **Register GeoJSON yourself.** There is no built-in atlas and no geocoder.
- **Region values join on the region key.** The default key is the feature name.
- **Variants** are choropleth, area, point, bubble, scatter, symbol, heatmap, route, and flow. Pick the one that matches the data.
- **Pan and zoom are pointer-only.** Arrow keys do not roam the map.
- **Loading, empty, and export** belong to the shell around the map.

## 3. Flows

### Regions

1. The page registers GeoJSON under a map name, or passes it in. There is no built-in atlas.
2. Choropleth joins values to features by the region key and paints a scale. Area mode uses category colors and the shell legend.

### Points and heat

1. Point, symbol, bubble, and scatter use a point list. Bubble and scatter size comes from the point size, or the value if size is missing.
2. Heatmap uses the point value as intensity. Labels hide automatically when there are many points. Pan and zoom are pointer actions, not keyboard actions.

### Routes

1. Route and flow use links. Each link has a from and a to, as coordinates or point ids, and may include waypoints.
2. Flow line width follows the link value. Arrows show direction.

### Click

1. A click reports the region or point. The page may filter or drill. The map does not change the route.
2. Loading, empty, and skeleton belong to the shell around the map. Export PNG, SVG, or CSV from that shell.

## 4. Step by step

Section 3 is the short list. Each picture here is one of those flows, with the branch that changes what the developer must do. Read the note under the picture before copying the pattern.

### Regions

```mermaid
sequenceDiagram
  participant Page
  participant Geo as GeoJSON
  participant Map
  participant Host as Chart host
  Page->>Geo: register a map name, or pass the shapes
  Note over Map: there is no built-in atlas
  Page->>Map: values joined by the region key
  Map->>Host: choropleth or area
```

Choropleth paints a scale. Area mode uses category colors and the shell legend. If the join key does not match the feature name, set the region key. Otherwise the map stays blank.

### Points and heat

```mermaid
sequenceDiagram
  participant Page
  participant Map
  participant Host as Chart host
  Page->>Map: a point list
  Note over Map: point, symbol, bubble, or scatter
  Map->>Host: draw
  opt heatmap
    Note over Map: the point value is the intensity
  end
  Note over Map: pan and zoom are pointer only
```

Bubble and scatter size comes from the point size, or from the value when size is missing. Labels hide when there are many points. Do not expect the keyboard to pan.

### Routes

```mermaid
sequenceDiagram
  participant Page
  participant Map
  participant Host as Chart host
  Page->>Map: links with a from and a to
  Note over Map: coordinates or point ids, plus optional waypoints
  Map->>Host: route or flow
  Note over Map: flow width follows the link value
```

A route without a from and a to is not a line. Arrows show direction. The page supplies the geometry. The map does not look up addresses.

### Click

```mermaid
sequenceDiagram
  actor User
  participant Map
  participant Page
  User->>Map: click a region or a point
  Map->>Page: that hit
  Note over Page: you filter or drill
  Note over Map: the map does not change the route
```

Loading, empty, and skeleton stay on the shell. Export PNG, SVG, or CSV from that shell. Do not navigate inside the map component.

## 5. States

- No GeoJSON yet: nothing geographic to draw.
- Regions, points, heat, or links drawn.
- Roaming with the pointer.
- Empty or loading, from the shell.

## 6. Easy to get wrong

- Import from pixel-ui/charts. Register GeoJSON yourself. The library does not include a world map.
- Join region data with the region key. The default key is the feature name.
- Do not navigate inside the map. Drill-down stays in the page.
- Pan and zoom are pointer-only. Do not expect arrow keys to roam.

## 7. Files

- `pixel-chart-map.html`
- `pixel-chart-map.scss`
- `pixel-chart-map.ts`

The behavior contract stays in [README.md](./README.md). If this page and the README disagree, the README wins. Fix this page.
