import { describe, it, expect } from 'vitest';
import {
    computeSummary,
    computeYearlySummary,
    computeMonthlySummary,
} from '../src/stats';
import type { MappitDataset } from '../src/types';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makeDataset(): MappitDataset {
    return {
        source: 'timeline-standard',
        dateRange: { min: '2023-06-01T08:00:00Z', max: '2024-02-15T18:00:00Z' },
        points: [
            { timestamp: '2023-06-01T08:00:00Z', lat: 45.0, lng: 9.0 },
            { timestamp: '2024-01-10T12:00:00Z', lat: 46.0, lng: 10.0 },
        ],
        timeline: [
            {
                type: 'visit' as const,
                startTime: '2023-06-01T09:00:00Z',
                endTime: '2023-06-01T11:00:00Z',
                lat: 45.0,
                lng: 9.0,
                name: 'Place A',
                placeId: 'A',
            },
            {
                type: 'visit' as const,
                startTime: '2023-06-15T09:00:00Z',
                endTime: '2023-06-15T11:00:00Z',
                lat: 45.1,
                lng: 9.1,
                name: 'Place B',
                placeId: 'B',
            },
            {
                type: 'activity' as const,
                startTime: '2023-06-01T11:00:00Z',
                endTime: '2023-06-01T12:30:00Z',
                activityType: 'WALKING',
                distanceMeters: 5000,
                startLocation: { lat: 45.0, lng: 9.0 },
                endLocation: { lat: 45.1, lng: 9.1 },
                path: [
                    { lat: 45.0, lng: 9.0 },
                    { lat: 45.1, lng: 9.1 },
                ],
            },
            {
                type: 'activity' as const,
                startTime: '2024-01-10T14:00:00Z',
                endTime: '2024-01-10T15:30:00Z',
                activityType: 'DRIVING',
                distanceMeters: 30000,
                startLocation: { lat: 46.0, lng: 10.0 },
                endLocation: { lat: 47.0, lng: 11.0 },
                path: [
                    { lat: 46.0, lng: 10.0 },
                    { lat: 47.0, lng: 11.0 },
                ],
            },
            {
                type: 'visit' as const,
                startTime: '2024-02-15T16:00:00Z',
                endTime: '2024-02-15T18:00:00Z',
                lat: 47.0,
                lng: 11.0,
                name: 'Place C',
                placeId: 'A', // same placeId as first visit
            },
        ],
    };
}

// ---------------------------------------------------------------------------
// computeSummary
// ---------------------------------------------------------------------------

describe('computeSummary', () => {
    it('counts visits and activities', () => {
        const s = computeSummary(makeDataset());
        expect(s.visits).toBe(3);
        expect(s.activities).toBe(2);
    });

    it('sums total distance', () => {
        const s = computeSummary(makeDataset());
        expect(s.totalDistanceMeters).toBe(35000);
    });

    it('breaks distance down by activity type', () => {
        const s = computeSummary(makeDataset());
        expect(s.distanceByActivity['WALKING']).toBe(5000);
        expect(s.distanceByActivity['DRIVING']).toBe(30000);
    });

    it('counts unique place IDs', () => {
        const s = computeSummary(makeDataset());
        // Place A appears twice, Place B once ⇒ 2 unique
        expect(s.uniquePlaces).toBe(2);
    });

    it('counts total raw points', () => {
        const s = computeSummary(makeDataset());
        expect(s.totalPoints).toBe(2);
    });

    it('copies the dateRange', () => {
        const s = computeSummary(makeDataset());
        expect(s.dateRange.min).toBe('2023-06-01T08:00:00Z');
        expect(s.dateRange.max).toBe('2024-02-15T18:00:00Z');
    });

    it('handles empty dataset', () => {
        const empty: MappitDataset = {
            source: 'records',
            dateRange: { min: '', max: '' },
            points: [],
            timeline: [],
        };
        const s = computeSummary(empty);
        expect(s.visits).toBe(0);
        expect(s.activities).toBe(0);
        expect(s.totalDistanceMeters).toBe(0);
        expect(s.totalPoints).toBe(0);
    });

    it('computes distance from path when distanceMeters is missing', () => {
        const ds: MappitDataset = {
            source: 'records',
            dateRange: { min: '2024-01-01T00:00:00Z', max: '2024-01-01T01:00:00Z' },
            points: [],
            timeline: [
                {
                    type: 'activity' as const,
                    startTime: '2024-01-01T00:00:00Z',
                    endTime: '2024-01-01T01:00:00Z',
                    activityType: 'WALKING',
                    startLocation: { lat: 45.0, lng: 9.0 },
                    endLocation: { lat: 45.01, lng: 9.01 },
                    path: [
                        { lat: 45.0, lng: 9.0 },
                        { lat: 45.01, lng: 9.01 },
                    ],
                },
            ],
        };
        const s = computeSummary(ds);
        // ~1.4 km for 0.01° step at lat 45
        expect(s.totalDistanceMeters).toBeGreaterThan(1000);
        expect(s.totalDistanceMeters).toBeLessThan(2000);
    });
});

// ---------------------------------------------------------------------------
// computeYearlySummary
// ---------------------------------------------------------------------------

describe('computeYearlySummary', () => {
    it('groups entries by year', () => {
        const result = computeYearlySummary(makeDataset());
        expect(result).toHaveLength(2);
        expect(result[0].label).toBe('2023');
        expect(result[1].label).toBe('2024');
    });

    it('counts visits per year', () => {
        const result = computeYearlySummary(makeDataset());
        expect(result[0].summary.visits).toBe(2); // 2023
        expect(result[1].summary.visits).toBe(1); // 2024
    });

    it('counts activities per year', () => {
        const result = computeYearlySummary(makeDataset());
        expect(result[0].summary.activities).toBe(1); // WALKING in 2023
        expect(result[1].summary.activities).toBe(1); // DRIVING in 2024
    });

    it('sums distance per year', () => {
        const result = computeYearlySummary(makeDataset());
        expect(result[0].summary.totalDistanceMeters).toBe(5000);
        expect(result[1].summary.totalDistanceMeters).toBe(30000);
    });

    it('counts points per year', () => {
        const result = computeYearlySummary(makeDataset());
        expect(result[0].summary.totalPoints).toBe(1); // Jun 2023
        expect(result[1].summary.totalPoints).toBe(1); // Jan 2024
    });

    it('is sorted by year ascending', () => {
        const result = computeYearlySummary(makeDataset());
        for (let i = 1; i < result.length; i++) {
            expect(result[i].label > result[i - 1].label).toBe(true);
        }
    });
});

// ---------------------------------------------------------------------------
// computeMonthlySummary
// ---------------------------------------------------------------------------

describe('computeMonthlySummary', () => {
    it('groups entries by YYYY-MM', () => {
        const result = computeMonthlySummary(makeDataset());
        const labels = result.map((r) => r.label);
        expect(labels).toContain('2023-06');
        expect(labels).toContain('2024-01');
        expect(labels).toContain('2024-02');
    });

    it('correctly distributes visits to months', () => {
        const result = computeMonthlySummary(makeDataset());
        const jun = result.find((r) => r.label === '2023-06')!;
        expect(jun.summary.visits).toBe(2); // Place A and Place B
        const feb = result.find((r) => r.label === '2024-02')!;
        expect(feb.summary.visits).toBe(1); // Place C
    });

    it('correctly distributes activities to months', () => {
        const result = computeMonthlySummary(makeDataset());
        const jun = result.find((r) => r.label === '2023-06')!;
        expect(jun.summary.activities).toBe(1);
        const jan = result.find((r) => r.label === '2024-01')!;
        expect(jan.summary.activities).toBe(1);
    });

    it('is sorted chronologically', () => {
        const result = computeMonthlySummary(makeDataset());
        for (let i = 1; i < result.length; i++) {
            expect(result[i].label > result[i - 1].label).toBe(true);
        }
    });
});
