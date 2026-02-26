/**
 * Activity type colours, display names and helpers.
 * Ported from timeline.html's getActivityColor() / getActivityIcon().
 */

// ---------------------------------------------------------------------------
// Activity colours (hex)
// ---------------------------------------------------------------------------

export const ACTIVITY_COLORS: Record<string, string> = {
    DRIVING: '#4285F4',
    TAXI: '#FFEB3B',
    MOTORCYCLING: '#1E90FF',
    CYCLING: '#0F9D58',
    WALKING: '#DB4437',
    RUNNING: '#FF3329',
    HIKING: '#0DBD25',
    BUS: '#B026B0',
    SUBWAY: '#673AB7',
    TRAM: '#673AB7',
    TRAIN: '#FF9800',
    FERRY: '#87CEEB',
    STATIONARY: '#757575',
    FLYING: '#03C9FF',
    CABLECAR: '#607D8B',
    FUNICULAR: '#607D8B',
    GONDOLA_LIFT: '#607D8B',
    WHEELCHAIR: '#607D8B',
    BOATING: '#00BCD4',
    KAYAKING: '#00BCD4',
    ROWING: '#00BCD4',
    SAILING: '#00BCD4',
    SURFING: '#00BCD4',
    SWIMMING: '#00BCD4',
    SKIING: '#B0E0E6',
    SLEDDING: '#B0E0E6',
    SNOWBOARDING: '#B0E0E6',
    SNOWSHOEING: '#B0E0E6',
    SNOWMOBILE: '#B0E0E6',
    SKATEBOARDING: '#607D8B',
    SKATING: '#607D8B',
    UNKNOWN: '#9E9E9E',
};

export const VISIT_COLOR = '#FFC107';
export const HIGHLIGHT_COLOR = '#00BFFF';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getActivityColor(activityType: string): string {
    return ACTIVITY_COLORS[activityType] ?? ACTIVITY_COLORS.UNKNOWN;
}

export function formatActivityType(type: string): string {
    return type
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Convert hex colour string → [R, G, B, A] tuple for deck.gl. */
export function hexToRgba(
    hex: string,
    alpha = 200,
): [number, number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, alpha];
}

/** Format an ISO timestamp to a short locale time string (HH:MM). */
export function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

/** Format an ISO date string to a readable date (e.g. "Wed, 15 Jan 2024"). */
export function formatDate(iso: string): string {
    try {
        return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return iso;
    }
}

/** Format a number with locale grouping. */
export function formatNumber(n: number): string {
    return n.toLocaleString('en-US');
}

/** Format metres → "X.Y km". */
export function formatKm(meters: number): string {
    return (meters / 1000).toFixed(1);
}
