const { mean } = require("./utils.js");
const { viridis_mod } = require("./defaults.js");

function prepareData(timeSpanData, type) {
  console.log("preparing plot... size: ", timeSpanData.length);
  
  if (!Array.isArray(timeSpanData) || timeSpanData.length === 0) {
    throw new Error("No valid location data to plot: timeSpanData must be a non-empty array");
  }
  
  console.time("preparing plot");
  let plot;
  switch (type) {
    case "byvelocity":
      plot = plotByVelocity(timeSpanData);
      break;
    case "heatmap":
      plot = plotHeatmap(timeSpanData);
      break;
    default:
      plot = scatterRaw(timeSpanData);
  }
  console.timeEnd("preparing plot");

  return plot;
}

function plotByVelocity(sourceData) {
  sourceData = sourceData.map(loc => {
    loc.velocity = loc.velocity ? loc.velocity : -1;
    return loc;
  });

  let scl = [
    [0, "rgb(255,0,0)"],
    [25, "rgb(0, 0, 255)"],
    [50, "rgb(0, 255, 0)"]
  ];

  const velocities = sourceData.map(loc => loc.velocity);

  var trace = {
    type: "scattermapbox",
    lat: sourceData.map(loc => loc.latitudeE7 / 1e7),
    lon: sourceData.map(loc => loc.longitudeE7 / 1e7),
    mode: "markers",
    marker: {
      size: 5,
      color: velocities,
      colorscale: scl,
      showscale: true
    },
    text: []
  };

  var data = [trace];

  var layout = {
    autosize: true,
    height: 2000,
    width: 1200,
    hovermode: "closest",
    mapbox: {
      bearing: 0,
      center: {
        lat: mean(sourceData.map(loc => loc.latitudeE7 / 1e7)),
        lon: mean(sourceData.map(loc => loc.longitudeE7 / 1e7))
      },
      pitch: 0,
      zoom: 9,
      style: "dark"
    },
    margin: {
      r: 0,
      t: 0,
      b: 0,
      l: 0,
      pad: 0
    },
    coloraxis: {
      showscale: true
    }
  };

  return { data: data, layout: layout };
}

function scatterRaw(sourceData) {
  var trace = {
    type: "scattermapbox",
    lat: sourceData.map(loc => loc.latitudeE7 / 1e7),
    lon: sourceData.map(loc => loc.longitudeE7 / 1e7),
    mode: "markers",
    marker: {
      size: 5
    }
  };

  var data = [trace];

  var layout = {
    autosize: true,
    height: 2000,
    width: 1200,
    hovermode: "closest",
    mapbox: {
      bearing: 0,
      center: {
        lat: mean(sourceData.map(loc => loc.latitudeE7 / 1e7)),
        lon: mean(sourceData.map(loc => loc.longitudeE7 / 1e7))
      },
      pitch: 0,
      zoom: 9,
      style: "satellite-streets"
    },
    margin: {
      r: 0,
      t: 0,
      b: 0,
      l: 0,
      pad: 0
    }
  };

  return { data: data, layout: layout };
}

function plotHeatmap(sourceData) {
  var data = [
    {
      lon: sourceData.map(loc => loc.longitudeE7 / 1e7),
      lat: sourceData.map(loc => loc.latitudeE7 / 1e7),
      radius: 10,
      opacity: 0.7,
      z: sourceData.map(() => 1), // Simplified, original was complex
      type: "densitymapbox",
      colorscale: viridis_mod,
      zsmooth: "best",
      hoverinfo: "skip"
    }
  ];

  var layout = {
    mapbox: { center: { lon: 10, lat: 50 }, style: "outdoors", zoom: 4 },
    title: { text: "gmaps positions" },
    width: 1200,
    height: 800,
    margin: {
      r: 0,
      t: 0,
      b: 0,
      l: 0,
      pad: 0
    }
  };

  return {
    data: data,
    layout: layout,
    config: { responsive: true }
  };
}

exports.prepareData = prepareData;
