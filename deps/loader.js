// LOAD DATA
// SINGLE FILE
// STREAM
// JSON
// CSV

const fs = require("fs-extra");
var _ = require("underscore");
const path = require("path");

function load(filepath) {
  let data;
  switch (path.extname(filepath)) {
    case ".json":
      data = loadJSONFile(filepath);
      break;
    case ".csv":
      console.warn("CSV are not supported yet");
    default:
      console.warn("FILE EXTENSION NOT SUPPORTED");
  }
  return data;
}

function loadJSONFile(filepath) {
  console.time("read file");
  var data = fs.readJSONSync(filepath);
  console.timeEnd("read file");
  printFileStats(data);
  return data;
}

function printFileStats(data) {
  console.time("printFileStats");

  console.log("Number of locations:");
  console.log(_.size(data.locations)); // 972833
  console.log("Location keys:");
  console.log(_.keys(data.locations[1]));

  var tss = _.pluck(data.locations, "timestampMs");
  console.log("First date:");
  console.log(new Date(parseInt(tss.slice().pop())));
  console.log("Last date:");
  console.log(new Date(parseInt(tss.slice().shift())));
  console.timeEnd("printFileStats");
}

exports.load = load;
