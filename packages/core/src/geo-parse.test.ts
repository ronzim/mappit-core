import { describe, it, expect } from 'vitest';
import { e7ToDecimal, parseGeoUri, parseDegreeString } from './geo';

describe('e7ToDecimal', () => {
  it('converts E7 to decimal degrees', () => {
    expect(e7ToDecimal(454225900)).toBeCloseTo(45.42259, 5);
    expect(e7ToDecimal(91864100)).toBeCloseTo(9.18641, 5);
    expect(e7ToDecimal(0)).toBe(0);
    expect(e7ToDecimal(-1234567890)).toBeCloseTo(-123.456789, 5);
  });
});

describe('parseGeoUri', () => {
  it('parses a valid geo: URI', () => {
    expect(parseGeoUri('geo:45.4642,9.1900')).toEqual({
      lat: 45.4642,
      lng: 9.19,
    });
  });

  it('returns null for non-geo strings', () => {
    expect(parseGeoUri('http://example.com')).toBeNull();
    expect(parseGeoUri('')).toBeNull();
  });

  it('returns null for malformed geo URIs', () => {
    expect(parseGeoUri('geo:abc,def')).toBeNull();
    expect(parseGeoUri('geo:45.0')).toBeNull();
    expect(parseGeoUri('geo:45.0,9.0,100')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(parseGeoUri(123 as unknown as string)).toBeNull();
  });
});

describe('parseDegreeString', () => {
  it('parses "45.4642°, 9.1900°"', () => {
    expect(parseDegreeString('45.4642°, 9.1900°')).toEqual({
      lat: 45.4642,
      lng: 9.19,
    });
  });

  it('handles negative coordinates', () => {
    expect(parseDegreeString('-33.8688°, 151.2093°')).toEqual({
      lat: -33.8688,
      lng: 151.2093,
    });
  });

  it('handles integer degrees', () => {
    expect(parseDegreeString('45°, 9°')).toEqual({ lat: 45, lng: 9 });
  });

  it('returns null for unparseable strings', () => {
    expect(parseDegreeString('hello')).toBeNull();
    expect(parseDegreeString('')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(parseDegreeString(null as unknown as string)).toBeNull();
  });
});
