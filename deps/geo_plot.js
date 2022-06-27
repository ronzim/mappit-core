// COMMAND LINE TOOL FOR ANALYZE and VISUALIZE GOOGLE LOCATION DATA
//
// API study:
//
// let geoplot(data)
//     .filter('timespan', date1, date2)  -> filter by date
//     .filter('bbox', center, radius)    -> filter by space
//     .purge('property')                 -> purge data without this property
//     .type('scatter', {opts})           -> set plot type
//     .variable('property)               -> set variable to bind color with
//     .plot({options})                   -> run plot rendering

var _ = require("underscore");
var stat = require("simple-statistics");

var filters = require("./filters.js");
var core = require("./core.js");

// {
//   timestampMs: '23456789',
//   latitudeE7: 3456789,
//   longitudeE7: 3456789,
//   accuracy: 12
// }
// console.log(new Date(parseInt(data.locations[1].timestampMs)))

let applyFilters = function (data, filterType, filtersOpts) {
  console.log("applying filters...");
  console.time("applying filters");
  let filtered;
  switch (filterType) {
    case "date":
      console.log("DATE from", filtersOpts[0], "to", filtersOpts[1]);
      filtered = filters.byDate(data, filtersOpts[0], filtersOpts[1]);
      break;
    case "space":
      // TODO
      break;
    default:
      console.log("MISSING FILTER TYPE");
  }
  console.timeEnd("applying filters");
  return filtered;
};

let prepareData = function (timeSpanData, type) {
  console.log("preparing plot... size: ", timeSpanData.length);
  console.time("preparing plot");
  let plot;
  switch (type) {
    case "byactivity":
      plot = core.plotByActivityType(timeSpanData);
      break;
    case "byvelocity":
      plot = core.plotByVelocity(timeSpanData);
      break;
    case "heatmap":
      plot = core.plotHeatmap(timeSpanData);
      break;
    default:
      console.warn("NO PLOT SELECTED");
  }
  console.timeEnd("preparing plot");

  return plot;
};

exports.applyFilters = applyFilters;
exports.prepareData = prepareData;

// Cronologia delle posizioni
// Dati sulla posizione raccolti durante l'adesione alla Cronologia delle posizioni.
// JSON
// Il file Cronologia delle posizioni JSON descrive i segnali relativi alla posizione del dispositivo e i metadati associati raccolti mentre Cronologia delle posizioni era attiva e che non hai successivamente eliminato.

// posizioni: tutti i record di posizione.
// timestampMs(int64): timestamp (UTC) in millisecondi per la posizione registrata.
// latitudeE7(int32): il valore di latitudine della posizione in formato E7 (gradi moltiplicati per 10**7 e arrotondati al numero intero più vicino).
// longitudeE7(int32): il valore di longitudine della posizione in formato E7 (gradi moltiplicati per 10**7 e arrotondati al numero intero più vicino).
// accuracy(int32): raggio approssimativo di precisione della posizione in metri.
// velocity(int32): velocità in metri al secondo.
// heading(int32): gradi a est della stella polare.
// altitude(int32): metri sopra l'ellissoide di riferimento WGS84.
// verticalAccuracy(int32): precisione verticale calcolata in metri.
// activity: informazioni sull'attività svolta nella posizione.
// timestampMs(int64): timestamp (UTC) in millisecondi per l'attività registrata.
// type: descrizione del tipo di attività.
// confidence(int32): affidabilità associata al tipo di attività specificato.
// KML
// Un file KML memorizza informazioni sulla modellazione geografica in formato XML che possono essere usate per mostrare dati geografici. Per ulteriori informazioni, consulta la documentazione su KML. Puoi caricare il file KML in Google Earth per visualizzare tutte le località che hai visitato.
// Cronologia delle posizioni semantica
// Cronologia delle posizioni semantica composta da segmenti relativi ad attività e visite a luoghi dedotte.
// JSON
// I file JSON della cronologia delle posizioni semantica descrivono gli oggetti della cronologia di Google, come segmenti relativi ad attività e visite a luoghi dedotte tra le visite ai luoghi.
