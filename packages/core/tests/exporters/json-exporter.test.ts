import { describe, it, expect } from 'vitest';
import { exportToJson } from '../../src/exporters/json-exporter';
import type { MappitDataset } from '../../src/types';

function makeDataset(): MappitDataset {
    return {
        source: 'records',
        dateRange: { min: '2024-01-05T10:00:00Z', max: '2024-01-05T11:00:00Z' },
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
        timeline: [],
    };
}

describe('exportToJson', () => {
    it('returns a valid JSON string', () => {
        const json = exportToJson(makeDataset());
        expect(() => JSON.parse(json)).not.toThrow();
    });

    it('simplifies by default (strips accuracy, altitude, etc.)', () => {
        const json = exportToJson(makeDataset());
        const parsed = JSON.parse(json);
        expect(parsed.points[0].accuracy).toBeUndefined();
        expect(parsed.points[0].altitude).toBeUndefined();
        expect(parsed.points[0].source).toBeUndefined();
        // Core fields preserved
        expect(parsed.points[0].lat).toBe(45.0);
        expect(parsed.points[0].velocity).toBe(1.2);
    });

    it('skips simplification when simplify=false', () => {
        const json = exportToJson(makeDataset(), { simplify: false });
        const parsed = JSON.parse(json);
        expect(parsed.points[0].accuracy).toBe(15);
        expect(parsed.points[0].altitude).toBe(120);
    });

    it('respects indent option', () => {
        const compact = exportToJson(makeDataset(), { indent: 0 });
        expect(compact).not.toContain('\n');

        const pretty = exportToJson(makeDataset(), { indent: 4 });
        expect(pretty).toContain('    ');
    });

    it('preserves source and dateRange', () => {
        const json = exportToJson(makeDataset());
        const parsed = JSON.parse(json);
        expect(parsed.source).toBe('records');
        expect(parsed.dateRange.min).toBe('2024-01-05T10:00:00Z');
    });
});
