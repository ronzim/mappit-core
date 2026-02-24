import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseTimelineStandard } from './timeline-standard';

const fixture = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../../fixtures/timeline-standard.json'),
    'utf-8',
  ),
);

describe('parseTimelineStandard', () => {
  it('returns source "timeline-standard"', () => {
    const ds = parseTimelineStandard(fixture);
    expect(ds.source).toBe('timeline-standard');
  });

  it('loads 2 visits and 1 activity', () => {
    const ds = parseTimelineStandard(fixture);
    expect(ds.timeline).toHaveLength(3);
    const visits = ds.timeline.filter((e) => e.type === 'visit');
    const activities = ds.timeline.filter((e) => e.type === 'activity');
    expect(visits).toHaveLength(2);
    expect(activities).toHaveLength(1);
  });

  it('converts E7 coordinates for visits', () => {
    const ds = parseTimelineStandard(fixture);
    const visit = ds.timeline[0];
    expect(visit.type).toBe('visit');
    if (visit.type === 'visit') {
      expect(visit.lat).toBeCloseTo(45.42259, 4);
      expect(visit.lng).toBeCloseTo(9.18641, 4);
      expect(visit.name).toBe('Duomo di Milano');
      expect(visit.placeId).toBe('ChIJexample_duomo');
    }
  });

  it('normalises activity type', () => {
    const ds = parseTimelineStandard(fixture);
    const act = ds.timeline[1];
    expect(act.type).toBe('activity');
    if (act.type === 'activity') {
      expect(act.activityType).toBe('WALKING');
      expect(act.distanceMeters).toBe(3850);
    }
  });

  it('parses simplifiedRawPath with timestamps', () => {
    const ds = parseTimelineStandard(fixture);
    const act = ds.timeline[1];
    if (act.type === 'activity') {
      expect(act.path.length).toBe(4);
      expect(act.path[0].lat).toBeCloseTo(45.42259, 4);
      // timestampMs "1705318200000" → 2024-01-15T11:30:00.000Z
      expect(act.path[0].timestamp).toBeDefined();
    }
  });

  it('computes date range', () => {
    const ds = parseTimelineStandard(fixture);
    expect(ds.dateRange.min).toBe('2024-01-15T10:00:00Z');
    expect(ds.dateRange.max).toBe('2024-01-15T13:30:00Z');
  });

  it('throws on invalid input', () => {
    expect(() => parseTimelineStandard({})).toThrow('timelineObjects');
  });
});
