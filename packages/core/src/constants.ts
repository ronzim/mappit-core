/**
 * Visualisation defaults ported from the legacy `src/defaults.js`.
 *
 * These are constants used by Plotly / deck.gl visualisation layers.
 * The core library re-exports them so that the app has a single source of
 * truth for colour scales, layout margins, etc.
 */

/** Custom colour scale for scatter plots (0–100 range). */
export const COLORSCALE: ReadonlyArray<[number, string]> = [
    [0, 'rgb(150,0,90)'],
    [12.5, 'rgb(0, 0, 200)'],
    [25, 'rgb(0, 25, 255)'],
    [37.5, 'rgb(0, 152, 255)'],
    [50, 'rgb(44, 255, 150)'],
    [62.5, 'rgb(151, 255, 0)'],
    [75, 'rgb(255, 234, 0)'],
    [87.5, 'rgb(255, 111, 0)'],
    [100, 'rgb(255, 0, 0)'],
];

/** Modified viridis colour scale for heatmaps. */
export const VIRIDIS_MOD: ReadonlyArray<[number, string]> = [
    [0, 'rgb(150,0,90)'],
    [0.033, 'rgb(69,2,86)'],
    [0.066, 'rgb(59,28,140)'],
    [0.1, 'rgb(33,144,141)'],
    [1, 'rgb(249,231,33)'],
];

/**
 * Legacy activity-type → colour map (for the old Plotly scatter layer).
 *
 * For the normalised activity grouping used by the new Timeline formats,
 * see `activity-mapping.ts`.
 */
export const ACTIVITY_COLOR_MAP: Readonly<Record<string, string>> = {
    IN_VEHICLE: 'red',
    STILL: 'yellow',
    IN_RAIL_VEHICLE: 'green',
    IN_ROAD_VEHICLE: 'red',
    IN_CAR: 'red',
    ON_FOOT: 'pink',
    WALKING: 'green',
    ON_BICYCLE: 'lightblue',
    UNKNOWN: 'gray',
    TILTING: 'gray',
};

/** Default layout margins (zero-padding for full-screen maps). */
export const MARGIN: Readonly<{ r: number; t: number; b: number; l: number; pad: number }> = {
    r: 0,
    t: 0,
    b: 0,
    l: 0,
    pad: 0,
};
