// LOAD DATA
// SINGLE FILE
// STREAM
// JSON
// CSV

const fs = require("fs-extra");
var _ = require("underscore");
const path = require("path");
const bigJson = require("big-json");

function load(filepath) {
  let data;
  switch (path.extname(filepath)) {
    case ".json":
      // data = loadJSONFile(filepath);
      data = loadBigJsonFile(filepath); // data is a promise
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

function loadBigJsonFile(filepath) {
  console.time("parser");

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filepath);

    const parseStream = bigJson.createParseStream();

    parseStream.on("data", function (pojo) {
      // => receive reconstructed POJO
      //   console.log(pojo);
      console.timeEnd("parser");
      printFileStats(pojo);

      resolve(pojo);
    });

    parseStream.on("error", reject);

    readStream.pipe(parseStream);
  });
}

function printFileStats_legacy(data) {
  console.time("printFileStats");

  console.log("Number of locations:");
  console.log(_.size(data.locations)); // 972833
  console.log("Location keys:");
  console.log(_.keys(data.locations[1]));

  var tss = _.pluck(data.locations, "timestampMs");
  console.log("First date:", tss.slice().pop());
  console.log(new Date(parseInt(tss.slice().pop())));
  console.log("Last date:", tss.slice().shift());
  console.log(new Date(parseInt(tss.slice().shift())));
  console.timeEnd("printFileStats");
}

function printFileStats(data) {
  console.time("printFileStats");

  console.log("Number of locations:");
  console.log(_.size(data.locations)); // 972833
  console.log("Location keys:");
  console.log(_.keys(data.locations[1]));

  var tss = _.pluck(data.locations, "timestamp");
  console.log("tss", tss);
  console.log("First date:", tss.slice().pop());
  console.log(new Date(tss.slice().pop()));
  console.log("Last date:", tss.slice().shift());
  console.log(new Date(tss.slice().shift()));
  console.timeEnd("printFileStats");
}

exports.load = load;
