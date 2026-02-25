import { describe, it, expect } from 'vitest';
import {
    filterByDateRange,
    filterByArea,
    filterByActivityType,
} from '../src/filters';
import type { MappitDataset } from '../src/types';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makeDataset(): MappitDataset {
    return {
        source: 'records',
        dateRange: { min: '2024-01-01T00:00:00Z', max: '2024-01-31T23:59:59Z' },
        points: [
            { timestamp: '2024-01-05T10:00:00Z', lat: 45.0, lng: 9.0, activityType: 'WALKING' },
            { timestamp: '2024-01-10T12:00:00Z', lat: 46.0, lng: 10.0, activityType: 'DRIVING' },
            { timestamp: '2024-01-20T08:00:00Z', lat: 41.0, lng: 12.0 },
            { timestamp: '2024-01-25T18:00:00Z', lat: 48.0, lng: 2.0, activityType: 'CYCLING' },
        ],
        timeline: [
            {
                type: 'visit' as const,
                startTime: '2024-01-05T09:00:00Z',
                endTime: '2024-01-05T11:00:00Z',
                lat: 45.0,
                lng: 9.0,
                name: 'Place A',
                placeId: 'A',
            },
            {
                type: 'activity' as const,
                startTime: '2024-01-10T11:00:00Z',
                endTime: '2024-01-10T13:00:00Z',
                activityType: 'WALKING',
                distanceMeters: 5000,
                startLocation: { lat: 45.0, lng: 9.0 },
                endLocation: { lat: 46.0, lng: 10.0 },
                path: [
                    { lat: 45.0, lng: 9.0 },
                    { lat: 45.5, lng: 9.5 },
                    { lat: 46.0, lng: 10.0 },
                ],
            },
            {
                type: 'activity' as const,
                startTime: '2024-01-20T07:00:00Z',
                endTime: '2024-01-20T09:00:00Z',
                activityType: 'DRIVING',
                distanceMeters: 30000,
                startLocation: { lat: 41.0, lng: 12.0 },
                endLocation: { lat: 43.0, lng: 11.0 },
                path: [
                    { lat: 41.0, lng: 12.0 },
                    { lat: 43.0, lng: 11.0 },
                ],
            },
        ],
    };
}

// ---------------------------------------------------------------------------
// filterByDateRange
// ---------------------------------------------------------------------------

describe('filterByDateRange', () => {
    it('keeps only entries within the specified range', () => {
        const ds = makeDataset();
        const result = filterByDateRange(ds, '2024-01-08', '2024-01-15');

        // Points: only the Jan 10 point falls in [8,15]
        expect(result.points).toHaveLength(1);
        expect(result.points[0].timestamp).toBe('2024-01-10T12:00:00Z');

        // Timeline: visit on Jan 5 is outside, activity Jan 10 is inside,
        // activity Jan 20 is outside
        expect(result.timeline).toHaveLength(1);
        expect(result.timeline[0].startTime).toBe('2024-01-10T11:00:00Z');
    });

    it('includes entries that overlap the range boundaries', () => {
        const ds = makeDataset();
        // The visit is 09:00–11:00 on Jan 5; range starts on Jan 5 00:00
        const result = filterByDateRange(ds, '2024-01-05', '2024-01-06');

        // Visit overlaps with [Jan 5, Jan 6]
        expect(result.timeline.some((e) => e.type === 'visit')).toBe(true);
    });

    it('recomputes dateRange on the result', () => {
        const ds = makeDataset();
        const result = filterByDateRange(ds, '2024-01-08', '2024-01-15');
        expect(result.dateRange.min).toBe('2024-01-10T11:00:00Z');
        expect(result.dateRange.max).toBe('2024-01-10T13:00:00Z');
    });

    it('throws on invalid dates', () => {
        const ds = makeDataset();
        expect(() => filterByDateRange(ds, 'bad', '2024-01-15')).toThrow('Invalid date');
    });

    it('does not mutate the original dataset', () => {
        const ds = makeDataset();
        const origLen = ds.points.length;
        filterByDateRange(ds, '2024-01-08', '2024-01-15');
        expect(ds.points).toHaveLength(origLen);
    });

    it('returns empty arrays when nothing matches', () => {
        const ds = makeDataset();
        const result = filterByDateRange(ds, '2025-01-01', '2025-12-31');
        expect(result.points).toHaveLength(0);
        expect(result.timeline).toHaveLength(0);
        expect(result.dateRange).toEqual({ min: '', max: '' });
    });
});

// ---------------------------------------------------------------------------
// filterByArea
// ---------------------------------------------------------------------------

describe('filterByArea', () => {
    it('keeps points and visits within the bounding box', () => {
        const ds = makeDataset();
        // Box around northern Italy: lat 44–47, lng 8–11
        const result = filterByArea(ds, {
            south: 44,
            north: 47,
            west: 8,
            east: 11,
        });

        // Points: (45,9) and (46,10) match; (41,12) and (48,2) don't
        expect(result.points).toHaveLength(2);
    });

    it('keeps activities if any path point is in bounds', () => {
        const ds = makeDataset();
        // Box that contains only the midpoint 45.5,9.5
        const result = filterByArea(ds, {
            south: 45.3,
            north: 45.7,
            west: 9.3,
            east: 9.7,
        });

        // The WALKING activity has a midpoint at 45.5,9.5
        expect(result.timeline).toHaveLength(1);
        expect(
            result.timeline[0].type === 'activity' &&
            result.timeline[0].activityType === 'WALKING',
        ).toBe(true);
    });

    it('keeps activities if start location is in bounds', () => {
        const ds = makeDataset();
        const result = filterByArea(ds, {
            south: 40,
            north: 42,
            west: 11,
            east: 13,
        });

        // DRIVING activity starts at (41,12)
        const acts = result.timeline.filter((e) => e.type === 'activity');
        expect(acts).toHaveLength(1);
    });

    it('returns empty when nothing is in bounds', () => {
        const ds = makeDataset();
        const result = filterByArea(ds, {
            south: -10,
            north: -5,
            west: -10,
            east: -5,
        });
        expect(result.points).toHaveLength(0);
        expect(result.timeline).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// filterByActivityType
// ---------------------------------------------------------------------------

describe('filterByActivityType', () => {
    it('keeps only points and activities of the specified types', () => {
        const ds = makeDataset();
        const result = filterByActivityType(ds, ['WALKING']);

        // Points: WALKING (kept), DRIVING (dropped), untyped (kept by default), CYCLING (dropped)
        expect(result.points).toHaveLength(2);
        expect(result.points[0].activityType).toBe('WALKING');
        expect(result.points[1].activityType).toBeUndefined();

        // Timeline: visit (always kept), WALKING activity (kept), DRIVING activity (dropped)
        expect(result.timeline).toHaveLength(2);
    });

    it('excludes untyped points when includeUntyped=false', () => {
        const ds = makeDataset();
        const result = filterByActivityType(ds, ['WALKING'], false);

        expect(result.points).toHaveLength(1);
        expect(result.points[0].activityType).toBe('WALKING');
    });

    it('is case-insensitive', () => {
        const ds = makeDataset();
        const result = filterByActivityType(ds, ['walking']);
        expect(result.points[0].activityType).toBe('WALKING');
    });

    it('always keeps visits', () => {
        const ds = makeDataset();
        const result = filterByActivityType(ds, ['DRIVING']);
        const visits = result.timeline.filter((e) => e.type === 'visit');
        expect(visits).toHaveLength(1);
    });
});
