const fs = require("fs-extra");
const bigJson = require("big-json");

function loadData(filepath) {
  console.time("parser");

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filepath);
    const parseStream = bigJson.createParseStream();

    parseStream.on("data", function (pojo) {
      console.timeEnd("parser");
      printFileStats(pojo);
      resolve(pojo);
    });

    parseStream.on("error", reject);

    readStream.pipe(parseStream);
  });
}

function printFileStats(data) {
  console.time("printFileStats");

  console.log("Number of locations:");
  console.log(data.locations.length);
  
  if (data.locations.length > 0) {
    console.log("Location keys:");
    console.log(Object.keys(data.locations[0]));

    const timestamps = data.locations.map(loc => loc.timestamp);
    console.log("First date:", timestamps[timestamps.length - 1]);
    console.log(new Date(timestamps[timestamps.length - 1]));
    console.log("Last date:", timestamps[0]);
    console.log(new Date(timestamps[0]));
  }
  
  console.timeEnd("printFileStats");
}

function filterData(data, dateRange) {
  if (!data || !data.locations) {
    throw new Error("Invalid data format: missing locations array");
  }

  if (!dateRange) {
    return data.locations;
  }

  if (!Array.isArray(dateRange) || dateRange.length !== 2) {
    throw new Error("Invalid dateRange: must be an array with start and end dates");
  }

  console.log("DATE from", dateRange[0], "to", dateRange[1]);
  const [start, end] = dateRange.map(d => new Date(d));

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date format in dateRange");
  }

  const timeSpanData = data.locations.filter(loc => {
    const locDate = new Date(loc.timestamp);
    return locDate > start && locDate < end;
  });

  console.log("...", timeSpanData.length);
  return timeSpanData;
}

function simplifyData(locations) {
  if (!Array.isArray(locations)) {
    throw new Error("Invalid input: locations must be an array");
  }

  return locations.map(location => {
    const simplified = {
      timestamp: location.timestamp,
      latitudeE7: location.latitudeE7,
      longitudeE7: location.longitudeE7,
      velocity: location.velocity || null,
      heading: location.heading || null,
      activity: location.activity ? location.activity[0].activity.map(act => act.type) : null
    };
    return simplified;
  });
}

exports.loadData = loadData;
exports.filterData = filterData;
exports.simplifyData = simplifyData;
