// ~------------------INTRO SETUP----------------~

// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";
import "./leafletWorkaround.ts";
//import luck from "./luck.ts";

const map = leaflet.map("map", {
  center: leaflet.latLng(0,0),
  zoom: 20,
  minZoom: 20,
  maxZoom: 20,
  zoomControl: false,
  scrollWheelZoom: false,
});


console.log(map);
