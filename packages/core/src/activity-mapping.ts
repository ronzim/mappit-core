/**
 * Activity-type grouping extracted from the timeline viewer.
 *
 * Google exports many fine-grained activity types (e.g. IN_PASSENGER_VEHICLE,
 * IN_BUS, JOGGING …).  This module maps them to stable group names that are
 * easier to work with in the UI and for filtering.
 */

/**
 * Master mapping: group name → array of raw types that belong to the group.
 */
export const activityGroupMapping: Readonly<Record<string, readonly string[]>> = {
    DRIVING: ['IN_VEHICLE', 'IN_PASSENGER_VEHICLE', 'DRIVE', 'DRIVING'],
    TAXI: ['IN_TAXI', 'TAXI'],
    MOTORCYCLING: ['MOTORCYCLING'],
    CYCLING: ['ON_BICYCLE', 'CYCLING', 'BICYCLE'],
    WALKING: ['ON_FOOT', 'WALKING', 'WALKING_NORDIC', 'WALK'],
    HIKING: ['HIKING'],
    RUNNING: ['RUNNING', 'JOGGING'],
    BUS: ['IN_BUS', 'BUS'],
    SUBWAY: ['IN_SUBWAY', 'SUBWAY'],
    TRAIN: ['IN_TRAIN', 'TRAIN'],
    TRAM: ['IN_TRAM', 'TRAM'],
    FERRY: ['IN_FERRY', 'FERRY'],
    STATIONARY: ['STILL', 'STATIONARY'],
    FLYING: ['FLYING', 'IN_FLIGHT'],
    CABLECAR: ['IN_CABLECAR', 'CABLECAR'],
    FUNICULAR: ['IN_FUNICULAR', 'FUNICULAR'],
    GONDOLA_LIFT: ['IN_GONDOLA_LIFT', 'GONDOLA_LIFT'],
    WHEELCHAIR: ['IN_WHEELCHAIR', 'WHEELCHAIR'],
    SNOWMOBILE: ['SNOWMOBILE'],
    BOATING: ['BOATING'],
    CATCHING_POKEMON: ['CATCHING_POKEMON'],
    HORSEBACK_RIDING: ['HORSEBACK_RIDING'],
    KAYAKING: ['KAYAKING'],
    KITESURFING: ['KITESURFING'],
    PARAGLIDING: ['PARAGLIDING'],
    ROWING: ['ROWING'],
    SAILING: ['SAILING'],
    SKATEBOARDING: ['SKATEBOARDING'],
    SKATING: ['SKATING'],
    SKIING: ['SKIING'],
    SLEDDING: ['SLEDDING'],
    SNOWBOARDING: ['SNOWBOARDING'],
    SNOWSHOEING: ['SNOWSHOEING'],
    SURFING: ['SURFING'],
    SWIMMING: ['SWIMMING'],
    UNKNOWN: ['UNKNOWN', 'UNKNOWN_ACTIVITY_TYPE', 'TILTING'],
};

/**
 * Reverse index built once at module load: raw activity type → group name.
 */
const rawToGroup: Record<string, string> = {};
for (const [group, rawTypes] of Object.entries(activityGroupMapping)) {
    for (const raw of rawTypes) {
        rawToGroup[raw] = group;
    }
}

/**
 * Resolve any raw activity type string to its normalised group name.
 *
 * If the input is already a group name it is returned as-is.
 * Unknown types fall back to `'UNKNOWN'`.
 */
export function getGroupedActivityType(rawType: string): string {
    if (rawType in activityGroupMapping) return rawType;
    return rawToGroup[rawType] ?? 'UNKNOWN';
}
