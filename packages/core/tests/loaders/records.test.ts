import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseRecords } from '../../src/loaders/records';

const fixture = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../../fixtures/records.json'),
    'utf-8',
  ),
);

describe('parseRecords', () => {
  it('returns source "records"', () => {
    const ds = parseRecords(fixture);
    expect(ds.source).toBe('records');
  });

  it('loads all 4 location points', () => {
    const ds = parseRecords(fixture);
    expect(ds.points).toHaveLength(4);
    expect(ds.timeline).toHaveLength(0);
  });

  it('converts E7 coordinates to decimal degrees', () => {
    const ds = parseRecords(fixture);
    const first = ds.points[0];
    expect(first.lat).toBeCloseTo(45.42259, 4);
    expect(first.lng).toBeCloseTo(9.18641, 4);
  });

  it('preserves metadata fields', () => {
    const ds = parseRecords(fixture);
    const first = ds.points[0];
    expect(first.timestamp).toBe('2024-01-15T10:00:00.000Z');
    expect(first.accuracy).toBe(15);
    expect(first.velocity).toBe(5);
    expect(first.heading).toBe(90);
    expect(first.altitude).toBe(120);
    expect(first.source).toBe('GPS');
  });

  it('normalises activity type via grouping', () => {
    const ds = parseRecords(fixture);
    // First point: WALKING → WALKING (stays the same)
    expect(ds.points[0].activityType).toBe('WALKING');
    // Third point: IN_PASSENGER_VEHICLE → DRIVING
    expect(ds.points[2].activityType).toBe('DRIVING');
    // Fourth point: STILL → STATIONARY
    expect(ds.points[3].activityType).toBe('STATIONARY');
  });

  it('computes date range', () => {
    const ds = parseRecords(fixture);
    expect(ds.dateRange.min).toBe('2024-01-15T10:00:00.000Z');
    expect(ds.dateRange.max).toBe('2024-01-15T11:00:00.000Z');
  });

  it('handles points without activity gracefully', () => {
    const ds = parseRecords(fixture);
    // Second point has no activity
    expect(ds.points[1].activityType).toBeUndefined();
    expect(ds.points[1].activityConfidence).toBeUndefined();
  });

  it('throws on invalid input', () => {
    expect(() => parseRecords({})).toThrow('missing "locations" array');
    expect(() => parseRecords({ locations: 'bad' })).toThrow();
  });
});
