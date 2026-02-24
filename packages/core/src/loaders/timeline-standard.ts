/**
 * Loader for the **Timeline Standard** format (Google Takeout "Semantic
 * Location History").
 *
 * Input shape:
 * ```json
 * { "timelineObjects": [ { placeVisit?: {…}, activitySegment?: {…} }, … ] }
 * ```
 *
 * Produces a `MappitDataset` with `source: 'timeline-standard'` and
 * `timeline` populated.
 */

import type {
  MappitDataset,
  PlaceVisit,
  ActivitySegment,
  TimelineEntry,
} from '../types';
import { e7ToDecimal } from '../geo';
import { getGroupedActivityType } from '../activity-mapping';

// ---------------------------------------------------------------------------
// Raw JSON shapes
// ---------------------------------------------------------------------------

interface RawE7Location {
  latitudeE7?: number;
  longitudeE7?: number;
  placeId?: string;
  name?: string;
  address?: string;
  semanticType?: string;
}

interface RawDuration {
  startTimestamp?: string;
  endTimestamp?: string;
}

interface RawPathPoint {
  latE7?: number;
  lngE7?: number;
  timestampMs?: string;
}

interface RawPlaceVisit {
  location?: RawE7Location;
  duration?: RawDuration;
  editConfirmationStatus?: string;
}

interface RawActivitySegment {
  startLocation?: RawE7Location;
  endLocation?: RawE7Location;
  duration?: RawDuration;
  distance?: number;
  activityType?: string;
  simplifiedRawPath?: { points?: RawPathPoint[] };
}

interface RawTimelineObject {
  placeVisit?: RawPlaceVisit;
  activitySegment?: RawActivitySegment;
}

interface RawStandardFile {
  timelineObjects?: RawTimelineObject[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseVisit(pv: RawPlaceVisit): PlaceVisit | null {
  const loc = pv.location;
  if (loc?.latitudeE7 == null || loc?.longitudeE7 == null) return null;
  return {
    type: 'visit',
    startTime: pv.duration?.startTimestamp ?? '',
    endTime: pv.duration?.endTimestamp ?? '',
    lat: e7ToDecimal(loc.latitudeE7),
    lng: e7ToDecimal(loc.longitudeE7),
    placeId: loc.placeId,
    name: loc.name,
    semanticType: loc.semanticType,
    editConfirmationStatus: pv.editConfirmationStatus,
  };
}

function parseActivity(seg: RawActivitySegment): ActivitySegment | null {
  const startLat = seg.startLocation?.latitudeE7;
  const startLng = seg.startLocation?.longitudeE7;
  const endLat = seg.endLocation?.latitudeE7;
  const endLng = seg.endLocation?.longitudeE7;
  if (startLat == null || startLng == null || endLat == null || endLng == null)
    return null;

  const path = (seg.simplifiedRawPath?.points ?? []).map((p) => ({
    lat: e7ToDecimal(p.latE7 ?? 0),
    lng: e7ToDecimal(p.lngE7 ?? 0),
    ...(p.timestampMs
      ? { timestamp: new Date(Number(p.timestampMs)).toISOString() }
      : {}),
  }));

  return {
    type: 'activity',
    startTime: seg.duration?.startTimestamp ?? '',
    endTime: seg.duration?.endTimestamp ?? '',
    activityType: seg.activityType
      ? getGroupedActivityType(seg.activityType)
      : 'UNKNOWN',
    distanceMeters: seg.distance,
    startLocation: { lat: e7ToDecimal(startLat), lng: e7ToDecimal(startLng) },
    endLocation: { lat: e7ToDecimal(endLat), lng: e7ToDecimal(endLng) },
    path,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an already-loaded Standard Timeline JSON object.
 *
 * @throws if `data` does not contain a `timelineObjects` array.
 */
export function parseTimelineStandard(data: unknown): MappitDataset {
  const raw = data as RawStandardFile;
  if (!raw?.timelineObjects || !Array.isArray(raw.timelineObjects)) {
    throw new Error(
      'Invalid Timeline Standard: missing "timelineObjects" array',
    );
  }

  const timeline: TimelineEntry[] = [];
  let min = '';
  let max = '';

  for (const obj of raw.timelineObjects) {
    let entry: TimelineEntry | null = null;

    if (obj.placeVisit) {
      entry = parseVisit(obj.placeVisit);
    } else if (obj.activitySegment) {
      entry = parseActivity(obj.activitySegment);
    }
    if (!entry) continue;
    timeline.push(entry);

    // Track date range
    if (entry.startTime) {
      if (!min || entry.startTime < min) min = entry.startTime;
    }
    if (entry.endTime) {
      if (!max || entry.endTime > max) max = entry.endTime;
    }
  }

  return {
    source: 'timeline-standard',
    dateRange: { min, max },
    points: [],
    timeline,
  };
}
