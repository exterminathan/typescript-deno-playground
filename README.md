# typescript-deno-playground

A multi-project TypeScript sandbox built on Vite + Deno. Each project lives on its own branch and shares the same base infrastructure (devcontainer, Vite config, GitHub Pages workflow, fonts).

The current `main` branch hosts the **CalTrans Data Map** — a Leaflet web app that plots live data from the California Department of Transportation across all 12 districts.

**Live demo:** <https://exterminathan.github.io/typescript-deno-playground/>

---

## CalTrans Data Map (`main`)

Plots six types of CalTrans data on an interactive map, filtered by district:

| Type | Description |
|---|---|
| `cc` | Chain control |
| `cctv` | Traffic cameras (with image preview & live stream link) |
| `cms` | Changeable message signs |
| `lcs` | Lane closures |
| `rwis` | Road weather (temperature, wind speed) |
| `tt` | Travel time |

Data is fetched from the public CalTrans endpoint pattern `https://cwwp2.dot.ca.gov/data/d{N}/{type}/{type}StatusD{NN}.json` and cached client-side for 5 minutes per district + type combination.

### Controls

- **District buttons (1–12)** — pan to a CalTrans district and load its data.
- **Data Points dropdown** — toggle which data types are shown. Disabled types aren't published for the current district.
- **Geocoder** (top right) — search by address.
- Click a marker to see details. CCTV markers have an inline image preview.

---

## Tech stack

- **Deno** wraps Vite — `deno.json` is the source of truth for tasks and npm dependencies. There is no `package.json`.
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

[vite.config.ts](vite.config.ts) reads the `REPO_NAME` env var to set the Pages `base` path; the workflow sets it automatically.

---

## Branch layout

The repo is a sandbox — each branch is a different project sharing the same starter.

| Branch | Project |
|---|---|
| `main` | CalTrans Data Map (this README's subject) |
| `caltrans-tool` | Earlier variant of the CalTrans app |
| `spotify-app` | Spotify Web API demo using PKCE OAuth |

Only `main` auto-deploys to Pages. To start a new project on this repo, branch from commit `3dcd7e5` ("Removed Spotify, pre-fork commit"), which is the clean pre-fork base.

## Source layout (CalTrans app)

| File | Purpose |
|---|---|
| [src/main.ts](src/main.ts) | Map, UI, marker rendering, popups |
| [src/dataFetcher.ts](src/dataFetcher.ts) | URL builder + per-type district availability |
| [src/dataProcessor.ts](src/dataProcessor.ts) | Fetch + assemble dictionary by data type |
| [src/types.ts](src/types.ts) | Schemas for each CalTrans payload |
| [src/leafletWorkaround.ts](src/leafletWorkaround.ts) | Fixes Leaflet's default-icon URLs under Vite |
| [src/assets.d.ts](src/assets.d.ts) | `*.png` import declarations |
| [assets/](assets/) | Marker icons (`ccIcon.png`, `cctvIcon.png`, `cmsIcon.png`, `location.png`) |

## Author

Nathan Shturm — [@exterminathan](https://github.com/exterminathan)
