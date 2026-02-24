import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseTimelineIos } from '../../src/loaders/timeline-ios';

const fixture = JSON.parse(
    fs.readFileSync(
        path.resolve(__dirname, '../../../../fixtures/timeline-ios.json'),
        'utf-8',
    ),
);

describe('parseTimelineIos', () => {
    it('returns source "timeline-ios"', () => {
        const ds = parseTimelineIos(fixture);
        expect(ds.source).toBe('timeline-ios');
    });

    it('loads 2 visits and 1 activity', () => {
        const ds = parseTimelineIos(fixture);
        expect(ds.timeline).toHaveLength(3);
        const visits = ds.timeline.filter((e) => e.type === 'visit');
        const activities = ds.timeline.filter((e) => e.type === 'activity');
        expect(visits).toHaveLength(2);
        expect(activities).toHaveLength(1);
    });

    it('parses geo: URIs for visit coordinates', () => {
        const ds = parseTimelineIos(fixture);
        const visit = ds.timeline[0];
        expect(visit.type).toBe('visit');
        if (visit.type === 'visit') {
            expect(visit.lat).toBeCloseTo(45.4642, 4);
            expect(visit.lng).toBeCloseTo(9.19, 4);
            expect(visit.name).toBe('Duomo di Milano');
            expect(visit.placeId).toBe('ChIJexample_duomo');
        }
    });

    it('normalises activity type to uppercase group', () => {
        const ds = parseTimelineIos(fixture);
        const act = ds.timeline[1];
        expect(act.type).toBe('activity');
        if (act.type === 'activity') {
            expect(act.activityType).toBe('WALKING');
        }
    });

    it('parses distanceMeters from string', () => {
        const ds = parseTimelineIos(fixture);
        const act = ds.timeline[1];
        if (act.type === 'activity') {
            expect(act.distanceMeters).toBe(3850);
        }
    });

    it('builds path from timelinePath with offset timestamps', () => {
        const ds = parseTimelineIos(fixture);
        const act = ds.timeline[1];
        if (act.type === 'activity') {
            expect(act.path.length).toBe(4);
            expect(act.path[0].lat).toBeCloseTo(45.4642, 4);
            // offset 0 from startTime "2024-01-15T11:30:00Z"
            expect(act.path[0].timestamp).toBe('2024-01-15T11:30:00.000Z');
            // offset 10 min
            expect(act.path[1].timestamp).toBe('2024-01-15T11:40:00.000Z');
            // offset 30 min
            expect(act.path[3].timestamp).toBe('2024-01-15T12:00:00.000Z');
        }
    });

    it('computes date range', () => {
        const ds = parseTimelineIos(fixture);
        expect(ds.dateRange.min).toBe('2024-01-15T10:00:00Z');
        expect(ds.dateRange.max).toBe('2024-01-15T13:30:00Z');
    });

    it('throws on invalid input', () => {
        expect(() => parseTimelineIos({})).toThrow('top-level JSON array');
    });
});
