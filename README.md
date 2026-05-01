# roadway-data-map

A Leaflet web app that visualizes live public roadway data on an interactive map. The current data source is the California Department of Transportation (Caltrans), covering all 12 districts; the project is structured so additional jurisdictions with public endpoints can be added.

**Live demo:** <https://exterminathan.github.io/roadway-data-map/>

---

## What it does

Plots six types of roadway data on an interactive map, filtered by district:

| Type | Description |
|---|---|
| `cc` | Chain control |
| `cctv` | Traffic cameras (with image preview & live stream link) |
| `cms` | Changeable message signs |
| `lcs` | Lane closures |
| `rwis` | Road weather (temperature, wind speed) |
| `tt` | Travel time |

Data is fetched from the public Caltrans endpoint pattern `https://cwwp2.dot.ca.gov/data/d{N}/{type}/{type}StatusD{NN}.json` and cached client-side for 5 minutes per district + type combination.

### Controls

- **District buttons (1–12)** — pan to a district and load its data.
- **Data Points dropdown** — toggle which data types are shown. Disabled types aren't published for the current district.
- **Geocoder** (top right) — search by address.
- Click a marker to see details. CCTV markers have an inline image preview.

---

## Tech stack

- **Deno** wraps Vite — `deno.json` is the source of truth for tasks and npm dependencies.
- **Vite** bundles the browser app.
- **Leaflet** + Stadia Maps tiles for the map.
- **GitHub Pages** for hosting; deploy is automatic on push to `main`.

## Run locally

You need [Deno](https://deno.com/) v2+ installed.

```sh
deno task dev      # start vite dev server
deno task build    # build → dist/
deno task preview  # preview the built bundle
deno task process  # run dataProcessor.ts standalone (writes data_out.txt)
```

Never invoke `vite` directly — always go through `deno task`.

## CI / deploy

[.github/workflows/publish.yml](.github/workflows/publish.yml) runs on every push to `main`:

1. **check** job — `deno lint` + `deno check src/main.ts`
2. **deploy** job — `deno task build` → upload `dist/` to GitHub Pages

The two jobs run in parallel, so a deploy is not gated on the type check (intentional — keeps the site live if a type-only regression slips in).

[vite.config.ts](vite.config.ts) reads the `REPO_NAME` env var to set the Pages `base` path; the workflow sets it automatically from the repo name.

---

## Source layout

| File | Purpose |
|---|---|
| [src/main.ts](src/main.ts) | Map, UI, marker rendering, popups |
| [src/dataFetcher.ts](src/dataFetcher.ts) | URL builder + per-type district availability |
| [src/dataProcessor.ts](src/dataProcessor.ts) | Fetch + assemble dictionary by data type |
| [src/types.ts](src/types.ts) | Schemas for each upstream DOT payload |
| [src/leafletWorkaround.ts](src/leafletWorkaround.ts) | Fixes Leaflet's default-icon URLs under Vite |
| [src/assets.d.ts](src/assets.d.ts) | `*.png` import declarations |
| [assets/](assets/) | Marker icons (`ccIcon.png`, `cctvIcon.png`, `cmsIcon.png`, `location.png`) |

## Author

Nathan Shturm — [@exterminathan](https://github.com/exterminathan)
