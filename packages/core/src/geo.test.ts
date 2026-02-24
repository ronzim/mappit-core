import { describe, it, expect } from 'vitest';
import { degToRad, distance, countNearbyPoints, normalize, mean } from './geo';

describe('degToRad', () => {
  it('converts 0° to 0', () => {
    expect(degToRad(0)).toBe(0);
  });

  it('converts 180° to π', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });

  it('converts 360° to 2π', () => {
    expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
  });

  it('handles negative degrees', () => {
    expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
  });
});

describe('distance', () => {
  const rome = { lat: 41.9028, lng: 12.4964 };
  const milan = { lat: 45.4642, lng: 9.19 };
  const samePoint = { lat: 41.9028, lng: 12.4964 };

  it('returns 0 for the same point', () => {
    expect(distance(rome, samePoint)).toBeCloseTo(0, 0);
  });

  it('computes Rome–Milan distance ≈ 477 km', () => {
    const d = distance(rome, milan);
    // Haversine result is roughly 477–478 km
    expect(d).toBeGreaterThan(470_000);
    expect(d).toBeLessThan(485_000);
  });

  it('is symmetric', () => {
    expect(distance(rome, milan)).toBeCloseTo(distance(milan, rome));
  });

  it('handles antipodal points (≈ half circumference)', () => {
    const north = { lat: 90, lng: 0 };
    const south = { lat: -90, lng: 0 };
    const d = distance(north, south);
    // Should be ≈ π × R ≈ 20 015 km
    expect(d).toBeGreaterThan(20_000_000);
    expect(d).toBeLessThan(20_100_000);
  });
});

describe('countNearbyPoints', () => {
  // Three points very close (~100 m apart) and one far away
  const origin = { lat: 41.9028, lng: 12.4964 };
  const near1 = { lat: 41.903, lng: 12.4966 };
  const near2 = { lat: 41.9026, lng: 12.4962 };
  const farAway = { lat: 45.0, lng: 9.0 };

  it('counts points within the default 1 km radius', () => {
    expect(countNearbyPoints(origin, [near1, near2, farAway])).toBe(2);
  });

  it('counts all points when radius is very large', () => {
    expect(countNearbyPoints(origin, [near1, near2, farAway], 1_000_000)).toBe(3);
  });

  it('counts zero when radius is tiny and no point matches', () => {
    expect(countNearbyPoints(origin, [farAway], 1)).toBe(0);
  });

  it('returns 0 for an empty array', () => {
    expect(countNearbyPoints(origin, [])).toBe(0);
  });
});

describe('normalize', () => {
  it('scales [0, 50, 100] to [0, 50, 100]', () => {
    expect(normalize([0, 50, 100])).toEqual([0, 50, 100]);
  });

  it('scales [0, 10, 20] to [0, 50, 100]', () => {
    expect(normalize([0, 10, 20])).toEqual([0, 50, 100]);
  });

  it('handles all-zero arrays', () => {
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('does not mutate the input', () => {
    const input = [10, 20, 30];
    const copy = [...input];
    normalize(input);
    expect(input).toEqual(copy);
  });

  it('handles single-element arrays', () => {
    expect(normalize([42])).toEqual([100]);
  });
});

describe('mean', () => {
  it('returns NaN for an empty array', () => {
    expect(mean([])).toBeNaN();
  });

  it('returns the single value for a one-element array', () => {
    expect(mean([7])).toBe(7);
  });

  it('computes arithmetic mean', () => {
    expect(mean([2, 4, 6])).toBe(4);
  });

  it('handles negative values', () => {
    expect(mean([-10, 10])).toBe(0);
  });
});
