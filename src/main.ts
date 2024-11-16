// main.ts
// Nathan Shturm

// deno-lint-ignore-file

// Imports
import { createDataDictionary } from './dataProcessor.ts';
import { availableDataTypes } from './dataFetcher.ts';
import 'leaflet/dist/leaflet.css'; 
import L from 'leaflet';
import './style.css';
import "./leafletWorkaround.ts";

/* ~-------------------VARIABLES/INITIALIZATION-------------------~ */
// Constants
const DISTRICT_ZOOM = 10; 

// HTML Elements
const app = document.getElementById('app') as HTMLElement;
const options: Array<keyof typeof availableDataTypes> = ['cc', 'cctv', 'cms', 'lcs', 'rwis', 'tt'];
const selectedOptions = new Array(6).fill(false);
let persistentDataDictionary: { [key: string]: any[] } = {};
const optionButtons: HTMLButtonElement[] = [];

const districtContainer = document.createElement('div');
districtContainer.id = 'districtContainer';
const selectedDistrict = { value: 1 };

const submitButton = document.createElement('button');
submitButton.id = 'submitButton';
submitButton.innerText = 'Submit';

const mapContainer = document.createElement('div');
mapContainer.id = 'map';
app.appendChild(mapContainer);

const map = L.map('map').setView([37.7749, -122.4194], 6);

// Create Leaflet map
L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png", {
        minZoom: 0,
        maxZoom: 20,
        attribution:
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
).addTo(map);


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
        map.setView(coordinates, DISTRICT_ZOOM);
    }
}

function updateMap() {
    /**
     * Updates the map with the data from the persistent data dictionary.
     */

    map.eachLayer((layer: typeof L.Layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    const bounds = map.getBounds();
    Object.entries(persistentDataDictionary).forEach(([key, dataArray]) => {
        dataArray.forEach((data: any) => {
            const dataEntry = data[key];
            if (dataEntry && dataEntry.location) {
                const latitude = parseFloat(dataEntry.location.latitude);
                const longitude = parseFloat(dataEntry.location.longitude);
                const district = parseInt(dataEntry.location.district);
                if (!isNaN(latitude) && !isNaN(longitude) && bounds.contains([latitude, longitude]) && district === selectedDistrict.value) {
                    const marker = L.marker([latitude, longitude]).addTo(map);
                    marker.bindPopup(createPopup(data));
                }
            }
        });
    });
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

    // Create popup content based on the object type using switch-case
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
            popupContent.innerHTML = `
                <strong>CMS Object Details</strong><br>
                Index: ${dataEntry.index || 'N/A'}<br>
                Location: ${dataEntry.location.locationName || 'N/A'}, ${dataEntry.location.county || 'N/A'}<br>
                In Service: ${dataEntry.inService || 'N/A'}<br>
                Display Message: ${dataEntry.message?.display || 'N/A'}
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

        default:
            popupContent.innerHTML = `<strong>Unknown Object Type</strong><br>Data: ${JSON.stringify(data)}`;
            break;
    }

    return popupContent;
}




/* ~--------------------------LISTENERS---------------------------~ */
map.on('moveend', () => {
    updateMap();
});

submitButton.onclick = async () => {
    submitButton.disabled = true;
    submitButton.innerText = 'Loading...';
    persistentDataDictionary = {};
    let binaryFlag = 0;

    selectedOptions.forEach((isSelected, i) => {
        if (isSelected) {
            binaryFlag |= (1 << i);
        }
    });

    persistentDataDictionary = await createDataDictionary(binaryFlag, [selectedDistrict.value]);
    
    const isDataEmpty = Object.values(persistentDataDictionary).every(dataArray => dataArray.length === 0);
    if (isDataEmpty) {
        alert('No data available for the selected type(s) and district.');
    } else {
        const resultContainer = document.createElement('div');
        resultContainer.id = 'resultContainer';
        resultContainer.innerHTML = '';
        Object.entries(persistentDataDictionary).forEach(([key, dataArray]) => {
            if (dataArray.length > 0) {
                const result = document.createElement('p');
                result.innerText = `${key.toUpperCase()} contains ${dataArray.length} objects`;
                resultContainer.appendChild(result);
            }
        });

        if (!document.getElementById('resultContainer')) {
            app.appendChild(resultContainer);
        } else {
            const existingContainer = document.getElementById('resultContainer') as HTMLElement;
            existingContainer.replaceWith(resultContainer);
        }

        updateMap();
    }

    submitButton.disabled = false;
    submitButton.innerText = 'Submit';
};

options.forEach((option, index) => {
    const button = document.createElement('button');
    button.innerText = option.toUpperCase();
    button.classList.add('option-button');
    button.onclick = () => {
        selectedOptions[index] = !selectedOptions[index];
        if (selectedOptions[index]) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    };

    app.appendChild(button);
    optionButtons.push(button);
});

for (let i = 1; i <= 12; i++) {
    const districtButton = document.createElement('button');
    districtButton.innerText = `District ${i}`;
    districtButton.classList.add('district-button');
    districtButton.onclick = () => {
        selectedDistrict.value = i;
        districtButton.classList.add('selected-district');
        setDistrictView(i);
        Array.from(districtContainer.children).forEach(child => {
            if (child !== districtButton) (child as HTMLElement).classList.remove('selected-district');
        });
        updateAvailableOptions(i);
        updateMap();
    };

    districtContainer.appendChild(districtButton);
}
app.appendChild(districtContainer);

app.appendChild(submitButton);
app.appendChild(mapContainer);
