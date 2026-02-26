/**
 * Filters module — renders activity-type checkbox filters.
 *
 * Provides "Show Visits" / "Show Activities" master toggles and
 * per-type checkboxes with coloured swatches.
 * Self-subscribes to state to keep UI in sync.
 */

import { state } from './state';
import { getActivityColor, formatActivityType } from './constants';

let showVisitsCb: HTMLInputElement | null = null;
let showActivitiesCb: HTMLInputElement | null = null;
let typeContainer: HTMLElement | null = null;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

export function initFilters(): void {
    showVisitsCb = document.getElementById(
        'show-visits',
    ) as HTMLInputElement | null;
    showActivitiesCb = document.getElementById(
        'show-activities',
    ) as HTMLInputElement | null;
    typeContainer = document.getElementById('activity-type-filters');

    showVisitsCb?.addEventListener('change', () => {
        state.setShowVisits(showVisitsCb!.checked);
    });
    showActivitiesCb?.addEventListener('change', () => {
        state.setShowActivities(showActivitiesCb!.checked);
        updateTypeCheckboxesVisible();
    });

    // Re-render filter checkboxes when the dataset changes
    state.subscribe((event) => {
        if (event === 'dataset-changed') {
            renderTypeCheckboxes();
        }
    });
}

// ---------------------------------------------------------------------------
// Per-activity-type checkboxes
// ---------------------------------------------------------------------------

function renderTypeCheckboxes(): void {
    if (!typeContainer) return;
    typeContainer.innerHTML = '';

    // Sort activity types alphabetically
    const types = [...state.activityFilters.keys()].sort();
    if (types.length === 0) return;

    for (const type of types) {
        const checked = state.activityFilters.get(type) !== false;
        const color = getActivityColor(type);
        const label = document.createElement('label');
        label.className = 'filter-item';
        label.innerHTML = `
            <input type="checkbox" data-activity="${type}" ${checked ? 'checked' : ''} />
            <span class="color-swatch" style="background:${color};"></span>
            ${formatActivityType(type)}`;

        const cb = label.querySelector('input')!;
        cb.addEventListener('change', () => state.toggleActivityType(type));

        typeContainer.appendChild(label);
    }

    updateTypeCheckboxesVisible();
}

/** Show/hide per-type checkboxes based on the "Show Activities" master. */
function updateTypeCheckboxesVisible(): void {
    if (!typeContainer) return;
    typeContainer.style.display =
        state.showActivities ? 'flex' : 'none';
}
