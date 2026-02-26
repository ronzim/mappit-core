/**
 * Sidebar module — renders the chronological timeline list.
 *
 * Each timeline entry becomes a clickable DOM element.
 * Date headers are inserted between entries on different days.
 * Self-subscribes to state for highlight updates.
 */

import type { TimelineEntry, PlaceVisit, ActivitySegment } from 'mappit-core';
import { state } from './state';
import {
    getActivityColor,
    formatActivityType,
    formatTime,
    formatDate,
    VISIT_COLOR,
} from './constants';

let timelineContainer: HTMLElement | null = null;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

export function initSidebar(): void {
    timelineContainer = document.getElementById('timeline');

    // React to state changes
    state.subscribe((event) => {
        if (event === 'dataset-changed' || event === 'filters-changed') {
            renderTimeline();
        }
        if (event === 'selection-changed') {
            updateHighlight();
        }
    });
}

// ---------------------------------------------------------------------------
// Timeline rendering
// ---------------------------------------------------------------------------

export function renderTimeline(): void {
    if (!timelineContainer) return;
    timelineContainer.innerHTML = '';

    const entries = state.filteredEntries;
    if (entries.length === 0) {
        timelineContainer.innerHTML =
            '<p class="empty-msg">No entries for the current filters.</p>';
        return;
    }

    let currentDate = '';

    entries.forEach((entry, index) => {
        const dayStr = entry.startTime.slice(0, 10);

        // Insert date header when the day changes
        if (dayStr !== currentDate) {
            currentDate = dayStr;
            const header = document.createElement('div');
            header.className = 'date-header';
            header.dataset.date = dayStr;
            header.textContent = formatDate(dayStr);
            timelineContainer!.appendChild(header);
        }

        const item = createTimelineItem(entry, index);
        timelineContainer!.appendChild(item);
    });
}

// ---------------------------------------------------------------------------
// Single timeline item
// ---------------------------------------------------------------------------

function createTimelineItem(
    entry: TimelineEntry,
    index: number,
): HTMLElement {
    const div = document.createElement('div');
    div.className = `timeline-item ${entry.type === 'visit' ? 'timeline-visit' : 'timeline-activity'}`;
    div.dataset.index = String(index);

    if (entry.type === 'visit') {
        div.innerHTML = buildVisitHTML(entry);
    } else {
        div.style.setProperty(
            '--activity-color',
            getActivityColor(entry.activityType),
        );
        div.innerHTML = buildActivityHTML(entry);
    }

    div.addEventListener('click', () => state.selectEntry(index));

    return div;
}

function buildVisitHTML(v: PlaceVisit): string {
    const color = VISIT_COLOR;
    return `
        <span class="timeline-dot" style="background:${color};"></span>
        <div class="timeline-details">
            <strong class="timeline-name">${escapeHtml(v.name || 'Unknown place')}</strong>
            <span class="timeline-time">${formatTime(v.startTime)} – ${formatTime(v.endTime)}</span>
        </div>`;
}

function buildActivityHTML(a: ActivitySegment): string {
    const color = getActivityColor(a.activityType);
    const dist = a.distanceMeters
        ? `<span class="timeline-distance">${(a.distanceMeters / 1000).toFixed(1)} km</span>`
        : '';
    return `
        <span class="timeline-dot" style="background:${color};"></span>
        <div class="timeline-details">
            <strong class="timeline-name">${formatActivityType(a.activityType)}</strong>
            <span class="timeline-time">${formatTime(a.startTime)} – ${formatTime(a.endTime)}</span>
            ${dist}
        </div>`;
}

// ---------------------------------------------------------------------------
// Highlight the selected item & scroll into view
// ---------------------------------------------------------------------------

function updateHighlight(): void {
    if (!timelineContainer) return;

    // Remove old highlight
    const prev = timelineContainer.querySelector('.timeline-item.highlighted');
    if (prev) prev.classList.remove('highlighted');

    if (state.selectedIndex === null) return;

    const el = timelineContainer.querySelector(
        `.timeline-item[data-index="${state.selectedIndex}"]`,
    );
    if (el) {
        el.classList.add('highlighted');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
