import CoordinateHelper from "@/helpers/CoordinateHelper";
import XmlHelper from "@/helpers/XmlHelper";
import CsvHelper from "@/helpers/CsvHelper";
import GeolocationHelper from "@/helpers/GeolocationHelper";

const TRANSIT_AGENCY_TAG = 'ttc';
const TransitHelper = {
    async getStopData() {
        // TODO: Error handling
        return await CsvHelper.fetch({
                url: 'data/stops.txt'
            }
        );
    },

    async getNearestStops(coords) {
        let stops = await this.getStopData();

        let stopIdIndex = stops.fields.findIndex(field => field === "stop_code");
        let stopNameIndex = stops.fields.findIndex(field => field === "stop_name");
        let stopLatIndex = stops.fields.findIndex(field => field === "stop_lat");
        let stopLonIndex = stops.fields.findIndex(field => field === "stop_lon");

        let stopsByDistance = [];
        for (let stopIndex in stops.records) {
            let stop = stops.records[stopIndex];

            let thisStop = {
                stopId: stop[stopIdIndex],
                stopName: stop[stopNameIndex],
                lat: stop[stopLatIndex],
                lon: stop[stopLonIndex],
                dist: CoordinateHelper.calcCrow(
                    {lat: coords.lat, lon: coords.lon},
                    {lat: stop[stopLatIndex], lon: stop[stopLonIndex]}
                )
            };

            stopsByDistance.push(thisStop);
        }

        stopsByDistance.sort((a, b) => a.dist - b.dist);

        return stopsByDistance;
    },

    async getPredictionsForStopByStopId(stopId) {
        // https://retro.umoiq.com/service/publicXMLFeed?command=predictions&a=<agency_tag>&stopId=<stop_id>
        let resp = await fetch(`https://retro.umoiq.com/service/publicXMLFeed?command=predictions&a=${TRANSIT_AGENCY_TAG}&stopId=${stopId}`);

        if (!resp.ok) {
            console.error('error', resp.status, resp.statusText);
            return null;
        }

        let respXMLStr = await resp.text();
        return XmlHelper.parseXml(respXMLStr);
    },

    async getPredictionsForTopNStops(coords, n) {
        let stops = await this.getNearestStops(coords);

        let stopsToConsider = [];
        for (let i = 0; i < n; i++) {
            if (stops.length < i)
                break;

            stopsToConsider.push(stops[i]);
        }

        let stopsToReturn = [];
        for (let idx in stopsToConsider) {
            let stopToConsider = stopsToConsider[idx];
            let thisStopPredictions = await this.getPredictionsForStopByStopId(stopToConsider.stopId);
            stopsToReturn.push({
                stop: stopToConsider,
                predictions: thisStopPredictions.body.predictions
            });
        }

        return stopsToReturn;
    },

    async consolidateData(coords) {
        let stops = await this.getPredictionsForTopNStops(coords, 6);
        console.log(stops);

        let output = [];

        for (let stopIdx in stops) {
            let thisStop = stops[stopIdx];

            let stopName = thisStop.stop.stopName;

            let thisStopOutput = {
                stopName,
                routes: []
            };

            let routes = Array.isArray(thisStop.predictions) ? thisStop.predictions : [thisStop.predictions];
            for (let routeIdx in routes) {
                let route = routes[routeIdx];

                if (!route || !route.hasOwnProperty('direction') || !route.hasOwnProperty('routeTitle')) {
                    continue;
                }

                let globalName = route.routeTitle;

                let directions = Array.isArray(route.direction) ? route.direction : [route.direction];


                for (let directionIdx in directions) {
                    let direction = directions[directionIdx];
                    let name = direction['title'];
                    let predictions = direction['prediction'];

                    let predictionMinutes = [];

                    for (let predictionIdx in predictions) {
                        predictionMinutes.push(predictions[predictionIdx]['minutes']);
                    }

                    predictionMinutes = predictionMinutes.map(val => parseInt(val));

                    let directionName = 'Unknown';
                    if (name.startsWith('East')) {
                        directionName = 'Eastbound';
                    } else if (name.startsWith('West')) {
                        directionName = 'Westbound';
                    } else if (name.startsWith('North')) {
                        directionName = 'Northbound';
                    } else if (name.startsWith('South')) {
                        directionName = 'Southbound';
                    }

                    let thisRouteOutput = {
                        directionName,
                        globalName,
                        name,
                        predictionMinutes
                    };

                    thisStopOutput.routes.push(thisRouteOutput);
                }
            }

            output.push(thisStopOutput);
        }

        let consolidatedOutput = {"Eastbound": [], "Westbound": [], "Northbound": [], "Southbound": [], "Unknown": []};
        for (let stopIdx in output) {
            let stop = output[stopIdx];

            let stopName = stop.stopName;
            for (let routeIdx in stop.routes) {
                let route = stop.routes[routeIdx];
                let directionOutput = consolidatedOutput[route.directionName];
                let existingIndex = directionOutput.findIndex(stop => stop.stopName === stopName);
                if (existingIndex === -1) {
                    consolidatedOutput[route.directionName].push({
                        stopName,
                        routes: [route]
                    })
                } else {
                    consolidatedOutput[route.directionName][existingIndex].routes.push(route);
                }
            }
        }
        return consolidatedOutput;
    },


    // Eglinton and Dunfield: {lat: 43.707321, lon: -79.395445}
    // Queen and Bay: {lat: 43.651838, lon: -79.381618}
    //getPredictionsForTopNStops({lat: 43.707321, lon: -79.395445}, 6).then(str => console.log(str));
    async testing() {
        try {
            let pos = await GeolocationHelper.getCurrentPosition();
            let data = await this.consolidateData({lat: pos.coords.latitude, lon: pos.coords.longitude});

            return JSON.stringify(data, null, 4);
        } catch (err) {
            alert('Error!' + err);
            return err;
        }
    }
};

export default TransitHelper;