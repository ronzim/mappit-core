/**
 * Loader for the legacy **Records.json** format produced by Google Takeout
 * prior to 2024.
 *
 * Input shape:
 * ```json
 * { "locations": [ { timestamp, latitudeE7, longitudeE7, … }, … ] }
 * ```
 *
 * Produces a `MappitDataset` with `source: 'records'` and `points` populated.
 */

import type { LocationPoint, MappitDataset } from '../types';
import { e7ToDecimal } from '../geo';
import { getGroupedActivityType } from '../activity-mapping';

// ---------------------------------------------------------------------------
// Raw JSON shapes (just enough typing for safe access)
// ---------------------------------------------------------------------------

interface RawActivity {
    type?: string;
    confidence?: number;
}

interface RawLocation {
    timestamp?: string;
    latitudeE7?: number;
    longitudeE7?: number;
    accuracy?: number;
    velocity?: number;
    heading?: number;
    altitude?: number;
    source?: string;
    activity?: Array<{
        activity?: RawActivity[];
        timestamp?: string;
    }>;
}

interface RawRecordsFile {
    locations?: RawLocation[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an already-loaded Records.json object into a `MappitDataset`.
 *
 * @throws if `data` does not contain a `locations` array.
 */
export function parseRecords(data: unknown): MappitDataset {
    const raw = data as RawRecordsFile;
    if (!raw?.locations || !Array.isArray(raw.locations)) {
        throw new Error('Invalid Records.json: missing "locations" array');
    }

    const points: LocationPoint[] = [];
    let min = '';
    let max = '';

    for (const loc of raw.locations) {
        if (loc.latitudeE7 == null || loc.longitudeE7 == null) continue;

        const ts = loc.timestamp ?? '';

        // Determine primary activity (first entry, highest confidence sub-entry)
        let activityType: string | undefined;
        let activityConfidence: number | undefined;
        if (loc.activity?.[0]?.activity?.[0]) {
            const top = loc.activity[0].activity[0];
            activityType = top.type ? getGroupedActivityType(top.type) : undefined;
            activityConfidence = top.confidence;
        }

        points.push({
            timestamp: ts,
            lat: e7ToDecimal(loc.latitudeE7),
            lng: e7ToDecimal(loc.longitudeE7),
            accuracy: loc.accuracy,
            velocity: loc.velocity,
            heading: loc.heading,
            altitude: loc.altitude,
            source: loc.source,
            activityType,
            activityConfidence,
        });

        // Track date range
        if (ts) {
            if (!min || ts < min) min = ts;
            if (!max || ts > max) max = ts;
        }
    }

    return {
        source: 'records',
        dateRange: { min, max },
        points,
        timeline: [],
    };
}
