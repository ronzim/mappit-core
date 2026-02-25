import { describe, it, expect } from 'vitest';
import { simplifyDataset, timelineToPoints } from '../src/transforms';
import type { MappitDataset } from '../src/types';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makeDataset(): MappitDataset {
    return {
        source: 'timeline-standard',
        dateRange: { min: '2024-01-05T09:00:00Z', max: '2024-01-10T13:00:00Z' },
        points: [
            {
                timestamp: '2024-01-05T10:00:00Z',
                lat: 45.0,
                lng: 9.0,
                accuracy: 15,
                velocity: 1.2,
                heading: 90,
                altitude: 120,
                source: 'GPS',
                activityType: 'WALKING',
                activityConfidence: 80,
            },
        ],
        timeline: [
            {
                type: 'visit' as const,
                startTime: '2024-01-05T09:00:00Z',
                endTime: '2024-01-05T11:00:00Z',
                lat: 45.0,
                lng: 9.0,
                name: 'Duomo',
                placeId: 'ChIJ123',
                semanticType: 'CHURCH',
                editConfirmationStatus: 'CONFIRMED',
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
                    { lat: 45.0, lng: 9.0, timestamp: '2024-01-10T11:00:00Z' },
                    { lat: 45.5, lng: 9.5, timestamp: '2024-01-10T12:00:00Z' },
                    { lat: 46.0, lng: 10.0, timestamp: '2024-01-10T13:00:00Z' },
                ],
            },
        ],
    };
}

// ---------------------------------------------------------------------------
// simplifyDataset
// ---------------------------------------------------------------------------

describe('simplifyDataset', () => {
    it('strips extra fields from points', () => {
        const ds = makeDataset();
        const result = simplifyDataset(ds);
        const p = result.points[0];

        expect(p.lat).toBe(45.0);
        expect(p.lng).toBe(9.0);
        expect(p.timestamp).toBe('2024-01-05T10:00:00Z');
        expect(p.velocity).toBe(1.2);
        expect(p.heading).toBe(90);
        expect(p.activityType).toBe('WALKING');
        // These should be absent (undefined)
        expect(p.accuracy).toBeUndefined();
        expect(p.altitude).toBeUndefined();
        expect(p.source).toBeUndefined();
        expect(p.activityConfidence).toBeUndefined();
    });

    it('simplifes visits to core fields', () => {
        const ds = makeDataset();
        const result = simplifyDataset(ds);
        const visit = result.timeline[0];
        expect(visit.type).toBe('visit');
        if (visit.type === 'visit') {
            expect(visit.name).toBe('Duomo');
            expect(visit.placeId).toBe('ChIJ123');
            // extra fields stripped
            expect((visit as any).semanticType).toBeUndefined();
            expect((visit as any).editConfirmationStatus).toBeUndefined();
        }
    });

    it('simplifies activity path to lat/lng only', () => {
        const ds = makeDataset();
        const result = simplifyDataset(ds);
        const act = result.timeline[1];
        if (act.type === 'activity') {
            expect(act.path).toHaveLength(3);
            expect(act.path[0]).toEqual({ lat: 45.0, lng: 9.0 });
            expect((act.path[0] as any).timestamp).toBeUndefined();
        }
    });

    it('does not mutate the original', () => {
        const ds = makeDataset();
        simplifyDataset(ds);
        expect(ds.points[0].accuracy).toBe(15);
    });

    it('preserves source and dateRange', () => {
        const ds = makeDataset();
        const result = simplifyDataset(ds);
        expect(result.source).toBe('timeline-standard');
        expect(result.dateRange).toEqual(ds.dateRange);
    });
});

// ---------------------------------------------------------------------------
// timelineToPoints
// ---------------------------------------------------------------------------

describe('timelineToPoints', () => {
    it('converts visits to single points with STATIONARY type', () => {
        const ds = makeDataset();
        const result = timelineToPoints(ds);

        const stationaryPts = result.points.filter(
            (p) => p.activityType === 'STATIONARY',
        );
        expect(stationaryPts).toHaveLength(1);
        expect(stationaryPts[0].lat).toBe(45.0);
        expect(stationaryPts[0].lng).toBe(9.0);
        expect(stationaryPts[0].timestamp).toBe('2024-01-05T09:00:00Z');
    });

    it('converts activity path points to LocationPoint[]', () => {
        const ds = makeDataset();
        const result = timelineToPoints(ds);

        const walkingPts = result.points.filter(
            (p) =>
                p.activityType === 'WALKING' &&
                p.timestamp !== '2024-01-05T10:00:00Z', // exclude the original point
        );
        expect(walkingPts).toHaveLength(3); // 3 path waypoints
    });

    it('preserves existing points', () => {
        const ds = makeDataset();
        const result = timelineToPoints(ds);

        // Original 1 point + 1 visit + 3 path points = 5
        expect(result.points).toHaveLength(5);
    });

    it('sorts all points by timestamp', () => {
        const ds = makeDataset();
        const result = timelineToPoints(ds);

        for (let i = 1; i < result.points.length; i++) {
            expect(
                new Date(result.points[i].timestamp).getTime(),
            ).toBeGreaterThanOrEqual(
                new Date(result.points[i - 1].timestamp).getTime(),
            );
        }
    });

    it('keeps existing timeline intact', () => {
        const ds = makeDataset();
        const result = timelineToPoints(ds);
        expect(result.timeline).toEqual(ds.timeline);
    });

    it('updates dateRange to cover all points', () => {
        const ds = makeDataset();
        const result = timelineToPoints(ds);
        expect(result.dateRange.min).toBe('2024-01-05T09:00:00Z');
        expect(result.dateRange.max).toBe('2024-01-10T13:00:00Z');
    });
});
