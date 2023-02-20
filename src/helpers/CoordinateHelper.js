// from here: https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
const CoordinateHelper = {
    calcCrow(coords1, coords2) {
        let toRad = this.toRad;
        let R = 6371000;
        let dLat = toRad(coords2.lat - coords1.lat);
        let dLon = toRad(coords2.lon - coords1.lon);
        let lat1 = toRad(coords1.lat);
        let lat2 = toRad(coords2.lat);

        let a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c;
        return d;
    },

    toRad(Value) {
        return (Value * Math.PI) / 180;
    }
};

export default CoordinateHelper;