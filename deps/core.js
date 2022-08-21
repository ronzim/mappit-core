var utils = require("./utils.js");
var filters = require("./filters.js");
var _ = require("underscore");

const { scl, viridis_mod, map, margin } = require("./defaults.js");

// STYLES
// carto-darkmatter, carto-positron, open-street-map, stamen-terrain,
// stamen-toner, stamen-watercolor, white-bg
// The built-in Mapbox styles are: basic, streets, outdoors,
// light, dark, satellite, satellite-streets
// style: "mapbox://styles/ronzim/cl26kqq3l000315pj3jsra2o7",

// HIGH LEVEL FUNCTIONS

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

  function mapToColor(type) {
    // let map = {
    //   IN_VEHICLE: "red",
    //   STILL: "yellow",
    //   IN_RAIL_VEHICLE: "green",
    //   IN_ROAD_VEHICLE: "red",
    //   IN_CAR: "red",
    //   ON_FOOT: "pink",
    //   WALKING: "green",
    //   ON_BYCICLE: "lightblue",
    //   UNKNOWN: "gray",
    //   TILTING: "gray" // ??
    // };
    return type ? type : 0;
  }

  let altitudes = _.pluck(sourceData, "altitude");

  let velocities = _.pluck(sourceData, "velocity");

  // let colors = _.map(altitudes, mapToColor);
  let colors = _.map(velocities, mapToColor);

  var trace = {
    type: "scattermapbox",
    lat: _.pluck(sourceData, "latitudeE7").map(a => a / 1e7),
    lon: _.pluck(sourceData, "longitudeE7").map(a => a / 1e7),
    mode: "markers",
    marker: {
      size: 5,
      color: colors,
      colorscale: scl,
      showscale: true
    },
    text: []
  };

  var data = [trace];

  var layout = {
    autosize: true,
    heigth: 2000,
    width: 1200,
    hovermode: "closest",
    mapbox: {
      bearing: 0,
      center: {
        lat: utils.mean(_.pluck(sourceData, "latitudeE7").map(a => a / 1e7)),
        lon: utils.mean(_.pluck(sourceData, "longitudeE7").map(a => a / 1e7))
      },
      // domain: {
      //   x: [0, 1],
      //   y: [0, 1]
      // },
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
    lat: _.pluck(sourceData, "latitudeE7").map(a => a / 1e7),
    lon: _.pluck(sourceData, "longitudeE7").map(a => a / 1e7),
    mode: "markers",
    marker: {
      size: 5
    }
  };

  var data = [trace];

  var layout = {
    autosize: true,
    heigth: 2000,
    width: 1200,
    hovermode: "closest",
    mapbox: {
      bearing: 0,
      center: {
        lat: utils.mean(_.pluck(sourceData, "latitudeE7").map(a => a / 1e7)),
        lon: utils.mean(_.pluck(sourceData, "longitudeE7").map(a => a / 1e7))
      },
      // domain: {
      //   x: [0, 1],
      //   y: [0, 1]
      // },
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
      lon: _.pluck(sourceData, "longitudeE7").map(a => a / 1e7),
      lat: _.pluck(sourceData, "latitudeE7").map(a => a / 1e7),
      radius: 10,
      opacity: 0.7,
      z: _.map(sourceData, utils.countBros),
      // z: _.map(sourceData, d => 1),
      // z: utils.normalize(_.map(sourceData, utils.countBros)), // kill performances: use clustering!
      type: "densitymapbox",
      // coloraxis: "coloraxis", // setting this to use layout.coloraxis
      colorscale: viridis_mod,
      zsmooth: "best",
      // zmax: 250,
      // zmin: 0,
      hoverinfo: "skip"
    }
  ];

  var layout = {
    mapbox: { center: { lon: 10, lat: 50 }, style: "outdoors", zoom: 4 },
    // coloraxis: { colorscale: "Viridis" },
    // coloraxis: { colorscale: viridis_mod },
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

exports.plotByVelocity = plotByVelocity;
exports.plotHeatmap = plotHeatmap;
exports.scatterRaw = scatterRaw;

// PLOTLY opts
// {staticPlot: true} -> remove all uis
// {displayModeBar: true}
// {modeBarButtonsToRemove: ['toImage']}
// modeBarButtonsToAdd: [
//   {
//     name: 'color toggler',
//     icon: icon1,
//     click: function(gd) {
//       var newColor = colors[Math.floor(3 * Math.random())]
//       Plotly.restyle(gd, 'line.color', newColor)
//     }},
//   {
//     name: 'button1',
//     icon: Plotly.Icons.pencil,
//     direction: 'up',
//     click: function(gd) {alert('button1')
//   }}],
// {displaylogo: false}
// {responsive: true}
