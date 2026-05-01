// main.ts
// Nathan Shturm

// deno-lint-ignore-file no-explicit-any

import { createDataDictionary } from './dataProcessor.ts';
import { availableDataTypes } from './dataFetcher.ts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as LCG from 'leaflet-control-geocoder';
import './style.css';
import './leafletWorkaround.ts';

import markerIconImage from '../assets/location.png';
import ccIcon from '../assets/ccIcon.png';
import cctvIcon from '../assets/cctvIcon.png';
import cmsIcon from '../assets/cmsIcon.png';

import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

/* ~-------------------VARIABLES/INITIALIZATION-------------------~ */
const DISTRICT_ZOOM = 10;
const CACHE_TTL_MS = 5 * 60 * 1000;

const iconFor = (url: string) =>
    L.icon({ iconUrl: url, iconSize: [35, 49], iconAnchor: [17.5, 49], popupAnchor: [0, -24.5] });

const markerImage = iconFor(markerIconImage);
const ccMarkerImage = iconFor(ccIcon);
const cctvMarkerImage = iconFor(cctvIcon);
const cmsMarkerImage = iconFor(cmsIcon);

type DataType = keyof typeof availableDataTypes;
type DataDictionary = Record<string, any[]>;

const app = document.getElementById('app') as HTMLElement;
const options: DataType[] = ['cc', 'cctv', 'cms', 'lcs', 'rwis', 'tt'];
const selectedOptions = new Array(6).fill(false);
let persistentDataDictionary: DataDictionary = {};
const optionButtons: HTMLButtonElement[] = [];

const districtContainer = document.createElement('div');
districtContainer.id = 'districtContainer';
const selectedDistrict = { value: 1 };

const mapContainer = document.createElement('div');
mapContainer.id = 'map';
app.appendChild(mapContainer);

const map = L.map('map').setView([37.7749, -122.4194], 6);
map.doubleClickZoom.disable();

// Single LayerGroup holds all markers — replaces per-pan rebuild that was leaking memory.
const markerLayer = L.layerGroup().addTo(map);

// In-memory cache: key = `${district}-${binaryFlag}`
const dataCache = new Map<string, { data: DataDictionary; timestamp: number }>();

L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        minZoom: 0,
        maxZoom: 20,
        attribution:
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
).addTo(map);

LCG.geocoder({
    defaultMarkGeocode: true,
    position: 'topright',
})
    .on('markgeocode', (e: any) => {
        const latlng = e.geocode.center;
        map.setView(latlng, 15);
    })
    .addTo(map);

const overlay = document.createElement('div');
overlay.id = 'overlay';

const overlayDropDownButton = document.createElement('button');
overlayDropDownButton.innerText = 'Data Points';
overlayDropDownButton.classList.add('option-button');
overlayDropDownButton.onclick = () => {
    overlay.classList.toggle('show');
    overlayDropDownButton.classList.toggle('expanded');

    const isShown = overlay.classList.contains('show');
    Array.from(overlay.children).forEach(child => {
        if (child !== overlayDropDownButton) {
            (child as HTMLElement).style.display = isShown ? 'block' : 'none';
        }
    });
};

overlay.appendChild(overlayDropDownButton);

options.forEach((option, index) => {
    const button = document.createElement('button');
    button.innerText = option.toUpperCase();
    button.classList.add('option-button');
    button.onclick = async () => {
        selectedOptions[index] = !selectedOptions[index];
        button.classList.toggle('selected', selectedOptions[index]);
        await updateDataAndMap();
    };

    overlay.append(button);
    optionButtons.push(button);
});

for (let i = 1; i <= 12; i++) {
    const districtButton = document.createElement('button');
    districtButton.innerText = `District ${i}`;
    districtButton.classList.add('district-button');
    districtButton.onclick = async () => {
        selectedDistrict.value = i;
        districtButton.classList.add('selected-district');
        setDistrictView(i);
        Array.from(districtContainer.children).forEach(child => {
            if (child !== districtButton) (child as HTMLElement).classList.remove('selected-district');
        });
        updateAvailableOptions(i);
        await updateDataAndMap();
    };

    districtContainer.appendChild(districtButton);
}

mapContainer.appendChild(overlay);
app.appendChild(districtContainer);
app.appendChild(mapContainer);

/* ~---------------------FUNCTION DEFINITIONS---------------------~ */
function updateAvailableOptions(district: number) {
    options.forEach((option, index) => {
        const button = optionButtons[index];
        if (availableDataTypes[option].includes(district)) {
            button.disabled = false;
        } else {
            button.disabled = true;
            selectedOptions[index] = false;
            button.classList.remove('selected');
        }
    });
}

function setDistrictView(district: number) {
    const districtCoordinates: { [key: number]: [number, number] } = {
        1: [40.789621, -124.109611],
        2: [40.898134, -121.662397],
        3: [39.157228, -121.612890],
        4: [37.441512, -121.997705],
        5: [35.282418, -120.691266],
        6: [36.904728, -119.809147],
        7: [33.975959, -118.088380],
        8: [34.146572, -117.226980],
        9: [37.7459, -119.5971],
        10: [38.1041, -120.2351],
        11: [32.7157, -117.1611],
        12: [33.7455, -117.8677],
    };

    const coordinates = districtCoordinates[district];
    if (coordinates) {
        map.setView(coordinates, DISTRICT_ZOOM, { animate: false });
    }
}

function rebuildMarkers() {
    markerLayer.clearLayers();
    const seen = new Set<string>();

    Object.entries(persistentDataDictionary).forEach(([key, dataArray]) => {
        dataArray.forEach((data: any) => {
            const dataEntry = data[key];
            if (!dataEntry?.location) return;

            const latitude = parseFloat(dataEntry.location.latitude);
            const longitude = parseFloat(dataEntry.location.longitude);
            const district = parseInt(dataEntry.location.district);
            if (isNaN(latitude) || isNaN(longitude)) return;
            if (district !== selectedDistrict.value) return;

            const markerId = `${latitude}-${longitude}-${data.type}`;
            if (seen.has(markerId)) return;
            seen.add(markerId);

            let iconImage;
            let makePopup = true;
            switch (data.type) {
                case 'cc': {
                    const entry = data[data.type];
                    if (entry.statusData?.statusDescription === 'No chain controls are in effect at this time.') {
                        makePopup = false;
                    }
                    iconImage = ccMarkerImage;
                    break;
                }
                case 'cctv':
                    iconImage = cctvMarkerImage;
                    break;
                case 'cms': {
                    const entry = data[data.type];
                    if (entry.message?.display === 'Blank') {
                        makePopup = false;
                    }
                    iconImage = cmsMarkerImage;
                    break;
                }
                default:
                    iconImage = markerImage;
            }

            if (!makePopup) return;

            const marker = L.marker([latitude, longitude], { icon: iconImage });
            // Lazy popup: createPopup runs only when the user actually opens it.
            marker.bindPopup(() => createPopup(data), {
                autoPan: true,
                autoPanPadding: new L.Point(100, 100),
                keepInView: true,
            });
            markerLayer.addLayer(marker);
        });
    });
}

function createPopup(data: any) {
    const popupContent = document.createElement('div');
    popupContent.classList.add('popup-content');
    const dataEntry = data[data.type];

    if (!dataEntry || !dataEntry.location) {
        popupContent.innerHTML = `<strong>Error:</strong> Location data is not available.`;
        return popupContent;
    }

    switch (data.type) {
        case 'cc':
            popupContent.innerHTML = `
                <strong>CC Object Details</strong><br>
                Index: ${dataEntry.index || 'N/A'}<br>
                Status: ${dataEntry.statusData?.status || 'N/A'}<br>
                Location: ${dataEntry.location.locationName || 'N/A'}, ${dataEntry.location.county || 'N/A'}<br>
                In Service: ${dataEntry.inService || 'N/A'}<br>
                Description: ${dataEntry.statusData?.statusDescription || 'N/A'}
            `;
            break;
        case 'cctv':
            popupContent.innerHTML = `
                <strong>CCTV Object Details</strong><br>
                Index: ${dataEntry.index || 'N/A'}<br>
                Location: ${dataEntry.location.locationName || 'N/A'}, ${dataEntry.location.county || 'N/A'}<br>
                In Service: ${dataEntry.inService || 'N/A'}<br>
                Current Image URL: ${dataEntry.imageData?.static?.currentImageURL
                    ? `<a href="#" id="imageLink">View Image</a>`
                    : 'N/A'}<br>
                Streaming URL: ${dataEntry.imageData?.streamingVideoURL
                    ? `<a href="${dataEntry.imageData.streamingVideoURL}" target="_blank">Watch Stream</a>`
                    : 'N/A'}
            `;

            if (dataEntry.imageData?.static?.currentImageURL) {
                const imageLink = popupContent.querySelector('#imageLink') as HTMLAnchorElement;
                imageLink.onclick = (e) => {
                    e.preventDefault();
                    let image = popupContent.querySelector('img');

                    if (!image) {
                        image = document.createElement('img');
                        image.src = dataEntry.imageData.static.currentImageURL;
                        image.style.width = '100%';
                        image.style.marginTop = '10px';
                        image.classList.add('popup-image');
                        image.style.opacity = '0';

                        image.onload = () => {
                            if (image) image.style.opacity = '1';
                            popupContent.classList.add('no-scroll');
                            popupContent.scrollTop = 0;
                            setTimeout(() => {
                                popupContent.classList.add('expanded');
                                popupContent.classList.remove('no-scroll');
                            }, 100);
                        };

                        popupContent.appendChild(image);
                        imageLink.innerText = 'Close Image';
                    } else {
                        if (image.style.display === 'none') {
                            image.style.display = 'block';
                            popupContent.classList.add('no-scroll');
                            popupContent.scrollTop = 0;
                            setTimeout(() => {
                                popupContent.classList.add('expanded');
                                popupContent.classList.remove('no-scroll');
                            }, 100);
                            imageLink.innerText = 'Close Image';
                        } else {
                            image.style.display = 'none';
                            popupContent.classList.remove('expanded');
                            imageLink.innerText = 'View Image';
                        }
                    }
                };
            }
            break;

        case 'cms': {
            const displayLine1 = dataEntry.message?.phase1?.phase1Line1 || 'N/A';
            const displayLine2 = dataEntry.message?.phase1?.phase1Line2 || 'N/A';
            const displayLine3 = dataEntry.message?.phase1?.phase1Line3 || 'N/A';

            popupContent.innerHTML = `
                <strong>CMS Object Details</strong><br>
                Index: ${dataEntry.index || 'N/A'}<br>
                Location: ${dataEntry.location.locationName || 'N/A'}, ${dataEntry.location.county || 'N/A'}<br>
                In Service: ${dataEntry.inService || 'N/A'}<br>
                Message: <br>
                ${displayLine1}<br>
                ${displayLine2}<br>
                ${displayLine3}<br>
            `;
            break;
        }

        case 'lcs':
            popupContent.innerHTML = `
                <strong>LCS Object Details</strong><br>
                Index: ${dataEntry.index || 'N/A'}<br>
                Begin Location: ${dataEntry.location?.begin?.beginLocationName || 'N/A'}, ${dataEntry.location?.begin?.county || 'N/A'}<br>
                End Location: ${dataEntry.location?.end?.endLocationName || 'N/A'}, ${dataEntry.location?.end?.county || 'N/A'}<br>
                Closure Type: ${dataEntry.closure?.typeOfClosure || 'N/A'}<br>
                Estimated Delay: ${dataEntry.closure?.estimatedDelay || 'N/A'}
            `;
            break;

        case 'rwis':
            popupContent.innerHTML = `
                <strong>RWIS Object Details</strong><br>
                Index: ${dataEntry.index || 'N/A'}<br>
                Location: ${dataEntry.location.locationName || 'N/A'}, ${dataEntry.location.county || 'N/A'}<br>
                In Service: ${dataEntry.inService || 'N/A'}<br>
                Temperature: ${dataEntry.rwisData?.temperatureData?.essAirTemperature || 'N/A'} °C<br>
                Wind Speed: ${dataEntry.rwisData?.windData?.essAvgWindSpeed || 'N/A'} km/h
            `;
            break;

        case 'tt':
            popupContent.innerHTML = `
                <strong>TT Object Details</strong><br>
                Index: ${dataEntry.index || 'N/A'}<br>
                Start Location: ${dataEntry.location?.begin?.beginLocationName || 'N/A'}, ${dataEntry.location?.begin?.county || 'N/A'}<br>
                End Location: ${dataEntry.location?.end?.endLocationName || 'N/A'}, ${dataEntry.location?.end?.county || 'N/A'}<br>
                Calculated Travel Time: ${dataEntry.traveltime?.calculatedTraveltime || 'N/A'} mins<br>
                Update Frequency: ${dataEntry.traveltime?.traveltimeUpdateFrequency || 'N/A'}
            `;
            break;
        default:
            popupContent.innerHTML = `<strong>Unknown Object Type</strong><br>Data: ${JSON.stringify(data)}`;
            break;
    }

    return popupContent;
}

async function getCachedDictionary(binaryFlag: number, district: number): Promise<DataDictionary> {
    const key = `${district}-${binaryFlag}`;
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }
    const data = await createDataDictionary(binaryFlag, [district]);
    dataCache.set(key, { data, timestamp: Date.now() });
    return data;
}

async function updateDataAndMap() {
    let binaryFlag = 0;
    selectedOptions.forEach((isSelected, i) => {
        if (isSelected) binaryFlag |= (1 << i);
    });

    if (binaryFlag === 0) {
        persistentDataDictionary = {};
        rebuildMarkers();
        return;
    }

    persistentDataDictionary = await getCachedDictionary(binaryFlag, selectedDistrict.value);
    rebuildMarkers();
}
