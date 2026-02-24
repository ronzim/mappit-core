import { describe, it, expect } from 'vitest';
import {
  getGroupedActivityType,
  activityGroupMapping,
} from './activity-mapping';

describe('activityGroupMapping', () => {
  it('has UNKNOWN as a group', () => {
    expect(activityGroupMapping).toHaveProperty('UNKNOWN');
  });
});

describe('getGroupedActivityType', () => {
  it('returns the group name when given a master key', () => {
    expect(getGroupedActivityType('WALKING')).toBe('WALKING');
    expect(getGroupedActivityType('DRIVING')).toBe('DRIVING');
  });

  it('maps a raw type to its group', () => {
    expect(getGroupedActivityType('IN_PASSENGER_VEHICLE')).toBe('DRIVING');
    expect(getGroupedActivityType('ON_FOOT')).toBe('WALKING');
    expect(getGroupedActivityType('ON_BICYCLE')).toBe('CYCLING');
    expect(getGroupedActivityType('IN_BUS')).toBe('BUS');
    expect(getGroupedActivityType('JOGGING')).toBe('RUNNING');
    expect(getGroupedActivityType('STILL')).toBe('STATIONARY');
    expect(getGroupedActivityType('IN_FLIGHT')).toBe('FLYING');
    expect(getGroupedActivityType('TILTING')).toBe('UNKNOWN');
  });

  it('returns UNKNOWN for unrecognised types', () => {
    expect(getGroupedActivityType('TELEPORTING')).toBe('UNKNOWN');
    expect(getGroupedActivityType('')).toBe('UNKNOWN');
  });
});
