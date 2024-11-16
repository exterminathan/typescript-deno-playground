// dataFetcher.ts
// Nathan Shturm

export const availableDataTypes = {
    cc: [1, 2, 3, 6, 7, 8, 9, 10, 11],              // Chain control data
    cctv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  // CCTV data
    cms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],   // CMS data
    lcs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],   // Lane closure data
    rwis: [2, 3, 6, 8, 9, 10],                      // Road weather data
    tt: [3, 8, 11, 12]                              // Travel time data
};

export function getDataUrl(district: number, type: keyof typeof availableDataTypes): string | null {
    /**
     * Get the URL for the data of the specified type and district
     * @param district The district number
     * @param type The type of data
     * @returns The URL of the data or null if the data is not available for the district
     */

    if (availableDataTypes[type].includes(district)) {
        return `https://cwwp2.dot.ca.gov/data/d${district}/${type}/${type}StatusD${String(district).padStart(2, '0')}.json`;
    }
    return null; 
}

// Export available districts for reference
export const districts = Array.from(
    new Set(
        Object.values(availableDataTypes).flat()
    )
);

// Export available data types for reference
export const dataTypes = Object.keys(availableDataTypes) as Array<keyof typeof availableDataTypes>;
