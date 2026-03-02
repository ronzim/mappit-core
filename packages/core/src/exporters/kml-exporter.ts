/**
 * Export a MappitDataset to KML format.
 *
 * Extracted and reworked from the `exportToKML()` function in
 * `timeline.html`.  This version works entirely on the normalised
 * `MappitDataset` model so it is format-agnostic.
 */

import type {
    MappitDataset,
    TimelineEntry,
    PlaceVisit,
    ActivitySegment,
} from '../types';
import { getGroupedActivityType } from '../activity-mapping';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeXml(unsafe: string | undefined): string {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Convert a hex colour `#RRGGBB` to KML's `AABBGGRR` format
 * (alpha-blue-green-red).
 */
function hexToKmlColor(hex: string, alpha = 'cc'): string {
    const clean = hex.replace('#', '');
    const r = clean.substring(0, 2);
    const g = clean.substring(2, 4);
    const b = clean.substring(4, 6);
    return `${alpha}${b}${g}${r}`;
}

// A small palette matching the activity groups used in the old viewer.
const ACTIVITY_KML_COLORS: Record<string, string> = {
    DRIVING: '#4285F4',
    TAXI: '#EA8600',
    MOTORCYCLING: '#9334E6',
    CYCLING: '#12B5CB',
    WALKING: '#34A853',
    HIKING: '#0D652D',
    RUNNING: '#E8710A',
    BUS: '#FA7B17',
    SUBWAY: '#9334E6',
    TRAIN: '#A142F4',
    TRAM: '#A142F4',
    FERRY: '#4285F4',
    STATIONARY: '#9E9E9E',
    FLYING: '#185ABC',
    UNKNOWN: '#9E9E9E',
};

function activityColor(group: string): string {
    return ACTIVITY_KML_COLORS[group] ?? ACTIVITY_KML_COLORS['UNKNOWN'];
}

function formatIso(isoStr: string): string {
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
    } catch {
        return isoStr;
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Options for {@link exportToKml}. */
export interface KmlExportOptions {
    /** Document name embedded in the KML (default "MappIt Export"). */
    documentName?: string;
}

/**
 * Generate a KML string from a MappitDataset.
 *
 * Visits are rendered as `<Point>` placemarks, activities as `<LineString>`
 * placemarks coloured by activity type.
 */
export function exportToKml(
    dataset: MappitDataset,
    options: KmlExportOptions = {},
): string {
    const { documentName = 'MappIt Export' } = options;

    // Collect used activity groups for style definitions
    const usedGroups = new Set<string>();

    const placemarks: string[] = [];

    for (const entry of dataset.timeline) {
        if (entry.type === 'visit') {
            placemarks.push(visitPlacemark(entry));
        } else {
            const group = getGroupedActivityType(entry.activityType);
            usedGroups.add(group);
            placemarks.push(activityPlacemark(entry, group));
        }
    }

    // If we have raw points but no timeline, render them as simple placemarks
    if (dataset.timeline.length === 0 && dataset.points.length > 0) {
        for (const pt of dataset.points) {
            placemarks.push(
                `    <Placemark>
      <name>${escapeXml(pt.activityType ?? 'Point')}</name>
      <description>${formatIso(pt.timestamp)}</description>
      <styleUrl>#placeVisitStyle</styleUrl>
      <Point><coordinates>${pt.lng},${pt.lat},0</coordinates></Point>
    </Placemark>`,
            );
        }
    }

    // Build styles
    const styles: string[] = [];
    styles.push(`    <Style id="placeVisitStyle">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>0.8</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href></Icon>
      </IconStyle>
    </Style>`);

    for (const group of usedGroups) {
        const kmlColor = hexToKmlColor(activityColor(group));
        styles.push(`    <Style id="${group}">
      <LineStyle><color>${kmlColor}</color><width>4</width></LineStyle>
    </Style>`);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(documentName)}</name>
${styles.join('\n')}
${placemarks.join('\n')}
  </Document>
</kml>`;
}

// ---------------------------------------------------------------------------
// Placemark builders
// ---------------------------------------------------------------------------

function visitPlacemark(visit: PlaceVisit): string {
    const name = escapeXml(visit.name ?? 'Visit');
    const arrived = formatIso(visit.startTime);
    const departed = formatIso(visit.endTime);

    return `    <Placemark>
      <name>${name}</name>
      <description>Arrived: ${arrived}
Departed: ${departed}</description>
      <styleUrl>#placeVisitStyle</styleUrl>
      <Point><coordinates>${visit.lng},${visit.lat},0</coordinates></Point>
    </Placemark>`;
}

function activityPlacemark(act: ActivitySegment, group: string): string {
    const name = escapeXml(act.activityType);
    const dist =
        act.distanceMeters != null
            ? `${(act.distanceMeters / 1000).toFixed(1)} km`
            : '';

    // Build coordinate list
    const coords: string[] = [];
    for (const pt of act.path) {
        coords.push(`${pt.lng},${pt.lat},0`);
    }
    // Fall back to start/end if path is too short
    if (coords.length < 2) {
        coords.length = 0;
        coords.push(
            `${act.startLocation.lng},${act.startLocation.lat},0`,
            `${act.endLocation.lng},${act.endLocation.lat},0`,
        );
    }

    return `    <Placemark>
      <name>${name}</name>
      <description>Distance: ${dist}</description>
      <styleUrl>#${group}</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>
          ${coords.join('\n          ')}
        </coordinates>
      </LineString>
    </Placemark>`;
}
