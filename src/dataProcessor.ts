import { getDataUrl, districts } from './dataFetcher.ts';
import { CCObject, CCTVObject, CMSObject, LCSObject, RWISObject, TTObject } from './types.ts';

// Function to fetch data from a URL and parse it into a specific type
export async function fetchData<T>(url: string): Promise<T | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch data from ${url}`);
            return null;
        }
        const data = await response.json();
        return data as T;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return null;
    }
}

// Function to create a dictionary of data objects based on the binary flag input
export async function createDataDictionary(binaryFlag: number) {
    // Array of object types corresponding to binary positions
    const objectTypes = ['cc', 'cctv', 'cms', 'lcs', 'rwis', 'tt'];
    const selectedTypes = [];

    // Check each bit in the binary flag to decide if the type should be included
    for (let i = 0; i < objectTypes.length; i++) {
        if ((binaryFlag & (1 << i)) !== 0) {
            selectedTypes.push(objectTypes[i]);
        }
    }

    const dataDictionary: {
        [key: string]: Array<CCObject | CCTVObject | CMSObject | LCSObject | RWISObject | TTObject>;
    } = {
        cc: [],
        cctv: [],
        cms: [],
        lcs: [],
        rwis: [],
        tt: []
    };

    for (const district of districts) {
        for (const type of selectedTypes) {
            const url = getDataUrl(district, type as 'cc' | 'cctv' | 'cms' | 'lcs' | 'rwis' | 'tt');
            if (url) {
                const data = await fetchData<{ data: (CCObject | CCTVObject | CMSObject | LCSObject | RWISObject | TTObject)[] }>(url); // Generic fetch for any data format

                if (data && data.data) {
                    switch (type) {
                        case 'cc':
                            data.data.forEach(item => dataDictionary.cc.push(item as CCObject));
                            break;
                        case 'cctv':
                            data.data.forEach(item => dataDictionary.cctv.push(item as CCTVObject));
                            break;
                        case 'cms':
                            data.data.forEach(item => dataDictionary.cms.push(item as CMSObject));
                            break;
                        case 'lcs':
                            data.data.forEach(item => dataDictionary.lcs.push(item as LCSObject));
                            break;
                        case 'rwis':
                            data.data.forEach(item => dataDictionary.rwis.push(item as RWISObject));
                            break;
                        case 'tt':
                            data.data.forEach(item => dataDictionary.tt.push(item as TTObject));
                            break;
                    }
                }
            }
        }
    }

    return dataDictionary;
}

// Function to format and write the data dictionary to a text file
export async function writeDataToFile(binaryFlag: number) {
    const allData = await createDataDictionary(binaryFlag);
    const formattedData = Object.entries(allData)
        .filter(([_key, dataArray]) => dataArray.length > 0) // Only include non-empty arrays
        .map(([key, dataArray]) => {
            const header = `~----${key.toUpperCase()} OBJECTS-----~`;
            const footer = `~------------------------------~`;
            const body = dataArray
                .map(obj => {
                    switch (key) {
                        case 'cc':
                            return `[CC Object at index ${(obj as CCObject).cc.index}]`;
                        case 'cctv':
                            return `[CCTV Object at index ${(obj as CCTVObject).cctv.index}]`;
                        case 'cms':
                            return `[CMS Object at index ${(obj as CMSObject).cms.index}]`;
                        case 'lcs':
                            return `[LCS Object at index ${(obj as LCSObject).lcs.index}]`;
                        case 'rwis':
                            return `[RWIS Object at index ${(obj as RWISObject).rwis.index}]`;
                        case 'tt':
                            return `[TT Object at index ${(obj as TTObject).tt.index}]`;
                        default:
                            return '[Unknown Object]';
                    }
                })
                .join('\n');

            return `${header}\n${body}\n${footer}`;
        })
        .join('\n\n');

    try {
        await Deno.writeTextFile('data_out.txt', formattedData);
        console.log('Data written to data_out.txt successfully.');
    } catch (error) {
        console.error('Error writing data to file:', error);
    }
}

// Run the function with a binary flag input (e.g., 43 -> 101011)
(async () => {
    const binaryFlag = 16; // Replace with your desired number input
    await writeDataToFile(binaryFlag);
})();
