/**
 * Renderer entry point.
 *
 * All communication with the main process goes through `window.api`
 * (exposed by the preload script via contextBridge).
 */

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const $ = <T extends HTMLElement>(sel: string) =>
    document.querySelector<T>(sel)!;

const btnLoadWelcome = $<HTMLButtonElement>('#btn-load-welcome');
const welcomePanel = $('#welcome');
const summaryPanel = $('#summary');
const summaryContent = $('#summary-content');
const yearlyBreakdown = $('#yearly-breakdown');
const datasetInfo = $('#dataset-info');
const statusText = $('#status-text');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStatus(msg: string, loading = false): void {
    statusText.textContent = msg;
    statusText.classList.toggle('loading', loading);
}

function formatNumber(n: number): string {
    return n.toLocaleString('en-US');
}

function formatKm(meters: number): string {
    return (meters / 1000).toFixed(1);
}

// ---------------------------------------------------------------------------
// Load dataset flow
// ---------------------------------------------------------------------------

async function handleLoadClick(): Promise<void> {
    try {
        // 1 — Open native dialog
        setStatus('Opening file picker…');
        const filePath = await window.api.openFile();
        if (!filePath) {
            setStatus('Ready');
            return;
        }

        // 2 — Load dataset
        setStatus(`Loading ${filePath}…`, true);
        const ds = await window.api.loadDataset(filePath);

        setStatus(
            `Loaded ${ds.source} — ${formatNumber(ds.points.length)} points, ${formatNumber(ds.timeline.length)} timeline entries`,
        );
        datasetInfo.textContent = `${ds.source} | ${ds.dateRange.min?.slice(0, 10) ?? '?'} → ${ds.dateRange.max?.slice(0, 10) ?? '?'}`;

        // 3 — Show summary
        await renderSummary();

        welcomePanel.classList.add('hidden');
        summaryPanel.classList.remove('hidden');
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus(`Error: ${msg}`);
    }
}

// ---------------------------------------------------------------------------
// Render summary
// ---------------------------------------------------------------------------

async function renderSummary(): Promise<void> {
    const [stats, yearly] = await Promise.all([
        window.api.getStats(),
        window.api.getYearlyStats(),
    ]);

    if (!stats) {
        summaryContent.innerHTML = '<p class="muted">No dataset loaded.</p>';
        return;
    }

    // Main stats grid
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
        ${renderActivityTable(stats.distanceByActivity)}
    `;

    // Yearly breakdown
    if (yearly.length > 1) {
        yearlyBreakdown.innerHTML = `
            <h3>Yearly Breakdown</h3>
            <table class="activity-table">
                <thead>
                    <tr><th>Year</th><th>Visits</th><th>Activities</th><th>Distance</th></tr>
                </thead>
                <tbody>
                    ${yearly
                .map(
                    (y) => `
                        <tr>
                            <td>${y.label}</td>
                            <td>${formatNumber(y.summary.visits)}</td>
                            <td>${formatNumber(y.summary.activities)}</td>
                            <td>${formatKm(y.summary.totalDistanceMeters)} km</td>
                        </tr>`,
                )
                .join('')}
                </tbody>
            </table>
        `;
    } else {
        yearlyBreakdown.innerHTML = '';
    }
}

function renderActivityTable(distanceByActivity: Record<string, number>): string {
    const entries = Object.entries(distanceByActivity).sort(
        (a, b) => b[1] - a[1],
    );
    if (entries.length === 0) return '';

    return `
        <h3 style="margin-top: 16px; font-size: 14px; color: var(--text-muted);">Distance by Activity</h3>
        <table class="activity-table">
            <thead><tr><th>Activity</th><th>Distance</th></tr></thead>
            <tbody>
                ${entries.map(([type, meters]) => `<tr><td>${type}</td><td>${formatKm(meters)} km</td></tr>`).join('')}
            </tbody>
        </table>
    `;
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------

btnLoadWelcome.addEventListener('click', handleLoadClick);

// Listen for dataset pushed from main process (e.g. after filters)
window.api.onDatasetLoaded((_ds) => {
    renderSummary();
});

// Listen for errors from main process
window.api.onError((msg) => {
    setStatus(`Error: ${msg}`);
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

setStatus('Ready');
