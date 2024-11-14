// ~------------------INTRO SETUP----------------~

// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./leafletWorkaround.ts";
//import luck from "./luck.ts";

const map = leaflet.map("map", {
  center: leaflet.latLng(37.000054, -122.063535),
  zoom: 20,
  minZoom: 20,
  maxZoom: 20,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    {
      minZoom: 0,
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    } as leaflet.TileLayerOptions,
  )
  .addTo(map);

