/**
 * Map module — deck.gl layers on top of maplibre-gl base map.
 *
 * Renders:
 * - ScatterplotLayer for place visits (amber dots)
 * - PathLayer for activity segments (coloured by activity type)
 * - Highlight styling for the currently selected item
 *
 * Self-subscribes to `state` and re-renders layers on changes.
 */

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { PlaceVisit, ActivitySegment } from 'mappit-core';
import { state } from './state';
import {
    getActivityColor,
    hexToRgba,
    formatActivityType,
    formatTime,
    VISIT_COLOR,
    HIGHLIGHT_COLOR,
} from './constants';

// ---------------------------------------------------------------------------
// Indexed wrapper — carries each datum's position in filteredEntries
// ---------------------------------------------------------------------------

interface Indexed<T> {
    entry: T;
    idx: number;
}

// ---------------------------------------------------------------------------
// Module-level references
// ---------------------------------------------------------------------------

let map: maplibregl.Map | null = null;
let overlay: MapboxOverlay | null = null;
let tooltipEl: HTMLDivElement | null = null;

const DARK_STYLE =
    'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

export function initMap(containerId: string): void {
    map = new maplibregl.Map({
        container: containerId,
        style: DARK_STYLE,
        center: [12.5, 41.9], // default: Rome
        zoom: 4,
        attributionControl: false,
    });

    map.addControl(
        new maplibregl.NavigationControl({ showCompass: true }),
        'top-right',
    );
    map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right',
    );

    overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.addControl(overlay as any);

    // Tooltip
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'map-tooltip';
    tooltipEl.style.display = 'none';
    document.getElementById(containerId)!.appendChild(tooltipEl);

    // Subscribe to state
    state.subscribe((event) => {
        if (
            event === 'dataset-changed' ||
            event === 'filters-changed' ||
            event === 'selection-changed'
        ) {
            updateLayers();
        }
        if (event === 'dataset-changed') {
            fitToData();
        }
    });
}

// ---------------------------------------------------------------------------
// Layer update
// ---------------------------------------------------------------------------

export function updateLayers(): void {
    if (!overlay) return;

    const entries = state.filteredEntries;
    const selected = state.selectedIndex;

    // Build indexed arrays
    const visits: Indexed<PlaceVisit>[] = [];
    const activities: Indexed<ActivitySegment>[] = [];

    entries.forEach((e, i) => {
        if (e.type === 'visit') visits.push({ entry: e, idx: i });
        else activities.push({ entry: e, idx: i });
    });

    const visitLayer = new ScatterplotLayer<Indexed<PlaceVisit>>({
        id: 'visits',
        data: visits,
        getPosition: (d) => [d.entry.lng, d.entry.lat],
        getRadius: (d) => (selected === d.idx ? 10 : 6),
        getFillColor: (d) =>
            selected === d.idx
                ? hexToRgba(HIGHLIGHT_COLOR, 255)
                : hexToRgba(VISIT_COLOR, 200),
        radiusUnits: 'pixels',
        radiusMinPixels: 4,
        radiusMaxPixels: 20,
        pickable: true,
        onClick: (info: PickingInfo<Indexed<PlaceVisit>>) => {
            if (info.object) state.selectEntry(info.object.idx);
        },
        onHover: (info: PickingInfo<Indexed<PlaceVisit>>) =>
            showTooltipVisit(info),
        updateTriggers: {
            getRadius: [selected],
            getFillColor: [selected],
        },
    });

    const activityLayer = new PathLayer<Indexed<ActivitySegment>>({
        id: 'activities',
        data: activities,
        getPath: (d) =>
            d.entry.path.map((p) => [p.lng, p.lat] as [number, number]),
        getColor: (d) =>
            selected === d.idx
                ? hexToRgba(HIGHLIGHT_COLOR, 255)
                : hexToRgba(getActivityColor(d.entry.activityType)),
        getWidth: (d) => (selected === d.idx ? 6 : 3),
        widthUnits: 'pixels',
        widthMinPixels: 2,
        widthMaxPixels: 10,
        pickable: true,
        onClick: (info: PickingInfo<Indexed<ActivitySegment>>) => {
            if (info.object) state.selectEntry(info.object.idx);
        },
        onHover: (info: PickingInfo<Indexed<ActivitySegment>>) =>
            showTooltipActivity(info),
        updateTriggers: {
            getColor: [selected],
            getWidth: [selected],
        },
    });

    overlay.setProps({ layers: [activityLayer, visitLayer] });
}

// ---------------------------------------------------------------------------
// Camera helpers (exported for sidebar → map interaction)
// ---------------------------------------------------------------------------

export function flyTo(lng: number, lat: number, zoom?: number): void {
    if (!map) return;
    map.flyTo({
        center: [lng, lat],
        zoom: zoom ?? Math.max(map.getZoom(), 15),
        duration: 800,
    });
}

export function fitToBounds(
    coords: Array<[number, number]>,
    padding = 50,
): void {
    if (!map || coords.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    for (const [lng, lat] of coords) bounds.extend([lng, lat]);
    map.fitBounds(bounds, { padding, duration: 800 });
}

export function fitToData(): void {
    const entries = state.filteredEntries;
    if (entries.length === 0) return;

    const coords: Array<[number, number]> = [];
    for (const e of entries) {
        if (e.type === 'visit') {
            coords.push([e.lng, e.lat]);
        } else {
            if (e.path.length > 0) {
                coords.push([e.path[0].lng, e.path[0].lat]);
                coords.push([
                    e.path[e.path.length - 1].lng,
                    e.path[e.path.length - 1].lat,
                ]);
            } else {
                coords.push([e.startLocation.lng, e.startLocation.lat]);
                coords.push([e.endLocation.lng, e.endLocation.lat]);
            }
        }
    }
    fitToBounds(coords);
}

// ---------------------------------------------------------------------------
// Tooltip helpers
// ---------------------------------------------------------------------------

function showTooltipVisit(info: PickingInfo<Indexed<PlaceVisit>>): void {
    if (!tooltipEl) return;
    if (info.object) {
        const v = info.object.entry;
        tooltipEl.innerHTML = `<strong>${v.name || 'Visit'}</strong><br>${formatTime(v.startTime)} – ${formatTime(v.endTime)}`;
        tooltipEl.style.display = 'block';
        tooltipEl.style.left = `${(info.x ?? 0) + 12}px`;
        tooltipEl.style.top = `${(info.y ?? 0) + 12}px`;
    } else {
        tooltipEl.style.display = 'none';
    }
}

function showTooltipActivity(
    info: PickingInfo<Indexed<ActivitySegment>>,
): void {
    if (!tooltipEl) return;
    if (info.object) {
        const a = info.object.entry;
        const dist = a.distanceMeters
            ? `<br>${(a.distanceMeters / 1000).toFixed(1)} km`
            : '';
        tooltipEl.innerHTML = `<strong>${formatActivityType(a.activityType)}</strong>${dist}`;
        tooltipEl.style.display = 'block';
        tooltipEl.style.left = `${(info.x ?? 0) + 12}px`;
        tooltipEl.style.top = `${(info.y ?? 0) + 12}px`;
    } else {
        tooltipEl.style.display = 'none';
    }
}
