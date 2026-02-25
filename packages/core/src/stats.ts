/**
 * Statistical summaries for MappitDataset.
 *
 * Extracted and reworked from the `calculateSummaries()` function in the
 * legacy `timeline.html` viewer.
 */

import type { MappitDataset, TimelineEntry, ActivitySegment } from './types';
import { distance } from './geo';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Summary statistics for a dataset (or a time slice of one). */
export interface DatasetSummary {
    /** Total number of visit entries. */
    visits: number;
    /** Total number of activity entries. */
    activities: number;
    /** Total distance across all activity segments (metres). */
    totalDistanceMeters: number;
    /** Distance broken down by normalised activity group (metres). */
    distanceByActivity: Record<string, number>;
    /** Number of unique place IDs visited (0 if placeId is absent). */
    uniquePlaces: number;
    /** Number of raw location points. */
    totalPoints: number;
    /** Date range covered. */
    dateRange: { min: string; max: string };
}

/** A yearly or monthly bucket with its label. */
export interface PeriodSummary {
    /** Human-readable label, e.g. `"2024"` or `"2024-01"`. */
    label: string;
    /** Summary data for this period. */
    summary: DatasetSummary;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emptyBucket(): Omit<DatasetSummary, 'dateRange'> {
    return {
        visits: 0,
        activities: 0,
        totalDistanceMeters: 0,
        distanceByActivity: {},
        uniquePlaces: 0,
        totalPoints: 0,
    };
}

function activityDistance(seg: ActivitySegment): number {
    // Prefer the explicit distanceMeters if present
    if (seg.distanceMeters != null && seg.distanceMeters > 0) {
        return seg.distanceMeters;
    }
    // Fall back to computing from path
    if (seg.path.length < 2) return 0;
    let d = 0;
    for (let i = 1; i < seg.path.length; i++) {
        d += distance(seg.path[i - 1], seg.path[i]);
    }
    return d;
}

function accumulateEntry(
    bucket: ReturnType<typeof emptyBucket>,
    entry: TimelineEntry,
    placeIds: Set<string>,
): void {
    if (entry.type === 'visit') {
        bucket.visits++;
        if (entry.placeId) placeIds.add(entry.placeId);
    } else {
        bucket.activities++;
        const d = activityDistance(entry);
        if (d > 0) {
            bucket.totalDistanceMeters += d;
            bucket.distanceByActivity[entry.activityType] =
                (bucket.distanceByActivity[entry.activityType] ?? 0) + d;
        }
    }
}

function padMonth(m: number): string {
    return m < 10 ? `0${m}` : String(m);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute a single summary for the entire dataset.
 */
export function computeSummary(dataset: MappitDataset): DatasetSummary {
    const bucket = emptyBucket();
    const placeIds = new Set<string>();

    for (const entry of dataset.timeline) {
        accumulateEntry(bucket, entry, placeIds);
    }

    return {
        ...bucket,
        uniquePlaces: placeIds.size,
        totalPoints: dataset.points.length,
        dateRange: { ...dataset.dateRange },
    };
}

/**
 * Compute per-year summaries.
 *
 * Returns an array sorted by year ascending.
 */
export function computeYearlySummary(
    dataset: MappitDataset,
): PeriodSummary[] {
    const buckets = new Map<
        number,
        { bucket: ReturnType<typeof emptyBucket>; placeIds: Set<string>; timestamps: string[] }
    >();

    const getOrCreate = (year: number) => {
        if (!buckets.has(year)) {
            buckets.set(year, {
                bucket: emptyBucket(),
                placeIds: new Set<string>(),
                timestamps: [],
            });
        }
        return buckets.get(year)!;
    };

    // Timeline entries
    for (const entry of dataset.timeline) {
        const year = new Date(entry.startTime).getFullYear();
        if (isNaN(year)) continue;
        const b = getOrCreate(year);
        accumulateEntry(b.bucket, entry, b.placeIds);
        b.timestamps.push(entry.startTime, entry.endTime);
    }

    // Raw points
    for (const p of dataset.points) {
        const year = new Date(p.timestamp).getFullYear();
        if (isNaN(year)) continue;
        const b = getOrCreate(year);
        b.bucket.totalPoints++;
        b.timestamps.push(p.timestamp);
    }

    const years = [...buckets.keys()].sort((a, b) => a - b);
    return years.map((year) => {
        const { bucket, placeIds, timestamps } = buckets.get(year)!;
        timestamps.sort();
        return {
            label: String(year),
            summary: {
                ...bucket,
                uniquePlaces: placeIds.size,
                dateRange: {
                    min: timestamps[0] ?? '',
                    max: timestamps[timestamps.length - 1] ?? '',
                },
            },
        };
    });
}

/**
 * Compute per-month summaries.
 *
 * Returns an array sorted chronologically.  Labels use `"YYYY-MM"` format.
 */
export function computeMonthlySummary(
    dataset: MappitDataset,
): PeriodSummary[] {
    const buckets = new Map<
        string,
        { bucket: ReturnType<typeof emptyBucket>; placeIds: Set<string>; timestamps: string[] }
    >();

    const getOrCreate = (key: string) => {
        if (!buckets.has(key)) {
            buckets.set(key, {
                bucket: emptyBucket(),
                placeIds: new Set<string>(),
                timestamps: [],
            });
        }
        return buckets.get(key)!;
    };

    const keyOf = (isoStr: string): string | null => {
        const d = new Date(isoStr);
        const y = d.getFullYear();
        const m = d.getMonth() + 1; // 1-based
        if (isNaN(y)) return null;
        return `${y}-${padMonth(m)}`;
    };

    // Timeline entries
    for (const entry of dataset.timeline) {
        const key = keyOf(entry.startTime);
        if (!key) continue;
        const b = getOrCreate(key);
        accumulateEntry(b.bucket, entry, b.placeIds);
        b.timestamps.push(entry.startTime, entry.endTime);
    }

    // Raw points
    for (const p of dataset.points) {
        const key = keyOf(p.timestamp);
        if (!key) continue;
        const b = getOrCreate(key);
        b.bucket.totalPoints++;
        b.timestamps.push(p.timestamp);
    }

    const keys = [...buckets.keys()].sort();
    return keys.map((key) => {
        const { bucket, placeIds, timestamps } = buckets.get(key)!;
        timestamps.sort();
        return {
            label: key,
            summary: {
                ...bucket,
                uniquePlaces: placeIds.size,
                dateRange: {
                    min: timestamps[0] ?? '',
                    max: timestamps[timestamps.length - 1] ?? '',
                },
            },
        };
    });
}
