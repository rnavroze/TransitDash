// python -m http.server

const TRANSIT_AGENCY_TAG = 'ttc';

function calcCrow(coords1, coords2) {
    // let R = 6.371; // km
    let R = 6371000;
    let dLat = toRad(coords2.lat - coords1.lat);
    let dLon = toRad(coords2.lon - coords1.lon);
    let lat1 = toRad(coords1.lat);
    let lat2 = toRad(coords2.lat);

    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}

function parseXml(xml, arrayTags) {
    let dom = null;
    if (window.DOMParser) dom = (new DOMParser()).parseFromString(xml, "text/xml");
    else if (window.ActiveXObject) {
        dom = new ActiveXObject('Microsoft.XMLDOM');
        dom.async = false;
        if (!dom.loadXML(xml)) throw dom.parseError.reason + " " + dom.parseError.srcText;
    } else throw new Error("cannot parse xml string!");

    function parseNode(xmlNode, result) {
        if (xmlNode.nodeName == "#text") {
            let v = xmlNode.nodeValue;
            if (v.trim()) result['#text'] = v;
            return;
        }

        let jsonNode = {},
            existing = result[xmlNode.nodeName];
        if (existing) {
            if (!Array.isArray(existing)) result[xmlNode.nodeName] = [existing, jsonNode];
            else result[xmlNode.nodeName].push(jsonNode);
        } else {
            if (arrayTags && arrayTags.indexOf(xmlNode.nodeName) != -1) result[xmlNode.nodeName] = [jsonNode];
            else result[xmlNode.nodeName] = jsonNode;
        }

        if (xmlNode.attributes) for (let attribute of xmlNode.attributes) jsonNode[attribute.nodeName] = attribute.nodeValue;

        for (let node of xmlNode.childNodes) parseNode(node, jsonNode);
    }

    let result = {};
    for (let node of dom.childNodes) parseNode(node, result);

    return result;
}

async function getStopData() {
    // TODO: Error handling
    return await CSV.fetch({
            url: 'data/stops.txt'
        }
    );
}

async function getNearestStops(coords) {
    let stops = await getStopData();

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
            dist: calcCrow(
                {lat: coords.lat, lon: coords.lon},
                {lat: stop[stopLatIndex], lon: stop[stopLonIndex]}
            )
        };

        stopsByDistance.push(thisStop);
    }

    stopsByDistance.sort((a, b) => a.dist - b.dist);

    return stopsByDistance;
}

async function getPredictionsForStopByStopId(stopId) {
    // https://retro.umoiq.com/service/publicXMLFeed?command=predictions&a=<agency_tag>&stopId=<stop_id>
    let resp = await fetch(`https://retro.umoiq.com/service/publicXMLFeed?command=predictions&a=${TRANSIT_AGENCY_TAG}&stopId=${stopId}`);

    if (!resp.ok) {
        console.error('error', resp.status, resp.statusText);
        return null;
    }

    let respXMLStr = await resp.text();
    return parseXml(respXMLStr);
}

async function getPredictionsForTopNStops(coords, n) {
    let stops = await getNearestStops(coords);

    let stopsToConsider = [];
    for (let i = 0; i < n; i++) {
        if (stops.length < i)
            break;

        stopsToConsider.push(stops[i]);
    }

    let stopsToReturn = [];
    for (let idx in stopsToConsider) {
        let stopToConsider = stopsToConsider[idx];
        let thisStopPredictions = await getPredictionsForStopByStopId(stopToConsider.stopId);
        stopsToReturn.push({
            stop: stopToConsider,
            predictions: thisStopPredictions.body.predictions
        });
    }

    return stopsToReturn;
}

/*

*/
async function consolidateData() {
    let predictionsData = await getPredictionsForTopNStops({lat: 43.651838, lon: -79.381618}, 6);

    let output = [];

    for (let dataIdx in predictionsData) {
        let thisPredictionsData = predictionsData[dataIdx];
        let stopName = predictionsData.stop.stopName;
        for (let predictionIdx in thisPredictionsData.predictions) {
            let prediction = thisPredictionsData.predictions[predictionIdx];
            let thisPredictionOutput = {

            };
        }
    }
}

// Eglinton and Dunfield: {lat: 43.707321, lon: -79.395445}
// Queen and Bay: {lat: 43.651838, lon: -79.381618}
getPredictionsForTopNStops({lat: 43.707321, lon: -79.395445}, 6).then(str => console.log(str));

//consolidateData().then(data => console.log(data));

//(function(dataset) {
//    // dataset object doc'd below
//    console.log(dataset);
//});