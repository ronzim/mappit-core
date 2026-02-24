/**
 * Geographic and math utility functions.
 *
 * Ported from the legacy `src/utils.js` with the following changes:
 * - TypeScript with strict types
 * - `distance()` now accepts plain `{lat, lng}` instead of E7-encoded points
 * - `countNearbyPoints()` also uses `{lat, lng}` and accepts a custom radius
 * - Pure functions — no mutation (normalize returns a new array)
 */

/** Earth radius in metres (mean value). */
const EARTH_RADIUS_M = 6_371_000;

/** A minimal geographic coordinate. */
export interface LatLng {
    lat: number;
    lng: number;
}

/** Convert degrees to radians. */
export function degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Haversine distance between two points in **metres**.
 *
 * Coordinates are expected in decimal degrees (not E7).
 */
export function distance(p1: LatLng, p2: LatLng): number {
    const phi1 = degToRad(p1.lat);
    const phi2 = degToRad(p2.lat);
    const deltaPhi = degToRad(p2.lat - p1.lat);
    const deltaLambda = degToRad(p2.lng - p1.lng);

    const a =
        Math.sin(deltaPhi / 2) ** 2 +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_M * c;
}

/**
 * Count how many points in `points` are within `radiusMetres` of `origin`.
 *
 * The origin itself is **not** excluded — if it appears in the array it will
 * be counted (distance ≈ 0).
 *
 * @param origin      Reference point
 * @param points      Array of points to test
 * @param radiusMetres  Maximum distance (default 1 000 m)
 */
export function countNearbyPoints(
    origin: LatLng,
    points: readonly LatLng[],
    radiusMetres = 1_000,
): number {
    return points.reduce(
        (count, pt) => (distance(origin, pt) <= radiusMetres ? count + 1 : count),
        0,
    );
}

/**
 * Normalize an array of numbers to the 0–100 range (linear scaling).
 *
 * Returns a **new** array — the original is not mutated.
 * If `max` is 0 (all values are 0), returns an array of zeros.
 */
export function normalize(values: readonly number[]): number[] {
    const max = Math.max(...values);
    if (max === 0) return values.map(() => 0);
    const ratio = max / 100;
    return values.map((v) => Math.round(v / ratio));
}

/** Arithmetic mean of an array of numbers. Returns `NaN` for empty arrays. */
export function mean(values: readonly number[]): number {
    if (values.length === 0) return NaN;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
}

// ---------------------------------------------------------------------------
// Coordinate parsing helpers
// ---------------------------------------------------------------------------

/** Convert a Google E7 integer (degrees × 10⁷) to decimal degrees. */
export function e7ToDecimal(e7: number): number {
    return e7 / 1e7;
}

/**
 * Parse a `"geo:lat,lng"` URI (used by the iOS Timeline format).
 *
 * Returns `null` if the string is not a valid geo URI.
 */
export function parseGeoUri(geoStr: string): LatLng | null {
    if (typeof geoStr !== 'string' || !geoStr.startsWith('geo:')) return null;
    const parts = geoStr.substring(4).split(',');
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
}

/**
 * Parse a degree-sign coordinate string such as `"45.4642°, 9.1900°"`
 * (used by the Semantic Timeline format).
 *
 * Returns `null` if the string does not match.
 */
const DEGREE_RE = /(-?\d+(?:\.\d+)?)\s*°,\s*(-?\d+(?:\.\d+)?)/;
export function parseDegreeString(degStr: string): LatLng | null {
    if (typeof degStr !== 'string') return null;
    const m = degStr.match(DEGREE_RE);
    if (!m) return null;
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
}
