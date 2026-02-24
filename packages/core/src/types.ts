/**
 * Unified data model for all Google Location History formats.
 *
 * All loaders normalise their specific format into these types, so the rest
 * of the application can work with a single, consistent representation.
 */

// ---------------------------------------------------------------------------
// Primitive building blocks
// ---------------------------------------------------------------------------

/** A single raw location record (used by Records.json / scatter / heatmap). */
export interface LocationPoint {
    timestamp: string; // ISO 8601
    lat: number; // decimal degrees
    lng: number; // decimal degrees
    accuracy?: number;
    velocity?: number; // m/s
    heading?: number; // degrees
    altitude?: number; // metres
    source?: string;
    activityType?: string; // normalised group (via getGroupedActivityType)
    activityConfidence?: number; // 0–100
}

/** A visit to a specific place. */
export interface PlaceVisit {
    type: 'visit';
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    lat: number;
    lng: number;
    placeId?: string;
    name?: string;
    semanticType?: string;
    editConfirmationStatus?: string;
}

/** A movement segment between two locations. */
export interface ActivitySegment {
    type: 'activity';
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    activityType: string; // normalised group
    distanceMeters?: number;
    startLocation: { lat: number; lng: number };
    endLocation: { lat: number; lng: number };
    /** GPS path points along the movement. */
    path: Array<{ lat: number; lng: number; timestamp?: string }>;
}

// ---------------------------------------------------------------------------
// Unions & dataset
// ---------------------------------------------------------------------------

/** Either a place visit or an activity segment. */
export type TimelineEntry = PlaceVisit | ActivitySegment;

/** Identifies which parser produced the dataset. */
export type DataSource =
    | 'records'
    | 'timeline-standard'
    | 'timeline-semantic'
    | 'timeline-ios'
    | 'takeout-monthly';

/**
 * The main output of every loader.
 *
 * - `points` is populated only by the Records loader.
 * - `timeline` is populated by all Timeline-family loaders.
 *
 * Use `timelineToPoints()` (Phase 2) to convert timeline entries into
 * flat `LocationPoint[]` when needed for scatter / heatmap rendering.
 */
export interface MappitDataset {
    source: DataSource;
    dateRange: { min: string; max: string };
    /** Raw location points (Records.json only). */
    points: LocationPoint[];
    /** Structured timeline entries (all Timeline formats). */
    timeline: TimelineEntry[];
}
