import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseTakeoutMonthly } from '../../src/loaders/takeout-monthly';

const janFixture = JSON.parse(
    fs.readFileSync(
        path.resolve(__dirname, '../../../../fixtures/2024_JANUARY.json'),
        'utf-8',
    ),
);

// Re-use the standard fixture as a second month
const stdFixture = JSON.parse(
    fs.readFileSync(
        path.resolve(__dirname, '../../../../fixtures/timeline-standard.json'),
        'utf-8',
    ),
);

describe('parseTakeoutMonthly', () => {
    it('merges multiple months into one dataset', () => {
        const files = new Map<string, unknown>([
            ['2024_JANUARY', janFixture],
            ['2024_FEBRUARY', stdFixture],
        ]);
        const ds = parseTakeoutMonthly(files);
        expect(ds.source).toBe('takeout-monthly');
        // 3 from January + 3 from the standard fixture
        expect(ds.timeline).toHaveLength(6);
    });

    it('computes the global date range across months', () => {
        const files = new Map<string, unknown>([
            ['2024_JANUARY', janFixture],
            ['2024_FEBRUARY', stdFixture],
        ]);
        const ds = parseTakeoutMonthly(files);
        // January fixture has earlier dates (2024-01-08)
        expect(ds.dateRange.min).toBe('2024-01-08T09:00:00Z');
        // Standard fixture has 2024-01-15T13:30:00Z
        expect(ds.dateRange.max).toBe('2024-01-15T13:30:00Z');
    });

    it('works with a single file', () => {
        const files = new Map<string, unknown>([['2024_JANUARY', janFixture]]);
        const ds = parseTakeoutMonthly(files);
        expect(ds.timeline).toHaveLength(3);
    });

    it('throws when no files are provided', () => {
        expect(() => parseTakeoutMonthly(new Map())).toThrow('no files provided');
    });
});
