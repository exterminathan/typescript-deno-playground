// main.ts
// Nathan Shturm

// TODO: fix memory usage: eventually the page crashes due to being out of memory

// deno-lint-ignore-file

// Imports
import { createDataDictionary } from './dataProcessor.ts';
import { availableDataTypes } from './dataFetcher.ts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as LCG from 'leaflet-control-geocoder';
import './style.css';
import "./leafletWorkaround.ts";

//@ts-ignore 
import markerIconImage from "../assets/location.png";
//@ts-ignore
import ccIcon from "../assets/ccIcon.png";
//@ts-ignore
import cctvIcon from "../assets/cctvIcon.png";
//@ts-ignore
import cmsIcon from "../assets/cmsIcon.png";

import 'leaflet-control-geocoder/dist/Control.Geocoder.css';

/* ~-------------------VARIABLES/INITIALIZATION-------------------~ */
// Constants
const DISTRICT_ZOOM = 10;

// Images
const markerImage = L.icon({
    iconUrl: markerIconImage,
    iconSize: [35, 49],
    iconAnchor: [17.5, 49],
    popupAnchor: [0, -24.5],
});

const ccMarkerImage = L.icon({
    iconUrl: ccIcon,
    iconSize: [35, 49],
    iconAnchor: [17.5, 49],
    popupAnchor: [0, -24.5],
});

const cctvMarkerImage = L.icon({
    iconUrl: cctvIcon,
    iconSize: [35, 49],
    iconAnchor: [17.5, 49],
    popupAnchor: [0, -24.5],
});

const cmsMarkerImage = L.icon({
    iconUrl: cmsIcon,
    iconSize: [35, 49],
    iconAnchor: [17.5, 49],
    popupAnchor: [0, -24.5],
});

// HTML Elements
const app = document.getElementById('app') as HTMLElement;
const options: Array<keyof typeof availableDataTypes> = ['cc', 'cctv', 'cms', 'lcs', 'rwis', 'tt'];
const selectedOptions = new Array(6).fill(false);
let persistentDataDictionary: { [key: string]: any[] } = {};
const optionButtons: HTMLButtonElement[] = [];

const districtContainer = document.createElement('div');
districtContainer.id = 'districtContainer';
const selectedDistrict = { value: 1 };

const mapContainer = document.createElement('div');
mapContainer.id = 'map';
app.appendChild(mapContainer);

const map = L.map('map').setView([37.7749, -122.4194], 6);
map.doubleClickZoom.disable();


// Create Leaflet map
L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png", {
        minZoom: 0,
        maxZoom: 20,
        zoomControl: true,
        attribution:
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
).addTo(map);

// Add LCG geocoder control
const geocoder = LCG.geocoder({
    defaultMarkGeocode: true,
    position: 'topright',
})
    .on('markgeocode', function (e) {
        const latlng = e.geocode.center;
        map.setView(latlng, 15);
        updateMap();
    })
    .addTo(map);

// overlay div for type buttons
const overlay = document.createElement('div');
overlay.id = 'overlay';

// overlay drop down button
const overlayDropDownButton = document.createElement('button');
overlayDropDownButton.innerText = 'Data Points';
overlayDropDownButton.classList.add('option-button');
overlayDropDownButton.onclick = () => {
    overlay.classList.toggle('show'); // Toggle the dropdown's visibility
    overlayDropDownButton.classList.toggle('expanded'); // Indicate the button is active
    
    // Hide or show buttons based on the overlay's visibility
    if (overlay.classList.contains('show')) {
        Array.from(overlay.children).forEach(child => {
            if (child !== overlayDropDownButton) {
                (child as HTMLElement).style.display = 'block';
            }
        });
    } else {
        Array.from(overlay.children).forEach(child => {
            if (child !== overlayDropDownButton) {
                (child as HTMLElement).style.display = 'none';
            }
        });
    }
};


overlay.appendChild(overlayDropDownButton);


options.forEach((option, index) => {
    const button = document.createElement('button');
    button.innerText = option.toUpperCase();
    button.classList.add('option-button');
    button.onclick = async () => {
        selectedOptions[index] = !selectedOptions[index];
        if (selectedOptions[index]) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }

        await updateDataAndMap(); // Ensures map doesn't move when an option is toggled
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
    /**
     * Updates the available options based on the selected district.
     * @param {number} district - The selected district.
     */
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
    /**
     * Sets the view of the map to the selected district.
     * @param {number} district - The selected district.
     */
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
        12: [33.7455, -117.8677]
    };

    const coordinates = districtCoordinates[district];
    if (coordinates) {
        map.setView(coordinates, DISTRICT_ZOOM, { animate: false }); // Prevent random map movement
    }
}

let isUpdating = false; // Flag to track if the update is already running

function updateMap() {
    /**
     * Updates the map with the data from the persistent data dictionary, preventing duplicate markers.
     */
    if (isUpdating) {
        return; // Prevent nested or excessive calls
    }

    isUpdating = true; // Set flag to indicate update is in progress

    try {
        map.eachLayer((layer: typeof L.Layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        const bounds = map.getBounds();
        const existingMarkers = new Set<string>();

        Object.entries(persistentDataDictionary).forEach(([key, dataArray]) => {
            dataArray.forEach((data: any) => {
                const dataEntry = data[key];
                if (dataEntry && dataEntry.location) {
                    const latitude = parseFloat(dataEntry.location.latitude);
                    const longitude = parseFloat(dataEntry.location.longitude);
                    const district = parseInt(dataEntry.location.district);
                    const markerId = `${latitude}-${longitude}`;

                    let makePopup = true;

                    if (!isNaN(latitude) && !isNaN(longitude) && bounds.contains([latitude, longitude]) && district === selectedDistrict.value) {
                        if (!existingMarkers.has(markerId)) {
                            existingMarkers.add(markerId);

                            let iconImage;
                            switch (data.type) {
                                case 'cc':
                                    // if cc description contains "No chain controls are in effect at this time.", make popup is set to false
                                    let dataEntry = data[data.type];
                                    if (dataEntry.statusData.statusDescription === "No chain controls are in effect at this time.") {
                                        makePopup = false;
                                    }
                                    iconImage = ccMarkerImage;
                                    break;
                                case 'cctv':
                                    iconImage = cctvMarkerImage;
                                    break;
                                case 'cms':
                                    // if cms message is Blank, make popup is set to false
                                    let dataEntryCMS = data[data.type];
                                    if (dataEntryCMS.message.display === "Blank") {
                                        makePopup = false;
                                    }
                                    iconImage = cmsMarkerImage;
                                    
                                    break;
                                default:
                                    iconImage = markerImage;
                            }
                            
                            if (makePopup) {
                                const marker = L.marker([latitude, longitude], {
                                    icon: iconImage,
                                }).addTo(map);
    
                                customBindPopup(marker, data);
                            }
                        }
                    }
                }
            });
        });
    } finally {
        isUpdating = false; // Reset flag after update
    }
}

function createPopup(data: any) {
    /**
     * Creates a popup for the given data.
     * @param {any} data - The data to create a popup for.
     */
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

            // Add event listener to toggle image visibility and change link text
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

                        // Append the image and set the transition after it loads
                        image.onload = () => {
                            if (image) {
                                image.style.opacity = '1'; 
                            }

                            popupContent.classList.add('no-scroll'); 
                            popupContent.scrollTop = 0;

                            // Delay for a smooth transition
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

        case 'cms':
            let displayLine1 = dataEntry.message?.phase1?.phase1Line1 || 'N/A';
            let displayLine2 = dataEntry.message?.phase1?.phase1Line2 || 'N/A';
            let displayLine3 = dataEntry.message?.phase1?.phase1Line3 || 'N/A';

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
        // Add other cases as needed
        default:
            popupContent.innerHTML = `<strong>Unknown Object Type</strong><br>Data: ${JSON.stringify(data)}`;
            break;
    }

    return popupContent;
}

function customBindPopup(marker: any, data: any) {
    /**
        * Allows for multi line bindPopup content.
     */

    console.log("custom bind popup fired: ", typeof data, typeof marker);
    
    const markerLatLnt = marker.getLatLng();
    // Bind the popup to the marker and ensure there is enough map space to display the entire popup without it closing
    marker.bindPopup(createPopup(data), {
        autoPan: true,
        autoPanPadding: new L.Point(100,100),
        keepInView: true
    });


}

function panToLocation(lat: number, lng: number, zoomLevel: number) {
    /**
     * Pans the map to the given location.
     * @param {number} lat - The latitude of the location.
     * @param {number} lng - The longitude of the location.
     * @param {number} zoomLevel - The zoom level of the map.
        */
    
    map.setView([lat, lng], zoomLevel);
}



async function updateDataAndMap() {
    /**
     * Updates the data and map based on the selected options and district.
     */

    persistentDataDictionary = {};
    let binaryFlag = 0;

    selectedOptions.forEach((isSelected, i) => {
        if (isSelected) {
            binaryFlag |= (1 << i);
        }
    });

    if (binaryFlag === 0) {
        persistentDataDictionary = {};
        updateMap();
        return;
    }


    persistentDataDictionary = await createDataDictionary(binaryFlag, [selectedDistrict.value]);
    updateMap();
}

/* ~--------------------------LISTENERS---------------------------~ */
map.on('moveend', () => {
    updateMap();
});