import CoordinateHelper from "@/helpers/CoordinateHelper";
import XmlHelper from "@/helpers/XmlHelper";
import CsvHelper from "@/helpers/CsvHelper";
import GeolocationHelper from "@/helpers/GeolocationHelper";

const TRANSIT_AGENCY_TAG = 'ttc';
const FETCH_N_STOPS = 20;

const SUBWAY_LINES = [
    {lineNo: 1, lineName: 'Yonge-University', branchNE: 1, branchSW: 0},
    {lineNo: 2, lineName: 'Bloor-Danforth', branchNE: 1, branchSW: 0},
    {lineNo: 3, lineName: 'Scarborough', branchNE: 1, branchSW: 0},
    {lineNo: 4, lineName: 'Sheppard', branchNE: 1, branchSW: 0},
]

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

    async getPredictionsForStopByStopId(stopId, isStation) {
        // https://retro.umoiq.com/service/publicXMLFeed?command=predictions&a=<agency_tag>&stopId=<stop_id>
        // https://ntas.ttc.ca/api/ntas/get-next-train-time/
        if (!isStation) {
            let resp = await fetch(`https://retro.umoiq.com/service/publicXMLFeed?command=predictions&a=${TRANSIT_AGENCY_TAG}&stopId=${stopId}`);

            if (!resp.ok) {
                console.error('error', resp.status, resp.statusText);
                return null;
            }

            let respXMLStr = await resp.text();
            return XmlHelper.parseXml(respXMLStr);
        } else {
            return {
                body: {
                    predictions:
                        [
                            {
                                agencyTitle: "Toronto Transit Commission",
                                routeTitle: "1-Yonge-University",
                                routeTag: "1",
                                stopTitle: "Eglinton Station",
                                stopTag: "3908",
                                direction: {
                                    title: "North - 1 Yonge-University towards Finch",
                                    prediction: {
                                        epochTime: "1677008150236",
                                        seconds: "1037",
                                        minutes: "17",
                                        isDeparture: "false",
                                        affectedByLayover: "true",
                                        branch: "97F",
                                        dirTag: "97_1_97F",
                                        vehicle: "3560",
                                        block: "97_5_52",
                                        tripTag: "45452945"
                                    }
                                }
                            },
                            {
                                agencyTitle: "Toronto Transit Commission",
                                routeTitle: "320-Yonge Night Bus",
                                routeTag: "320",
                                stopTitle: "Yonge St At Eglinton Ave East North Side - Eglinton Station",
                                stopTag: "3908",
                                dirTitleBecauseNoPredictions: "North - 320 Yonge towards Steeles via Finch Station"
                            }
                        ]
                }
            }
        }
    },

    isStation(stopName) {
        return stopName.endsWith('Platform') && stopName.indexOf('Station') !== -1 && stopName.indexOf(' at ') === -1;
    },

    async getPredictionsForTopNStops(coords, n) {
//        return JSON.parse('[{"stop":{"stopId":2268,"stopName":"Eglinton Ave East at Dunfield Ave","lat":43.707461,"lon":"-79.395252","dist":144.91308538453208},"predictions":[{"agencyTitle":"Toronto Transit Commission","routeTitle":"56-Leaside","routeTag":"56","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"9633","direction":{"title":"North - 56a Leaside towards Eglinton Station","prediction":[{"epochTime":"1676942605096","seconds":"837","minutes":"13","isDeparture":"false","branch":"56A","dirTag":"56_1_56A","vehicle":"8700","block":"56_2_20","tripTag":"45526080"},{"epochTime":"1676944340919","seconds":"2573","minutes":"42","isDeparture":"false","affectedByLayover":"true","branch":"56A","dirTag":"56_1_56A","vehicle":"8750","block":"56_1_10","tripTag":"45526079"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"334-Eglinton East Night Bus","routeTag":"334","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"9633","dirTitleBecauseNoPredictions":"West - 334 Eglinton East towards Eglinton Station"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"51-Leslie","routeTag":"51","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"9633","direction":{"title":"South - 51 Leslie towards Eglinton Station","prediction":[{"epochTime":"1676942744347","seconds":"977","minutes":"16","isDeparture":"false","branch":"51","dirTag":"51_0_51","vehicle":"3120","block":"51_3_30","tripTag":"45523827"},{"epochTime":"1676944896182","seconds":"3128","minutes":"52","isDeparture":"false","affectedByLayover":"true","branch":"51","dirTag":"51_0_51","vehicle":"3210","block":"51_4_40","tripTag":"45523826"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"54-Lawrence East","routeTag":"54","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"9633","direction":{"title":"West - 54 Lawrence East towards Eglinton Station","prediction":[{"epochTime":"1676942099736","seconds":"332","minutes":"5","isDeparture":"false","branch":"54","dirTag":"54_1_54Bpm","vehicle":"8778","block":"54_5_50","tripTag":"45525906"},{"epochTime":"1676942248272","seconds":"481","minutes":"8","isDeparture":"false","branch":"54","dirTag":"54_1_54A","vehicle":"8863","block":"54_9_90","tripTag":"45525849"},{"epochTime":"1676942947986","seconds":"1180","minutes":"19","isDeparture":"false","branch":"54","dirTag":"54_1_54A","vehicle":"8701","block":"54_2_20","tripTag":"45525848"},{"epochTime":"1676943206372","seconds":"1439","minutes":"23","isDeparture":"false","branch":"54","dirTag":"54_1_RH54","vehicle":"8662","block":"54_14_140","tripTag":"45525847"},{"epochTime":"1676943304461","seconds":"1537","minutes":"25","isDeparture":"false","branch":"54","dirTag":"54_1_54Bpm","vehicle":"8658","block":"54_10_100","tripTag":"45525905"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"34-Eglinton East","routeTag":"34","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"9633","direction":{"title":"West - 34 Eglinton East towards Eglinton Station","prediction":[{"epochTime":"1676941961210","seconds":"193","minutes":"3","isDeparture":"false","branch":"34","dirTag":"34_1_34A","vehicle":"8693","block":"34_1_10","tripTag":"45517909"},{"epochTime":"1676942034276","seconds":"267","minutes":"4","isDeparture":"false","branch":"34","dirTag":"34_1_34A","vehicle":"8675","block":"34_10_100","tripTag":"45517908"},{"epochTime":"1676942182681","seconds":"415","minutes":"6","isDeparture":"false","branch":"34","dirTag":"34_1_34C","vehicle":"8640","block":"34_84_80","tripTag":"45517900"},{"epochTime":"1676942648485","seconds":"881","minutes":"14","isDeparture":"false","branch":"34","dirTag":"34_1_34A","vehicle":"8651","block":"34_14_140","tripTag":"45517907"},{"epochTime":"1676943285194","seconds":"1517","minutes":"25","isDeparture":"false","affectedByLayover":"true","branch":"34","dirTag":"34_1_34C","vehicle":"8711","block":"34_4_40","tripTag":"45517899"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"354-Lawrence East Night Bus","routeTag":"354","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"9633","dirTitleBecauseNoPredictions":"West - 354 Lawrence East towards Eglinton Station"}]},{"stop":{"stopId":2304,"stopName":"Eglinton Ave East at Redpath Ave","lat":43.707755,"lon":"-79.392936","dist":147.79362115437814},"predictions":[{"agencyTitle":"Toronto Transit Commission","routeTitle":"51-Leslie","routeTag":"51","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"6665","direction":{"title":"North - 51 Leslie towards Steeles","prediction":[{"epochTime":"1676942312179","seconds":"544","minutes":"9","isDeparture":"false","affectedByLayover":"true","branch":"51","dirTag":"51_1_51","vehicle":"3241","block":"51_2_20","tripTag":"45523848"},{"epochTime":"1676944112179","seconds":"2344","minutes":"39","isDeparture":"false","affectedByLayover":"true","branch":"51","dirTag":"51_1_51","vehicle":"3120","block":"51_3_30","tripTag":"45523847"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"334-Eglinton East Night Bus","routeTag":"334","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"6665","dirTitleBecauseNoPredictions":"East - 334 Eglinton East towards Finch and Neilson via Kingston Rd and Morningside"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"34-Eglinton East","routeTag":"34","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"6665","direction":[{"title":"East - 34c Eglinton East towards Flemingdon Park (Grenoble & Spanbridge)","prediction":[{"epochTime":"1676941979985","seconds":"212","minutes":"3","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8748","block":"34_5_50","tripTag":"45517777"},{"epochTime":"1676942982156","seconds":"1214","minutes":"20","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8640","block":"34_84_80","tripTag":"45517776"},{"epochTime":"1676944062156","seconds":"2294","minutes":"38","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8711","block":"34_4_40","tripTag":"45517884"},{"epochTime":"1676945082156","seconds":"3314","minutes":"55","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8781","block":"34_87_60","tripTag":"45517883"}]},{"title":"East - 34a Eglinton East towards Kennedy Station","prediction":[{"epochTime":"1676941803633","seconds":"36","minutes":"0","isDeparture":"false","branch":"34A","dirTag":"34_0_34A","vehicle":"8702","block":"34_3_30","tripTag":"45517788"},{"epochTime":"1676943248206","seconds":"1480","minutes":"24","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8693","block":"34_1_10","tripTag":"45517787"},{"epochTime":"1676943746407","seconds":"1979","minutes":"32","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8675","block":"34_10_100","tripTag":"45517785"},{"epochTime":"1676944346407","seconds":"2579","minutes":"42","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8651","block":"34_14_140","tripTag":"45517784"},{"epochTime":"1676944886407","seconds":"3119","minutes":"51","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8699","block":"34_54_20","tripTag":"45517783"}]}]},{"agencyTitle":"Toronto Transit Commission","routeTitle":"54-Lawrence East","routeTag":"54","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"6665","direction":[{"title":"East - 54b Lawrence East towards Orton Park","prediction":[{"epochTime":"1676942849167","seconds":"1081","minutes":"18","isDeparture":"false","affectedByLayover":"true","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8778","block":"54_5_50","tripTag":"45525713"},{"epochTime":"1676944049167","seconds":"2281","minutes":"38","isDeparture":"false","affectedByLayover":"true","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8658","block":"54_10_100","tripTag":"45525712"},{"epochTime":"1676945249167","seconds":"3481","minutes":"58","isDeparture":"false","affectedByLayover":"true","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8704","block":"54_15_150","tripTag":"45525711"}]},{"title":"East - 54a Lawrence East towards Starspray","prediction":[{"epochTime":"1676942192326","seconds":"424","minutes":"7","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8785","block":"54_3_30","tripTag":"45525698"},{"epochTime":"1676942909908","seconds":"1142","minutes":"19","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8863","block":"54_9_90","tripTag":"45525697"},{"epochTime":"1676943746848","seconds":"1979","minutes":"32","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8701","block":"54_2_20","tripTag":"45525696"},{"epochTime":"1676944946848","seconds":"3179","minutes":"52","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8662","block":"54_14_140","tripTag":"45525695"}]}]},{"agencyTitle":"Toronto Transit Commission","routeTitle":"354-Lawrence East Night Bus","routeTag":"354","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"6665","dirTitleBecauseNoPredictions":"East - 354 Lawrence East towards Starspray Blvd"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"56-Leaside","routeTag":"56","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"6665","direction":{"title":"South - 56 Leaside towards Donlands Station","prediction":[{"epochTime":"1676941803620","seconds":"36","minutes":"0","isDeparture":"false","branch":"56","dirTag":"56_0_56A","vehicle":"8750","block":"56_1_10","tripTag":"45526017"},{"epochTime":"1676943038212","seconds":"1270","minutes":"21","isDeparture":"false","affectedByLayover":"true","branch":"56","dirTag":"56_0_56A","vehicle":"8700","block":"56_2_20","tripTag":"45526016"},{"epochTime":"1676944774035","seconds":"3006","minutes":"50","isDeparture":"false","affectedByLayover":"true","branch":"56","dirTag":"56_0_56A","vehicle":"8750","block":"56_1_10","tripTag":"45526015"}]}}]},{"stop":{"stopId":15702,"stopName":"Eglinton Ave East at Dunfield Ave","lat":43.707208,"lon":"-79.395605","dist":153.481614892433},"predictions":[{"agencyTitle":"Toronto Transit Commission","routeTitle":"354-Lawrence East Night Bus","routeTag":"354","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"24060","dirTitleBecauseNoPredictions":"East - 354 Lawrence East towards Starspray Blvd"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"54-Lawrence East","routeTag":"54","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"24060","direction":[{"title":"East - 54b Lawrence East towards Orton Park","prediction":[{"epochTime":"1676942797167","seconds":"1029","minutes":"17","isDeparture":"false","affectedByLayover":"true","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8778","block":"54_5_50","tripTag":"45525713"},{"epochTime":"1676943997167","seconds":"2229","minutes":"37","isDeparture":"false","affectedByLayover":"true","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8658","block":"54_10_100","tripTag":"45525712"},{"epochTime":"1676945197167","seconds":"3429","minutes":"57","isDeparture":"false","affectedByLayover":"true","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8704","block":"54_15_150","tripTag":"45525711"}]},{"title":"East - 54a Lawrence East towards Starspray","prediction":[{"epochTime":"1676942158326","seconds":"390","minutes":"6","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8785","block":"54_3_30","tripTag":"45525698"},{"epochTime":"1676942875908","seconds":"1108","minutes":"18","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8863","block":"54_9_90","tripTag":"45525697"},{"epochTime":"1676943712848","seconds":"1945","minutes":"32","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8701","block":"54_2_20","tripTag":"45525696"},{"epochTime":"1676944912848","seconds":"3145","minutes":"52","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8662","block":"54_14_140","tripTag":"45525695"}]}]},{"agencyTitle":"Toronto Transit Commission","routeTitle":"51-Leslie","routeTag":"51","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"24060","direction":{"title":"North - 51 Leslie towards Steeles","prediction":[{"epochTime":"1676942248179","seconds":"480","minutes":"8","isDeparture":"false","affectedByLayover":"true","branch":"51","dirTag":"51_1_51","vehicle":"3241","block":"51_2_20","tripTag":"45523848"},{"epochTime":"1676944048179","seconds":"2280","minutes":"38","isDeparture":"false","affectedByLayover":"true","branch":"51","dirTag":"51_1_51","vehicle":"3120","block":"51_3_30","tripTag":"45523847"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"334-Eglinton East Night Bus","routeTag":"334","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"24060","dirTitleBecauseNoPredictions":"East - 334 Eglinton East towards Finch and Neilson via Kingston Rd and Morningside"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"56-Leaside","routeTag":"56","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"24060","direction":{"title":"South - 56 Leaside towards Donlands Station","prediction":[{"epochTime":"1676942980211","seconds":"1212","minutes":"20","isDeparture":"false","affectedByLayover":"true","branch":"56","dirTag":"56_0_56A","vehicle":"8700","block":"56_2_20","tripTag":"45526016"},{"epochTime":"1676944716034","seconds":"2948","minutes":"49","isDeparture":"false","affectedByLayover":"true","branch":"56","dirTag":"56_0_56A","vehicle":"8750","block":"56_1_10","tripTag":"45526015"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"34-Eglinton East","routeTag":"34","stopTitle":"Eglinton Ave East At Dunfield Ave","stopTag":"24060","direction":[{"title":"East - 34c Eglinton East towards Flemingdon Park (Grenoble & Spanbridge)","prediction":[{"epochTime":"1676941921988","seconds":"154","minutes":"2","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8748","block":"34_5_50","tripTag":"45517777"},{"epochTime":"1676942924159","seconds":"1156","minutes":"19","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8640","block":"34_84_80","tripTag":"45517776"},{"epochTime":"1676944004159","seconds":"2236","minutes":"37","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8711","block":"34_4_40","tripTag":"45517884"},{"epochTime":"1676945024159","seconds":"3256","minutes":"54","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8781","block":"34_87_60","tripTag":"45517883"}]},{"title":"East - 34a Eglinton East towards Kennedy Station","prediction":[{"epochTime":"1676943184209","seconds":"1416","minutes":"23","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8693","block":"34_1_10","tripTag":"45517787"},{"epochTime":"1676943682410","seconds":"1914","minutes":"31","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8675","block":"34_10_100","tripTag":"45517785"},{"epochTime":"1676944282410","seconds":"2514","minutes":"41","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8651","block":"34_14_140","tripTag":"45517784"},{"epochTime":"1676944822410","seconds":"3054","minutes":"50","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8699","block":"34_54_20","tripTag":"45517783"}]}]}]},{"stop":{"stopId":2305,"stopName":"Eglinton Ave East at Redpath Ave","lat":43.707987,"lon":"-79.392646","dist":182.02770827323232},"predictions":[{"agencyTitle":"Toronto Transit Commission","routeTitle":"51-Leslie","routeTag":"51","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"4697","direction":{"title":"South - 51 Leslie towards Eglinton Station","prediction":[{"epochTime":"1676942708489","seconds":"940","minutes":"15","isDeparture":"false","branch":"51","dirTag":"51_0_51","vehicle":"3120","block":"51_3_30","tripTag":"45523827"},{"epochTime":"1676944860324","seconds":"3092","minutes":"51","isDeparture":"false","affectedByLayover":"true","branch":"51","dirTag":"51_0_51","vehicle":"3210","block":"51_4_40","tripTag":"45523826"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"34-Eglinton East","routeTag":"34","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"4697","direction":{"title":"West - 34 Eglinton East towards Eglinton Station","prediction":[{"epochTime":"1676941910983","seconds":"143","minutes":"2","isDeparture":"false","branch":"34","dirTag":"34_1_34A","vehicle":"8693","block":"34_1_10","tripTag":"45517909"},{"epochTime":"1676941984049","seconds":"216","minutes":"3","isDeparture":"false","branch":"34","dirTag":"34_1_34A","vehicle":"8675","block":"34_10_100","tripTag":"45517908"},{"epochTime":"1676942130484","seconds":"362","minutes":"6","isDeparture":"false","branch":"34","dirTag":"34_1_34C","vehicle":"8640","block":"34_84_80","tripTag":"45517900"},{"epochTime":"1676942598258","seconds":"830","minutes":"13","isDeparture":"false","branch":"34","dirTag":"34_1_34A","vehicle":"8651","block":"34_14_140","tripTag":"45517907"},{"epochTime":"1676943232997","seconds":"1465","minutes":"24","isDeparture":"false","affectedByLayover":"true","branch":"34","dirTag":"34_1_34C","vehicle":"8711","block":"34_4_40","tripTag":"45517899"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"54-Lawrence East","routeTag":"54","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"4697","direction":{"title":"West - 54 Lawrence East towards Eglinton Station","prediction":[{"epochTime":"1676942047509","seconds":"279","minutes":"4","isDeparture":"false","branch":"54","dirTag":"54_1_54Bpm","vehicle":"8778","block":"54_5_50","tripTag":"45525906"},{"epochTime":"1676942202024","seconds":"434","minutes":"7","isDeparture":"false","branch":"54","dirTag":"54_1_54A","vehicle":"8863","block":"54_9_90","tripTag":"45525849"},{"epochTime":"1676942901738","seconds":"1134","minutes":"18","isDeparture":"false","branch":"54","dirTag":"54_1_54A","vehicle":"8701","block":"54_2_20","tripTag":"45525848"},{"epochTime":"1676943169934","seconds":"1402","minutes":"23","isDeparture":"false","branch":"54","dirTag":"54_1_RH54","vehicle":"8662","block":"54_14_140","tripTag":"45525847"},{"epochTime":"1676943252234","seconds":"1484","minutes":"24","isDeparture":"false","branch":"54","dirTag":"54_1_54Bpm","vehicle":"8658","block":"54_10_100","tripTag":"45525905"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"334-Eglinton East Night Bus","routeTag":"334","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"4697","dirTitleBecauseNoPredictions":"West - 334 Eglinton East towards Eglinton Station"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"354-Lawrence East Night Bus","routeTag":"354","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"4697","dirTitleBecauseNoPredictions":"West - 354 Lawrence East towards Eglinton Station"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"56-Leaside","routeTag":"56","stopTitle":"Eglinton Ave East At Redpath Ave","stopTag":"4697","direction":{"title":"North - 56a Leaside towards Eglinton Station","prediction":[{"epochTime":"1676942539889","seconds":"772","minutes":"12","isDeparture":"false","branch":"56A","dirTag":"56_1_56A","vehicle":"8700","block":"56_2_20","tripTag":"45526080"},{"epochTime":"1676944275712","seconds":"2508","minutes":"41","isDeparture":"false","affectedByLayover":"true","branch":"56A","dirTag":"56_1_56A","vehicle":"8750","block":"56_1_10","tripTag":"45526079"}]}}]},{"stop":{"stopId":16332,"stopName":"Eglinton Ave East at Mount Pleasant Rd","lat":43.708284,"lon":"-79.390426","dist":334.0214753092109},"predictions":[{"agencyTitle":"Toronto Transit Commission","routeTitle":"56-Leaside","routeTag":"56","stopTitle":"Eglinton Ave East At Mount Pleasant Rd","stopTag":"24572","direction":{"title":"South - 56 Leaside towards Donlands Station","prediction":[{"epochTime":"1676941841620","seconds":"73","minutes":"1","isDeparture":"false","branch":"56","dirTag":"56_0_56A","vehicle":"8750","block":"56_1_10","tripTag":"45526017"},{"epochTime":"1676943076212","seconds":"1308","minutes":"21","isDeparture":"false","affectedByLayover":"true","branch":"56","dirTag":"56_0_56A","vehicle":"8700","block":"56_2_20","tripTag":"45526016"},{"epochTime":"1676944812035","seconds":"3044","minutes":"50","isDeparture":"false","affectedByLayover":"true","branch":"56","dirTag":"56_0_56A","vehicle":"8750","block":"56_1_10","tripTag":"45526015"}]}},{"agencyTitle":"Toronto Transit Commission","routeTitle":"34-Eglinton East","routeTag":"34","stopTitle":"Eglinton Ave East At Mount Pleasant Rd","stopTag":"24572","direction":[{"title":"East - 34c Eglinton East towards Flemingdon Park (Grenoble & Spanbridge)","prediction":[{"epochTime":"1676942038985","seconds":"271","minutes":"4","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8748","block":"34_5_50","tripTag":"45517777"},{"epochTime":"1676943041156","seconds":"1273","minutes":"21","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8640","block":"34_84_80","tripTag":"45517776"},{"epochTime":"1676944121156","seconds":"2353","minutes":"39","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8711","block":"34_4_40","tripTag":"45517884"},{"epochTime":"1676945141156","seconds":"3373","minutes":"56","isDeparture":"false","affectedByLayover":"true","branch":"34C","dirTag":"34_0_34C","vehicle":"8781","block":"34_87_60","tripTag":"45517883"}]},{"title":"East - 34a Eglinton East towards Kennedy Station","prediction":[{"epochTime":"1676941854634","seconds":"86","minutes":"1","isDeparture":"false","branch":"34A","dirTag":"34_0_34A","vehicle":"8702","block":"34_3_30","tripTag":"45517788"},{"epochTime":"1676943299207","seconds":"1531","minutes":"25","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8693","block":"34_1_10","tripTag":"45517787"},{"epochTime":"1676943797408","seconds":"2029","minutes":"33","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8675","block":"34_10_100","tripTag":"45517785"},{"epochTime":"1676944397408","seconds":"2629","minutes":"43","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8651","block":"34_14_140","tripTag":"45517784"},{"epochTime":"1676944937408","seconds":"3169","minutes":"52","isDeparture":"false","affectedByLayover":"true","branch":"34A","dirTag":"34_0_34A","vehicle":"8699","block":"34_54_20","tripTag":"45517783"}]}]},{"agencyTitle":"Toronto Transit Commission","routeTitle":"54-Lawrence East","routeTag":"54","stopTitle":"Eglinton Ave East At Mount Pleasant Rd","stopTag":"24572","direction":[{"title":"East - 54b Lawrence East towards Orton Park","prediction":[{"epochTime":"1676941774644","seconds":"6","minutes":"0","isDeparture":"false","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8867","block":"54_8_80","tripTag":"45525714"},{"epochTime":"1676942875167","seconds":"1107","minutes":"18","isDeparture":"false","affectedByLayover":"true","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8778","block":"54_5_50","tripTag":"45525713"},{"epochTime":"1676944075167","seconds":"2307","minutes":"38","isDeparture":"false","affectedByLayover":"true","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8658","block":"54_10_100","tripTag":"45525712"},{"epochTime":"1676945275167","seconds":"3507","minutes":"58","isDeparture":"false","affectedByLayover":"true","branch":"54B","dirTag":"54_0_54Bpm","vehicle":"8704","block":"54_15_150","tripTag":"45525711"}]},{"title":"East - 54a Lawrence East towards Starspray","prediction":[{"epochTime":"1676942280326","seconds":"512","minutes":"8","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8785","block":"54_3_30","tripTag":"45525698"},{"epochTime":"1676942997908","seconds":"1230","minutes":"20","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8863","block":"54_9_90","tripTag":"45525697"},{"epochTime":"1676943834848","seconds":"2067","minutes":"34","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8701","block":"54_2_20","tripTag":"45525696"},{"epochTime":"1676945034848","seconds":"3267","minutes":"54","isDeparture":"false","affectedByLayover":"true","branch":"54A","dirTag":"54_0_54A","vehicle":"8662","block":"54_14_140","tripTag":"45525695"}]}]},{"agencyTitle":"Toronto Transit Commission","routeTitle":"354-Lawrence East Night Bus","routeTag":"354","stopTitle":"Eglinton Ave East At Mount Pleasant Rd","stopTag":"24572","dirTitleBecauseNoPredictions":"East - 354 Lawrence East towards Starspray Blvd"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"334-Eglinton East Night Bus","routeTag":"334","stopTitle":"Eglinton Ave East At Mount Pleasant Rd","stopTag":"24572","dirTitleBecauseNoPredictions":"East - 334 Eglinton East towards Finch and Neilson via Kingston Rd and Morningside"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"51-Leslie","routeTag":"51","stopTitle":"Eglinton Ave East At Mount Pleasant Rd","stopTag":"24572","direction":{"title":"North - 51 Leslie towards Steeles","prediction":[{"epochTime":"1676942367177","seconds":"599","minutes":"9","isDeparture":"false","affectedByLayover":"true","branch":"51","dirTag":"51_1_51","vehicle":"3241","block":"51_2_20","tripTag":"45523848"},{"epochTime":"1676944167177","seconds":"2399","minutes":"39","isDeparture":"false","affectedByLayover":"true","branch":"51","dirTag":"51_1_51","vehicle":"3120","block":"51_3_30","tripTag":"45523847"}]}}]},{"stop":{"stopId":15708,"stopName":"Opposite 2190 Yonge St","lat":43.705297,"lon":"-79.397908","dist":355.3285661810521},"predictions":[{"agencyTitle":"Toronto Transit Commission","routeTitle":"320-Yonge Night Bus","routeTag":"320","stopTitle":"Opposite 2190 Yonge St","stopTag":"24066","dirTitleBecauseNoPredictions":"North - 320 Yonge towards Steeles via Finch Station"},{"agencyTitle":"Toronto Transit Commission","routeTitle":"97-Yonge","routeTag":"97","stopTitle":"Opposite 2190 Yonge St","stopTag":"24066","direction":[{"title":"North - 97f Yonge towards Steeles via Yonge Blvd","prediction":[{"epochTime":"1676942201188","seconds":"433","minutes":"7","isDeparture":"false","affectedByLayover":"true","branch":"97F","dirTag":"97_1_97F","vehicle":"8323","block":"97_3_30","tripTag":"45535102"},{"epochTime":"1676945801188","seconds":"4033","minutes":"67","isDeparture":"false","affectedByLayover":"true","branch":"97F","dirTag":"97_1_97F","vehicle":"8353","block":"97_2_20","tripTag":"45535100"}]},{"title":"North - 97d Yonge towards Steeles","prediction":{"epochTime":"1676944026278","seconds":"2258","minutes":"37","isDeparture":"false","affectedByLayover":"true","branch":"97D","dirTag":"97_1_97D","vehicle":"8184","block":"97_1_10","tripTag":"45535101"}}]}]}]');

        let stops = await this.getNearestStops(coords);

        // We need to get two stations - northbound and southbound / eastbound and westbound
        // TODO: How to deal with bloor-yonge or other interchange stations?
        let gotStations = 0;
        let stopsToConsider = [];
        for (let i = 0; i < n; i++) {
            if (stops.length < i)
                break;

            if (this.isStation(stops[i].stopName)) {
                gotStations++;
            }
            stopsToConsider.push(stops[i]);
        }

        // We need to consider at least one station
        if (!gotStations < 2) {
            for (let stopIndex in stops) {
                if (this.isStation(stops[stopIndex].stopName)) {
                    gotStations++;
                    stopsToConsider.push(stops[stopIndex]);

                    if (gotStations >= 2) {
                        break;
                    }
                }
            }
        }

        // Always put stations on top
        stopsToConsider.sort(elem => this.isStation(elem.stopName) ? -1 : 0)

        let stopsToReturn = [];
        let promises = [];
        for (let idx in stopsToConsider) {
            let stopToConsider = stopsToConsider[idx];
            promises.push(this.getPredictionsForStopByStopId(stopToConsider.stopId, this.isStation(stopToConsider.stopName)));
        }

        let promiseResults = await Promise.all(promises);
        for (let idx in stopsToConsider) {
            let stopToConsider = stopsToConsider[idx];
            let thisStopPredictions = promiseResults[idx];
            stopsToReturn.push({
                stop: stopToConsider,
                predictions: thisStopPredictions.body?.predictions
            });

        }

        return stopsToReturn;
    },

    async consolidateData(coords) {
        let stops = await this.getPredictionsForTopNStops(coords, FETCH_N_STOPS);

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
                    let routeNo = "?";
                    let isSubway = false;
                    let subwayLine = 0;
                    let isNight = false;
                    let isExpress = false;
                    let towards = "Unknown";
                    let predictions = Array.isArray(direction['prediction']) ? direction['prediction'] : [direction['prediction']];

                    let predictionMinutes = [];

                    for (let predictionIdx in predictions) {
                        predictionMinutes.push(predictions[predictionIdx]['minutes']);
                    }

                    predictionMinutes = predictionMinutes.map(val => parseInt(val));

                    let firstPrediction;

                    if (predictionMinutes.length > 0) {
                        firstPrediction = predictionMinutes.shift();
                    }

                    let directionName = 'Unknown';
                    let directionsMap = [
                        {startsWith: 'East', directionName: 'Eastbound'},
                        {startsWith: 'West', directionName: 'Westbound'},
                        {startsWith: 'North', directionName: 'Northbound'},
                        {startsWith: 'South', directionName: 'Southbound'},
                    ];

                    for (let directionsMapIndex in directionsMap) {
                        let directionMap = directionsMap[directionsMapIndex];
                        if (name.startsWith(directionMap.startsWith)) {
                            directionName = directionMap.directionName;

                            // Name needs to be truncated for (startsWith.length)+3 characters because it's always like
                            // "East - NN towards..."
                            name = name.substring(directionMap.startsWith.length + 3);

                            // Now we need the route number. We can get this from routeTag but the problem is that
                            // the routeTag does not include the branch letter
                            let routeNoIndex = name.indexOf(" ");
                            if (routeNoIndex !== -1) {
                                routeNo = name.substring(0, routeNoIndex).toUpperCase();

                                let routeNoInt = parseInt(routeNo);
                                if (routeNoInt < 7) {
                                    isSubway = true;
                                    subwayLine = routeNoInt;
                                }
                                if (routeNoInt >= 300 && routeNoInt < 400) {
                                    isNight = true;
                                } else if (routeNoInt >= 900 && routeNoInt < 1000) {
                                    isExpress = true;
                                }
                                name = name.substring(routeNoIndex + 1);
                            }

                            // Now we find the "towards" portion and break it off
                            let towardsIndex = name.indexOf("towards");
                            if (towardsIndex !== -1) {
                                towards = name.substring(towardsIndex + 8);
                                name = name.substring(0, towardsIndex - 1);
                            }
                            break;
                        }
                    }
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
                        routeNo,
                        subwayLine,
                        isSubway,
                        isNight,
                        isExpress,
                        towards,
                        firstPrediction,
                        predictionMinutes
                    };

                    thisStopOutput.routes.push(thisRouteOutput);
                }
            }

            output.push(thisStopOutput);
        }

        let consolidatedOutput = {"NorthboundEastbound": [], "SouthboundWestbound": [], "Unknown": []};

        for (let stopIdx in output) {
            let stop = output[stopIdx];

            let stopName = stop.stopName;
            for (let routeIdx = 0; routeIdx < stop.routes.length; routeIdx++) {
                let route = stop.routes[routeIdx];
                let consolidatedDirectionName =
                    (route.directionName === "Northbound" || route.directionName === "Eastbound") ? "NorthboundEastbound"
                        : (route.directionName === "Southbound" || route.directionName === "Westbound") ? "SouthboundWestbound"
                            : "Unknown";

                let directionOutput = consolidatedOutput[consolidatedDirectionName];
                let existingIndex = directionOutput.findIndex(stop => stop.stopName === stopName);

                if (existingIndex === -1) {
                    consolidatedOutput[consolidatedDirectionName].push({
                        stopName,
                        routes: [route]
                    })
                } else {
                    consolidatedOutput[consolidatedDirectionName][existingIndex].routes.push(route);

                    // First we sort by A, B, C then we sort by numbers
                    consolidatedOutput[consolidatedDirectionName][existingIndex].routes.sort((a, b) => a.routeNo.localeCompare(b.routeNo));
                    consolidatedOutput[consolidatedDirectionName][existingIndex].routes.sort((a, b) => parseInt(a.routeNo) - parseInt(b.routeNo));
                }
            }
        }

        return consolidatedOutput;
    },


    // Eglinton and Dunfield: {lat: 43.707321, lon: -79.395445}
    // Queen and Bay: {lat: 43.651838, lon: -79.381618}
    // (function c2a(lat, lon) { return {lat, lon} })(43.638015, -79.537103)
    //getPredictionsForTopNStops({lat: 43.707321, lon: -79.395445}, 6).then(str => console.log(str));
    async getData() {
        try {
            let pos = await GeolocationHelper.getCurrentPosition();
            let data = await this.consolidateData({lat: pos.coords.latitude, lon: pos.coords.longitude});

            console.log('data', data);
            return ['success', data];
        } catch (err) {
            console.error('error', err);
            return ['error', err];
        }
    }
};

export default TransitHelper;