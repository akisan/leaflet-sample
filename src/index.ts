import "@fortawesome/fontawesome-free/js/fontawesome";
import "@fortawesome/fontawesome-free/js/solid";
import * as L from "leaflet";
import "leaflet-draw";
import {
  GeoSearchControl,
  EsriProvider,
  // OpenStreetMapProvider,
} from "leaflet-geosearch";
import MiniMap from "leaflet-minimap";
import "leaflet-providers";
import "leaflet.fullscreen";
import "leaflet.locatecontrol";
import "leaflet.markercluster";

import "./style.scss";

const map = L.map("map", {
  /*
  leaflet.fullscreen - https://github.com/Leaflet/Leaflet.fullscreen
  */
  fullscreenControl: true,
}).setView([35.65, 139.45], 11);

/*
leaflet-providers - http://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html
*/
const baseLayers: L.Control.LayersObject = {};
const overlays: L.Control.LayersObject = {};

function eachLayer(callback) {
  for (const provider in L.TileLayer.Provider.providers) {
    const p = L.TileLayer.Provider.providers[provider];
    if (p.variants) {
      for (const variant in p.variants) {
        callback(`${provider}.${variant}`);
      }
    } else {
      callback(provider);
    }
  }
}

function isIgnored(layer: L.TileLayer.Provider): boolean {
  const o = layer.options as any;
  return o.accessToken || o.apikey || o.apiKey || o["app_id"] || o.key;
}

function isOverlay(providerName: string, layer: L.TileLayer.Provider): boolean {
  if (layer.options.opacity && layer.options.opacity < 1) {
    return true;
  }

  const overlayPatterns = [
    "^(OpenWeatherMap|OpenSeaMap)",
    "OpenMapSurfer.(Hybrid|AdminBounds|ContourLines|Hillshade|ElementsAtRisk)",
    "Stamen.Toner(Hybrid|Lines|Labels)",
    "Hydda.RoadsAndLabels",
    "^JusticeMap",
    "OpenPtMap",
    "OpenRailwayMap",
    "OpenFireMap",
    "SafeCast",
  ];
  return providerName.match(`(${overlayPatterns.join("|")})`) !== null;
}

eachLayer((name) => {
  const layer = L.tileLayer.provider(name);
  if (!isIgnored(layer)) {
    if (isOverlay(name, layer)) {
      overlays[name] = layer;
    } else {
      baseLayers[name] = layer;
    }
  }
});
const layers = L.control.layers(baseLayers, overlays);
layers.addTo(map);

const firstBaseLayerName = Object.keys(baseLayers)[0];
baseLayers[firstBaseLayerName].addTo(map);

/*
leaflet.locatecontrol - https://github.com/domoritz/leaflet-locatecontrol
*/
L.control.locate({ keepCurrentZoomLevel: true }).addTo(map);

/*
leaflet-geosearch - https://github.com/smeijer/leaflet-geosearch
*/
new GeoSearchControl({
  // provider: new OpenStreetMapProvider(),
  provider: new EsriProvider(),
}).addTo(map);

/*
Draw API - http://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html
*/
const drawnItems = L.featureGroup().addTo(map);
map.on(L.Draw.Event.CREATED, (event) => drawnItems.addLayer(event.layer));
map.addControl(
  new L.Control.Draw({
    edit: {
      featureGroup: drawnItems,
    },
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true,
      },
    },
  })
);

/*
leaflet-minimap - https://github.com/Norkart/Leaflet-MiniMap
*/
const miniMap = new MiniMap(L.tileLayer.provider(firstBaseLayerName), {
  toggleDisplay: true,
  position: "bottomleft",
});
miniMap.addTo(map);
map.on("baselayerchange", (e: L.LayersControlEvent) => {
  miniMap.changeLayer(L.tileLayer.provider(e.name));
});

/*
Scale control - https://leafletjs.com/reference-1.6.0.html#control-scale
*/
L.control.scale({ position: "bottomright" }).addTo(map);

/*
leaflet.markercluster - https://github.com/Leaflet/Leaflet.markercluster
*/
const markers = L.markerClusterGroup();

fetch(
  "https://services6.arcgis.com/5jNaHNYe2AnnqRnS/arcgis/rest/services/COVID19_JapanCaseData/FeatureServer/0/query?where=%E9%80%9A%E3%81%97%3E-1&returnIdsOnly=false&returnCountOnly=false&&f=pgeojson&outFields=*&orderByFields=%E9%80%9A%E3%81%97"
)
  .then((response) => response.json())
  .then((data) => {
    for (let i = 1; i < data.features.length; i++) {
      const f = data.features[i];
      const props = f.properties;
      if (props.ステータス === null) {
        const [lng, lat] = f.geometry.coordinates;
        const marker = L.marker(new L.LatLng(lat, lng), {
          title: `${props.年代}代 ${props.性別}`,
        });
        marker
          .bindTooltip(`${props.キー} ${props.年代} ${props.性別}`)
          .bindPopup(`${props.キー} ${props.年代} ${props.性別}`);
        markers.addLayer(marker);
      }
    }
  });

layers.addOverlay(markers, "COVID19_JapanCaseData");
