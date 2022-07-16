// FILTERS
// - BTW DATES
// - AVOID NAN

const _ = require("underscore");

// start - end as 'dd-mm-yyyy'
function byDate_legacy(data, start, end) {
  let timeSpanData = _.filter(data.locations, loc => {
    return loc.timestampMs > new Date(start) && loc.timestampMs < new Date(end);
  });
  return timeSpanData;
}

// start - end as 'yyyy-mm-dd'
function byDate(data, start, end) {
  let timeSpanData = _.filter(data.locations, loc => {
    return (
      new Date(loc.timestamp) > new Date(start) &&
      new Date(loc.timestamp) < new Date(end)
    );
  });
  return timeSpanData;
}

function sanityCheck(data, property) {
  let sanitized = _.filter(data, loc => {
    return loc[property];
  });
  return sanitized;
}

exports.byDate = byDate;
exports.sanityCheck = sanityCheck;
