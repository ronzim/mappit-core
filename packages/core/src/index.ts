/**
 * mappit-core
 * Core library for loading and processing Google Location History data.
 */

export const VERSION = '0.1.0';

// Phase 1.1 — Geographic & math utilities
export {
  type LatLng,
  degToRad,
  distance,
  countNearbyPoints,
  normalize,
  mean,
  e7ToDecimal,
  parseGeoUri,
  parseDegreeString,
} from './geo';

// Phase 1.2 — Constants
export {
  COLORSCALE,
  VIRIDIS_MOD,
  ACTIVITY_COLOR_MAP,
  MARGIN,
} from './constants';

// Phase 1.3 — Unified data model
export type {
  LocationPoint,
  PlaceVisit,
  ActivitySegment,
  TimelineEntry,
  DataSource,
  MappitDataset,
} from './types';

// Phase 1.4 — Activity grouping
export {
  activityGroupMapping,
  getGroupedActivityType,
} from './activity-mapping';

// Phase 1.5–1.10 — Loaders
export {
  parseRecords,
  parseTimelineStandard,
  parseTimelineSemantic,
  parseTimelineIos,
  parseTakeoutMonthly,
  detectFormat,
  parseAuto,
  type DetectedFormat,
} from './loaders';
