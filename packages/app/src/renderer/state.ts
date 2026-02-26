/**
 * Application state management with pub/sub notifications.
 *
 * All renderer modules subscribe to state changes and re-render accordingly.
 * Activity-type filtering is done client-side (no IPC roundtrip).
 * Date-range filtering is delegated to the main process via IPC.
 */

import type {
    MappitDataset,
    TimelineEntry,
    PlaceVisit,
    ActivitySegment,
} from 'mappit-core';

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type AppEventType =
    | 'dataset-changed'
    | 'filters-changed'
    | 'selection-changed';

type Listener = (event: AppEventType) => void;

// ---------------------------------------------------------------------------
// State singleton
// ---------------------------------------------------------------------------

class AppState {
    // ---- Data ----
    dataset: MappitDataset | null = null;

    /** The full date range of the originally-loaded dataset. */
    originalDateRange: { min: string; max: string } | null = null;

    // ---- Client-side filters ----
    showVisits = true;
    showActivities = true;
    activityFilters = new Map<string, boolean>();

    // ---- Selection ----
    /** Index of the selected entry within `filteredEntries`. */
    selectedIndex: number | null = null;

    // ---- Computed ----
    get filteredEntries(): TimelineEntry[] {
        if (!this.dataset) return [];
        return this.dataset.timeline.filter((entry) => {
            if (entry.type === 'visit') {
                return this.showVisits;
            }
            if (!this.showActivities) return false;
            const enabled = this.activityFilters.get(entry.activityType);
            return enabled !== false; // default true for types not in the map
        });
    }

    get visits(): PlaceVisit[] {
        return this.filteredEntries.filter(
            (e): e is PlaceVisit => e.type === 'visit',
        );
    }

    get activities(): ActivitySegment[] {
        return this.filteredEntries.filter(
            (e): e is ActivitySegment => e.type === 'activity',
        );
    }

    // ---- Listeners ----
    private listeners: Listener[] = [];

    subscribe(fn: Listener): () => void {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== fn);
        };
    }

    private emit(event: AppEventType): void {
        for (const fn of this.listeners) fn(event);
    }

    // ---- Mutations ----

    /**
     * Set a new (possibly filtered) dataset.
     * Preserves activity-filter choices for types that still exist.
     */
    setDataset(ds: MappitDataset): void {
        this.dataset = ds;

        // Collect activity types present in this dataset
        const typesInData = new Set<string>();
        for (const e of ds.timeline) {
            if (e.type === 'activity') typesInData.add(e.activityType);
        }

        // Remove types no longer present
        for (const t of this.activityFilters.keys()) {
            if (!typesInData.has(t)) this.activityFilters.delete(t);
        }
        // Add new types (default enabled)
        for (const t of typesInData) {
            if (!this.activityFilters.has(t)) {
                this.activityFilters.set(t, true);
            }
        }

        this.selectedIndex = null;
        this.emit('dataset-changed');
    }

    setOriginalDateRange(min: string, max: string): void {
        this.originalDateRange = { min, max };
    }

    setShowVisits(v: boolean): void {
        this.showVisits = v;
        this.selectedIndex = null;
        this.emit('filters-changed');
    }

    setShowActivities(v: boolean): void {
        this.showActivities = v;
        this.selectedIndex = null;
        this.emit('filters-changed');
    }

    toggleActivityType(type: string): void {
        const cur = this.activityFilters.get(type) ?? true;
        this.activityFilters.set(type, !cur);
        this.selectedIndex = null;
        this.emit('filters-changed');
    }

    setAllActivityTypes(enabled: boolean): void {
        for (const t of this.activityFilters.keys()) {
            this.activityFilters.set(t, enabled);
        }
        this.selectedIndex = null;
        this.emit('filters-changed');
    }

    selectEntry(index: number | null): void {
        if (index === this.selectedIndex) return; // no-op
        this.selectedIndex = index;
        this.emit('selection-changed');
    }
}

export const state = new AppState();
