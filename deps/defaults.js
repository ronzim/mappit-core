let scl = [
  [0, "rgb(150,0,90)"],
  [12.5, "rgb(0, 0, 200)"],
  [25, "rgb(0, 25, 255)"],
  [37.5, "rgb(0, 152, 255)"],
  [50, "rgb(44, 255, 150)"],
  [62.5, "rgb(151, 255, 0)"],
  [75, "rgb(255, 234, 0)"],
  [87.5, "rgb(255, 111, 0)"],
  [100, "rgb(255, 0, 0)"]
];

let map = {
  IN_VEHICLE: "red",
  STILL: "yellow",
  IN_RAIL_VEHICLE: "green",
  IN_ROAD_VEHICLE: "red",
  IN_CAR: "red",
  ON_FOOT: "pink",
  WALKING: "green",
  ON_BYCICLE: "lightblue",
  UNKNOWN: "gray",
  TILTING: "gray" // ??
};

let margin = {
  r: 0,
  t: 0,
  b: 0,
  l: 0,
  pad: 0
};

let viridis_mod = [
  [0, "rgb(150,0,90)"],
  [0.033, "rgb(69,2,86)"],
  [0.066, "rgb(59,28,140)"],
  [0.1, "rgb(33,144,141)"],
  [1, "rgb(249,231,33)"]
];

exports.scl = scl;
exports.viridis_mod = viridis_mod;
exports.map = map;
exports.margin = margin;
