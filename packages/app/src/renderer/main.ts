/**
 * Renderer entry point — orchestrates modules.
 *
 * Handles: load flow, date picker, summary, cross-module interactions.
 * All data operations go through `window.api` (IPC → main process).
 */

import { state } from './state';
import { initMap, flyTo, fitToBounds } from './map';
import { initSidebar } from './sidebar';
import { initFilters } from './filters';
import { formatNumber, formatKm } from './constants';

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const $ = <T extends HTMLElement>(sel: string) =>
    document.querySelector<T>(sel)!;

const welcomePanel = $('#welcome');
const appLayout = $('#app-layout');
const statusText = $('#status-text');

// Date picker
const dateStart = $<HTMLInputElement>('#date-start');
const dateEnd = $<HTMLInputElement>('#date-end');
const btnPrev = $<HTMLButtonElement>('#btn-prev');
const btnNext = $<HTMLButtonElement>('#btn-next');
const btnApply = $<HTMLButtonElement>('#btn-apply');

// Sidebar actions
const btnLoadWelcome = $<HTMLButtonElement>('#btn-load-welcome');
const btnLoadNew = $<HTMLButtonElement>('#btn-load-new');
const btnSummary = $<HTMLButtonElement>('#btn-summary');
const btnFiltersToggle = $<HTMLButtonElement>('#btn-filters-toggle');

// Summary overlay
const summaryOverlay = $('#summary-overlay');
const btnCloseSummary = $<HTMLButtonElement>('#btn-close-summary');
const summaryContent = $('#summary-content');
const yearlyBreakdown = $('#yearly-breakdown');

// Filters panel
const filtersPanel = $('#filters-panel');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStatus(msg: string, loading = false): void {
    statusText.textContent = msg;
    statusText.classList.toggle('loading', loading);
}

/** ISO date string → "YYYY-MM-DD" for <input type="date"> */
function toDateInputValue(iso: string): string {
    return iso.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Load dataset flow
// ---------------------------------------------------------------------------

async function handleLoad(): Promise<void> {
    try {
        setStatus('Opening file picker…');
        const filePath = await window.api.openFile();
        if (!filePath) {
            setStatus('Ready');
            return;
        }

        setStatus(`Loading ${filePath}…`, true);
        const ds = await window.api.loadDataset(filePath);

        // Store original date range
        state.setOriginalDateRange(ds.dateRange.min, ds.dateRange.max);

        // Set date inputs to the full range
        dateStart.value = toDateInputValue(ds.dateRange.min);
        dateEnd.value = toDateInputValue(ds.dateRange.max);
        dateStart.min = toDateInputValue(ds.dateRange.min);
        dateEnd.max = toDateInputValue(ds.dateRange.max);

        // Push dataset into state (triggers map + sidebar rendering)
        state.setDataset(ds);

        // Show the app layout, hide welcome
        welcomePanel.classList.add('hidden');
        appLayout.classList.remove('hidden');

        setStatus(
            `${formatNumber(ds.timeline.length)} entries | ${ds.source} | ${ds.dateRange.min.slice(0, 10)} → ${ds.dateRange.max.slice(0, 10)}`,
        );
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus(`Error: ${msg}`);
    }
}

// ---------------------------------------------------------------------------
// Date range filter
// ---------------------------------------------------------------------------

async function applyDateFilter(): Promise<void> {
    const start = dateStart.value;
    const end = dateEnd.value;
    if (!start || !end) return;

    try {
        setStatus('Filtering…', true);
        const filtered = await window.api.filterDataset({
            dateRange: { start, end },
        });

        state.setDataset(filtered);

        setStatus(
            `${formatNumber(filtered.timeline.length)} entries | ${start} → ${end}`,
        );
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus(`Error: ${msg}`);
    }
}

function shiftDateRange(direction: -1 | 1): void {
    const s = new Date(dateStart.value);
    const e = new Date(dateEnd.value);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return;

    const rangeDays = Math.max(
        1,
        Math.round((e.getTime() - s.getTime()) / 86_400_000),
    );

    s.setDate(s.getDate() + direction * rangeDays);
    e.setDate(e.getDate() + direction * rangeDays);

    dateStart.value = s.toISOString().slice(0, 10);
    dateEnd.value = e.toISOString().slice(0, 10);

    // Auto-apply
    applyDateFilter();
}

// ---------------------------------------------------------------------------
// Summary overlay
// ---------------------------------------------------------------------------

async function showSummary(): Promise<void> {
    const [stats, yearly] = await Promise.all([
        window.api.getStats(),
        window.api.getYearlyStats(),
    ]);

    if (!stats) {
        summaryContent.innerHTML = '<p class="muted">No data.</p>';
        yearlyBreakdown.innerHTML = '';
        summaryOverlay.classList.remove('hidden');
        return;
    }

    summaryContent.innerHTML = `
        <dl class="summary-grid">
            <dt>Date range</dt>
            <dd>${stats.dateRange.min?.slice(0, 10) ?? '—'} → ${stats.dateRange.max?.slice(0, 10) ?? '—'}</dd>
            <dt>Raw points</dt>
            <dd>${formatNumber(stats.totalPoints)}</dd>
            <dt>Visits</dt>
            <dd>${formatNumber(stats.visits)}</dd>
            <dt>Activities</dt>
            <dd>${formatNumber(stats.activities)}</dd>
            <dt>Unique places</dt>
            <dd>${formatNumber(stats.uniquePlaces)}</dd>
            <dt>Total distance</dt>
            <dd>${formatKm(stats.totalDistanceMeters)} km</dd>
        </dl>
        ${renderDistanceTable(stats.distanceByActivity)}`;

    if (yearly.length > 1) {
        yearlyBreakdown.innerHTML = `
            <h3>Yearly Breakdown</h3>
            <table class="activity-table">
                <thead><tr><th>Year</th><th>Visits</th><th>Activities</th><th>Distance</th></tr></thead>
                <tbody>${yearly.map((y) => `<tr><td>${y.label}</td><td>${formatNumber(y.summary.visits)}</td><td>${formatNumber(y.summary.activities)}</td><td>${formatKm(y.summary.totalDistanceMeters)} km</td></tr>`).join('')}</tbody>
            </table>`;
    } else {
        yearlyBreakdown.innerHTML = '';
    }

    summaryOverlay.classList.remove('hidden');
}

function renderDistanceTable(
    distanceByActivity: Record<string, number>,
): string {
    const entries = Object.entries(distanceByActivity).sort(
        (a, b) => b[1] - a[1],
    );
    if (entries.length === 0) return '';
    return `
        <h3 style="margin-top:16px;font-size:14px;color:var(--text-muted);">Distance by Activity</h3>
        <table class="activity-table">
            <thead><tr><th>Activity</th><th>Distance</th></tr></thead>
            <tbody>${entries.map(([t, m]) => `<tr><td>${t}</td><td>${formatKm(m)} km</td></tr>`).join('')}</tbody>
        </table>`;
}

// ---------------------------------------------------------------------------
// Map ↔ sidebar interaction (selection → camera)
// ---------------------------------------------------------------------------

state.subscribe((event) => {
    if (event === 'selection-changed' && state.selectedIndex !== null) {
        const entry = state.filteredEntries[state.selectedIndex];
        if (!entry) return;

        if (entry.type === 'visit') {
            flyTo(entry.lng, entry.lat);
        } else if (entry.path.length > 0) {
            const coords = entry.path.map(
                (p) => [p.lng, p.lat] as [number, number],
            );
            fitToBounds(coords);
        }
    }
});

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

btnLoadWelcome.addEventListener('click', handleLoad);
btnLoadNew.addEventListener('click', handleLoad);
btnApply.addEventListener('click', applyDateFilter);
btnPrev.addEventListener('click', () => shiftDateRange(-1));
btnNext.addEventListener('click', () => shiftDateRange(1));
btnSummary.addEventListener('click', showSummary);
btnCloseSummary.addEventListener('click', () =>
    summaryOverlay.classList.add('hidden'),
);
btnFiltersToggle.addEventListener('click', () =>
    filtersPanel.classList.toggle('hidden'),
);

// IPC push events from main process
window.api.onDatasetLoaded(() => {
    /* handled via state subscriptions */
});
window.api.onError((msg) => setStatus(`Error: ${msg}`));

// ---------------------------------------------------------------------------
// Init modules
// ---------------------------------------------------------------------------

initMap('map');
initSidebar();
initFilters();
setStatus('Ready');

