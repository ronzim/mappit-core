import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { detectFormat, parseAuto } from './auto-detect';

const fixturesDir = path.resolve(__dirname, '../../../../fixtures');
const load = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf-8'));

describe('detectFormat', () => {
  it('detects records format', () => {
    expect(detectFormat(load('records.json'))).toBe('records');
  });

  it('detects timeline-standard format', () => {
    expect(detectFormat(load('timeline-standard.json'))).toBe(
      'timeline-standard',
    );
  });

  it('detects timeline-semantic format', () => {
    expect(detectFormat(load('timeline-semantic.json'))).toBe(
      'timeline-semantic',
    );
  });

  it('detects timeline-ios format', () => {
    expect(detectFormat(load('timeline-ios.json'))).toBe('timeline-ios');
  });

  it('returns unknown for unrecognised shapes', () => {
    expect(detectFormat({ foo: 'bar' })).toBe('unknown');
    expect(detectFormat(null)).toBe('unknown');
    expect(detectFormat(42)).toBe('unknown');
    expect(detectFormat([])).toBe('unknown');
  });
});

describe('parseAuto', () => {
  it('auto-parses records fixture', () => {
    const ds = parseAuto(load('records.json'));
    expect(ds.source).toBe('records');
    expect(ds.points.length).toBeGreaterThan(0);
  });

  it('auto-parses timeline-standard fixture', () => {
    const ds = parseAuto(load('timeline-standard.json'));
    expect(ds.source).toBe('timeline-standard');
    expect(ds.timeline.length).toBeGreaterThan(0);
  });

  it('auto-parses timeline-semantic fixture', () => {
    const ds = parseAuto(load('timeline-semantic.json'));
    expect(ds.source).toBe('timeline-semantic');
    expect(ds.timeline.length).toBeGreaterThan(0);
  });

  it('auto-parses timeline-ios fixture', () => {
    const ds = parseAuto(load('timeline-ios.json'));
    expect(ds.source).toBe('timeline-ios');
    expect(ds.timeline.length).toBeGreaterThan(0);
  });

  it('throws for unrecognised data', () => {
    expect(() => parseAuto({ foo: 'bar' })).toThrow('Unable to auto-detect');
  });
});
