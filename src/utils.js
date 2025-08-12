function degToRad(degrees) {
  var pi = Math.PI;
  return degrees * (pi / 180);
}

function distance(p1, p2) {
  let lat1 = p1.latitudeE7 / 1e7;
  let lon1 = p1.longitudeE7 / 1e7;
  let lat2 = p2.latitudeE7 / 1e7;
  let lon2 = p2.longitudeE7 / 1e7;

  var R = 6371e3; // metres
  var φ1 = degToRad(lat1);
  var φ2 = degToRad(lat2);
  var Δφ = degToRad(lat2 - lat1);
  var Δλ = degToRad(lon2 - lon1);

  var a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  var d = R * c;
  return d;
}

function normalize(array) {
  let ratio = Math.max.apply(Math, array) / 100;
  let l = array.length;

  for (let i = 0; i < l; i++) {
    array[i] = Math.round(array[i] / ratio);
  }
  return array;
}

function countBros(d1, n, arr) {
  const counts = arr.reduce(
    (acc, d2) => {
      const category = distance(d1, d2) < 1000 ? "near" : "far";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    { near: 0, far: 0 }
  );
  return counts.near;
}

function mean(array) {
  const sum = array.reduce((a, b) => a + b, 0);
  return sum / array.length;
}

exports.degToRad = degToRad;
exports.distance = distance;
exports.normalize = normalize;
exports.countBros = countBros;
exports.mean = mean;
