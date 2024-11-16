// types.ts
// Nathan Shturm

/* ~-------- GENERALIZED DATA TYPES ----------~ */
export interface RecordTimestamp {
    recordDate: string;
    recordTime: string;
    recordEpoch?: string;
}

export interface Location {
    district: string;
    locationName: string;
    nearbyPlace: string;
    longitude: string;
    latitude: string;
    elevation: string;
    direction: string;
    county: string;
    route: string;
    routeSuffix: string;
    postmilePrefix: string;
    postmile: string;
    alignment: string;
    milepost: string;
}

/* ~-------- SPECIALIZED DATA TYPES ----------~ */
export interface LCSEndLocation {
    endDistrict: string;
    endLocationName: string;
    endFreeFormDescription: string;
    endNearbyPlace: string;
    endLongitude: string;
    endLatitude: string;
    endElevation: string;
    endDirection: string;
    endCounty: string;
    endRoute: string;
    endRouteSuffix: string;
    endPostmilePrefix: string;
    endPostmile: string;
    endAlignment: string;
    endMilepost: string;
}


export interface LCSBeginLocation extends LCSEndLocation {
    beginDistrict: string;
    beginLocationName: string;
    beginFreeFormDescription: string;
    beginNearbyPlace: string;
    beginLongitude: string;
    beginLatitude: string;
    beginElevation: string;
    beginDirection: string;
    beginCounty: string;
    beginRoute: string;
    beginRouteSuffix: string;
    beginPostmilePrefix: string;
    beginPostmile: string;
    beginAlignment: string;
    beginMilepost: string;
}


/* ~------- SERVICETYPE DATA OBJECTS ---------~ */
export interface CCServiceType {
    cc: CCData['cc'];
    type: string;
}

export interface CCTVServiceType {
    cctv: CCTVData['cctv'];
    type: string;
}

export interface CMSServiceType {
    cms: CMSData['cms'];
    type: string;
}

export interface LCSServiceType {
    lcs: LCSData['lcs'];
    type: string;
}

export interface RWISServiceType {
    rwis: RWISData['rwis'];
    type: string;
}

export interface TTServiceType {
    tt: TTData['tt'];
    type: string;
}


/* ~----------- SERVICETYPE DATA -------------~ */
export interface CCData {
    cc: {
        index: string;
        recordTimestamp: RecordTimestamp;
        location: Location;
        inService: string;
        statusData: {
            statusTimestamp: RecordTimestamp;
            status: string;
            statusDescription: string;
        };
    };
}

export interface CCTVData {
    cctv: {
        index: string;
        recordTimestamp: RecordTimestamp;
        location: Location;
        inService: string;
        imageData: {
            imageDescription: string;
            streamingVideoURL: string;
            static: {
                currentImageUpdateFrequency: string;
                currentImageURL: string;
                referenceImageUpdateFrequency: string;
                referenceImage1UpdateAgoURL: string;
                referenceImage2UpdatesAgoURL: string;
                referenceImage3UpdatesAgoURL: string;
                referenceImage4UpdatesAgoURL: string;
                referenceImage5UpdatesAgoURL: string;
                referenceImage6UpdatesAgoURL: string;
                referenceImage7UpdatesAgoURL: string;
                referenceImage8UpdatesAgoURL: string;
                referenceImage9UpdatesAgoURL: string;
                referenceImage10UpdatesAgoURL: string;
                referenceImage11UpdatesAgoURL: string;
                referenceImage12UpdatesAgoURL: string;
            };
        };
    };
}

export interface CMSData {
    cms: {
        index: string;
        recordTimestamp: RecordTimestamp;
        location: Location;
        inService: string;
        message: {
            messageTimestamp: {
                messageDate: string;
                messageTime: string;
            };
            display: string;
            displayTime: string;
            phase1: {
                phase1Font: string;
                phase1Line1: string;
                phase1Line2: string;
                phase1Line3: string;
            };
            phase2: {
                phase2Font: string;
                phase2Line1: string;
                phase2Line2: string;
                phase2Line3: string;
            };
        };
    };
}

export interface LCSData {
    lcs: {
        index: string;
        recordTimestamp: RecordTimestamp;
        location: {
            travelFlowDirection: string;
            begin: LCSBeginLocation;
            end: LCSEndLocation;
        };
        closure: {
            closureID: string;
            logNumber: string;
            closureTimestamp: {
                closureRequestDate: string;
                closureRequestTime: string;
                closureRequestEpoch: string;
                closureStartDate: string;
                closureStartTime: string;
                closureStartEpoch: string;
                closureEndDate: string;
                closureEndTime: string;
                closureEndEpoch: string;
                isClosureEndIndefinite: string;
            };
            facility: string;
            typeOfClosure: string;
            typeOfWork: string;
            durationOfClosure: string;
            estimatedDelay: string;
            lanesClosed: string;
            totalExistingLanes: string;
            isCHINReportable: string;
            code1097: {
                isCode1097: string;
                code1097Timestamp: RecordTimestamp;
            };
            code1098: {
                isCode1098: string;
                code1098Timestamp: RecordTimestamp;
            };
            code1022: {
                isCode1022: string;
                code1022Timestamp: RecordTimestamp;
            };
        };
    };
}

export interface RWISData {
    rwis: {
        index: string;
        recordTimestamp: RecordTimestamp;
        location: Location;
        inService: string;
        rwisData: {
            stationData: {
                essAtmosphericPressure: string;
            };
            windData: {
                essAvgWindDirection: string;
                essAvgWindSpeed: string;
                essSpotWindDirection: string;
                essSpotWindSpeed: string;
                essMaxWindGustSpeed: string;
                essMaxWindGustDir: string;
            };
            temperatureData: {
                essNumTemperatureSensors: string;
                essTemperatureSensorTable: {
                    essTemperatureSensorEntry: {
                        essTemperatureSensorIndex: string;
                        essAirTemperature: string;
                    };
                }[];
                essWetbulbTemp: string;
                essDewpointTemp: string;
                essMaxTemp: string;
                essMinTemp: string;
            };
            humidityPrecipData: {
                essRelativeHumidity: string;
                essPrecipYesNo: string;
                essPrecipRate: string;
                essPrecipSituation: string;
                essPrecipitationStartTime: string;
                essPrecipitationEndTime: string;
                essPrecipitationOneHour: string;
                essPrecipitationThreeHours: string;
                essPrecipitationSixHours: string;
                essPrecipitationTwelveHours: string;
                essPrecipitation24Hours: string;
            };
            radiationObjects: object;
            visibilityData: {
                essVisibility: string;
                essVisibilitySituation: string;
            };
            pavementSensorData: {
                numEssPavementSensors: string;
                essPavementSensorTable: object[];
                numEssSubSurfaceSensors: string;
                essSubSurfaceSensorTable: object[];
            };
        };
    };
}

export interface TTData {
    tt: {
        index: string;
        recordTimestamp: RecordTimestamp;
        location: {
            travelFlowDirection: string;
            begin: LCSBeginLocation;
            end: LCSEndLocation;
        };
        traveltime: {
            traveltimeRouteID: string;
            traveltimeTimestamp: RecordTimestamp;
            calculatedTraveltime: string;
            traveltimeUpdateFrequency: string;
            traveltimeAccuracy: string;
        };
    };
}

