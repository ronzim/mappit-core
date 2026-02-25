/**
 * Dataset transformation functions.
 *
 * All transforms return **new** objects — inputs are never mutated.
 */

import type {
    MappitDataset,
    LocationPoint,
    ActivitySegment,
    PlaceVisit,
} from './types';

// ---------------------------------------------------------------------------
// simplifyDataset
// ---------------------------------------------------------------------------

/**
 * Produce a trimmed copy of a dataset with only the essential fields.
 *
 * - **Points**: keeps `timestamp`, `lat`, `lng`, `velocity`, `heading`,
 *   `activityType`.
 * - **Timeline visits**: keeps `type`, `startTime`, `endTime`, `lat`, `lng`,
 *   `name`, `placeId`.
 * - **Timeline activities**: keeps `type`, `startTime`, `endTime`,
 *   `activityType`, `distanceMeters`, `startLocation`, `endLocation` and a
 *   simplified path (coordinates only, no extra metadata).
 */
export function simplifyDataset(dataset: MappitDataset): MappitDataset {
    const points: LocationPoint[] = dataset.points.map((p) => ({
        timestamp: p.timestamp,
        lat: p.lat,
        lng: p.lng,
        velocity: p.velocity,
        heading: p.heading,
        activityType: p.activityType,
    }));

    const timeline = dataset.timeline.map((entry) => {
        if (entry.type === 'visit') {
            const v: PlaceVisit = {
                type: 'visit',
                startTime: entry.startTime,
                endTime: entry.endTime,
                lat: entry.lat,
                lng: entry.lng,
                name: entry.name,
                placeId: entry.placeId,
            };
            return v;
        }

        const act = entry as ActivitySegment;
        const simplified: ActivitySegment = {
            type: 'activity',
            startTime: act.startTime,
            endTime: act.endTime,
            activityType: act.activityType,
            distanceMeters: act.distanceMeters,
            startLocation: { ...act.startLocation },
            endLocation: { ...act.endLocation },
            path: act.path.map((pt) => ({ lat: pt.lat, lng: pt.lng })),
        };
        return simplified;
    });

    return {
        source: dataset.source,
        dateRange: { ...dataset.dateRange },
        points,
        timeline,
    };
}

// ---------------------------------------------------------------------------
// timelineToPoints
// ---------------------------------------------------------------------------

/**
 * Explode timeline entries into flat `LocationPoint[]` records.
 *
 * - **Visits** produce a single point at the visit coordinates, with the
 *   `startTime` as timestamp.
 * - **Activities** produce one point per path waypoint. If a waypoint has
 *   a `timestamp` it is used; otherwise the segment's `startTime` is used.
 *
 * The resulting points are appended to any existing `points` in the dataset.
 * The `timeline` array is left intact (we only *add* to points).
 */
export function timelineToPoints(dataset: MappitDataset): MappitDataset {
    const extraPoints: LocationPoint[] = [];

    for (const entry of dataset.timeline) {
        if (entry.type === 'visit') {
            extraPoints.push({
                timestamp: entry.startTime,
                lat: entry.lat,
                lng: entry.lng,
                activityType: 'STATIONARY',
            });
        } else {
            const act = entry as ActivitySegment;
            for (const pt of act.path) {
                extraPoints.push({
                    timestamp: pt.timestamp ?? act.startTime,
                    lat: pt.lat,
                    lng: pt.lng,
                    activityType: act.activityType,
                });
            }
        }
    }

    const allPoints = [...dataset.points, ...extraPoints];

    // Sort by timestamp ascending
    allPoints.sort(
        (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Recompute date range
    const timestamps = allPoints.map((p) => p.timestamp).filter(Boolean);
    timestamps.sort();
    const min = timestamps[0] ?? dataset.dateRange.min;
    const max = timestamps[timestamps.length - 1] ?? dataset.dateRange.max;

    return {
        source: dataset.source,
        dateRange: { min, max },
        points: allPoints,
        timeline: dataset.timeline,
    };
}
