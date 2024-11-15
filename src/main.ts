// main.ts
// https://chatgpt.com/c/6737c34b-b418-800a-a237-473e3e033150

import { createDataDictionary } from './dataProcessor.ts';

// Create buttons dynamically and add them to the app container
const app = document.getElementById('app') as HTMLElement;
const options = ['cc', 'cctv', 'cms', 'lcs', 'rwis', 'tt'];
const selectedOptions = new Array(6).fill(false);

options.forEach((option, index) => {
    const button = document.createElement('button');
    button.innerText = option.toUpperCase();
    button.style.margin = '5px';
    button.style.padding = '10px';
    button.style.cursor = 'pointer';
    button.onclick = () => {
        selectedOptions[index] = !selectedOptions[index]; // Toggle selection state
        button.style.backgroundColor = selectedOptions[index] ? 'lightgreen' : ''; // Change color if selected or not
    };
    app.appendChild(button);
});

// Create the submit button
const submitButton = document.createElement('button');
submitButton.innerText = 'Submit';
submitButton.style.margin = '10px';
submitButton.style.padding = '10px';
submitButton.style.cursor = 'pointer';
submitButton.onclick = async () => {
    // Disable the submit button
    submitButton.disabled = true;
    submitButton.innerText = 'Loading...';

    // Recalculate the binary flag based on the currently selected options
    let binaryFlag = 0;
    selectedOptions.forEach((isSelected, i) => {
        if (isSelected) {
            binaryFlag |= (1 << i);
        }
    });

    // Fetch the data dictionary for the selected options
    const dataDictionary = await createDataDictionary(binaryFlag);

    // Display the number of objects per option type
    const resultContainer = document.createElement('div');
    resultContainer.style.marginTop = '20px';
    resultContainer.innerHTML = ''; // Clear previous results

    Object.entries(dataDictionary).forEach(([key, dataArray]) => {
        if (dataArray.length > 0) {
            const result = document.createElement('p');
            result.innerText = `${key.toUpperCase()} contains ${dataArray.length} objects`;
            resultContainer.appendChild(result);
        }
    });

    // Append the result to the app container
    if (!document.getElementById('resultContainer')) {
        resultContainer.id = 'resultContainer';
        app.appendChild(resultContainer);
    } else {
        const existingContainer = document.getElementById('resultContainer') as HTMLElement;
        existingContainer.replaceWith(resultContainer);
        resultContainer.id = 'resultContainer';
    }

    // Re-enable the submit button and reset its text
    submitButton.disabled = false;
    submitButton.innerText = 'Submit';
};
app.appendChild(submitButton);
