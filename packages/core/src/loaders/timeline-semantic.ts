/**
 * Loader for the **Timeline Semantic** format (newer Google Takeout export).
 *
 * Input shape:
 * ```json
 * { "semanticSegments": [
 *     { startTime, endTime, visit?: {…}, activity?: {…}, timelinePath?: […] }
 * ] }
 * ```
 *
 * Coordinates are encoded as `"45.4642°, 9.1900°"` degree-sign strings.
 */

import type {
  MappitDataset,
  PlaceVisit,
  ActivitySegment,
  TimelineEntry,
} from '../types';
import { parseDegreeString } from '../geo';
import { getGroupedActivityType } from '../activity-mapping';

// ---------------------------------------------------------------------------
// Raw JSON shapes
// ---------------------------------------------------------------------------

interface RawVisit {
  topCandidate?: {
    placeId?: string;
    placeLocation?: { latLng?: string };
    semanticType?: string;
    name?: string;
    probability?: number;
  };
  editConfirmationStatus?: string;
}

interface RawActivity {
  start?: { latLng?: string };
  end?: { latLng?: string };
  topCandidate?: { type?: string; probability?: number };
  distanceMeters?: number;
  editConfirmationStatus?: string;
}

interface RawPathPoint {
  point?: string;
  time?: string;
}

interface RawSemanticSegment {
  startTime?: string;
  endTime?: string;
  visit?: RawVisit;
  activity?: RawActivity;
  timelinePath?: RawPathPoint[];
}

interface RawSemanticFile {
  semanticSegments?: RawSemanticSegment[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseTimelineSemantic(data: unknown): MappitDataset {
  const raw = data as RawSemanticFile;
  if (!raw?.semanticSegments || !Array.isArray(raw.semanticSegments)) {
    throw new Error(
      'Invalid Timeline Semantic: missing "semanticSegments" array',
    );
  }

  const timeline: TimelineEntry[] = [];
  let min = '';
  let max = '';

  for (const seg of raw.semanticSegments) {
    const startTime = seg.startTime ?? '';
    const endTime = seg.endTime ?? '';

    // Track date range
    if (startTime && (!min || startTime < min)) min = startTime;
    if (endTime && (!max || endTime > max)) max = endTime;

    if (seg.visit) {
      const entry = parseVisit(seg.visit, startTime, endTime);
      if (entry) timeline.push(entry);
    } else if (seg.activity) {
      const entry = parseActivitySegment(
        seg.activity,
        startTime,
        endTime,
        seg.timelinePath,
      );
      if (entry) timeline.push(entry);
    }
  }

  return {
    source: 'timeline-semantic',
    dateRange: { min, max },
    points: [],
    timeline,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parseVisit(
  v: RawVisit,
  startTime: string,
  endTime: string,
): PlaceVisit | null {
  const locStr = v.topCandidate?.placeLocation?.latLng;
  if (!locStr) return null;
  const coords = parseDegreeString(locStr);
  if (!coords) return null;

  return {
    type: 'visit',
    startTime,
    endTime,
    lat: coords.lat,
    lng: coords.lng,
    placeId: v.topCandidate?.placeId,
    name: v.topCandidate?.name,
    semanticType: v.topCandidate?.semanticType,
    editConfirmationStatus: v.editConfirmationStatus,
  };
}

function parseActivitySegment(
  a: RawActivity,
  startTime: string,
  endTime: string,
  rawPath?: RawPathPoint[],
): ActivitySegment | null {
  const startCoords = a.start?.latLng
    ? parseDegreeString(a.start.latLng)
    : null;
  const endCoords = a.end?.latLng ? parseDegreeString(a.end.latLng) : null;
  if (!startCoords || !endCoords) return null;

  const path = (rawPath ?? [])
    .map((p) => {
      const pt = p.point ? parseDegreeString(p.point) : null;
      if (!pt) return null;
      return { lat: pt.lat, lng: pt.lng, ...(p.time ? { timestamp: p.time } : {}) };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return {
    type: 'activity',
    startTime,
    endTime,
    activityType: a.topCandidate?.type
      ? getGroupedActivityType(a.topCandidate.type)
      : 'UNKNOWN',
    distanceMeters: a.distanceMeters,
    startLocation: startCoords,
    endLocation: endCoords,
    path,
  };
}
