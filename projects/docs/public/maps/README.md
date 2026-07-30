# Docs map data

Assets here are **documentation-only** — they are not bundled into `pixel-ui`.
Applications must supply and validate GeoJSON for their legal, geographic,
accuracy, and product requirements.

| File | Role |
|------|------|
| `world.geojson` | World boundaries from [`tower1229/echarts-world-map-jeojson`](https://github.com/tower1229/echarts-world-map-jeojson) (Apache-2.0) |
| `us-states.geojson` | US state boundaries from [`PublicaMundi/MappingAPI`](https://github.com/PublicaMundi/MappingAPI/blob/master/data/geojson/us-states.json) |
| `us-ca-regions.geojson` | California county boundaries from [`click_that_hood`](https://github.com/codeforgermany/click_that_hood/blob/main/public/data/california-counties.geojson) (MIT) |
| `india-regions.geojson` | India state boundaries from [`click_that_hood`](https://github.com/codeforgermany/click_that_hood/blob/main/public/data/india.geojson) (MIT) |

These assets are suitable for the interactive documentation demo, but are not
survey-grade boundaries. Applications remain responsible for choosing authoritative
datasets appropriate to their product and jurisdiction.
