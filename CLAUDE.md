# typescript-deno-playground

Multi-project sandbox. The repo is a shared Vite + Deno + TypeScript starter, and **each project lives on its own branch** off the same base (devcontainer, fonts, GitHub Pages workflow, leaflet workaround, etc.). Author: Nathan Shturm (`exterminathan` on GitHub).

## Branch layout

| Branch | Project | Entry |
|---|---|---|
| `main` | CalTrans Data Map (current) — also contains a duplicate `src/caltrans-tool.ts` snapshot kept "pre-fork" so future project branches can fork from a clean base. Last commit: `Removed Spotify, pre-fork commit`. | [src/main.ts](src/main.ts) |
| `caltrans-tool` | Same CalTrans app, leaner — no `caltrans-tool.ts` duplicate, slightly tweaked `index.html` / `.gitignore`. | [src/main.ts](src/main.ts) |
| `spotify-app` | Spotify Web API demo using PKCE OAuth. Replaces `index.html` with a player UI; adds `src/spotify.ts` (`SpotifyAPI` class with token storage in `localStorage`) and `src/spotify_auth_pkce.ts` (PKCE flow, hardcoded client ID `7e524fae...`, redirect URI switches between `localhost:5173` and `https://exterminathan.github.io`). | `src/spotify.ts` |

When the user asks about something not in the working tree, check the other branches with `git show <branch>:<path>` before assuming it's missing.

## Build / run

Deno wraps Vite — never call `vite` directly:

```
deno task dev      # vite dev server
deno task build    # vite build → dist/
deno task preview  # vite preview
deno task process  # run src/dataProcessor.ts (writes data_out.txt) — Deno-side, not browser
deno task serve    # static serve dist/
```

[vite.config.ts](vite.config.ts) reads `REPO_NAME` env var for `base` (fallback `/project`). The GitHub Pages workflow sets it to the repo name automatically.

## CI / deploy

[.github/workflows/publish.yml](.github/workflows/publish.yml) — on push to `main`: `deno lint` → `deno task build` → upload `dist/` to GitHub Pages. Only `main` deploys; other branches do not auto-publish.

## CalTrans app architecture

- [src/dataFetcher.ts](src/dataFetcher.ts) — `availableDataTypes` maps each of 6 data types (`cc`, `cctv`, `cms`, `lcs`, `rwis`, `tt`) to the Caltrans districts (1–12) that publish them. URLs follow `https://cwwp2.dot.ca.gov/data/d{N}/{type}/{type}StatusD{NN}.json`.
- [src/dataProcessor.ts](src/dataProcessor.ts) — `createDataDictionary(binaryFlag, districts)`: bitwise flag selects which types to fetch (bit 0 = cc, bit 1 = cctv, …). Returns `{ [type]: ItemWithType[] }`.
- [src/types.ts](src/types.ts) — full schema for each Caltrans payload (CC/CCTV/CMS/LCS/RWIS/TT).
- [src/main.ts](src/main.ts) — Leaflet map, district buttons (1–12), data-type toggle buttons, geocoder, per-type popup renderers. Re-renders all markers on every `moveend`.
  - **Known issue (TODO in file):** memory leak — page eventually crashes. The `existingMarkers` Set dedupes within a single `updateMap` call but every pan/zoom rebuilds all markers and popups from scratch.
- [src/leafletWorkaround.ts](src/leafletWorkaround.ts) — fixes Leaflet's default marker icon URLs under Vite bundling. Required.
- [src/luck.ts](src/luck.ts) — murmur32 deterministic RNG by string seed. Currently unreferenced; left over from earlier playground experiments.

District-specific marker icons live in [assets/](assets/): `ccIcon.png`, `cctvIcon.png`, `cmsIcon.png`, `location.png` (default).

## Conventions / gotchas

- **`.gitignore` excludes `*.txt` and `src/creds.ts`.** Don't commit credentials. The Spotify PKCE flow uses no secret, so its client ID being in source is intentional.
- Source files import with explicit `.ts` extensions (Deno style) — keep this when adding new files.
- `deno-lint-ignore-file` and `// @ts-ignore` are used liberally in `main.ts` for asset imports and Leaflet typing gaps. Don't try to "clean these up" without checking it still builds.
- The duplicate `src/caltrans-tool.ts` on `main` is byte-identical to `src/main.ts` — it's an intentional snapshot, not dead code to delete. Confirm with the user before touching.
- Platform is Windows / PowerShell. Use `$env:VAR` not `$VAR`, and `;` / `if ($?)` instead of `&&` in PowerShell calls.

## When starting a new project on this repo

The pattern Nathan uses: branch off `main` (which is kept "pre-fork" clean), swap `index.html`'s entry script and add new `src/*.ts` files for the project. Shared infra (deno.json tasks, devcontainer, workflow, leaflet workaround, fonts) stays untouched.
