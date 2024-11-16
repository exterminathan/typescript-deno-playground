import { getDataUrl } from './dataFetcher.ts';
import { CCServiceType, CCTVServiceType, CMSServiceType, LCSServiceType, RWISServiceType, TTServiceType } from './types.ts';

// 
export async function fetchData<T>(url: string): Promise<T | null> {
    /**
     * Fetch data from the specified URL and return the parsed JSON response.
     * @param {string} url - The URL to fetch data from.
     */

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

export async function createDataDictionary(binaryFlag: number, selectedDistricts: number[]) {
    /**
     * Create a dictionary of data objects for the selected districts and object types.
     * @param {number} binaryFlag - A binary flag representing the selected object types.
     * @param {number[]} selectedDistricts - An array of selected district numbers.
     */

    const objectTypes = ['cc', 'cctv', 'cms', 'lcs', 'rwis', 'tt'];
    const selectedTypes: string[] = [];

    // Populate selectedTypes based on the binary flag
    for (let i = 0; i < objectTypes.length; i++) {
        if ((binaryFlag & (1 << i)) !== 0) {
            selectedTypes.push(objectTypes[i]);
        }
    }

    console.log("Selected types for fetch:", selectedTypes);
    console.log("Selected districts for fetch:", selectedDistricts);

    // Initialize an empty dictionary to store the data
    const dataDictionary: {
        [key: string]: Array<(CCServiceType | CCTVServiceType | CMSServiceType | LCSServiceType | RWISServiceType | TTServiceType) & { type: string }>;
    } = {
        cc: [],
        cctv: [],
        cms: [],
        lcs: [],
        rwis: [],
        tt: []
    };

    for (const district of selectedDistricts) {
        for (const type of selectedTypes) {
            const url = getDataUrl(district, type as 'cc' | 'cctv' | 'cms' | 'lcs' | 'rwis' | 'tt');
            if (url) {
                console.log(`Fetching data from URL: ${url}`);
                const data = await fetchData<{ data: (CCServiceType | CCTVServiceType | CMSServiceType | LCSServiceType | RWISServiceType | TTServiceType)[] }>(url);

                if (data && data.data) {
                    console.log(`Data fetched for type ${type}:`, data.data);
                    data.data.forEach(item => {
                        // Add the 'type' property to the item
                        const itemWithType = { ...item, type };
                        dataDictionary[type].push(itemWithType);
                    });
                } else {
                    console.warn(`No data fetched or data is empty for type ${type} at URL ${url}`);
                }
            }
        }
    }

    console.log("Final data dictionary:", dataDictionary);
    return dataDictionary;
}


export async function writeDataToFile(binaryFlag: number, selectedDistricts: number[]) {
    /**
     * Write the fetched data to a text file in a formatted manner.
     * @param {number} binaryFlag - A binary flag representing the selected object types.
     * @param {number[]} selectedDistricts - An array of selected district numbers.
     */
    
    const allData = await createDataDictionary(binaryFlag, selectedDistricts);
    const formattedData = Object.entries(allData)
        .filter(([_key, dataArray]) => dataArray.length > 0)
        .map(([key, dataArray]) => {
            const header = `~----${key.toUpperCase()} OBJECTS-----~`;
            const footer = `~------------------------------~`;

            // Format each object in the array for display in the text file
            const body = dataArray
                .map(obj => {
                    switch (key) {
                        case 'cc':
                            return `[CC Object at index ${(obj as CCServiceType).cc.index}]`;
                        case 'cctv':
                            return `[CCTV Object at index ${(obj as CCTVServiceType).cctv.index}]`;
                        case 'cms':
                            return `[CMS Object at index ${(obj as CMSServiceType).cms.index}]`;
                        case 'lcs':
                            return `[LCS Object at index ${(obj as LCSServiceType).lcs.index}]`;
                        case 'rwis':
                            return `[RWIS Object at index ${(obj as RWISServiceType).rwis.index}]`;
                        case 'tt':
                            return `[TT Object at index ${(obj as TTServiceType).tt.index}]`;
                        default:
                            return '[Unknown Object]';
                    }
                })
                .join('\n');

            return `${header}\n${body}\n${footer}`;
        })
        .join('\n\n');

    try {
        // Write the formatted data to a text file
        await Deno.writeTextFile('data_out.txt', formattedData);
        console.log('Data written to data_out.txt successfully.');
    } catch (error) {
        console.error('Error writing data to file:', error);
    }
}
