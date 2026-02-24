/**
 * Loader for the **Timeline iOS** format (Google Maps iOS export).
 *
 * Input shape: a top-level JSON array
 * ```json
 * [
 *   { startTime, endTime, visit?: {…}, activity?: {…}, timelinePath?: [{point:"geo:lat,lng", durationMinutesOffsetFromStartTime}] },
 *   …
 * ]
 * ```
 *
 * Coordinates use `"geo:lat,lng"` URIs.
 */

import type {
  MappitDataset,
  PlaceVisit,
  ActivitySegment,
  TimelineEntry,
} from '../types';
import { parseGeoUri } from '../geo';
import { getGroupedActivityType } from '../activity-mapping';

// ---------------------------------------------------------------------------
// Raw JSON shapes
// ---------------------------------------------------------------------------

interface RawVisit {
  topCandidate?: {
    placeID?: string;
    placeLocation?: string;
    semanticType?: string;
    name?: string;
    probability?: number;
  };
}

interface RawActivity {
  start?: string;
  end?: string;
  topCandidate?: { type?: string; probability?: number };
  distanceMeters?: number | string;
}

interface RawPathPoint {
  point?: string;
  durationMinutesOffsetFromStartTime?: string | number;
}

interface RawIosItem {
  startTime?: string;
  endTime?: string;
  visit?: RawVisit;
  activity?: RawActivity;
  timelinePath?: RawPathPoint[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseTimelineIos(data: unknown): MappitDataset {
  if (!Array.isArray(data)) {
    throw new Error('Invalid Timeline iOS: expected a top-level JSON array');
  }

  const items = data as RawIosItem[];
  const timeline: TimelineEntry[] = [];
  let min = '';
  let max = '';

  for (const item of items) {
    const startTime = item.startTime ?? '';
    const endTime = item.endTime ?? '';

    if (startTime && (!min || startTime < min)) min = startTime;
    if (endTime && (!max || endTime > max)) max = endTime;

    if (item.visit) {
      const entry = convertVisit(item.visit, startTime, endTime);
      if (entry) timeline.push(entry);
    } else if (item.activity) {
      const entry = convertActivity(
        item.activity,
        startTime,
        endTime,
        item.timelinePath,
      );
      if (entry) timeline.push(entry);
    }
  }

  return {
    source: 'timeline-ios',
    dateRange: { min, max },
    points: [],
    timeline,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function convertVisit(
  v: RawVisit,
  startTime: string,
  endTime: string,
): PlaceVisit | null {
  const locStr = v.topCandidate?.placeLocation;
  if (!locStr) return null;
  const coords = parseGeoUri(locStr);
  if (!coords) return null;

  return {
    type: 'visit',
    startTime,
    endTime,
    lat: coords.lat,
    lng: coords.lng,
    placeId: v.topCandidate?.placeID,
    name: v.topCandidate?.name,
    semanticType: v.topCandidate?.semanticType,
  };
}

function convertActivity(
  a: RawActivity,
  startTime: string,
  endTime: string,
  rawPath?: RawPathPoint[],
): ActivitySegment | null {
  const startCoords = a.start ? parseGeoUri(a.start) : null;
  const endCoords = a.end ? parseGeoUri(a.end) : null;
  if (!startCoords || !endCoords) return null;

  // Build path from timelinePath, computing timestamps via offsets
  const path = (rawPath ?? [])
    .map((p) => {
      const pt = p.point ? parseGeoUri(p.point) : null;
      if (!pt) return null;
      let timestamp: string | undefined;
      if (startTime && p.durationMinutesOffsetFromStartTime != null) {
        const offset = parseInt(String(p.durationMinutesOffsetFromStartTime), 10);
        if (!isNaN(offset)) {
          const ts = new Date(new Date(startTime).getTime() + offset * 60_000);
          timestamp = ts.toISOString();
        }
      }
      return { lat: pt.lat, lng: pt.lng, ...(timestamp ? { timestamp } : {}) };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const dist =
    typeof a.distanceMeters === 'string'
      ? parseFloat(a.distanceMeters)
      : a.distanceMeters;

  return {
    type: 'activity',
    startTime,
    endTime,
    activityType: a.topCandidate?.type
      ? getGroupedActivityType(a.topCandidate.type.toUpperCase())
      : 'UNKNOWN',
    distanceMeters: dist,
    startLocation: startCoords,
    endLocation: endCoords,
    path,
  };
}
