import { describe, it, expect } from 'vitest';
import { exportToKml } from '../../src/exporters/kml-exporter';
import type { MappitDataset } from '../../src/types';

function makeDataset(): MappitDataset {
    return {
        source: 'timeline-standard',
        dateRange: { min: '2024-01-05T09:00:00Z', max: '2024-01-05T13:00:00Z' },
        points: [],
        timeline: [
            {
                type: 'visit' as const,
                startTime: '2024-01-05T09:00:00Z',
                endTime: '2024-01-05T11:00:00Z',
                lat: 45.4642,
                lng: 9.19,
                name: 'Duomo di Milano',
                placeId: 'ChIJ123',
            },
            {
                type: 'activity' as const,
                startTime: '2024-01-05T11:00:00Z',
                endTime: '2024-01-05T12:30:00Z',
                activityType: 'WALKING',
                distanceMeters: 3850,
                startLocation: { lat: 45.4642, lng: 9.19 },
                endLocation: { lat: 45.47, lng: 9.2 },
                path: [
                    { lat: 45.4642, lng: 9.19 },
                    { lat: 45.466, lng: 9.195 },
                    { lat: 45.47, lng: 9.2 },
                ],
            },
            {
                type: 'activity' as const,
                startTime: '2024-01-05T12:30:00Z',
                endTime: '2024-01-05T13:00:00Z',
                activityType: 'DRIVING',
                distanceMeters: 15000,
                startLocation: { lat: 45.47, lng: 9.2 },
                endLocation: { lat: 45.6, lng: 9.3 },
                path: [
                    { lat: 45.47, lng: 9.2 },
                    { lat: 45.6, lng: 9.3 },
                ],
            },
        ],
    };
}

describe('exportToKml', () => {
    it('produces valid KML structure', () => {
        const kml = exportToKml(makeDataset());
        expect(kml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(kml).toContain('<kml xmlns="http://www.opengis.net/kml/2.2">');
        expect(kml).toContain('<Document>');
        expect(kml).toContain('</Document>');
        expect(kml).toContain('</kml>');
    });

    it('uses custom document name', () => {
        const kml = exportToKml(makeDataset(), {
            documentName: 'My Export',
        });
        expect(kml).toContain('<name>My Export</name>');
    });

    it('renders visits as Point placemarks', () => {
        const kml = exportToKml(makeDataset());
        expect(kml).toContain('<name>Duomo di Milano</name>');
        expect(kml).toContain('<Point><coordinates>9.19,45.4642,0</coordinates></Point>');
    });

    it('renders activities as LineString placemarks', () => {
        const kml = exportToKml(makeDataset());
        expect(kml).toContain('<LineString>');
        expect(kml).toContain('<tessellate>1</tessellate>');
        // Check that path coordinates are present
        expect(kml).toContain('9.19,45.4642,0');
    });

    it('creates styles for each used activity group', () => {
        const kml = exportToKml(makeDataset());
        expect(kml).toContain('<Style id="WALKING">');
        expect(kml).toContain('<Style id="DRIVING">');
        expect(kml).toContain('<Style id="placeVisitStyle">');
    });

    it('uses KML color format (AABBGGRR)', () => {
        const kml = exportToKml(makeDataset());
        // WALKING color is #34A853, KML = cc53A834
        expect(kml).toContain('cc53A834');
    });

    it('escapes XML special characters in names', () => {
        const ds = makeDataset();
        (ds.timeline[0] as any).name = 'Tom & Jerry <café>';
        const kml = exportToKml(ds);
        expect(kml).toContain('Tom &amp; Jerry &lt;café&gt;');
    });

    it('renders raw points when timeline is empty', () => {
        const ds: MappitDataset = {
            source: 'records',
            dateRange: {
                min: '2024-01-01T00:00:00Z',
                max: '2024-01-01T01:00:00Z',
            },
            points: [
                {
                    timestamp: '2024-01-01T00:00:00Z',
                    lat: 45.0,
                    lng: 9.0,
                    activityType: 'WALKING',
                },
            ],
            timeline: [],
        };
        const kml = exportToKml(ds);
        expect(kml).toContain('<Point><coordinates>9,45,0</coordinates></Point>');
    });

    it('falls back to start/end when path has fewer than 2 points', () => {
        const ds = makeDataset();
        // Clear the path for the WALKING activity
        const act = ds.timeline[1] as any;
        act.path = [];
        const kml = exportToKml(ds);
        // Should still produce a LineString with start→end
        expect(kml).toContain('9.19,45.4642,0');
        expect(kml).toContain('9.2,45.47,0');
    });
});
