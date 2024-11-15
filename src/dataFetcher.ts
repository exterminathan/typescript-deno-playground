// dataFetcher.ts

const availableDataTypes = {
    cc: [1, 2, 3, 6, 7, 8, 9, 10, 11],              // Chain control data
    cctv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  // CCTV data
    cms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],   // CMS data
    lcs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],   // Lane closure data
    rwis: [2, 3, 6, 8, 9, 10],                      // Road weather data
    tt: [3, 8, 11, 12]                              // Travel time data
};

// Function to generate URLs for different data types
export function getDataUrl(district: number, type: keyof typeof availableDataTypes): string | null {
    if (availableDataTypes[type].includes(district)) {
        return `https://cwwp2.dot.ca.gov/data/d${district}/${type}/${type}StatusD${String(district).padStart(2, '0')}.json`;
    }
    return null; // Return null if the data is not available for the district
}

// Export the list of all districts covered by any data type
export const districts = Array.from(
    new Set(
        Object.values(availableDataTypes).flat() // Combine all districts into a unique set
    )
);

// Export available data types for reference
export const dataTypes = Object.keys(availableDataTypes) as Array<keyof typeof availableDataTypes>;
